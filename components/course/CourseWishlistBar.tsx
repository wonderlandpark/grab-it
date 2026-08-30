import { useEffect, useState } from 'react'
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

	useEffect(() => {
		const knownIds = new Set([
			...experiences.map((item) => item.id),
			...resolvedExperiences.map((item) => item.id),
		])
		const missingIds = wishIds.filter((id) => !knownIds.has(id))
		if (!missingIds.length) return

		Promise.all(
			missingIds.map(async (id) => {
				try {
					const response = await fetch(`/api/experiences/${encodeURIComponent(id)}`)
					if (!response.ok)
						return {
							id,
							title: '지금은 이용할 수 없는 순간',
							space: { name: '공개가 종료되었어요.' },
						}
					const data = await response.json()
					return { id: data.id, title: data.title, space: { name: data.space.name } }
				} catch {
					return {
						id,
						title: '순간 정보를 불러오지 못했어요',
						space: { name: '새로고침 후 다시 확인해 주세요.' },
					}
				}
			})
		).then((items) => {
			setResolvedExperiences((current) => {
				const byId = new Map(current.map((item) => [item.id, item]))
				for (const item of items) byId.set(item.id, item)
				return [...byId.values()]
			})
		})
	}, [experiences, resolvedExperiences, wishIds])

	if (!wishIds.length) return null
	const selected = [
		...experiences.map(({ id, title, space }) => ({ id, title, space: { name: space.name } })),
		...resolvedExperiences,
	]

	return (
		<>
			<div className='fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-xl items-center gap-2 rounded-2xl bg-ink p-3 text-white shadow-2xl md:bottom-5'>
				<button
					onClick={() => setOpen(true)}
					className='min-w-0 flex-1 rounded-xl px-2 py-2 text-left font-black transition-colors hover:bg-white/10'
				>
					<span className='mr-1.5 text-glow'>★</span>
					잡은 순간 {wishIds.length}개
					<span className='ml-2 text-sm font-normal text-white/60'>잡은 목록</span>
				</button>
				<button
					onClick={onCreate}
					className='btn-primary shrink-0 whitespace-nowrap rounded-xl px-4 py-3 font-black'
				>
					궤적 만들기
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
								<h2 className='text-2xl font-black'>
									<span className='mr-2 text-brand'>★</span>
									잡은 순간 {wishIds.length}개
								</h2>
								<button
									onClick={onClear}
									className='btn-ghost rounded-lg px-2 py-1 text-sm underline'
								>
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
												<strong>{item?.title || '순간 정보 불러오는 중…'}</strong>
												{item && <p className='text-sm text-ink/50'>{item.space.name}</p>}
											</div>
											<button
												onClick={() => onRemove(id)}
												className='rounded-lg px-3 py-2 text-sm text-coral transition-colors hover:bg-coral/10'
											>
												삭제
											</button>
										</div>
									)
								})}
							</div>
							<button
								onClick={onCreate}
								className='btn-primary mt-6 w-full rounded-2xl p-4 font-black'
							>
								잡은 순간으로 궤적 만들기
							</button>
						</div>
					</section>
				</div>
			)}
		</>
	)
}
