import { randomUUID } from 'crypto'
import { mkdir, rename, unlink } from 'fs/promises'
import { join } from 'path'
import formidable, { type File } from 'formidable'
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePartner } from '@/lib/request'

export const config = { api: { bodyParser: false } }
const allowed: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
}
const list = (value: File | File[] | undefined) =>
	value ? (Array.isArray(value) ? value : [value]) : []

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
	const partner = await requirePartner(req, res)
	if (!partner) return
	const experience = await prisma.experience.findFirst({
		where: { id: String(req.query.id), space: { ownerId: partner.user.id } },
		include: { _count: { select: { media: true } } },
	})
	if (!experience) return res.status(404).json({ error: '경험을 찾을 수 없습니다.' })
	const moved: string[] = []
	try {
		const form = formidable({
			maxFiles: 3,
			maxFileSize: Number(process.env.MAX_IMAGE_BYTES || 5242880),
			allowEmptyFiles: false,
		})
		const [, parsed] = await form.parse(req),
			files = [...list(parsed.images), ...list(parsed.image), ...list(parsed.files)]
		if (
			!files.length ||
			experience._count.media + files.length > 3 ||
			files.some((file) => !file.mimetype || !allowed[file.mimetype])
		)
			return res.status(400).json({ error: 'JPG, PNG, WebP, GIF 사진을 최대 3장 선택해 주세요.' })
		const root = process.env.MEDIA_ROOT || '/app/storage'
		await mkdir(root, { recursive: true })
		const records = []
		for (const [index, file] of files.entries()) {
			const mimeType = file.mimetype as string,
				key = `${randomUUID()}.${allowed[mimeType]}`,
				path = join(root, key)
			await rename(file.filepath, path)
			moved.push(path)
			records.push({
				experienceId: experience.id,
				key,
				mimeType,
				size: file.size,
				sortOrder: experience._count.media + index,
			})
		}
		await prisma.experienceMedia.createMany({ data: records })
		return res
			.status(201)
			.json({ media: records.map((item) => ({ url: `/api/media/${item.key}` })) })
	} catch (error) {
		await Promise.all(moved.map((path) => unlink(path).catch(() => undefined)))
		throw error
	}
}
