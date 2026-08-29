import type { Emotion } from '@prisma/client'
import { distanceInMeters } from '@/lib/geo'

export interface ScoringInput {
	desiredEmotion: Emotion
	emotions: Emotion[]
	distanceMeters: number
	maxDistanceMeters: number
	startsAt: Date
	now: Date
	windowMinutes: number
	priceWon: number
	maxBudget?: number
}

export function recommendationScore(input: ScoringInput) {
	const emotion = input.emotions.includes(input.desiredEmotion) ? 50 : 0
	const distance = Math.max(
		0,
		20 * (1 - input.distanceMeters / Math.max(input.maxDistanceMeters, 1))
	)
	const minutesUntilStart = Math.max(0, (input.startsAt.getTime() - input.now.getTime()) / 60000)
	const speed = Math.max(0, 20 * (1 - minutesUntilStart / input.windowMinutes))
	const budget =
		input.maxBudget == null
			? 10
			: Math.max(0, 10 * (1 - input.priceWon / Math.max(input.maxBudget, 1)))
	return Math.round((emotion + distance + speed + budget) * 10) / 10
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
