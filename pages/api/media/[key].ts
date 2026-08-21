import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { basename, join } from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'

import { ApiError, allowMethods, currentUser, handleApiError, queryString } from '@/lib/api'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!allowMethods(req, res, ['GET'])) return

	try {
		const viewer = await currentUser(req, res)
		const key = queryString(req.query.key)
		if (!key || basename(key) !== key || !/^[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(key)) {
			throw new ApiError(404, '사진을 찾을 수 없습니다')
		}
		const media = await prisma.experienceMedia.findUnique({
			where: { storageKey: key },
			include: { experience: { select: { visibility: true, status: true, authorId: true } } },
		})
		if (!media || media.experience.status === 'DELETED') {
			throw new ApiError(404, '사진을 찾을 수 없습니다')
		}
		const isOwner = media.experience.authorId === viewer?.id
		if (!isOwner && (media.experience.status !== 'PUBLISHED' || media.experience.visibility !== 'PUBLIC')) {
			throw new ApiError(404, '사진을 찾을 수 없습니다')
		}

		const path = join(process.env.MEDIA_ROOT ?? '/app/storage', key)
		const file = await stat(path).catch(() => null)
		if (!file?.isFile()) throw new ApiError(404, '사진을 찾을 수 없습니다')
		res.setHeader('Content-Type', media.contentType)
		res.setHeader('Content-Length', file.size)
		res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
		createReadStream(path).pipe(res)
	} catch (error) {
		handleApiError(error, res)
	}
}
