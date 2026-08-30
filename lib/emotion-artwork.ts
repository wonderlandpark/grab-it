import type { EmotionValue } from '@/types/domain'

export type EmotionArtworkPlacement = 'left' | 'right' | 'both'
export type EmotionArtworkSize = 'small' | 'medium' | 'large'

export interface EmotionArtworkConfig {
	src: string
	placement: EmotionArtworkPlacement
	size: EmotionArtworkSize
}

export const emotionArtwork = {
	CALM: { src: '/emotions/calm-stars.svg', placement: 'both', size: 'medium' },
	REFRESH: { src: '/emotions/refresh-stars.svg', placement: 'right', size: 'large' },
	EXCITEMENT: { src: '/emotions/excitement-stars.svg', placement: 'both', size: 'large' },
	AWE: { src: '/emotions/awe-stars.svg', placement: 'both', size: 'medium' },
	COMFORT: { src: '/emotions/comfort-stars.svg', placement: 'both', size: 'large' },
	LIBERATION: { src: '/emotions/liberation-stars.svg', placement: 'right', size: 'large' },
	FOCUS: { src: '/emotions/focus-stars.svg', placement: 'both', size: 'medium' },
	ENERGY: { src: '/emotions/energy-stars.svg', placement: 'left', size: 'large' },
} satisfies Record<EmotionValue, EmotionArtworkConfig>

export const unsureEmotionArtwork = {
	src: '/emotions/unsure-stars.svg',
	placement: 'right',
	size: 'small',
} satisfies EmotionArtworkConfig

export function representativeEmotion(
	desiredEmotions: EmotionValue[],
	experienceEmotions: EmotionValue[]
) {
	return (
		desiredEmotions.find((emotion) => experienceEmotions.includes(emotion)) ??
		experienceEmotions[0] ??
		null
	)
}
