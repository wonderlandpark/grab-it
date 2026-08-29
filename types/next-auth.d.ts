import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
	interface Session {
		user: DefaultSession['user'] & {
			id: string
			role: 'USER' | 'ADMIN'
			isDemo: boolean
			demoExpiresAt: string | null
		}
	}

	interface User {
		role?: 'USER' | 'ADMIN'
		isDemo?: boolean
		demoExpiresAt?: Date | null
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		userId?: string
		role?: 'USER' | 'ADMIN'
		isDemo?: boolean
		demoExpiresAt?: string | null
	}
}
