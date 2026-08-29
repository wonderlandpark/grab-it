import { expiredDemoWhere, guestIdentity, guestName } from '@/lib/demo'

describe('visitor-isolated demo identities', () => {
	it('creates a different database identity for each guest login', () => {
		const first = guestIdentity('4f280000-0000-0000-0000-000000000000')
		const second = guestIdentity('a1730000-0000-0000-0000-000000000000')
		expect(first.email).not.toBe(second.email)
		expect(first.name).toMatch(
			/^(가벼운|용감한|느긋한|반짝이는|호기심 많은|다정한|설레는|자유로운|조용한|활기찬) (관악산|자하연|버들골|낙성대|규장각)$/
		)
		expect(guestName('4f280000-0000-0000-0000-000000000000')).toBe(first.name)
		expect(first.isDemo).toBe(true)
	})

	it('cleanup selector can only match expired demo users', () => {
		const now = new Date('2026-08-29T00:00:00Z')
		expect(expiredDemoWhere(now)).toEqual({ isDemo: true, demoExpiresAt: { lt: now } })
		expect(guestIdentity('abcd', now).demoExpiresAt.getTime()).toBe(now.getTime() + 86400000)
	})
})
