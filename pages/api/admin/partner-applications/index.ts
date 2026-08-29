import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
	if (!(await requireAdmin(req, res))) return
	return res
		.status(200)
		.json(
			await prisma.partnerApplication.findMany({
				include: { user: { select: { name: true, email: true } } },
				orderBy: { createdAt: 'desc' },
			})
		)
}
