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
	if (!experience) return res.status(400).json({ error: '열 수 있는 경험을 선택해 주세요.' })
	if (Number.isNaN(startsAt.getTime()) || Number.isNaN(bookingClosesAt.getTime()))
		return res.status(400).json({ error: '시작 시각과 예약 마감 시각을 확인해 주세요.' })
	if (startsAt <= new Date())
		return res.status(400).json({ error: '시작 시각은 현재보다 뒤여야 해요.' })
	if (bookingClosesAt > startsAt)
		return res.status(400).json({ error: '예약 마감 시각은 시작 시각과 같거나 이전이어야 해요.' })
	if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000)
		return res.status(400).json({ error: '정원은 1명에서 1,000명 사이로 입력해 주세요.' })
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
