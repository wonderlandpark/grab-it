import { createHash } from 'crypto'

export interface Coordinates {
	latitude: number
	longitude: number
}

export interface MapBounds {
	north: number
	south: number
	east: number
	west: number
}

const EARTH_RADIUS_METERS = 6_371_000

export function isValidCoordinates(latitude: number, longitude: number) {
	return (
		Number.isFinite(latitude) &&
		Number.isFinite(longitude) &&
		latitude >= -90 &&
		latitude <= 90 &&
		longitude >= -180 &&
		longitude <= 180
	)
}

export function parseBounds(value: unknown): MapBounds | null {
	if (typeof value !== 'string') return null

	const [west, south, east, north] = value.split(',').map(Number)
	if (![west, south, east, north].every(Number.isFinite)) return null
	if (!isValidCoordinates(south, west) || !isValidCoordinates(north, east)) return null
	if (south >= north || west >= east) return null

	return { north, south, east, west }
}

/**
 * Produces a stable public point 80-220 metres from the submitted location.
 * The seed is private server-side data, so clients cannot reverse the offset.
 */
export function blurCoordinates(
	coordinates: Coordinates,
	seed: string,
	minMeters = 80,
	maxMeters = 220,
): Coordinates {
	if (!isValidCoordinates(coordinates.latitude, coordinates.longitude)) {
		throw new Error('Invalid coordinates')
	}

	const digest = createHash('sha256')
		.update(`${seed}:${coordinates.latitude.toFixed(6)}:${coordinates.longitude.toFixed(6)}`)
		.digest()
	const distanceRatio = digest.readUInt32BE(0) / 0xffffffff
	const angleRatio = digest.readUInt32BE(4) / 0xffffffff
	const distance = minMeters + (maxMeters - minMeters) * distanceRatio
	const angle = angleRatio * Math.PI * 2
	const latitudeRadians = (coordinates.latitude * Math.PI) / 180
	const northOffset = Math.cos(angle) * distance
	const eastOffset = Math.sin(angle) * distance

	return {
		latitude:
			coordinates.latitude + (northOffset / EARTH_RADIUS_METERS) * (180 / Math.PI),
		longitude:
			coordinates.longitude +
			(eastOffset / (EARTH_RADIUS_METERS * Math.cos(latitudeRadians))) * (180 / Math.PI),
	}
}
