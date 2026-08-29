const guestAdjectives = [
	'가벼운',
	'용감한',
	'느긋한',
	'반짝이는',
	'호기심 많은',
	'다정한',
	'설레는',
	'자유로운',
	'조용한',
	'활기찬',
]

const guestNouns = ['관악산', '자하연', '버들골', '낙성대', '규장각']

function pickFrom<T>(items: readonly T[], seed: number) {
	return items[seed % items.length]
}

export function guestName(uuid: string) {
	const seed = Array.from(uuid).reduce((total, character) => total + character.charCodeAt(0), 0)
	return `${pickFrom(guestAdjectives, seed)} ${pickFrom(guestNouns, Math.floor(seed / 3))}`
}

export function guestIdentity(uuid: string, now = new Date()) {
	return {
		name: guestName(uuid),
		email: `guest-${uuid}@demo.local`,
		isDemo: true as const,
		demoExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
	}
}

export function expiredDemoWhere(now = new Date()) {
	return { isDemo: true, demoExpiresAt: { lt: now } } as const
}
