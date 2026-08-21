import { createHash } from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'

import {
	ApiError,
	allowMethods,
	handleApiError,
	queryString,
	requiredString,
} from '@/lib/api'

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

const demoPlaces = [
	{
		id: 'demo-london-bagel-anguk',
		name: '런던베이글뮤지엄 안국점',
		category: '카페, 베이커리',
		address: '서울특별시 종로구 계동 102-1',
		roadAddress: '서울특별시 종로구 북촌로4길 20',
		latitude: 37.5792,
		longitude: 126.9862,
	},
	{
		id: 'demo-seoul-forest',
		name: '서울숲',
		category: '도시공원',
		address: '서울특별시 성동구 성수동1가 685-20',
		roadAddress: '서울특별시 성동구 뚝섬로 273',
		latitude: 37.5444,
		longitude: 127.0374,
	},
	{
		id: 'demo-nodeul-island',
		name: '노들섬',
		category: '문화공간',
		address: '서울특별시 용산구 이촌동 302-146',
		roadAddress: '서울특별시 용산구 양녕로 445',
		latitude: 37.5177,
		longitude: 126.958,
	},
]

function cleanTitle(value: string) {
	return value.replace(/<[^>]+>/g, '').replaceAll('&amp;', '&')
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
			const normalized = query.toLowerCase().replaceAll(' ', '')
			const matches = demoPlaces.filter((place) =>
				`${place.name}${place.category}${place.address}`
					.toLowerCase()
					.replaceAll(' ', '')
					.includes(normalized),
			)
			res.status(200).json({ places: matches.length ? matches : demoPlaces })
			return
		}

		const url = new URL('https://openapi.naver.com/v1/search/local.json')
		url.searchParams.set('query', query)
		url.searchParams.set('display', '5')
		url.searchParams.set('start', '1')
		url.searchParams.set('sort', 'random')
		const response = await fetch(url, {
			headers: {
				'X-Naver-Client-Id': clientId,
				'X-Naver-Client-Secret': clientSecret,
			},
			signal: AbortSignal.timeout(5_000),
		})
		if (!response.ok) throw new ApiError(502, '장소 검색에 실패했습니다')
		const data = (await response.json()) as { items?: NaverItem[] }
		const places = (data.items ?? []).flatMap((item) => {
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
