import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })
	const admin = await requireAdmin(req, res)
	if (!admin) return
	const action = String(req.body?.action || '')
	if (!['HIDE', 'RESTORE', 'RESOLVE', 'DISMISS'].includes(action))
		return res.status(400).json({ error: '처리 방법이 올바르지 않습니다.' })
	const report = await prisma.report.findUnique({ where: { id: String(req.query.id) } })
	if (!report) return res.status(404).json({ error: '신고를 찾을 수 없습니다.' })
	await prisma.$transaction(async (tx) => {
		if (action === 'HIDE' || action === 'RESTORE')
			await tx.review.update({
				where: { id: report.reviewId },
				data: { status: action === 'HIDE' ? 'HIDDEN' : 'PUBLISHED' },
			})
		await tx.report.update({
			where: { id: report.id },
			data: {
				status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
				moderatorId: admin.id,
				resolvedAt: new Date(),
			},
		})
	})
	return res.status(200).json({ ok: true })
}
