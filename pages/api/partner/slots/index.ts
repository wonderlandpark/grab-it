import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePartner } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const partner = await requirePartner(req, res)
	if (!partner) return
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
	const experience = await prisma.experience.findFirst({
		where: { id: String(req.body?.experienceId || ''), space: { ownerId: partner.user.id } },
	})
	const startsAt = new Date(req.body?.startsAt),
		bookingClosesAt = new Date(req.body?.bookingClosesAt),
		capacity = Number(req.body?.capacity)
	if (
		!experience ||
		Number.isNaN(startsAt.getTime()) ||
		Number.isNaN(bookingClosesAt.getTime()) ||
		startsAt <= new Date() ||
		bookingClosesAt > startsAt ||
		!Number.isInteger(capacity) ||
		capacity < 1 ||
		capacity > 1000
	)
		return res.status(400).json({ error: '슬롯 정보를 확인해 주세요.' })
	const slot = await prisma.slot.create({
		data: {
			experienceId: experience.id,
			startsAt,
			endsAt: new Date(startsAt.getTime() + experience.durationMinutes * 60000),
			bookingClosesAt,
			capacity,
		},
	})
	return res.status(201).json(slot)
}
