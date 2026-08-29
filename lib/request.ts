import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function requireUser(req: NextApiRequest, res: NextApiResponse) {
	const session = await getServerSession(req, res, authOptions)
	if (!session?.user?.id) {
		res.status(401).json({ error: '로그인이 필요합니다.' })
		return null
	}
	const user = await prisma.user.findUnique({ where: { id: session.user.id } })
	if (!user || (user.isDemo && user.demoExpiresAt && user.demoExpiresAt < new Date())) {
		res.status(401).json({ error: '게스트 체험 시간이 만료되었습니다.' })
		return null
	}
	return user
}

export async function requireAdmin(req: NextApiRequest, res: NextApiResponse) {
	const user = await requireUser(req, res)
	if (!user) return null
	if (user.role !== 'ADMIN') {
		res.status(403).json({ error: '관리자 권한이 필요합니다.' })
		return null
	}
	return user
}

export async function requirePartner(req: NextApiRequest, res: NextApiResponse) {
	const user = await requireUser(req, res)
	if (!user) return null
	const application = await prisma.partnerApplication.findUnique({ where: { userId: user.id } })
	if (application?.status !== 'APPROVED') {
		res.status(403).json({ error: '승인된 공간 운영자만 사용할 수 있습니다.' })
		return null
	}
	return { user, application }
}
