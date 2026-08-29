import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
	const user = await requireUser(req, res)
	if (!user) return
	const review = await prisma.review.findFirst({
		where: { id: String(req.query.id), isPublic: true, status: 'PUBLISHED' },
	})
	const reason = String(req.body?.reason || '').trim()
	if (!review || !reason) return res.status(400).json({ error: '신고 내용을 확인해 주세요.' })
	const report = await prisma.report
		.create({ data: { reviewId: review.id, reporterId: user.id, reason: reason.slice(0, 500) } })
		.catch((error: { code?: string }) => (error.code === 'P2002' ? null : Promise.reject(error)))
	if (!report) return res.status(409).json({ error: '이미 신고한 후기입니다.' })
	return res.status(201).json(report)
}
