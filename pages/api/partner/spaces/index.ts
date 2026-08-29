import type { NextApiRequest, NextApiResponse } from 'next'
import { isValidCoordinates } from '@/lib/geo'
import { prisma } from '@/lib/prisma'
import { requirePartner } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const partner = await requirePartner(req, res)
	if (!partner) return
	if (req.method === 'GET')
		return res
			.status(200)
			.json(
				await prisma.space.findMany({
					where: { ownerId: partner.user.id },
					orderBy: { createdAt: 'desc' },
				})
			)
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
	const { name, description, typeCode, address, roadAddress, rules } = req.body || {},
		lat = Number(req.body?.latitude),
		lng = Number(req.body?.longitude)
	if (!name || !description || !typeCode || !address || !isValidCoordinates(lat, lng))
		return res.status(400).json({ error: '공간과 위치 정보를 확인해 주세요.' })
	const space = await prisma.space.create({
		data: {
			ownerId: partner.user.id,
			name: String(name).slice(0, 120),
			description: String(description).slice(0, 1000),
			typeCode: String(typeCode).slice(0, 30),
			address: String(address).slice(0, 300),
			roadAddress: roadAddress ? String(roadAddress).slice(0, 300) : null,
			lat,
			lng,
			rules: rules ? String(rules).slice(0, 1000) : null,
			status: partner.user.isDemo ? 'DRAFT' : 'PUBLISHED',
		},
	})
	return res.status(201).json(space)
}
