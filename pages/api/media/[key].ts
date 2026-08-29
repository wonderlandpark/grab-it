import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { basename, join } from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') return res.status(405).end()
	const key = String(req.query.key || '')
	if (basename(key) !== key || !/^[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(key))
		return res.status(404).end()
	const experienceMedia = await prisma.experienceMedia.findUnique({
		where: { key },
		include: { experience: { include: { space: true } } },
	})
	const spaceMedia = experienceMedia
		? null
		: await prisma.spaceMedia.findUnique({ where: { key }, include: { space: true } })
	if (
		(!experienceMedia ||
			experienceMedia.experience.status !== 'PUBLISHED' ||
			experienceMedia.experience.space.status !== 'PUBLISHED') &&
		(!spaceMedia || spaceMedia.space.status !== 'PUBLISHED')
	)
		return res.status(404).end()
	const path = join(process.env.MEDIA_ROOT || '/app/storage', key),
		file = await stat(path).catch(() => null)
	if (!file?.isFile()) return res.status(404).end()
	res.setHeader(
		'Content-Type',
		experienceMedia?.mimeType || spaceMedia?.mimeType || 'application/octet-stream'
	)
	res.setHeader('Content-Length', file.size)
	res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
	createReadStream(path).pipe(res)
}
