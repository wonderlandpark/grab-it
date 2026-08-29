export function guestIdentity(uuid: string, now = new Date()) {
	return {
		name: `게스트 ${uuid.slice(0, 4).toUpperCase()}`,
		email: `guest-${uuid}@demo.local`,
		isDemo: true as const,
		demoExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
	}
}

export function expiredDemoWhere(now = new Date()) {
	return { isDemo: true, demoExpiresAt: { lt: now } } as const
}
