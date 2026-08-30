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

	const requestedSlotIds: unknown[] = Array.isArray(req.body?.slotIds) ? req.body.slotIds : []
	const slotIds = [
		...new Set(requestedSlotIds.filter((id): id is string => typeof id === 'string')),
	]
	const desiredEmotion = String(req.body?.desiredEmotion || '') as Emotion
	const currentState =
		typeof req.body?.currentState === 'string' ? req.body.currentState.slice(0, 40) : null
	if (!slotIds.length || slotIds.length > 50 || !emotions.has(desiredEmotion))
		return res.status(400).json({ error: '궤적 예약 정보를 확인해 주세요.' })
	const courseGroupId = randomUUID()

	try {
		const bookings = await prisma.$transaction(
			async (tx) => {
				const slots = await tx.slot.findMany({
					where: { id: { in: slotIds } },
					include: {
						experience: {
							include: {
								space: { include: { owner: { include: { partnerApplication: true } } } },
							},
						},
					},
				})
				const slotsById = new Map(slots.map((slot) => [slot.id, slot]))
				const orderedSlots = slotIds.map((id) => slotsById.get(id))
				const now = new Date()
				if (
					orderedSlots.some(
						(slot) =>
							!slot ||
							slot.status !== 'OPEN' ||
							slot.startsAt <= now ||
							slot.bookingClosesAt <= now ||
							slot.experience.status !== 'PUBLISHED' ||
							slot.experience.space.status !== 'PUBLISHED' ||
							slot.experience.space.owner.isDemo ||
							slot.experience.space.owner.partnerApplication?.status !== 'APPROVED'
					)
				)
					throw new Error('BOOKING_CLOSED')

				const duplicate = await tx.booking.findFirst({
					where: { userId: user.id, slotId: { in: slotIds } },
				})
				if (duplicate) throw new Error('DUPLICATE')

				for (const slot of orderedSlots) {
					if (!slot) throw new Error('BOOKING_CLOSED')
					const activeCount = await tx.booking.count({
						where: { slotId: slot.id, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
					})
					if (activeCount >= slot.capacity) throw new Error('SOLD_OUT')
				}

				const created = []
				for (const [courseOrder, slotId] of slotIds.entries()) {
					const id = randomUUID()
					created.push(
						await tx.booking.create({
							data: {
								id,
								slotId,
								userId: user.id,
								courseGroupId,
								courseOrder,
								desiredEmotion,
								currentState,
								qrTokenHash: hashToken(bookingToken(id)),
							},
							include: bookingInclude,
						})
					)
				}
				return created
			},
			{ isolationLevel: 'Serializable' as Prisma.TransactionIsolationLevel }
		)
		return res.status(201).json({ bookings: bookings.map(bookingView) })
	} catch (error) {
		const message = error instanceof Error ? error.message : ''
		if (message === 'DUPLICATE')
			return res.status(409).json({ error: '이미 예약한 순간이 궤적에 포함되어 있어요.' })
		if (
			message === 'SOLD_OUT' ||
			message === 'BOOKING_CLOSED' ||
			(error as { code?: string }).code === 'P2034'
		)
			return res.status(409).json({
				error: '궤적에 포함된 자리 하나가 방금 마감됐어요. 궤적을 다시 선택해 주세요.',
			})
		throw error
	}
}
