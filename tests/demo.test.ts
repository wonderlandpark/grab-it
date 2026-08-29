import { expiredDemoWhere, guestIdentity } from '@/lib/demo'

describe('visitor-isolated demo identities', () => {
	it('creates a different database identity for each guest login', () => {
		const first = guestIdentity('4f280000-0000-0000-0000-000000000000')
		const second = guestIdentity('a1730000-0000-0000-0000-000000000000')
		expect(first.email).not.toBe(second.email)
		expect(first.name).toBe('게스트 4F28')
		expect(first.isDemo).toBe(true)
	})

	it('cleanup selector can only match expired demo users', () => {
		const now = new Date('2026-08-29T00:00:00Z')
		expect(expiredDemoWhere(now)).toEqual({ isDemo: true, demoExpiresAt: { lt: now } })
		expect(guestIdentity('abcd', now).demoExpiresAt.getTime()).toBe(now.getTime() + 86400000)
	})
})
