import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
	if (!(await requireAdmin(req, res))) return
	const reports = await prisma.report.findMany({
		where: { status: 'OPEN' },
		include: {
			reporter: { select: { name: true } },
			review: {
				include: {
					booking: {
						include: {
							user: { select: { name: true } },
							slot: { include: { experience: { select: { title: true } } } },
						},
					},
				},
			},
		},
		orderBy: { createdAt: 'asc' },
		take: 100,
	})
	return res.status(200).json(reports)
}
