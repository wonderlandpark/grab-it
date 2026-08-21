import type { NextApiRequest, NextApiResponse } from 'next'

import {
	allowMethods,
	experienceInclude,
	handleApiError,
	requireUser,
	serializeMapExperience,
} from '@/lib/api'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!allowMethods(req, res, ['GET'])) return

	try {
		const user = await requireUser(req, res)
		const resonances = await prisma.resonance.findMany({
			where: {
				userId: user.id,
				experience: { visibility: 'PUBLIC', status: 'PUBLISHED' },
			},
			include: { experience: { include: experienceInclude } },
			orderBy: { createdAt: 'desc' },
		})
		res.status(200).json({
			experiences: resonances.map(({ experience }) => serializeMapExperience(experience)),
		})
	} catch (error) {
		handleApiError(error, res)
	}
}
