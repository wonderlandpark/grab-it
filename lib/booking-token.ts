import { createHash, createHmac } from 'crypto'

const secret = () => process.env.NEXTAUTH_SECRET || 'local-development-secret'

export function bookingToken(bookingId: string) {
	const signature = createHmac('sha256', secret()).update(bookingId).digest('base64url')
	return `${bookingId}.${signature}`
}

export function hashToken(token: string) {
	return createHash('sha256').update(token).digest('hex')
}

export function bookingIdFromToken(token: string) {
	const separator = token.lastIndexOf('.')
	if (separator < 1) return null
	const id = token.slice(0, separator)
	return hashToken(bookingToken(id)) === hashToken(token) ? id : null
}
