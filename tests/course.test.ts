import { buildCourses, estimatedTravel, type CourseCandidate } from '@/lib/course'
import type { SlotSummary } from '@/types/domain'

const start = new Date('2026-08-29T00:00:00Z')
const slot = (id: string, from: number, until: number): SlotSummary => ({
	id,
	startsAt: new Date(start.getTime() + from * 60000).toISOString(),
	endsAt: new Date(start.getTime() + until * 60000).toISOString(),
	bookingClosesAt: new Date(start.getTime() + (from - 5) * 60000).toISOString(),
	capacity: 10,
	availableSeats: 10,
})

const candidate = (id: string, slots: SlotSummary[]): CourseCandidate => ({
	experience: {
		id,
		title: `경험 ${id}`,
		description: '테스트 경험',
		durationMinutes: 30,
		priceWon: 10000,
		originalPriceWon: 15000,
		emotions: ['CALM'],
		ambienceTags: ['조용함'],
		mediaUrl: null,
		score: 80,
		space: {
			id: `space-${id}`,
			name: `공간 ${id}`,
			typeCode: 'WORKSHOP',
			address: '서울',
			latitude: 37.4812,
			longitude: 126.9527,
			distanceMeters: 0,
		},
	},
	slots,
})

describe('course composition', () => {
	it('builds more than three chronological experiences when the window allows it', () => {
		const result = buildCourses(
			[
				candidate('a', [slot('a-1', 30, 60)]),
				candidate('b', [slot('b-1', 90, 120)]),
				candidate('c', [slot('c-1', 150, 180)]),
				candidate('d', [slot('d-1', 210, 240)]),
			],
			{
				origin: { latitude: 37.4812, longitude: 126.9527 },
				windowStart: start,
				windowEnd: new Date(start.getTime() + 270 * 60000),
			}
		)
		expect(result.courses[0].items).toHaveLength(4)
		expect(result.courses[0].items.map((item) => item.experience.id)).toEqual(['a', 'b', 'c', 'd'])
		expect(result.courses[0].totalDiscountWon).toBe(20000)
	})

	it('does not connect slots without enough movement and preparation time', () => {
		const result = buildCourses(
			[candidate('a', [slot('a-1', 30, 60)]), candidate('b', [slot('b-1', 65, 95)])],
			{
				origin: { latitude: 37.4812, longitude: 126.9527 },
				windowStart: start,
				windowEnd: new Date(start.getTime() + 180 * 60000),
			}
		)
		expect(result.courses[0].items).toHaveLength(1)
	})

	it('returns up to four distinct course candidates', () => {
		const candidates = [
			candidate('a', [slot('a-1', 30, 60)]),
			candidate('b', [slot('b-1', 90, 120)]),
			candidate('c', [slot('c-1', 150, 180)]),
			candidate('d', [slot('d-1', 210, 240)]),
		]
		const input = {
			origin: { latitude: 37.4812, longitude: 126.9527 },
			windowStart: start,
			windowEnd: new Date(start.getTime() + 300 * 60000),
		}
		const result = buildCourses(candidates, input)
		expect(result.courses).toHaveLength(4)
		expect(new Set(result.courses.map((course) => course.signature)).size).toBe(4)
	})

	it('uses a conservative distance estimate', () => {
		const travel = estimatedTravel(
			{ latitude: 37.4812, longitude: 126.9527 },
			{ latitude: 37.4912, longitude: 126.9527 },
			true
		)
		expect(travel.distanceMeters).toBeGreaterThan(1000)
		expect(travel.minutes).toBeGreaterThan(25)
	})
})
