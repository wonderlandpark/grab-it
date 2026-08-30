import { withAuth } from 'next-auth/middleware'

export default withAuth({
	pages: { signIn: '/login' },
	callbacks: {
		authorized: ({ token }) => Boolean(token),
	},
})

export const config = {
	matcher: [
		'/me/:path*',
		'/bookings/:path*',
		'/partner/:path*',
		'/check-in/:path*',
		'/admin/:path*',
		'/experiences/new',
	],
}
