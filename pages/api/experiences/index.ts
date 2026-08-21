import { Activity, Emotion, Visibility } from '@prisma/client'
import { randomUUID } from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'

import {
	ApiError,
	allowMethods,
	experienceInclude,
	handleApiError,
	numberValue,
	requiredString,
	requireUser,
	serializeExperienceDetail,
} from '@/lib/api'
import { blurCoordinates, isValidCoordinates } from '@/lib/geo'
import { prisma } from '@/lib/prisma'

const activityValues = new Set<string>(Object.values(Activity))
const emotionValues = new Set<string>(Object.values(Emotion))
const visibilityValues = new Set<string>(Object.values(Visibility))

function parseEmotions(value: unknown) {
	if (!Array.isArray(value) || value.length === 0 || value.some((item) => !emotionValues.has(item))) {
		throw new ApiError(400, '감정을 하나 이상 선택해 주세요')
	}
	return [...new Set(value)] as Emotion[]
}

function parseActivity(value: unknown) {
	if (typeof value !== 'string' || !activityValues.has(value)) {
		throw new ApiError(400, '행동을 선택해 주세요')
	}
	return value as Activity
}

function parseVisibility(value: unknown) {
	if (value === undefined) return Visibility.PUBLIC
	if (typeof value !== 'string' || !visibilityValues.has(value)) {
		throw new ApiError(400, '공개 설정이 올바르지 않습니다')
	}
	return value as Visibility
}

async function resolvePlace(value: unknown) {
	if (!value || typeof value !== 'object') return undefined
	const place = value as Record<string, unknown>
	if (typeof place.databaseId === 'string') {
		const found = await prisma.place.findUnique({ where: { id: place.databaseId } })
		if (!found) throw new ApiError(400, '장소를 찾을 수 없습니다')
		return found.id
	}

	const name = requiredString(place.name, '장소명', 120)
	const latitude = numberValue(place.latitude, '장소 위도')
	const longitude = numberValue(place.longitude, '장소 경도')
	if (!isValidCoordinates(latitude, longitude)) throw new ApiError(400, '장소 좌표가 올바르지 않습니다')
	const source = typeof place.source === 'string' ? place.source.slice(0, 30) : 'USER'
	const submittedExternalId = place.externalId ?? place.id
	const externalId =
		typeof submittedExternalId === 'string' && submittedExternalId
			? submittedExternalId.slice(0, 200)
			: null
	const data = {
		source,
		externalId,
		name,
		category: typeof place.category === 'string' ? place.category.slice(0, 120) : null,
		address: typeof place.address === 'string' ? place.address.slice(0, 300) : null,
		roadAddress: typeof place.roadAddress === 'string' ? place.roadAddress.slice(0, 300) : null,
		latitude,
		longitude,
	}

	if (externalId) {
		const found = await prisma.place.upsert({
			where: { source_externalId: { source, externalId } },
			create: data,
			update: data,
		})
		return found.id
	}

	return (await prisma.place.create({ data })).id
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!allowMethods(req, res, ['POST'])) return

	try {
		const user = await requireUser(req, res)
		const latitude = numberValue(req.body?.latitude, '위도')
		const longitude = numberValue(req.body?.longitude, '경도')
		if (!isValidCoordinates(latitude, longitude)) throw new ApiError(400, '좌표가 올바르지 않습니다')

		const display = blurCoordinates(
			{ latitude, longitude },
			`${process.env.NEXTAUTH_SECRET ?? 'local'}:${user.id}:${randomUUID()}`,
		)
		const placeId = await resolvePlace(req.body?.place)
		const experience = await prisma.experience.create({
			data: {
				authorId: user.id,
				placeId,
				activity: parseActivity(req.body?.activity),
				body: requiredString(req.body?.body, '기록', 500),
				visibility: parseVisibility(req.body?.visibility),
				exactLatitude: latitude,
				exactLongitude: longitude,
				displayLatitude: display.latitude,
				displayLongitude: display.longitude,
				emotions: {
					create: parseEmotions(req.body?.emotions).map((emotion) => ({ emotion })),
				},
			},
			include: experienceInclude,
		})

		res.status(201).json({ experience: serializeExperienceDetail(experience, user.id) })
	} catch (error) {
		handleApiError(error, res)
	}
}
