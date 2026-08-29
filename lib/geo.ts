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

export function distanceInMeters(a: Coordinates, b: Coordinates) {
	const toRadians = (degrees: number) => (degrees * Math.PI) / 180
	const latitudeDelta = toRadians(b.latitude - a.latitude)
	const longitudeDelta = toRadians(b.longitude - a.longitude)
	const latitudeA = toRadians(a.latitude)
	const latitudeB = toRadians(b.latitude)
	const haversine =
		Math.sin(latitudeDelta / 2) ** 2 +
		Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2
	return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}
