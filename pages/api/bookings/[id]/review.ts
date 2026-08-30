import type { Emotion } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/request'

const validEmotions = new Set([
	'CALM',
	'REFRESH',
	'EXCITEMENT',
	'AWE',
	'COMFORT',
	'LIBERATION',
	'FOCUS',
	'ENERGY',
])
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
	const user = await requireUser(req, res)
	if (!user) return
	const booking = await prisma.booking.findFirst({
		where: { id: String(req.query.id), userId: user.id },
		include: { review: true },
	})
	if (!booking) return res.status(404).json({ error: '예약을 찾을 수 없습니다.' })
	if (booking.status !== 'CHECKED_IN')
		return res.status(403).json({ error: '체크인한 순간만 기록할 수 있습니다.' })
	if (booking.review) return res.status(409).json({ error: '이미 기록을 남겼습니다.' })
	const afterEmotion = String(req.body?.afterEmotion || '') as Emotion
	const highlightTags = Array.isArray(req.body?.highlightTags)
		? req.body.highlightTags
				.map(String)
				.map((tag: string) => tag.trim())
				.filter(Boolean)
				.slice(0, 8)
		: []
	if (!validEmotions.has(afterEmotion))
		return res.status(400).json({ error: '이용 후 감정을 선택해 주세요.' })
	const review = await prisma.review.create({
		data: {
			bookingId: booking.id,
			afterEmotion,
			highlightTags,
			body: req.body?.body ? String(req.body.body).slice(0, 500) : null,
			isPublic: req.body?.isPublic !== false,
		},
	})
	return res.status(201).json(review)
}
