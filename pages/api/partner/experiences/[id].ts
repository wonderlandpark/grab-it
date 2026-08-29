import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePartner } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })
	const partner = await requirePartner(req, res)
	if (!partner) return
	const current = await prisma.experience.findFirst({
		where: { id: String(req.query.id), space: { ownerId: partner.user.id } },
	})
	if (!current) return res.status(404).json({ error: '경험을 찾을 수 없습니다.' })
	const durationMinutes =
			req.body.durationMinutes === undefined ? undefined : Number(req.body.durationMinutes),
		priceWon = req.body.priceWon === undefined ? undefined : Number(req.body.priceWon),
		originalPriceWon =
			req.body.originalPriceWon === undefined
				? undefined
				: req.body.originalPriceWon
					? Number(req.body.originalPriceWon)
					: null
	const effectivePrice = priceWon ?? current.priceWon
	if (
		(durationMinutes !== undefined &&
			(!Number.isInteger(durationMinutes) || durationMinutes < 15)) ||
		(priceWon !== undefined && (!Number.isInteger(priceWon) || priceWon < 0)) ||
		(originalPriceWon !== undefined &&
			originalPriceWon !== null &&
			(!Number.isInteger(originalPriceWon) || originalPriceWon <= effectivePrice))
	)
		return res.status(400).json({ error: '시간과 가격을 확인해 주세요.' })
	const result = await prisma.experience.update({
		where: { id: current.id },
		data: {
			title: req.body.title ? String(req.body.title).slice(0, 120) : undefined,
			description: req.body.description ? String(req.body.description).slice(0, 1000) : undefined,
			durationMinutes,
			priceWon,
			originalPriceWon,
			ambienceTags: Array.isArray(req.body.ambienceTags)
				? req.body.ambienceTags.map(String).slice(0, 8)
				: undefined,
			status: partner.user.isDemo
				? 'DRAFT'
				: ['DRAFT', 'PUBLISHED', 'HIDDEN'].includes(req.body.status)
					? req.body.status
					: undefined,
		},
	})
	return res.status(200).json(result)
}
