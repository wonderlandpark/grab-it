import type { NextApiRequest, NextApiResponse } from 'next'
import { bookingInclude, bookingView } from '@/lib/booking-view'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
	const user = await requireUser(req, res)
	if (!user) return
	const bookings = await prisma.booking.findMany({
		where: { userId: user.id },
		orderBy: { createdAt: 'desc' },
		include: bookingInclude,
	})
	return res.status(200).json(bookings.map(bookingView))
}
