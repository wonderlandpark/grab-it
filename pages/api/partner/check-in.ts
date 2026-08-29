import type { NextApiRequest, NextApiResponse } from 'next'
import { bookingIdFromToken, hashToken } from '@/lib/booking-token'
import { prisma } from '@/lib/prisma'
import { requirePartner } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
	const partner = await requirePartner(req, res)
	if (!partner) return
	const token = String(req.body?.token || ''),
		id = bookingIdFromToken(token)
	if (!id) return res.status(400).json({ error: '유효하지 않은 QR입니다.' })
	const booking = await prisma.booking.findUnique({
		where: { id },
		include: {
			user: { select: { name: true } },
			slot: { include: { experience: { include: { space: true } } } },
		},
	})
	if (!booking || booking.qrTokenHash !== hashToken(token))
		return res.status(404).json({ error: '예약을 찾을 수 없습니다.' })
	if (booking.slot.experience.space.ownerId !== partner.user.id)
		return res.status(403).json({ error: '이 공간의 운영자만 체크인할 수 있습니다.' })
	if (booking.status === 'CHECKED_IN')
		return res.status(409).json({ error: '이미 사용한 QR입니다.' })
	const now = new Date(),
		opensAt = new Date(booking.slot.startsAt.getTime() - 15 * 60000)
	if (booking.status !== 'CONFIRMED' || now < opensAt || now > booking.slot.endsAt)
		return res.status(409).json({ error: '체크인 가능한 시간이 아닙니다.' })
	await prisma.booking.update({ where: { id }, data: { status: 'CHECKED_IN', checkedInAt: now } })
	return res
		.status(200)
		.json({
			ok: true,
			guestName: booking.user.name,
			experienceTitle: booking.slot.experience.title,
		})
}
