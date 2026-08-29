import type { PartnerStatus } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })
	const admin = await requireAdmin(req, res)
	if (!admin) return
	const status = String(req.body?.status) as PartnerStatus
	if (status !== 'APPROVED' && status !== 'REJECTED')
		return res.status(400).json({ error: '처리 상태를 확인해 주세요.' })
	const result = await prisma.partnerApplication.update({
		where: { id: String(req.query.id) },
		data: {
			status,
			reviewerId: admin.id,
			reviewedAt: new Date(),
			reviewNote: req.body?.reviewNote ? String(req.body.reviewNote).slice(0, 300) : null,
		},
	})
	return res.status(200).json(result)
}
