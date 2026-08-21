import type { NextApiRequest, NextApiResponse } from 'next'

import {
	ApiError,
	allowMethods,
	handleApiError,
	queryString,
	requiredString,
	requireUser,
} from '@/lib/api'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!allowMethods(req, res, ['POST'])) return

	try {
		const user = await requireUser(req, res)
		const experienceId = queryString(req.query.id)
		if (!experienceId) throw new ApiError(400, '경험 ID가 필요합니다')
		const experience = await prisma.experience.findFirst({
			where: { id: experienceId, visibility: 'PUBLIC', status: 'PUBLISHED' },
			select: { id: true, authorId: true },
		})
		if (!experience) throw new ApiError(404, '경험을 찾을 수 없습니다')
		if (experience.authorId === user.id) throw new ApiError(400, '내 기록은 신고할 수 없습니다')

		const reason = requiredString(req.body?.reason, '신고 사유', 300)
		const report = await prisma.report.upsert({
			where: { experienceId_reporterId: { experienceId, reporterId: user.id } },
			create: { experienceId, reporterId: user.id, reason },
			update: { reason, status: 'OPEN', moderatorId: null, resolvedAt: null },
			select: { id: true, status: true, createdAt: true },
		})
		res.status(201).json({ report })
	} catch (error) {
		handleApiError(error, res)
	}
}
