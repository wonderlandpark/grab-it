import { randomUUID } from 'crypto'
import type { Emotion, Prisma } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { bookingToken, hashToken } from '@/lib/booking-token'
import { bookingInclude, bookingView } from '@/lib/booking-view'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/request'

const emotions = new Set([
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
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
	const user = await requireUser(req, res)
	if (!user) return
	const slotId = String(req.body?.slotId || ''),
		desiredEmotion = String(req.body?.desiredEmotion || '') as Emotion
	const currentState =
		typeof req.body?.currentState === 'string' ? req.body.currentState.slice(0, 40) : null
	if (!slotId || !emotions.has(desiredEmotion))
		return res.status(400).json({ error: '예약 정보를 확인해 주세요.' })
	try {
		const booking = await prisma.$transaction(
			async (tx) => {
				const slot = await tx.slot.findUnique({
					where: { id: slotId },
					include: {
						experience: {
							include: { space: { include: { owner: { include: { partnerApplication: true } } } } },
						},
					},
				})
				const now = new Date()
				if (
					!slot ||
					slot.status !== 'OPEN' ||
					slot.startsAt <= now ||
					slot.bookingClosesAt <= now ||
					slot.experience.status !== 'PUBLISHED' ||
					slot.experience.space.status !== 'PUBLISHED' ||
					slot.experience.space.owner.partnerApplication?.status !== 'APPROVED'
				)
					throw new Error('BOOKING_CLOSED')
				const count = await tx.booking.count({
					where: { slotId, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
				})
				if (count >= slot.capacity) throw new Error('SOLD_OUT')
				const duplicate = await tx.booking.findUnique({
					where: { slotId_userId: { slotId, userId: user.id } },
				})
				if (duplicate) throw new Error('DUPLICATE')
				const id = randomUUID(),
					token = bookingToken(id)
				return tx.booking.create({
					data: {
						id,
						slotId,
						userId: user.id,
						desiredEmotion,
						currentState,
						qrTokenHash: hashToken(token),
					},
					include: bookingInclude,
				})
			},
			{ isolationLevel: 'Serializable' as Prisma.TransactionIsolationLevel }
		)
		return res.status(201).json(bookingView(booking))
	} catch (error) {
		const message = error instanceof Error ? error.message : ''
		if (message === 'DUPLICATE') return res.status(409).json({ error: '이미 예약한 시간입니다.' })
		if (
			message === 'SOLD_OUT' ||
			message === 'BOOKING_CLOSED' ||
			(error as { code?: string }).code === 'P2034'
		)
			return res
				.status(409)
				.json({ error: '방금 좌석이 마감되었습니다. 다른 시간을 선택해 주세요.' })
		throw error
	}
}
