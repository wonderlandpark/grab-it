import type { NextApiRequest, NextApiResponse } from 'next'
import { bookingInclude, bookingView } from '@/lib/booking-view'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
	const user = await requireUser(req, res)
	if (!user) return
	const booking = await prisma.booking.findFirst({
		where: { id: String(req.query.id), userId: user.id },
		include: bookingInclude,
	})
	if (!booking) return res.status(404).json({ error: '예약을 찾을 수 없습니다.' })
	return res.status(200).json(bookingView(booking))
}
