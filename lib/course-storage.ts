import type { CourseRecommendation, DiscoveryIntent } from '@/types/domain'

export const WISH_KEY = 'course-wishes:v1'
export const DISCOVERY_VIEW_KEY = 'discovery-view:v1'
export const COURSE_DRAFT_KEY = 'course-draft:v4'
export const WISH_EVENT = 'course-wishes-change'

export interface DiscoveryViewState {
	intent: DiscoveryIntent
	currentState: string
	emotionMode: 'direct' | 'unsure'
	locationName: string
	showMap: boolean
	loadedResultCount: number
	scrollY: number
	returnUrl: string
}

export interface CourseDraftState {
	createdAt: number
	wishIds: string[]
	intentKey: string
	excludedSignatures: string[]
	courses: CourseRecommendation[]
	returnUrl: string
}

function readJson<T>(key: string): T | null {
	if (typeof window === 'undefined') return null
	try {
		return JSON.parse(sessionStorage.getItem(key) || 'null') as T | null
	} catch {
		return null
	}
}

export function readWishIds() {
	const ids = readJson<unknown[]>(WISH_KEY)
	return Array.isArray(ids)
		? [...new Set(ids.filter((id): id is string => typeof id === 'string'))]
		: []
}

export function writeWishIds(ids: string[]) {
	const next = [...new Set(ids)]
	sessionStorage.setItem(WISH_KEY, JSON.stringify(next))
	window.dispatchEvent(new CustomEvent(WISH_EVENT, { detail: next }))
	return next
}

export function readDiscoveryView() {
	return readJson<DiscoveryViewState>(DISCOVERY_VIEW_KEY)
}

export function writeDiscoveryView(value: DiscoveryViewState) {
	sessionStorage.setItem(DISCOVERY_VIEW_KEY, JSON.stringify(value))
}

export function readCourseDraft(wishIds: string[], intentKey: string) {
	const draft = readJson<CourseDraftState>(COURSE_DRAFT_KEY)
	if (!draft || Date.now() - draft.createdAt > 30 * 60000) return null
	if (draft.wishIds.join('|') !== wishIds.join('|')) return null
	if (draft.intentKey !== intentKey) return null
	return draft
}

export function writeCourseDraft(value: CourseDraftState) {
	sessionStorage.setItem(COURSE_DRAFT_KEY, JSON.stringify(value))
}

export function clearCourseDraft() {
	sessionStorage.removeItem(COURSE_DRAFT_KEY)
}
