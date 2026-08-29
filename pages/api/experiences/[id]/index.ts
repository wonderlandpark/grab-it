import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
	const id = String(req.query.id),
		now = new Date()
	const experience = await prisma.experience.findFirst({
		where: {
			id,
			status: 'PUBLISHED',
			space: {
				status: 'PUBLISHED',
				owner: { isDemo: false, partnerApplication: { status: 'APPROVED' } },
			},
		},
		include: {
			space: true,
			emotions: true,
			media: { orderBy: { sortOrder: 'asc' } },
			slots: {
				where: { status: 'OPEN', startsAt: { gt: now }, bookingClosesAt: { gt: now } },
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
	if (!experience) return res.status(404).json({ error: '경험을 찾을 수 없습니다.' })
	const reviews = await prisma.review.findMany({
		where: { booking: { slot: { experienceId: id } }, isPublic: true, status: 'PUBLISHED' },
		orderBy: { createdAt: 'desc' },
		take: 20,
	})
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
	return res.status(200).json({
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
		score: 0,
		rules: experience.space.rules,
		space: {
			id: experience.space.id,
			name: experience.space.name,
			typeCode: experience.space.typeCode,
			address: experience.space.roadAddress || experience.space.address,
			latitude: experience.space.lat,
			longitude: experience.space.lng,
			distanceMeters: 0,
		},
		slots,
		reviews: reviews.map((review) => ({
			id: review.id,
			afterEmotion: review.afterEmotion,
			highlightTags: review.highlightTags,
			body: review.body,
			createdAt: review.createdAt.toISOString(),
		})),
	})
}
