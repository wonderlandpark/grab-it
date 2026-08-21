import { Emotion } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'

import {
	ApiError,
	allowMethods,
	handleApiError,
	queryString,
	serializeMapExperience,
	experienceInclude,
} from '@/lib/api'
import { prisma } from '@/lib/prisma'

const emotionValues = new Set<string>(Object.values(Emotion))

function coordinate(value: string | string[] | undefined, name: string) {
	const parsed = Number(queryString(value))
	if (!Number.isFinite(parsed)) throw new ApiError(400, `${name} 경계값이 필요합니다`)
	return parsed
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!allowMethods(req, res, ['GET'])) return

	try {
		const west = coordinate(req.query.west, 'west')
		const south = coordinate(req.query.south, 'south')
		const east = coordinate(req.query.east, 'east')
		const north = coordinate(req.query.north, 'north')
		if (west >= east || south >= north) throw new ApiError(400, '지도 경계가 올바르지 않습니다')
		if (west < -180 || east > 180 || south < -90 || north > 90) {
			throw new ApiError(400, '지도 경계가 올바르지 않습니다')
		}

		const emotions = (queryString(req.query.emotions) ?? '')
			.split(',')
			.filter(Boolean)
		if (emotions.some((emotion) => !emotionValues.has(emotion))) {
			throw new ApiError(400, '알 수 없는 감정입니다')
		}

		const experiences = await prisma.experience.findMany({
			where: {
				visibility: 'PUBLIC',
				status: 'PUBLISHED',
				displayLongitude: { gte: west, lte: east },
				displayLatitude: { gte: south, lte: north },
				...(emotions.length
					? { emotions: { some: { emotion: { in: emotions as Emotion[] } } } }
					: {}),
			},
			include: experienceInclude,
			orderBy: { createdAt: 'desc' },
			take: 250,
		})

		res.status(200).json({ experiences: experiences.map(serializeMapExperience) })
	} catch (error) {
		handleApiError(error, res)
	}
}
