import type { Emotion } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { buildCourses, type CourseCandidate } from '@/lib/course'
import { distanceFrom, recommendationScore } from '@/lib/discovery'
import { isValidCoordinates } from '@/lib/geo'
import { prisma } from '@/lib/prisma'

const emotions = new Set([
	'CALM',
	'REFRESH',
	'EXCITEMENT',
	'AWE',
	'COMFORT',
	'LIBERATION',
	'FOCUS',
	'ENERGY',
])

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
	const body = req.body || {}
	const experienceIds: string[] = Array.isArray(body.experienceIds)
		? [
				...new Set<string>(
					body.experienceIds.filter((id: unknown): id is string => typeof id === 'string')
				),
			]
		: []
	const desiredEmotions = [
		...new Set<Emotion>(
			(Array.isArray(body.desiredEmotions) ? body.desiredEmotions : [body.desiredEmotion]).filter(
				(emotion: unknown): emotion is Emotion =>
					typeof emotion === 'string' ? emotions.has(emotion) : false
			)
		),
	]
	const latitude = Number(body.latitude)
	const longitude = Number(body.longitude)
	const maxDistanceKm = Number(body.maxDistanceKm || 3)
	const availableFromMinutes = Number(body.availableFromMinutes || 0)
	const availableUntilMinutes = Number(body.availableUntilMinutes || 180)
	if (
		!experienceIds.length ||
		!desiredEmotions.length ||
		desiredEmotions.length > 2 ||
		!isValidCoordinates(latitude, longitude) ||
		maxDistanceKm <= 0 ||
		!Number.isInteger(availableFromMinutes) ||
		!Number.isInteger(availableUntilMinutes) ||
		availableFromMinutes < 0 ||
		availableUntilMinutes > 1440 ||
		availableUntilMinutes - availableFromMinutes < 30
	)
		return res.status(400).json({ error: '궤적 조건을 다시 확인해 주세요.' })

	const now = new Date()
	const earliest = new Date(now.getTime() + availableFromMinutes * 60000)
	const latest = new Date(now.getTime() + availableUntilMinutes * 60000)
	const experiences = await prisma.experience.findMany({
		where: {
			id: { in: experienceIds },
			status: 'PUBLISHED',
			space: {
				status: 'PUBLISHED',
				owner: { isDemo: false, partnerApplication: { status: 'APPROVED' } },
			},
		},
		include: {
			space: true,
			emotions: true,
			media: { orderBy: { sortOrder: 'asc' }, take: 1 },
			slots: {
				where: {
					status: 'OPEN',
					startsAt: { gte: earliest },
					endsAt: { lte: latest },
					bookingClosesAt: { gt: now },
				},
				orderBy: { startsAt: 'asc' },
				take: 8,
				include: {
					bookings: {
						where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
						select: { id: true },
					},
				},
			},
		},
	})

	const candidates: CourseCandidate[] = experiences.flatMap((experience) => {
		const distanceMeters = distanceFrom(
			latitude,
			longitude,
			experience.space.lat,
			experience.space.lng
		)
		if (distanceMeters > maxDistanceKm * 1000) return []
		const slots = experience.slots
			.filter((slot) => slot.capacity > slot.bookings.length)
			.map((slot) => ({
				id: slot.id,
				startsAt: slot.startsAt.toISOString(),
				endsAt: slot.endsAt.toISOString(),
				bookingClosesAt: slot.bookingClosesAt.toISOString(),
				capacity: slot.capacity,
				availableSeats: slot.capacity - slot.bookings.length,
			}))
		const firstSlot = slots[0]
		const score = firstSlot
			? recommendationScore({
					desiredEmotions,
					emotions: experience.emotions.map((item) => item.emotion),
					distanceMeters,
					maxDistanceMeters: maxDistanceKm * 1000,
					startsAt: new Date(firstSlot.startsAt),
					earliest,
					latest,
				})
			: 0
		return [
			{
				experience: {
					id: experience.id,
					title: experience.title,
					description: experience.description,
					durationMinutes: experience.durationMinutes,
					priceWon: experience.priceWon,
					originalPriceWon: experience.originalPriceWon,
					emotions: experience.emotions.map((item) => item.emotion),
					ambienceTags: experience.ambienceTags,
					mediaUrl: experience.media[0]
						? `/api/media/${encodeURIComponent(experience.media[0].key)}`
						: null,
					score,
					space: {
						id: experience.space.id,
						name: experience.space.name,
						typeCode: experience.space.typeCode,
						address: experience.space.roadAddress || experience.space.address,
						latitude: experience.space.lat,
						longitude: experience.space.lng,
						distanceMeters: Math.round(distanceMeters),
					},
				},
				slots,
			},
		]
	})

	candidates.sort((a, b) => a.experience.id.localeCompare(b.experience.id))
	const result = buildCourses(candidates, {
		origin: { latitude, longitude },
		windowStart: earliest,
		windowEnd: latest,
		maxCourses: 4,
		beamWidth: 200,
	})
	if (result.courses.length) {
		const represented = new Set(candidates.map((candidate) => candidate.experience.id))
		const visibleExperiences = new Map(
			experiences.map((experience) => [experience.id, experience.title])
		)
		const unavailable = experienceIds
			.filter((id) => !represented.has(id))
			.map((experienceId) => ({
				experienceId,
				experienceTitle: visibleExperiences.get(experienceId),
				reason: visibleExperiences.has(experienceId)
					? '현재 선택한 이동 거리 밖에 있어요.'
					: '공개가 종료되었거나 현재 남은 좌석이 없어요.',
			}))
		for (const course of result.courses) course.omitted.push(...unavailable)
	}
	return res.status(200).json(result)
}
