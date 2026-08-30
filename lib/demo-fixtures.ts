import { createHash } from 'crypto'
import type { Prisma } from '@prisma/client'

const shifted = (now: Date, minutes: number) => new Date(now.getTime() + minutes * 60_000)

const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex')

export async function createGuestDemoFixtures(
	tx: Prisma.TransactionClient,
	userId: string,
	uuid: string,
	now = new Date()
) {
	const suffix = uuid.replaceAll('-', '').slice(0, 12)
	const spaceId = `guest-space-${suffix}`
	const experienceId = `guest-experience-${suffix}`
	const reviewedSlotId = `guest-reviewed-slot-${suffix}`
	const pendingReviewSlotId = `guest-pending-review-slot-${suffix}`
	const openSlotId = `guest-open-slot-${suffix}`

	await tx.space.create({
		data: {
			id: spaceId,
			ownerId: userId,
			name: '나의 비공개 데모 라운지',
			description: '공간 운영 화면을 체험하기 위한 게스트 전용 공간이에요.',
			typeCode: 'CAFE',
			address: '서울 관악구 관악로 1',
			roadAddress: '서울 관악구 관악로 1',
			lat: 37.4599,
			lng: 126.9519,
			rules: '게스트 전용 데이터로 다른 방문자에게 공개되지 않아요.',
			status: 'DRAFT',
			experiences: {
				create: {
					id: experienceId,
					title: '창가에서 40분 숨 고르기',
					description: '비어 있는 창가 좌석을 짧은 리프레시 순간으로 열어보는 예시예요.',
					durationMinutes: 40,
					priceWon: 8000,
					originalPriceWon: 14000,
					ambienceTags: ['창가', '조용함', '햇빛'],
					status: 'DRAFT',
					isDemoPublic: false,
					emotions: { create: [{ emotion: 'CALM' }, { emotion: 'REFRESH' }] },
					slots: {
						create: [
							{
								id: reviewedSlotId,
								startsAt: shifted(now, -3 * 24 * 60),
								endsAt: shifted(now, -3 * 24 * 60 + 40),
								bookingClosesAt: shifted(now, -3 * 24 * 60 - 30),
								capacity: 4,
								status: 'CLOSED',
							},
							{
								id: pendingReviewSlotId,
								startsAt: shifted(now, -24 * 60),
								endsAt: shifted(now, -24 * 60 + 40),
								bookingClosesAt: shifted(now, -24 * 60 - 30),
								capacity: 3,
								status: 'CLOSED',
							},
							{
								id: openSlotId,
								startsAt: shifted(now, 180),
								endsAt: shifted(now, 220),
								bookingClosesAt: shifted(now, 165),
								capacity: 3,
								status: 'OPEN',
							},
						],
					},
				},
			},
		},
	})

	await tx.booking.create({
		data: {
			id: `guest-reviewed-booking-${suffix}`,
			slotId: reviewedSlotId,
			userId,
			status: 'CHECKED_IN',
			currentState: '마음이 복잡해요',
			desiredEmotion: 'CALM',
			qrTokenHash: tokenHash(`reviewed:${uuid}`),
			createdAt: shifted(now, -3 * 24 * 60 - 60),
			checkedInAt: shifted(now, -3 * 24 * 60),
			review: {
				create: {
					afterEmotion: 'CALM',
					highlightTags: ['햇빛', '조용한 시간'],
					body: '잠깐 머물렀는데도 머리가 한결 가벼워졌어요.',
					isPublic: false,
				},
			},
		},
	})

	await tx.booking.create({
		data: {
			id: `guest-pending-review-booking-${suffix}`,
			slotId: pendingReviewSlotId,
			userId,
			status: 'CHECKED_IN',
			currentState: '무기력해요',
			desiredEmotion: 'REFRESH',
			qrTokenHash: tokenHash(`pending-review:${uuid}`),
			createdAt: shifted(now, -24 * 60 - 60),
			checkedInAt: shifted(now, -24 * 60),
		},
	})
}
