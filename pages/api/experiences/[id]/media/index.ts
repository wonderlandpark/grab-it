import { mkdir, rename, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import formidable, { type File } from 'formidable'
import type { NextApiRequest, NextApiResponse } from 'next'

import {
	ApiError,
	allowMethods,
	handleApiError,
	mediaUrl,
	queryString,
	requireUser,
} from '@/lib/api'
import { prisma } from '@/lib/prisma'

export const config = { api: { bodyParser: false } }

const allowedTypes: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
}

function filesFrom(value: File | File[] | undefined) {
	if (!value) return []
	return Array.isArray(value) ? value : [value]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!allowMethods(req, res, ['POST'])) return

	const movedPaths: string[] = []
	try {
		const user = await requireUser(req, res)
		const experienceId = queryString(req.query.id)
		if (!experienceId) throw new ApiError(400, '경험 ID가 필요합니다')
		const experience = await prisma.experience.findUnique({
			where: { id: experienceId },
			select: { authorId: true, status: true, _count: { select: { media: true } } },
		})
		if (!experience || experience.status === 'DELETED') throw new ApiError(404, '경험을 찾을 수 없습니다')
		if (experience.authorId !== user.id) throw new ApiError(403, '작성자만 사진을 추가할 수 있습니다')

		const maxBytes = Number(process.env.MAX_IMAGE_BYTES ?? 5 * 1024 * 1024)
		const form = formidable({
			maxFiles: 3,
			maxFileSize: maxBytes,
			maxTotalFileSize: maxBytes * 3,
			allowEmptyFiles: false,
		})
		const [, parsedFiles] = await form.parse(req)
		const files = [
			...filesFrom(parsedFiles.images),
			...filesFrom(parsedFiles.image),
			...filesFrom(parsedFiles.files),
		]
		if (files.length === 0) throw new ApiError(400, '사진을 선택해 주세요')
		if (experience._count.media + files.length > 3) {
			throw new ApiError(400, '사진은 경험당 최대 3장까지 올릴 수 있습니다')
		}
		if (files.some((file) => !file.mimetype || !allowedTypes[file.mimetype])) {
			throw new ApiError(400, 'JPG, PNG, WebP, GIF 이미지만 업로드할 수 있습니다')
		}

		const mediaRoot = process.env.MEDIA_ROOT ?? '/app/storage'
		await mkdir(mediaRoot, { recursive: true })
		const nextPosition = experience._count.media
		const media = []
		for (const [index, file] of files.entries()) {
			const contentType = file.mimetype as string
			const storageKey = `${randomUUID()}.${allowedTypes[contentType]}`
			const destination = join(mediaRoot, storageKey)
			await rename(file.filepath, destination)
			movedPaths.push(destination)
			media.push({ storageKey, contentType, position: nextPosition + index })
		}

		await prisma.experienceMedia.createMany({
			data: media.map((item) => ({ experienceId, ...item })),
		})
		const created = await prisma.experienceMedia.findMany({
			where: { experienceId, storageKey: { in: media.map(({ storageKey }) => storageKey) } },
			orderBy: { position: 'asc' },
		})
		res.status(201).json({
			media: created.map((item) => ({ id: item.id, url: mediaUrl(item.storageKey) })),
		})
	} catch (error) {
		await Promise.all(movedPaths.map((path) => unlink(path).catch(() => undefined)))
		handleApiError(error, res)
	}
}
