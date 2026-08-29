import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
	const user = await requireUser(req, res)
	if (!user) return
	const booking = await prisma.booking.findFirst({
		where: { id: String(req.query.id), userId: user.id },
		include: { slot: true },
	})
	if (!booking) return res.status(404).json({ error: '예약을 찾을 수 없습니다.' })
	if (booking.status !== 'CONFIRMED' || booking.slot.startsAt <= new Date())
		return res.status(409).json({ error: '시작 전 확정 예약만 취소할 수 있습니다.' })
	await prisma.booking.update({
		where: { id: booking.id },
		data: { status: 'CANCELLED', cancelledAt: new Date() },
	})
	return res.status(200).json({ ok: true })
}
