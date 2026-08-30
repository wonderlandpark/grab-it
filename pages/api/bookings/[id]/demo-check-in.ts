import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/request'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
	const user = await requireUser(req, res)
	if (!user) return
	if (!user.isDemo) return res.status(403).json({ error: '게스트 예약에서만 사용할 수 있습니다.' })
	const booking = await prisma.booking.findFirst({
		where: { id: String(req.query.id), userId: user.id },
		include: {
			slot: {
				include: {
					experience: { include: { space: true } },
				},
			},
		},
	})
	if (
		!booking ||
		(!booking.slot.experience.isDemoPublic && booking.slot.experience.space.ownerId !== user.id)
	)
		return res.status(404).json({ error: '데모 예약을 찾을 수 없습니다.' })
	if (booking.status !== 'CONFIRMED')
		return res.status(409).json({ error: '확정 상태의 예약만 체크인할 수 있습니다.' })
	await prisma.booking.update({
		where: { id: booking.id },
		data: { status: 'CHECKED_IN', checkedInAt: new Date() },
	})
	return res.status(200).json({ ok: true })
}
