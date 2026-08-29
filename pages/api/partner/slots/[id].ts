import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePartner } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })
	const partner = await requirePartner(req, res)
	if (!partner) return
	const slot = await prisma.slot.findFirst({
		where: { id: String(req.query.id), experience: { space: { ownerId: partner.user.id } } },
		include: {
			_count: { select: { bookings: { where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } } } } },
		},
	})
	if (!slot) return res.status(404).json({ error: '슬롯을 찾을 수 없습니다.' })
	const capacity = req.body.capacity === undefined ? undefined : Number(req.body.capacity)
	if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < slot._count.bookings))
		return res.status(400).json({ error: '예약 인원보다 정원을 줄일 수 없습니다.' })
	const result = await prisma.slot.update({
		where: { id: slot.id },
		data: {
			capacity,
			bookingClosesAt: req.body.bookingClosesAt ? new Date(req.body.bookingClosesAt) : undefined,
			status: ['OPEN', 'CLOSED', 'CANCELLED'].includes(req.body.status)
				? req.body.status
				: undefined,
		},
	})
	return res.status(200).json(result)
}
