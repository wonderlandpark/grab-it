import type { NextApiRequest, NextApiResponse } from 'next'
import { isValidCoordinates } from '@/lib/geo'
import { prisma } from '@/lib/prisma'
import { requirePartner } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })
	const partner = await requirePartner(req, res)
	if (!partner) return
	const current = await prisma.space.findFirst({
		where: { id: String(req.query.id), ownerId: partner.user.id },
	})
	if (!current) return res.status(404).json({ error: '공간을 찾을 수 없습니다.' })
	const lat = req.body.latitude === undefined ? current.lat : Number(req.body.latitude),
		lng = req.body.longitude === undefined ? current.lng : Number(req.body.longitude)
	if (!isValidCoordinates(lat, lng)) return res.status(400).json({ error: '위치를 확인해 주세요.' })
	const result = await prisma.space.update({
		where: { id: current.id },
		data: {
			name: req.body.name ? String(req.body.name).slice(0, 120) : undefined,
			description: req.body.description ? String(req.body.description).slice(0, 1000) : undefined,
			typeCode: req.body.typeCode ? String(req.body.typeCode).slice(0, 30) : undefined,
			address: req.body.address ? String(req.body.address).slice(0, 300) : undefined,
			rules:
				req.body.rules === null
					? null
					: req.body.rules
						? String(req.body.rules).slice(0, 1000)
						: undefined,
			lat,
			lng,
			status: partner.user.isDemo
				? 'DRAFT'
				: ['DRAFT', 'PUBLISHED', 'HIDDEN'].includes(req.body.status)
					? req.body.status
					: undefined,
		},
	})
	return res.status(200).json(result)
}
