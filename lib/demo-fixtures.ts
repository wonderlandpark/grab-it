import { createHash } from 'crypto'
import type { Emotion, Prisma } from '@prisma/client'

const shifted = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000)

const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex')

interface DemoMoment {
	title: string
	description: string
	durationMinutes: number
	priceWon: number
	originalPriceWon: number
	ambienceTags: string[]
	emotions: Emotion[]
	currentState: string
	desiredEmotion: Emotion
}

const upcomingMoment: DemoMoment = {
	title: '오늘의 향을 고르는 50분',
	description: '비어 있는 작업대에서 나만의 향 조합을 만들어보는 순간이에요.',
	durationMinutes: 50,
	priceWon: 18000,
	originalPriceWon: 32000,
	ambienceTags: ['향', '손으로 만들기', '기분 전환'],
	emotions: ['REFRESH', 'FOCUS'],
	currentState: '지루해요',
	desiredEmotion: 'REFRESH',
}

const reviewedMoment: DemoMoment = {
	title: '낯선 이미지에 머무는 35분',
	description: '작은 전시 공간에서 새로운 장면을 천천히 감상하는 순간이에요.',
	durationMinutes: 35,
	priceWon: 6000,
	originalPriceWon: 10000,
	ambienceTags: ['전시', '낯선 자극', '조용함'],
	emotions: ['AWE', 'CALM'],
	currentState: '마음이 복잡해요',
	desiredEmotion: 'AWE',
}

const pendingReviewMoment: DemoMoment = {
	title: '굳은 몸을 깨우는 40분 리커버리',
	description: '가벼운 움직임과 호흡으로 굳은 몸을 풀어보는 순간이에요.',
	durationMinutes: 40,
	priceWon: 11000,
	originalPriceWon: 18000,
	ambienceTags: ['움직임', '호흡', '해방감'],
	emotions: ['ENERGY', 'LIBERATION'],
	currentState: '무기력해요',
	desiredEmotion: 'ENERGY',
}

export async function createGuestDemoFixtures(
	tx: Prisma.TransactionClient,
	userId: string,
	uuid: string,
	now = new Date()
) {
	const configuredUpcomingStartsAt = new Date(
		process.env.DEMO_UPCOMING_RESERVATION_AT || '2026-08-31T17:30:00+09:00'
	)
	const upcomingStartsAt =
		configuredUpcomingStartsAt.getTime() > now.getTime()
			? configuredUpcomingStartsAt
			: shifted(now, 24 * 60)
	const suffix = uuid.replaceAll('-', '').slice(0, 12)
	const spaceId = `guest-space-${suffix}`
	const upcomingExperienceId = `guest-upcoming-experience-${suffix}`
	const reviewedExperienceId = `guest-reviewed-experience-${suffix}`
	const pendingReviewExperienceId = `guest-pending-review-experience-${suffix}`
	const reviewedSlotId = `guest-reviewed-slot-${suffix}`
	const pendingReviewSlotId = `guest-pending-review-slot-${suffix}`
	const openSlotId = `guest-open-slot-${suffix}`

	await tx.space.create({
		data: {
			id: spaceId,
			ownerId: userId,
			name: '나의 비공개 데모 스튜디오',
			description: '공간 운영과 다양한 순간 등록을 체험하기 위한 게스트 전용 공간이에요.',
			typeCode: 'OTHER',
			address: '서울 관악구 관악로 1',
			roadAddress: '서울 관악구 관악로 1',
			lat: 37.4599,
			lng: 126.9519,
			rules: '게스트 전용 데이터로 다른 방문자에게 공개되지 않아요.',
			status: 'DRAFT',
			experiences: {
				create: [
					{
						id: upcomingExperienceId,
						...experienceData(upcomingMoment),
						slots: {
							create: slotData(
								openSlotId,
								upcomingStartsAt,
								upcomingMoment.durationMinutes,
								'OPEN'
							),
						},
					},
					{
						id: reviewedExperienceId,
						...experienceData(reviewedMoment),
						slots: {
							create: slotData(
								reviewedSlotId,
								shifted(now, -3 * 24 * 60),
								reviewedMoment.durationMinutes,
								'CLOSED'
							),
						},
					},
					{
						id: pendingReviewExperienceId,
						...experienceData(pendingReviewMoment),
						slots: {
							create: slotData(
								pendingReviewSlotId,
								shifted(now, -24 * 60),
								pendingReviewMoment.durationMinutes,
								'CLOSED'
							),
						},
					},
				],
			},
		},
	})

	await tx.booking.create({
		data: bookingData({
			id: `guest-upcoming-booking-${suffix}`,
			slotId: openSlotId,
			userId,
			uuid,
			kind: 'upcoming',
			moment: upcomingMoment,
			status: 'CONFIRMED',
			createdAt: now,
		}),
	})

	await tx.booking.create({
		data: {
			...bookingData({
				id: `guest-reviewed-booking-${suffix}`,
				slotId: reviewedSlotId,
				userId,
				uuid,
				kind: 'reviewed',
				moment: reviewedMoment,
				status: 'CHECKED_IN',
				createdAt: shifted(now, -3 * 24 * 60 - 60),
			}),
			checkedInAt: shifted(now, -3 * 24 * 60),
			review: {
				create: {
					afterEmotion: 'CALM',
					highlightTags: ['낯선 자극', '조용함'],
					body: '천천히 둘러보다 보니 복잡했던 생각이 잠시 멈췄어요.',
					isPublic: false,
				},
			},
		},
	})

	await tx.booking.create({
		data: {
			...bookingData({
				id: `guest-pending-review-booking-${suffix}`,
				slotId: pendingReviewSlotId,
				userId,
				uuid,
				kind: 'pending-review',
				moment: pendingReviewMoment,
				status: 'CHECKED_IN',
				createdAt: shifted(now, -24 * 60 - 60),
			}),
			checkedInAt: shifted(now, -24 * 60),
		},
	})
}

function experienceData(moment: DemoMoment) {
	return {
		title: moment.title,
		description: moment.description,
		durationMinutes: moment.durationMinutes,
		priceWon: moment.priceWon,
		originalPriceWon: moment.originalPriceWon,
		ambienceTags: moment.ambienceTags,
		status: 'DRAFT' as const,
		isDemoPublic: false,
		emotions: { create: moment.emotions.map((emotion) => ({ emotion })) },
	}
}

function slotData(id: string, startsAt: Date, durationMinutes: number, status: 'OPEN' | 'CLOSED') {
	return {
		id,
		startsAt,
		endsAt: shifted(startsAt, durationMinutes),
		bookingClosesAt: shifted(startsAt, -15),
		capacity: 3,
		status,
	}
}

function bookingData({
	id,
	slotId,
	userId,
	uuid,
	kind,
	moment,
	status,
	createdAt,
}: {
	id: string
	slotId: string
	userId: string
	uuid: string
	kind: string
	moment: DemoMoment
	status: 'CONFIRMED' | 'CHECKED_IN'
	createdAt: Date
}) {
	return {
		id,
		slotId,
		userId,
		status,
		currentState: moment.currentState,
		desiredEmotion: moment.desiredEmotion,
		qrTokenHash: tokenHash(`${kind}:${uuid}`),
		createdAt,
	}
}
