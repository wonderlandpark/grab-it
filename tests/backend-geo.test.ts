import { blurCoordinates, isValidCoordinates, parseBounds } from '@/lib/geo'

describe('location privacy helpers', () => {
	it('creates stable public coordinates without returning the exact point', () => {
		const exact = { latitude: 37.5665, longitude: 126.978 }
		const first = blurCoordinates(exact, 'private-seed')
		const second = blurCoordinates(exact, 'private-seed')

		expect(first).toEqual(second)
		expect(first).not.toEqual(exact)
		expect(isValidCoordinates(first.latitude, first.longitude)).toBe(true)
	})

	it('rejects invalid coordinates', () => {
		expect(isValidCoordinates(91, 127)).toBe(false)
		expect(isValidCoordinates(37, 181)).toBe(false)
		expect(isValidCoordinates(Number.NaN, 127)).toBe(false)
	})

	it('parses west,south,east,north bounds', () => {
		expect(parseBounds('126.8,37.4,127.2,37.8')).toEqual({
			west: 126.8,
			south: 37.4,
			east: 127.2,
			north: 37.8,
		})
		expect(parseBounds('127.2,37.4,126.8,37.8')).toBeNull()
	})
})
