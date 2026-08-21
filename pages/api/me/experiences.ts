import type { NextApiRequest, NextApiResponse } from 'next'

import {
	allowMethods,
	experienceInclude,
	handleApiError,
	requireUser,
	serializeExperienceDetail,
} from '@/lib/api'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!allowMethods(req, res, ['GET'])) return

	try {
		const user = await requireUser(req, res)
		const experiences = await prisma.experience.findMany({
			where: { authorId: user.id, status: { not: 'DELETED' } },
			include: experienceInclude,
			orderBy: { createdAt: 'desc' },
		})
		res.status(200).json({
			experiences: experiences.map((experience) =>
				serializeExperienceDetail(experience, user.id),
			),
		})
	} catch (error) {
		handleApiError(error, res)
	}
}
