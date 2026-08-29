import { distanceFrom, recommendationScore } from '@/lib/discovery'

describe('rule-based discovery', () => {
	it('gives matching, closer, faster slots a higher score', () => {
		const now = new Date('2026-08-29T00:00:00Z')
		const close = recommendationScore({
			desiredEmotion: 'CALM',
			emotions: ['CALM'],
			distanceMeters: 300,
			maxDistanceMeters: 3000,
			startsAt: new Date(now.getTime() + 30 * 60000),
			now,
			windowMinutes: 180,
			priceWon: 5000,
			maxBudget: 20000,
		})
		const far = recommendationScore({
			desiredEmotion: 'CALM',
			emotions: ['ENERGY'],
			distanceMeters: 2500,
			maxDistanceMeters: 3000,
			startsAt: new Date(now.getTime() + 150 * 60000),
			now,
			windowMinutes: 180,
			priceWon: 18000,
			maxBudget: 20000,
		})
		expect(close).toBeGreaterThan(far)
	})

	it('calculates a realistic Seoul distance', () => {
		const meters = distanceFrom(37.5665, 126.978, 37.5651, 126.98955)
		expect(meters).toBeGreaterThan(900)
		expect(meters).toBeLessThan(1200)
	})
})
