import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import KakaoProvider from 'next-auth/providers/kakao'
import { randomUUID } from 'crypto'

import { prisma } from '@/lib/prisma'
import { guestIdentity } from '@/lib/demo'

const providers: NextAuthOptions['providers'] = []

if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
	providers.push(
		KakaoProvider({
			clientId: process.env.KAKAO_CLIENT_ID,
			clientSecret: process.env.KAKAO_CLIENT_SECRET,
		})
	)
}

if (process.env.DEMO_AUTH === 'true') {
	providers.push(
		CredentialsProvider({
			name: '게스트로 체험하기',
			credentials: {},
			async authorize() {
				const uuid = randomUUID()
				const identity = guestIdentity(uuid)
				return prisma.user.create({
					data: {
						...identity,
						partnerApplication: {
							create: {
								operatorName: '게스트 운영자',
								phone: '체험용',
								businessRegistrationNumber: `DEMO-${uuid.slice(0, 8)}`,
								status: 'APPROVED',
								reviewedAt: new Date(),
							},
						},
					},
				})
			},
		})
	)
}

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma),
	providers,
	session: { strategy: 'jwt' },
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.userId = user.id
				token.role = user.role ?? 'USER'
				token.isDemo = user.isDemo ?? false
				token.demoExpiresAt = user.demoExpiresAt?.toISOString() ?? null
			} else if (token.sub && (!token.userId || !token.role)) {
				const dbUser = await prisma.user.findUnique({
					where: { id: token.sub },
					select: { id: true, role: true, isDemo: true, demoExpiresAt: true },
				})
				if (dbUser) {
					token.userId = dbUser.id
					token.role = dbUser.role
					token.isDemo = dbUser.isDemo
					token.demoExpiresAt = dbUser.demoExpiresAt?.toISOString() ?? null
				}
			}
			return token
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = String(token.userId ?? token.sub ?? '')
				session.user.role = token.role === 'ADMIN' ? 'ADMIN' : 'USER'
				session.user.isDemo = token.isDemo === true
				session.user.demoExpiresAt = token.demoExpiresAt ?? null
			}
			return session
		},
	},
	pages: { signIn: '/login' },
}
