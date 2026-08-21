export const emotions = [
	{ value: 'CALM', label: '편안함', color: '#6ea995', emoji: '🌿' },
	{ value: 'REFRESH', label: '기분전환', color: '#efae61', emoji: '🍊' },
	{ value: 'EXCITEMENT', label: '설렘', color: '#e88399', emoji: '💗' },
	{ value: 'AWE', label: '경외감', color: '#7587bb', emoji: '🌌' },
	{ value: 'COMFORT', label: '위로', color: '#9a83b8', emoji: '🫂' },
	{ value: 'LIBERATION', label: '해방감', color: '#5da5c7', emoji: '🌊' },
] as const

export type EmotionValue = (typeof emotions)[number]['value']

export const activities = [
	{ value: 'REST', label: '쉬었어요' },
	{ value: 'WALK', label: '걸었어요' },
	{ value: 'EAT', label: '먹었어요' },
	{ value: 'TALK', label: '대화했어요' },
	{ value: 'VIEW', label: '바라봤어요' },
	{ value: 'EXERCISE', label: '움직였어요' },
	{ value: 'OTHER', label: '다른 경험' },
] as const

export type ActivityValue = (typeof activities)[number]['value']

export interface MapExperience {
	id: string
	body: string
	activity: ActivityValue
	emotions: EmotionValue[]
	latitude: number
	longitude: number
	placeName: string | null
	mediaUrl: string | null
	resonanceCount: number
	createdAt: string
}

export interface ExperienceDetail extends MapExperience {
	author: { id: string; name: string | null; image: string | null }
	media: Array<{ id: string; url: string }>
	isOwner: boolean
	hasResonated: boolean
	visibility: 'PUBLIC' | 'PRIVATE'
	exactLocation?: { latitude: number; longitude: number }
}

export interface PlaceSearchResult {
	id: string
	name: string
	category: string | null
	address: string | null
	roadAddress: string | null
	latitude: number
	longitude: number
}
