import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePartner } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
	const partner = await requirePartner(req, res)
	if (!partner) return
	const slots = await prisma.slot.findMany({
		where: { experience: { space: { ownerId: partner.user.id } }, startsAt: { gte: new Date() } },
		include: {
			experience: { include: { space: true } },
			bookings: {
				where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
				include: { user: { select: { name: true } } },
			},
		},
		orderBy: { startsAt: 'asc' },
		take: 100,
	})
	return res
		.status(200)
		.json(
			slots.map((slot) => ({
				...slot,
				soldSeats: slot.bookings.length,
				remainingSeats: Math.max(0, slot.capacity - slot.bookings.length),
				expectedRevenue: slot.bookings.length * slot.experience.priceWon,
			}))
		)
}
