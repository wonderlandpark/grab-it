import type { NextApiRequest, NextApiResponse } from 'next'

import {
	ApiError,
	allowMethods,
	handleApiError,
	queryString,
	requireAdmin,
} from '@/lib/api'
import { prisma } from '@/lib/prisma'

const actions = new Set(['HIDE', 'RESTORE', 'RESOLVE', 'DISMISS'])

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!allowMethods(req, res, ['PATCH'])) return

	try {
		const admin = await requireAdmin(req, res)
		const id = queryString(req.query.id)
		const action = req.body?.action
		if (!id) throw new ApiError(400, '신고 ID가 필요합니다')
		if (typeof action !== 'string' || !actions.has(action)) {
			throw new ApiError(400, '처리 방법이 올바르지 않습니다')
		}
		const report = await prisma.report.findUnique({
			where: { id },
			select: { id: true, experienceId: true },
		})
		if (!report) throw new ApiError(404, '신고를 찾을 수 없습니다')

		const reportStatus = action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED'
		const experienceStatus = action === 'HIDE' ? 'HIDDEN' : action === 'RESTORE' ? 'PUBLISHED' : null
		const result = await prisma.$transaction(async (transaction) => {
			if (experienceStatus) {
				await transaction.experience.update({
					where: { id: report.experienceId },
					data: { status: experienceStatus },
				})
			}
			return transaction.report.update({
				where: { id },
				data: {
					status: reportStatus,
					moderatorId: admin.id,
					resolvedAt: new Date(),
				},
				select: { id: true, status: true, resolvedAt: true },
			})
		})
		res.status(200).json({ report: result })
	} catch (error) {
		handleApiError(error, res)
	}
}
