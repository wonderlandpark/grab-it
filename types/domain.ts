export const emotions = [
	{ value: 'CALM', label: '고요함·편안함', emoji: '🌿' },
	{ value: 'REFRESH', label: '기분 전환', emoji: '🍊' },
	{ value: 'EXCITEMENT', label: '설렘', emoji: '💗' },
	{ value: 'AWE', label: '문화적 자극', emoji: '🌌' },
	{ value: 'COMFORT', label: '이색적', emoji: '🫂' },
	{ value: 'LIBERATION', label: '해방감', emoji: '🌊' },
	{ value: 'FOCUS', label: '몰입', emoji: '✍️' },
	{ value: 'ENERGY', label: '왁자지껄함', emoji: '⚡' },
] as const

export type EmotionValue = (typeof emotions)[number]['value']

export const currentStates = [
	{ value: 'OVERWHELMED', label: '답답해요' },
	{ value: 'TIRED', label: '무기력해요' },
	{ value: 'LONELY', label: '혼자이고 싶어요' },
	{ value: 'RESTLESS', label: '마음이 복잡해요' },
	{ value: 'BORED', label: '지루해요' },
] as const

export const spaceTypes = [
	['WORKSHOP', '공방·원데이 클래스'],
	['CAFE', '카페'],
	['BEAUTY', '네일·왁싱·마사지'],
	['SPORTS', '골프·테니스·PT'],
	['PET_CARE', '반려동물 미용·케어'],
	['CULTURE', '전시·공연'],
	['DINING', '파인다이닝·오마카세'],
	['COWORKING', '공유오피스·스터디카페'],
	['BOOKSTORE', '독립서점'],
	['HOTEL', '호텔 라운지'],
	['OTHER', '기타'],
] as const

export interface PlaceSearchResult {
	id: string
	name: string
	category: string | null
	address: string | null
	roadAddress: string | null
	latitude: number
	longitude: number
}

export interface SlotSummary {
	id: string
	startsAt: string
	endsAt: string
	bookingClosesAt: string
	capacity: number
	availableSeats: number
}

export interface ExperienceRecommendation {
	id: string
	title: string
	description: string
	durationMinutes: number
	priceWon: number
	originalPriceWon: number | null
	emotions: EmotionValue[]
	ambienceTags: string[]
	mediaUrl: string | null
	score: number
	matchedEmotionCount?: number
	space: {
		id: string
		name: string
		typeCode: string
		address: string
		latitude: number
		longitude: number
		distanceMeters: number
	}
	nextSlot: SlotSummary
}

export interface ExperienceDetail extends Omit<ExperienceRecommendation, 'nextSlot'> {
	rules: string | null
	slots: SlotSummary[]
	reviews: Array<{
		id: string
		afterEmotion: EmotionValue
		highlightTags: string[]
		body: string | null
		createdAt: string
	}>
}

export interface BookingTicket {
	id: string
	status: 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN'
	currentState: string | null
	desiredEmotion: EmotionValue
	qrToken: string
	createdAt: string
	cancelledAt: string | null
	checkedInAt: string | null
	slot: SlotSummary & {
		experience: {
			id: string
			title: string
			priceWon: number
			isDemoPublic: boolean
			space: { id: string; name: string; address: string }
		}
	}
	review: {
		id: string
		afterEmotion: EmotionValue
		highlightTags: string[]
		body: string | null
		createdAt: string
	} | null
}

export interface DiscoveryIntent {
	currentState?: string
	desiredEmotion: EmotionValue
	desiredEmotions?: EmotionValue[]
	availableFromMinutes: number
	availableUntilMinutes: number
	latitude: number
	longitude: number
	maxDistanceKm: number
}

export interface CourseItem {
	experience: ExperienceRecommendation
	slot: SlotSummary
	travelMinutes: number
	waitMinutes: number
}

export interface CourseRecommendation {
	signature: string
	items: CourseItem[]
	totalTravelMinutes: number
	totalWaitMinutes: number
	totalPriceWon: number
	totalOriginalPriceWon: number
	totalDiscountWon: number
	totalDistanceMeters: number
	startsAt: string
	endsAt: string
	omitted: Array<{ experienceId: string; experienceTitle?: string; reason: string }>
}
