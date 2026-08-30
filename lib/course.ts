import { distanceInMeters, type Coordinates } from '@/lib/geo'
import type { CourseRecommendation, ExperienceRecommendation, SlotSummary } from '@/types/domain'

export interface CourseCandidate {
	experience: Omit<ExperienceRecommendation, 'nextSlot'>
	slots: SlotSummary[]
}

interface CourseSearchInput {
	origin: Coordinates
	windowStart: Date
	windowEnd: Date
	maxCourses?: number
	beamWidth?: number
}

interface SearchState {
	items: CourseRecommendation['items']
	usedIds: string[]
	availableAt: Date
	location: Coordinates
	totalTravelMinutes: number
	totalWaitMinutes: number
	totalDistanceMeters: number
	score: number
}

export function estimatedTravel(a: Coordinates, b: Coordinates, transition = false) {
	const directDistance = distanceInMeters(a, b)
	const adjustedDistance = directDistance * 1.3
	const movementMinutes =
		adjustedDistance <= 2000
			? Math.ceil((adjustedDistance / 4000) * 60)
			: Math.ceil((adjustedDistance / 15000) * 60) + 10
	return {
		distanceMeters: Math.round(directDistance),
		minutes: movementMinutes + (transition ? 10 : 0),
	}
}

function compareStates(a: SearchState, b: SearchState) {
	return (
		b.items.length - a.items.length ||
		b.score - a.score ||
		a.totalTravelMinutes - b.totalTravelMinutes ||
		a.totalWaitMinutes - b.totalWaitMinutes ||
		a.availableAt.getTime() - b.availableAt.getTime() ||
		courseSignature(a.items).localeCompare(courseSignature(b.items))
	)
}

export function buildCourses(
	candidates: CourseCandidate[],
	input: CourseSearchInput
): { courses: CourseRecommendation[] } {
	const beamWidth = input.beamWidth || 200
	const maxCourses = input.maxCourses || 4
	const completed = new Map<string, SearchState>()
	let states: SearchState[] = [
		{
			items: [],
			usedIds: [],
			availableAt: input.windowStart,
			location: input.origin,
			totalTravelMinutes: 0,
			totalWaitMinutes: 0,
			totalDistanceMeters: 0,
			score: 0,
		},
	]

	for (let depth = 0; depth < candidates.length; depth += 1) {
		const expanded: SearchState[] = []
		for (const state of states) {
			for (const candidate of candidates) {
				if (state.usedIds.includes(candidate.experience.id)) continue
				const nextLocation = {
					latitude: candidate.experience.space.latitude,
					longitude: candidate.experience.space.longitude,
				}
				const travel = estimatedTravel(state.location, nextLocation, state.items.length > 0)
				const arrival = new Date(state.availableAt.getTime() + travel.minutes * 60000)

				for (const slot of candidate.slots) {
					const startsAt = new Date(slot.startsAt)
					const endsAt = new Date(slot.endsAt)
					if (startsAt < arrival || endsAt > input.windowEnd) continue
					const waitMinutes = Math.max(
						0,
						Math.round((startsAt.getTime() - arrival.getTime()) / 60000)
					)
					const next: SearchState = {
						items: [
							...state.items,
							{
								experience: { ...candidate.experience, nextSlot: slot },
								slot,
								travelMinutes: travel.minutes,
								waitMinutes,
							},
						],
						usedIds: [...state.usedIds, candidate.experience.id],
						availableAt: endsAt,
						location: nextLocation,
						totalTravelMinutes: state.totalTravelMinutes + travel.minutes,
						totalWaitMinutes: state.totalWaitMinutes + waitMinutes,
						totalDistanceMeters: state.totalDistanceMeters + travel.distanceMeters,
						score: state.score + candidate.experience.score,
					}
					expanded.push(next)
					completed.set(courseSignature(next.items), next)
				}
			}
		}
		if (!expanded.length) break
		states = [...new Map(expanded.map((state) => [courseSignature(state.items), state])).values()]
			.sort(compareStates)
			.slice(0, beamWidth)
	}

	return {
		courses: [...completed.values()]
			.sort(compareStates)
			.slice(0, maxCourses)
			.map((state) => toCourse(state, candidates)),
	}
}

function toCourse(state: SearchState, candidates: CourseCandidate[]): CourseRecommendation {
	const selectedIds = new Set(state.items.map((item) => item.experience.id))
	const totalPriceWon = state.items.reduce((sum, item) => sum + item.experience.priceWon, 0)
	const totalOriginalPriceWon = state.items.reduce(
		(sum, item) => sum + (item.experience.originalPriceWon || item.experience.priceWon),
		0
	)
	return {
		signature: courseSignature(state.items),
		items: state.items,
		totalTravelMinutes: state.totalTravelMinutes,
		totalWaitMinutes: state.totalWaitMinutes,
		totalPriceWon,
		totalOriginalPriceWon,
		totalDiscountWon: totalOriginalPriceWon - totalPriceWon,
		totalDistanceMeters: state.totalDistanceMeters,
		startsAt: state.items[0].slot.startsAt,
		endsAt: state.items.at(-1)!.slot.endsAt,
		omitted: candidates
			.filter((candidate) => !selectedIds.has(candidate.experience.id))
			.map((candidate) => ({
				experienceId: candidate.experience.id,
				experienceTitle: candidate.experience.title,
				reason: omissionReason(candidate, state),
			})),
	}
}

function omissionReason(candidate: CourseCandidate, state: SearchState) {
	if (!candidate.slots.length) return '선택한 시간에 남은 자리가 없어요.'
	const overlaps = candidate.slots.every((slot) =>
		state.items.some(
			(item) =>
				new Date(slot.startsAt) < new Date(item.slot.endsAt) &&
				new Date(slot.endsAt) > new Date(item.slot.startsAt)
		)
	)
	return overlaps
		? '궤적에 포함된 다른 순간과 시간이 겹쳐요.'
		: '이동과 준비 시간을 포함하면 연결하기 어려워요.'
}

export function courseSignature(items: CourseRecommendation['items']) {
	return items.map((item) => `${item.experience.id}:${item.slot.id}`).join('|')
}
