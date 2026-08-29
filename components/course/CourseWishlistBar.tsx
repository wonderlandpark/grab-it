import { useEffect, useRef, useState } from 'react'
import type { ExperienceRecommendation } from '@/types/domain'

interface SelectedExperienceLabel {
	id: string
	title: string
	space: { name: string }
}

export function CourseWishlistBar({
	wishIds,
	experiences,
	onRemove,
	onClear,
	onCreate,
}: {
	wishIds: string[]
	experiences: ExperienceRecommendation[]
	onRemove: (id: string) => void
	onClear: () => void
	onCreate: () => void
}) {
	const [open, setOpen] = useState(false)
	const [resolvedExperiences, setResolvedExperiences] = useState<SelectedExperienceLabel[]>([])
	const requestedIds = useRef(new Set<string>())

	useEffect(() => {
		const knownIds = new Set([
			...experiences.map((item) => item.id),
			...resolvedExperiences.map((item) => item.id),
		])
		const missingIds = wishIds.filter((id) => !knownIds.has(id) && !requestedIds.current.has(id))
		if (!missingIds.length) return
		for (const id of missingIds) requestedIds.current.add(id)

		let cancelled = false
		Promise.all(
			missingIds.map(async (id) => {
				const response = await fetch(`/api/experiences/${encodeURIComponent(id)}`)
				if (!response.ok) return null
				const data = await response.json()
				return { id: data.id, title: data.title, space: { name: data.space.name } }
			})
		).then((items) => {
			if (cancelled) return
			setResolvedExperiences((current) => {
				const byId = new Map(current.map((item) => [item.id, item]))
				for (const item of items) if (item) byId.set(item.id, item)
				return [...byId.values()]
			})
		})

		return () => {
			cancelled = true
		}
	}, [experiences, resolvedExperiences, wishIds])

	if (!wishIds.length) return null
	const selected = [
		...experiences.map(({ id, title, space }) => ({ id, title, space: { name: space.name } })),
		...resolvedExperiences,
	]

	return (
		<>
			<div className='fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-xl items-center gap-2 rounded-2xl bg-ink p-3 text-white shadow-2xl md:bottom-5'>
				<button onClick={() => setOpen(true)} className='flex-1 px-2 text-left font-black'>
					찜한 경험 {wishIds.length}개
					<span className='ml-2 text-sm font-normal text-white/60'>목록 보기</span>
				</button>
				<button onClick={onCreate} className='rounded-xl bg-leaf px-4 py-3 font-black'>
					코스 만들기
				</button>
			</div>
			{open && (
				<div
					className='fixed inset-0 z-[100] flex items-end bg-black/40'
					onClick={() => setOpen(false)}
				>
					<section
						className='max-h-[75dvh] w-full overflow-auto rounded-t-[2rem] bg-paper p-6'
						onClick={(event) => event.stopPropagation()}
					>
						<div className='mx-auto max-w-2xl'>
							<div className='flex items-center justify-between'>
								<h2 className='text-2xl font-black'>찜한 경험 {wishIds.length}개</h2>
								<button onClick={onClear} className='text-sm text-ink/50 underline'>
									전체 비우기
								</button>
							</div>
							<div className='mt-5 space-y-3'>
								{wishIds.map((id) => {
									const item = selected.find((candidate) => candidate?.id === id)
									return (
										<div
											key={id}
											className='flex items-center justify-between rounded-2xl bg-white p-4'
										>
											<div>
												<strong>{item?.title || '경험 정보 불러오는 중…'}</strong>
												{item && <p className='text-sm text-ink/50'>{item.space.name}</p>}
											</div>
											<button onClick={() => onRemove(id)} className='px-3 text-sm text-coral'>
												삭제
											</button>
										</div>
									)
								})}
							</div>
							<button
								onClick={onCreate}
								className='mt-6 w-full rounded-2xl bg-leaf p-4 font-black text-white'
							>
								찜한 경험으로 코스 만들기
							</button>
						</div>
					</section>
				</div>
			)}
		</>
	)
}
