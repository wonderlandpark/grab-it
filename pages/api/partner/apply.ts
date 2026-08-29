import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const user = await requireUser(req, res)
	if (!user) return
	if (req.method === 'GET')
		return res
			.status(200)
			.json(await prisma.partnerApplication.findUnique({ where: { userId: user.id } }))
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
	const operatorName = String(req.body?.operatorName || '').trim(),
		phone = String(req.body?.phone || '').trim(),
		businessRegistrationNumber = String(req.body?.businessRegistrationNumber || '').trim()
	if (!operatorName || !phone || !businessRegistrationNumber)
		return res.status(400).json({ error: '운영자 정보를 모두 입력해 주세요.' })
	const existing = await prisma.partnerApplication.findUnique({ where: { userId: user.id } })
	if (existing?.status === 'APPROVED')
		return res.status(409).json({ error: '이미 승인된 운영자입니다.' })
	const result = await prisma.partnerApplication.upsert({
		where: { userId: user.id },
		update: {
			operatorName: operatorName.slice(0, 80),
			phone: phone.slice(0, 30),
			businessRegistrationNumber: businessRegistrationNumber.slice(0, 30),
			status: 'PENDING',
			reviewNote: null,
			reviewedAt: null,
			reviewerId: null,
		},
		create: {
			userId: user.id,
			operatorName: operatorName.slice(0, 80),
			phone: phone.slice(0, 30),
			businessRegistrationNumber: businessRegistrationNumber.slice(0, 30),
		},
	})
	return res.status(201).json(result)
}
