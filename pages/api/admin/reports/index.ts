import type { NextApiRequest, NextApiResponse } from 'next'

import { allowMethods, handleApiError, requireAdmin } from '@/lib/api'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!allowMethods(req, res, ['GET'])) return

	try {
		await requireAdmin(req, res)
		const reports = await prisma.report.findMany({
			where: { status: 'OPEN' },
			select: {
				id: true,
				reason: true,
				status: true,
				createdAt: true,
				reporter: { select: { id: true, name: true } },
				experience: {
					select: {
						id: true,
						body: true,
						status: true,
						visibility: true,
						author: { select: { id: true, name: true } },
					},
				},
			},
			orderBy: { createdAt: 'asc' },
			take: 100,
		})
		res.status(200).json({ reports })
	} catch (error) {
		handleApiError(error, res)
	}
}
