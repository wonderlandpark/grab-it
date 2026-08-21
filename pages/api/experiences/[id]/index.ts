import { Activity, Emotion, Prisma, Visibility } from '@prisma/client'
import { randomUUID } from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'

import {
	ApiError,
	allowMethods,
	currentUser,
	experienceInclude,
	handleApiError,
	numberValue,
	queryString,
	requiredString,
	requireUser,
	serializeExperienceDetail,
} from '@/lib/api'
import { blurCoordinates, isValidCoordinates } from '@/lib/geo'
import { prisma } from '@/lib/prisma'

const activities = new Set<string>(Object.values(Activity))
const emotions = new Set<string>(Object.values(Emotion))
const visibilities = new Set<string>(Object.values(Visibility))

async function getExperience(id: string) {
	return prisma.experience.findUnique({ where: { id }, include: experienceInclude })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!allowMethods(req, res, ['GET', 'PATCH', 'DELETE'])) return

	try {
		const id = queryString(req.query.id)
		if (!id) throw new ApiError(400, '경험 ID가 필요합니다')

		if (req.method === 'GET') {
			const viewer = await currentUser(req, res)
			const experience = await getExperience(id)
			if (!experience || experience.status === 'DELETED') throw new ApiError(404, '경험을 찾을 수 없습니다')
			const isOwner = experience.authorId === viewer?.id
			if ((!isOwner && experience.visibility === 'PRIVATE') || (!isOwner && experience.status !== 'PUBLISHED')) {
				throw new ApiError(404, '경험을 찾을 수 없습니다')
			}
			const resonance = viewer
				? await prisma.resonance.findUnique({
						where: { experienceId_userId: { experienceId: id, userId: viewer.id } },
					})
				: null
			res.status(200).json({
				experience: serializeExperienceDetail(experience, viewer?.id, Boolean(resonance)),
			})
			return
		}

		const user = await requireUser(req, res)
		const existing = await prisma.experience.findUnique({ where: { id } })
		if (!existing || existing.status === 'DELETED') throw new ApiError(404, '경험을 찾을 수 없습니다')
		if (existing.authorId !== user.id) throw new ApiError(403, '작성자만 수정할 수 있습니다')

		if (req.method === 'DELETE') {
			await prisma.experience.update({ where: { id }, data: { status: 'DELETED' } })
			res.status(204).end()
			return
		}

		const body = req.body ?? {}
		const data: Prisma.ExperienceUpdateInput = {}
		if (body.body !== undefined) data.body = requiredString(body.body, '기록', 500)
		if (body.activity !== undefined) {
			if (typeof body.activity !== 'string' || !activities.has(body.activity)) {
				throw new ApiError(400, '행동이 올바르지 않습니다')
			}
			data.activity = body.activity as Activity
		}
		if (body.visibility !== undefined) {
			if (typeof body.visibility !== 'string' || !visibilities.has(body.visibility)) {
				throw new ApiError(400, '공개 설정이 올바르지 않습니다')
			}
			data.visibility = body.visibility as Visibility
		}
		if (body.emotions !== undefined) {
			if (
				!Array.isArray(body.emotions) ||
				body.emotions.length === 0 ||
				body.emotions.some((emotion: unknown) => typeof emotion !== 'string' || !emotions.has(emotion))
			) {
				throw new ApiError(400, '감정을 하나 이상 선택해 주세요')
			}
			data.emotions = {
				deleteMany: {},
				create: [...new Set(body.emotions as Emotion[])].map((emotion) => ({ emotion })),
			}
		}

		if (body.latitude !== undefined || body.longitude !== undefined) {
			const latitude = numberValue(body.latitude ?? existing.exactLatitude, '위도')
			const longitude = numberValue(body.longitude ?? existing.exactLongitude, '경도')
			if (!isValidCoordinates(latitude, longitude)) throw new ApiError(400, '좌표가 올바르지 않습니다')
			const display = blurCoordinates(
				{ latitude, longitude },
				`${process.env.NEXTAUTH_SECRET ?? 'local'}:${user.id}:${randomUUID()}`,
			)
			data.exactLatitude = latitude
			data.exactLongitude = longitude
			data.displayLatitude = display.latitude
			data.displayLongitude = display.longitude
		}

		const experience = await prisma.experience.update({
			where: { id },
			data,
			include: experienceInclude,
		})
		res.status(200).json({ experience: serializeExperienceDetail(experience, user.id) })
	} catch (error) {
		handleApiError(error, res)
	}
}
