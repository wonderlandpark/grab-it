import type { NextApiRequest, NextApiResponse } from 'next'

import {
	ApiError,
	allowMethods,
	handleApiError,
	queryString,
	requireUser,
} from '@/lib/api'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!allowMethods(req, res, ['POST', 'DELETE'])) return

	try {
		const user = await requireUser(req, res)
		const experienceId = queryString(req.query.id)
		if (!experienceId) throw new ApiError(400, '경험 ID가 필요합니다')
		const experience = await prisma.experience.findFirst({
			where: { id: experienceId, visibility: 'PUBLIC', status: 'PUBLISHED' },
			select: { id: true },
		})
		if (!experience) throw new ApiError(404, '경험을 찾을 수 없습니다')

		if (req.method === 'POST') {
			await prisma.resonance.upsert({
				where: { experienceId_userId: { experienceId, userId: user.id } },
				create: { experienceId, userId: user.id },
				update: {},
			})
		} else {
			await prisma.resonance.deleteMany({ where: { experienceId, userId: user.id } })
		}

		const resonanceCount = await prisma.resonance.count({ where: { experienceId } })
		res.status(200).json({
			hasResonated: req.method === 'POST',
			resonanceCount,
		})
	} catch (error) {
		handleApiError(error, res)
	}
}
