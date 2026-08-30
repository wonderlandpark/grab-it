import type { Emotion } from '@prisma/client'
import { distanceInMeters } from '@/lib/geo'

export interface ScoringInput {
	desiredEmotions: Emotion[]
	emotions: Emotion[]
	distanceMeters: number
	maxDistanceMeters: number
	startsAt: Date
	earliest: Date
	latest: Date
}

export function recommendationScore(input: ScoringInput) {
	const matchedEmotionCount = input.desiredEmotions.filter((emotion) =>
		input.emotions.includes(emotion)
	).length
	const emotion = input.desiredEmotions.length
		? 50 * (matchedEmotionCount / input.desiredEmotions.length)
		: 0
	const distance = Math.max(
		0,
		25 * (1 - input.distanceMeters / Math.max(input.maxDistanceMeters, 1))
	)
	const windowMilliseconds = Math.max(1, input.latest.getTime() - input.earliest.getTime())
	const position = Math.max(0, input.startsAt.getTime() - input.earliest.getTime())
	const time = Math.max(0, 25 * (1 - position / windowMilliseconds))
	return Math.round((emotion + distance + time) * 10) / 10
}

export function matchedEmotionCount(desiredEmotions: Emotion[], experienceEmotions: Emotion[]) {
	return desiredEmotions.filter((emotion) => experienceEmotions.includes(emotion)).length
}

export function distanceFrom(
	latitude: number,
	longitude: number,
	targetLatitude: number,
	targetLongitude: number
) {
	return distanceInMeters(
		{ latitude, longitude },
		{ latitude: targetLatitude, longitude: targetLongitude }
	)
}
