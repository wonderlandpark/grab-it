import type { Emotion } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
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
const windows = new Set([30, 60, 180, 1440])

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
	const latitude = Number(req.query.latitude),
		longitude = Number(req.query.longitude)
	const desiredEmotion = String(req.query.desiredEmotion || '') as Emotion
	const windowMinutes = Number(req.query.startWithinMinutes)
	const maxDistanceKm = Number(req.query.maxDistanceKm || 3)
	const maxBudget =
		req.query.maxBudget === undefined || req.query.maxBudget === ''
			? undefined
			: Number(req.query.maxBudget)
	if (
		!isValidCoordinates(latitude, longitude) ||
		!emotions.has(desiredEmotion) ||
		!windows.has(windowMinutes) ||
		!(maxDistanceKm > 0) ||
		(maxBudget !== undefined && maxBudget < 0)
	)
		return res.status(400).json({ error: '추천 조건을 다시 확인해 주세요.' })

	const now = new Date(),
		latest = new Date(now.getTime() + windowMinutes * 60000)
	const experiences = await prisma.experience.findMany({
		where: {
			status: 'PUBLISHED',
			priceWon: maxBudget === undefined ? undefined : { lte: maxBudget },
			space: {
				status: 'PUBLISHED',
				owner: { isDemo: false, partnerApplication: { status: 'APPROVED' } },
			},
			slots: {
				some: { status: 'OPEN', startsAt: { gte: now, lte: latest }, bookingClosesAt: { gt: now } },
			},
		},
		include: {
			space: true,
			emotions: true,
			media: { orderBy: { sortOrder: 'asc' }, take: 1 },
			slots: {
				where: {
					status: 'OPEN',
					startsAt: { gte: now, lte: latest },
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
			const score = recommendationScore({
				desiredEmotion,
				emotions: experience.emotions.map((item) => item.emotion),
				distanceMeters,
				maxDistanceMeters: maxDistanceKm * 1000,
				startsAt: slot.startsAt,
				now,
				windowMinutes,
				priceWon: experience.priceWon,
				maxBudget,
			})
			return [
				{
					id: experience.id,
					title: experience.title,
					description: experience.description,
					durationMinutes: experience.durationMinutes,
					priceWon: experience.priceWon,
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
				b.score - a.score ||
				new Date(a.nextSlot.startsAt).getTime() - new Date(b.nextSlot.startsAt).getTime()
		)
		.slice(0, 50)

	return res.status(200).json({ recommended: items.slice(0, 3), all: items })
}
