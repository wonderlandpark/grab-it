import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import KakaoProvider from 'next-auth/providers/kakao'

import { prisma } from '@/lib/prisma'

const providers: NextAuthOptions['providers'] = []

if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
	providers.push(
		KakaoProvider({
			clientId: process.env.KAKAO_CLIENT_ID,
			clientSecret: process.env.KAKAO_CLIENT_SECRET,
		}),
	)
}

if (process.env.DEMO_AUTH === 'true') {
	providers.push(
		CredentialsProvider({
			name: '데모 로그인',
			credentials: {},
			async authorize() {
				return prisma.user.upsert({
					where: { email: 'demo@emotion-map.local' },
					update: {},
					create: {
						name: '감정 여행자',
						email: 'demo@emotion-map.local',
					},
				})
			},
		}),
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
			} else if (token.sub && (!token.userId || !token.role)) {
				const dbUser = await prisma.user.findUnique({
					where: { id: token.sub },
					select: { id: true, role: true },
				})
				if (dbUser) {
					token.userId = dbUser.id
					token.role = dbUser.role
				}
			}
			return token
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = String(token.userId ?? token.sub ?? '')
				session.user.role = token.role === 'ADMIN' ? 'ADMIN' : 'USER'
			}
			return session
		},
	},
	pages: { signIn: '/login' },
}
