import type { NextApiRequest, NextApiResponse } from 'next'

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message)
	}
}
export function allowMethods(req: NextApiRequest, res: NextApiResponse, methods: string[]) {
	if (methods.includes(req.method || '')) return true
	res.setHeader('Allow', methods)
	res.status(405).json({ error: 'Method not allowed' })
	return false
}
export function queryString(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] : value
}
export function requiredString(value: unknown, name: string, maxLength: number) {
	if (typeof value !== 'string' || !value.trim())
		throw new ApiError(400, `${name}을(를) 입력해 주세요`)
	const text = value.trim()
	if (text.length > maxLength) throw new ApiError(400, `${name}은(는) ${maxLength}자 이하입니다`)
	return text
}
export function handleApiError(error: unknown, res: NextApiResponse) {
	if (error instanceof ApiError) return res.status(error.status).json({ error: error.message })
	console.error(error)
	return res.status(500).json({ error: '서버 오류가 발생했습니다' })
}
