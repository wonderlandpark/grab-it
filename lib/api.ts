import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'

import { authOptions } from '@/lib/auth'

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message)
	}
}

export function allowMethods(
	req: NextApiRequest,
	res: NextApiResponse,
	methods: string[],
) {
	if (methods.includes(req.method ?? '')) return true
	res.setHeader('Allow', methods)
	res.status(405).json({ error: 'Method not allowed' })
	return false
}

export async function currentUser(req: NextApiRequest, res: NextApiResponse) {
	const session = await getServerSession(req, res, authOptions)
	return session?.user ?? null
}

export async function requireUser(req: NextApiRequest, res: NextApiResponse) {
	const user = await currentUser(req, res)
	if (!user?.id) throw new ApiError(401, '로그인이 필요합니다')
	return user
}

export async function requireAdmin(req: NextApiRequest, res: NextApiResponse) {
	const user = await requireUser(req, res)
	if (user.role !== 'ADMIN') throw new ApiError(403, '관리자 권한이 필요합니다')
	return user
}

export function requiredString(value: unknown, name: string, maxLength: number) {
	if (typeof value !== 'string' || !value.trim()) {
		throw new ApiError(400, `${name}을(를) 입력해 주세요`)
	}
	const text = value.trim()
	if (text.length > maxLength) throw new ApiError(400, `${name}은(는) ${maxLength}자 이하입니다`)
	return text
}

export function numberValue(value: unknown, name: string) {
	const parsed = typeof value === 'number' ? value : Number(value)
	if (!Number.isFinite(parsed)) throw new ApiError(400, `${name}이(가) 올바르지 않습니다`)
	return parsed
}

export function queryString(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] : value
}

export function handleApiError(error: unknown, res: NextApiResponse) {
	if (error instanceof ApiError) {
		res.status(error.status).json({ error: error.message })
		return
	}
	console.error(error)
	res.status(500).json({ error: '서버 오류가 발생했습니다' })
}

export const experienceInclude = {
	place: { select: { id: true, name: true } },
	emotions: { select: { emotion: true } },
	media: { orderBy: { position: 'asc' as const } },
	author: { select: { id: true, name: true, image: true } },
	_count: { select: { resonances: true } },
} satisfies Prisma.ExperienceInclude

export type IncludedExperience = Prisma.ExperienceGetPayload<{
	include: typeof experienceInclude
}>

export function mediaUrl(storageKey: string) {
	return `/api/media/${encodeURIComponent(storageKey)}`
}

export function serializeMapExperience(experience: IncludedExperience) {
	return {
		id: experience.id,
		body: experience.body,
		activity: experience.activity,
		emotions: experience.emotions.map(({ emotion }) => emotion),
		latitude: experience.displayLatitude,
		longitude: experience.displayLongitude,
		placeName: experience.place?.name ?? null,
		mediaUrl: experience.media[0] ? mediaUrl(experience.media[0].storageKey) : null,
		resonanceCount: experience._count.resonances,
		createdAt: experience.createdAt.toISOString(),
	}
}

export function serializeExperienceDetail(
	experience: IncludedExperience,
	viewerId?: string,
	hasResonated = false,
) {
	const isOwner = experience.authorId === viewerId
	return {
		...serializeMapExperience(experience),
		author: experience.author,
		media: experience.media.map((item) => ({ id: item.id, url: mediaUrl(item.storageKey) })),
		isOwner,
		hasResonated,
		visibility: experience.visibility,
		...(isOwner
			? {
					exactLocation: {
						latitude: experience.exactLatitude,
						longitude: experience.exactLongitude,
					},
				}
			: {}),
	}
}
