import type { Emotion } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { distanceFrom, matchedEmotionCount, recommendationScore } from '@/lib/discovery'
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
	if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
	const latitude = Number(req.query.latitude),
		longitude = Number(req.query.longitude)
	const desiredEmotions = [
		...new Set(
			String(req.query.desiredEmotions || req.query.desiredEmotion || '')
				.split(',')
				.filter((emotion): emotion is Emotion => emotions.has(emotion))
		),
	]
	const legacyWindow = Number(req.query.startWithinMinutes)
	const availableFromMinutes = Number(req.query.availableFromMinutes ?? 0)
	const availableUntilMinutes = Number(
		req.query.availableUntilMinutes ?? (Number.isFinite(legacyWindow) ? legacyWindow : 180)
	)
	const maxDistanceKm = Number(req.query.maxDistanceKm || 3)
	const offset = Number(req.query.offset || 0)
	const limit = Number(req.query.limit || 12)
	const maxBudget =
		req.query.maxBudget === undefined || req.query.maxBudget === ''
			? undefined
			: Number(req.query.maxBudget)
	if (
		!isValidCoordinates(latitude, longitude) ||
		!desiredEmotions.length ||
		desiredEmotions.length > 2 ||
		!Number.isInteger(availableFromMinutes) ||
		!Number.isInteger(availableUntilMinutes) ||
		availableFromMinutes < 0 ||
		availableUntilMinutes > 1440 ||
		availableUntilMinutes - availableFromMinutes < 30 ||
		!(maxDistanceKm > 0) ||
		!Number.isInteger(offset) ||
		offset < 0 ||
		!Number.isInteger(limit) ||
		limit < 1 ||
		limit > 24 ||
		(maxBudget !== undefined && maxBudget < 0)
	)
		return res.status(400).json({ error: '추천 조건을 다시 확인해 주세요.' })

	const now = new Date()
	const earliest = new Date(now.getTime() + availableFromMinutes * 60000)
	const latest = new Date(now.getTime() + availableUntilMinutes * 60000)
	const experiences = await prisma.experience.findMany({
		where: {
			status: 'PUBLISHED',
			priceWon: maxBudget === undefined ? undefined : { lte: maxBudget },
			space: {
				status: 'PUBLISHED',
				owner: { isDemo: false, partnerApplication: { status: 'APPROVED' } },
			},
			slots: {
				some: {
					status: 'OPEN',
					startsAt: { gte: earliest },
					endsAt: { lte: latest },
					bookingClosesAt: { gt: now },
				},
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
				include: {
					bookings: {
						where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
						select: { id: true },
					},
				},
			},
		},
	})

	const items = experiences
		.flatMap((experience) => {
			const distanceMeters = distanceFrom(
				latitude,
				longitude,
				experience.space.lat,
				experience.space.lng
			)
			if (distanceMeters > maxDistanceKm * 1000) return []
			const slot = experience.slots.find(
				(candidate) => candidate.capacity > candidate.bookings.length
			)
			if (!slot) return []
			const experienceEmotions = experience.emotions.map((item) => item.emotion)
			const emotionMatches = matchedEmotionCount(desiredEmotions, experienceEmotions)
			const score = recommendationScore({
				desiredEmotions,
				emotions: experienceEmotions,
				distanceMeters,
				maxDistanceMeters: maxDistanceKm * 1000,
				startsAt: slot.startsAt,
				earliest,
				latest,
			})
			return [
				{
					id: experience.id,
					title: experience.title,
					description: experience.description,
					durationMinutes: experience.durationMinutes,
					priceWon: experience.priceWon,
					originalPriceWon: experience.originalPriceWon,
					emotions: experienceEmotions,
					matchedEmotionCount: emotionMatches,
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
					nextSlot: {
						id: slot.id,
						startsAt: slot.startsAt.toISOString(),
						endsAt: slot.endsAt.toISOString(),
						bookingClosesAt: slot.bookingClosesAt.toISOString(),
						capacity: slot.capacity,
						availableSeats: slot.capacity - slot.bookings.length,
					},
				},
			]
		})
		.sort(
			(a, b) =>
				b.matchedEmotionCount - a.matchedEmotionCount ||
				b.score - a.score ||
				new Date(a.nextSlot.startsAt).getTime() - new Date(b.nextSlot.startsAt).getTime()
		)

	const page = items.slice(offset, offset + limit)
	const nextOffset = offset + page.length < items.length ? offset + page.length : null

	return res.status(200).json({ items: page, total: items.length, nextOffset })
}
