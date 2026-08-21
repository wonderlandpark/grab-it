import {
	serializeExperienceDetail,
	serializeMapExperience,
	type IncludedExperience,
} from '@/lib/api'

const experience = {
	id: 'experience-1',
	authorId: 'author-1',
	placeId: 'place-1',
	activity: 'WALK',
	body: '산책하며 마음이 편안해졌어요.',
	visibility: 'PUBLIC',
	status: 'PUBLISHED',
	exactLatitude: 37.5665,
	exactLongitude: 126.978,
	displayLatitude: 37.5674,
	displayLongitude: 126.9791,
	createdAt: new Date('2026-08-21T00:00:00.000Z'),
	updatedAt: new Date('2026-08-21T00:00:00.000Z'),
	place: { id: 'place-1', name: '서울광장' },
	emotions: [{ emotion: 'CALM' }],
	media: [],
	author: { id: 'author-1', name: '감정 여행자', image: null },
	_count: { resonances: 2 },
} as IncludedExperience

describe('experience API coordinate privacy', () => {
	it('only serializes blurred display coordinates for map responses', () => {
		const result = serializeMapExperience(experience)

		expect(result.latitude).toBe(experience.displayLatitude)
		expect(result.longitude).toBe(experience.displayLongitude)
		expect(result).not.toHaveProperty('exactLatitude')
		expect(result).not.toHaveProperty('exactLongitude')
		expect(result).not.toHaveProperty('exactLocation')
	})

	it('only includes the exact location for the experience owner', () => {
		const publicResult = serializeExperienceDetail(experience, 'viewer-1')
		const ownerResult = serializeExperienceDetail(experience, 'author-1')

		expect(publicResult).not.toHaveProperty('exactLocation')
		expect(ownerResult.exactLocation).toEqual({
			latitude: experience.exactLatitude,
			longitude: experience.exactLongitude,
		})
	})
})
