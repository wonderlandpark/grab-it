import type { Emotion } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePartner } from '@/lib/request'

const validEmotions = new Set([
	'CALM',
	'REFRESH',
	'EXCITEMENT',
	'AWE',
	'COMFORT',
	'LIBERATION',
	'FOCUS',
	'ENERGY',
])
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const partner = await requirePartner(req, res)
	if (!partner) return
	if (req.method === 'GET')
		return res
			.status(200)
			.json(
				await prisma.experience.findMany({
					where: { space: { ownerId: partner.user.id } },
					include: { space: true, emotions: true },
					orderBy: { createdAt: 'desc' },
				})
			)
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
	const space = await prisma.space.findFirst({
		where: { id: String(req.body?.spaceId || ''), ownerId: partner.user.id },
	})
	const title = String(req.body?.title || '').trim(),
		description = String(req.body?.description || '').trim(),
		durationMinutes = Number(req.body?.durationMinutes),
		priceWon = Number(req.body?.priceWon || 0)
	const emotions = Array.isArray(req.body?.emotions)
		? ([
				...new Set(
					req.body.emotions.filter(
						(item: unknown) => typeof item === 'string' && validEmotions.has(item)
					)
				),
			] as Emotion[])
		: []
	const ambienceTags = Array.isArray(req.body?.ambienceTags)
		? req.body.ambienceTags
				.map(String)
				.map((item: string) => item.trim())
				.filter(Boolean)
				.slice(0, 8)
		: []
	if (
		!space ||
		!title ||
		!description ||
		!Number.isInteger(durationMinutes) ||
		durationMinutes < 15 ||
		durationMinutes > 1440 ||
		!Number.isInteger(priceWon) ||
		priceWon < 0 ||
		emotions.length === 0
	)
		return res.status(400).json({ error: '경험 정보를 확인해 주세요.' })
	const experience = await prisma.experience.create({
		data: {
			spaceId: space.id,
			title: title.slice(0, 120),
			description: description.slice(0, 1000),
			durationMinutes,
			priceWon,
			ambienceTags,
			emotions: { create: emotions.map((emotion) => ({ emotion })) },
			status: partner.user.isDemo ? 'DRAFT' : 'PUBLISHED',
		},
		include: { emotions: true },
	})
	return res.status(201).json(experience)
}
