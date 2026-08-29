import { useCallback, useEffect, useState } from 'react'
import { clearCourseDraft, readWishIds, WISH_EVENT, writeWishIds } from '@/lib/course-storage'

export function useCourseWishlist() {
	const [wishIds, setWishIds] = useState<string[]>([])

	useEffect(() => {
		setWishIds(readWishIds())
		const sync = () => setWishIds(readWishIds())
		window.addEventListener(WISH_EVENT, sync)
		return () => window.removeEventListener(WISH_EVENT, sync)
	}, [])

	const update = useCallback((next: string[]) => {
		clearCourseDraft()
		setWishIds(writeWishIds(next))
	}, [])

	const toggle = useCallback(
		(id: string) => {
			if (wishIds.includes(id)) update(wishIds.filter((item) => item !== id))
			else update([...wishIds, id])
		},
		[update, wishIds]
	)

	return {
		wishIds,
		toggle,
		remove: (id: string) => update(wishIds.filter((item) => item !== id)),
		clear: () => update([]),
	}
}
