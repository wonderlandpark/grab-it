import { useEffect, useState } from 'react'
import { readDiscoveryView } from '@/lib/course-storage'
import { emotionArtwork, representativeEmotion } from '@/lib/emotion-artwork'
import type { DiscoveryIntent, EmotionValue, ExperienceRecommendation } from '@/types/domain'

type WishlistExperience = Pick<ExperienceRecommendation, 'id' | 'title' | 'space' | 'emotions'>

interface SelectedExperienceLabel {
	id: string
	title: string
	space: { name: string }
	emotions: EmotionValue[]
}

export function CourseWishlistBar({
	wishIds,
	experiences,
	onRemove,
	onClear,
	onCreate,
}: {
	wishIds: string[]
	experiences: WishlistExperience[]
	onRemove: (id: string) => void
	onClear: () => void
	onCreate: () => void
}) {
	const [open, setOpen] = useState(false)
	const [resolvedExperiences, setResolvedExperiences] = useState<SelectedExperienceLabel[]>([])
	const [desiredEmotions, setDesiredEmotions] = useState<EmotionValue[]>([])

	useEffect(() => {
		let intent: DiscoveryIntent | null | undefined = readDiscoveryView()?.intent
		if (!intent) {
			try {
				intent = JSON.parse(
					sessionStorage.getItem('discovery-intent') || 'null'
				) as DiscoveryIntent | null
			} catch {
				intent = null
			}
		}
		setDesiredEmotions(
			intent?.desiredEmotions?.length
				? intent.desiredEmotions
				: intent?.desiredEmotion
					? [intent.desiredEmotion]
					: []
		)
	}, [])

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
							emotions: [],
						}
					const data = await response.json()
					return {
						id: data.id,
						title: data.title,
						space: { name: data.space.name },
						emotions: data.emotions,
					}
				} catch {
					return {
						id,
						title: '순간 정보를 불러오지 못했어요',
						space: { name: '새로고침 후 다시 확인해 주세요.' },
						emotions: [],
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
		...experiences.map(({ id, title, space, emotions }) => ({
			id,
			title,
			space: { name: space.name },
			emotions,
		})),
		...resolvedExperiences,
	]

	return (
		<>
			<div aria-hidden='true' className='h-28' />
			<div className='fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-xl items-center gap-2 rounded-2xl bg-ink p-3 text-white shadow-2xl md:bottom-5'>
				<button
					onClick={() => setOpen(true)}
					className='flex min-w-0 flex-1 items-center rounded-xl px-2 py-2 text-left font-black transition-colors hover:bg-white/10'
				>
					<span className='mr-2 grid h-7 w-7 shrink-0 place-items-center'>
						<img
							src={emotionArtwork.FOCUS.src}
							alt=''
							aria-hidden='true'
							className='h-6 w-6 object-contain brightness-0 invert'
						/>
					</span>
					<span className='truncate'>잡은 순간 {wishIds.length}개</span>
					<span className='ml-2 shrink-0 text-sm font-normal text-white/60'>잡은 목록</span>
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
								<h2 className='flex items-center gap-2 text-2xl font-black'>
									<img
										src={emotionArtwork.FOCUS.src}
										alt=''
										aria-hidden='true'
										className='h-8 w-8 object-contain'
									/>
									<span>잡은 순간 {wishIds.length}개</span>
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
									const emotion = item
										? representativeEmotion(desiredEmotions, item.emotions)
										: null
									return (
										<div
											key={id}
											className='flex items-center justify-between rounded-2xl bg-white p-4'
										>
											<div className='flex min-w-0 items-center gap-3'>
												<span className='grid h-9 w-9 shrink-0 place-items-center'>
													{emotion && (
														<img
															src={emotionArtwork[emotion].src}
															alt=''
															aria-hidden='true'
															className='h-8 w-8 object-contain'
														/>
													)}
												</span>
												<div className='min-w-0'>
													<strong>{item?.title || '순간 정보 불러오는 중…'}</strong>
													{item && <p className='text-sm text-ink/50'>{item.space.name}</p>}
												</div>
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
