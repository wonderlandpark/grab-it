import { distanceFrom, recommendationScore } from '@/lib/discovery'

describe('rule-based discovery', () => {
	it('gives matching, closer, faster slots a higher score', () => {
		const now = new Date('2026-08-29T00:00:00Z')
		const close = recommendationScore({
			desiredEmotions: ['CALM'],
			emotions: ['CALM'],
			distanceMeters: 300,
			maxDistanceMeters: 3000,
			startsAt: new Date(now.getTime() + 30 * 60000),
			earliest: now,
			latest: new Date(now.getTime() + 180 * 60000),
		})
		const far = recommendationScore({
			desiredEmotions: ['CALM'],
			emotions: ['ENERGY'],
			distanceMeters: 2500,
			maxDistanceMeters: 3000,
			startsAt: new Date(now.getTime() + 150 * 60000),
			earliest: now,
			latest: new Date(now.getTime() + 180 * 60000),
		})
		expect(close).toBeGreaterThan(far)
	})

	it('scores experiences matching both selected emotions above one match', () => {
		const now = new Date('2026-08-29T00:00:00Z')
		const base = {
			desiredEmotions: ['CALM', 'FOCUS'] as const,
			distanceMeters: 500,
			maxDistanceMeters: 3000,
			startsAt: new Date(now.getTime() + 60 * 60000),
			earliest: now,
			latest: new Date(now.getTime() + 180 * 60000),
		}
		const both = recommendationScore({
			...base,
			desiredEmotions: [...base.desiredEmotions],
			emotions: ['CALM', 'FOCUS'],
		})
		const one = recommendationScore({
			...base,
			desiredEmotions: [...base.desiredEmotions],
			emotions: ['CALM'],
		})
		expect(both).toBeGreaterThan(one)
	})

	it('calculates a realistic Seoul distance', () => {
		const meters = distanceFrom(37.5665, 126.978, 37.5651, 126.98955)
		expect(meters).toBeGreaterThan(900)
		expect(meters).toBeLessThan(1200)
	})
})
