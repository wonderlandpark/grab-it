import { createHash } from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'

import { ApiError, allowMethods, handleApiError, queryString, requiredString } from '@/lib/api'

interface NaverItem {
	title: string
	link?: string
	category?: string
	description?: string
	telephone?: string
	address?: string
	roadAddress?: string
	mapx: string
	mapy: string
}

function cleanTitle(value: string) {
	return value.replace(/<[^>]+>/g, '').replaceAll('&amp;', '&')
}

function normalizePlaceName(value: string) {
	return cleanTitle(value).replace(/\s+/g, '').toLocaleLowerCase('ko-KR')
}

function placeSearchScore(item: NaverItem, query: string) {
	const name = normalizePlaceName(item.title)
	const normalizedQuery = normalizePlaceName(query)
	let score = 0

	if (name === normalizedQuery) score += 100
	else if (name.startsWith(normalizedQuery)) score += 80
	else if (name.includes(normalizedQuery)) score += 60

	if (item.category?.includes('지하철역')) score += 30
	if (normalizedQuery.endsWith('역') && name.startsWith(normalizedQuery)) score += 20

	return score
}

function naverCoordinate(value: string, latitude: boolean) {
	const parsed = Number(value)
	if (!Number.isFinite(parsed)) return null
	const limit = latitude ? 90 : 180
	return Math.abs(parsed) > limit ? parsed / 10_000_000 : parsed
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!allowMethods(req, res, ['GET'])) return

	try {
		const query = requiredString(queryString(req.query.q), '검색어', 100)
		const clientId = process.env.NAVER_SEARCH_CLIENT_ID
		const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET
		if (!clientId || !clientSecret) {
			throw new ApiError(
				503,
				'장소 검색 API 키가 설정되지 않았습니다. NAVER_SEARCH_CLIENT_ID/SECRET을 확인해 주세요.'
			)
		}

		const url = new URL('https://naverapihub.apigw.ntruss.com/search/v1/local')
		url.searchParams.set('query', query)
		url.searchParams.set('display', '10')
		url.searchParams.set('start', '1')
		url.searchParams.set('sort', 'random')
		const response = await fetch(url, {
			headers: {
				'X-NCP-APIGW-API-KEY-ID': clientId,
				'X-NCP-APIGW-API-KEY': clientSecret,
			},
			signal: AbortSignal.timeout(5_000),
		})
		if (!response.ok) throw new ApiError(502, '장소 검색에 실패했습니다')
		const data = (await response.json()) as { items?: NaverItem[] }
		const places = [...(data.items ?? [])]
			.sort((left, right) => placeSearchScore(right, query) - placeSearchScore(left, query))
			.flatMap((item) => {
				const longitude = naverCoordinate(item.mapx, false)
				const latitude = naverCoordinate(item.mapy, true)
				if (latitude === null || longitude === null) return []
				return [
					{
						id: createHash('sha1')
							.update(item.link || `${item.title}:${item.address}:${item.mapx}:${item.mapy}`)
							.digest('hex'),
						name: cleanTitle(item.title),
						category: item.category || null,
						address: item.address || null,
						roadAddress: item.roadAddress || null,
						latitude,
						longitude,
					},
				]
			})
		res.status(200).json({ places })
	} catch (error) {
		handleApiError(error, res)
	}
}
