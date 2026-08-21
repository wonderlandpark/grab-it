import Link from 'next/link'
import EmotionFilter from '@/components/map/EmotionFilter'
import { activities, emotions, type EmotionValue, type MapExperience } from '@/types/domain'

interface DiscoverySidebarProps {
	experiences: MapExperience[]
	selectedEmotions: EmotionValue[]
	selectedExperience: MapExperience | null
	onEmotionsChange: (emotions: EmotionValue[]) => void
	onExperienceSelect: (experience: MapExperience) => void
	status: 'idle' | 'loading' | 'error'
	onRetry: () => void
}

export default function DiscoverySidebar({
	experiences,
	selectedEmotions,
	selectedExperience,
	onEmotionsChange,
	onExperienceSelect,
	status,
	onRetry,
}: DiscoverySidebarProps) {
	return (
		<aside className="hidden h-full w-[390px] shrink-0 flex-col border-r border-slate-200/80 bg-paper lg:flex">
			<header className="px-7 pb-5 pt-7">
				<Link
					href="/"
					className="inline-flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf/40"
				>
					<span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-leaf text-lg text-white">
						<span aria-hidden="true">⌁</span>
					</span>
					<span className="text-lg font-black tracking-tight text-ink">마음지도</span>
				</Link>
				<h1 className="mt-7 text-3xl font-black leading-tight tracking-tight text-ink">
					오늘은 어떤 마음을
					<br />
					만나고 싶나요?
				</h1>
				<p className="mt-3 text-sm leading-6 text-slate-500">
					감정을 골라 다른 사람의 경험이 머문 장소를 둘러보세요.
				</p>
				<div className="mt-5">
					<EmotionFilter selected={selectedEmotions} onChange={onEmotionsChange} />
				</div>
			</header>

			<div className="flex items-center justify-between border-y border-slate-200/70 px-7 py-3">
				<h2 className="text-sm font-bold text-ink">이 지도에서 발견한 경험</h2>
				<span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-leaf">
					{experiences.length}
				</span>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
				{status === 'loading' && experiences.length === 0 ? (
					<div className="space-y-3" aria-label="경험을 불러오는 중">
						{[0, 1, 2].map((item) => (
							<div key={item} className="animate-pulse rounded-2xl bg-white p-4">
								<div className="h-4 w-2/3 rounded bg-slate-200" />
								<div className="mt-3 h-3 w-full rounded bg-slate-100" />
								<div className="mt-2 h-3 w-4/5 rounded bg-slate-100" />
							</div>
						))}
					</div>
				) : null}

				{status === 'error' && experiences.length === 0 ? (
					<div className="rounded-2xl bg-white p-6 text-center">
						<p className="font-bold text-ink">경험을 불러오지 못했어요</p>
						<p className="mt-1 text-sm text-slate-500">잠시 후 다시 시도해 주세요.</p>
						<button
							type="button"
							onClick={onRetry}
							className="mt-4 rounded-full bg-leaf px-4 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:ring-offset-2"
						>
							다시 불러오기
						</button>
					</div>
				) : null}

				{status !== 'loading' && status !== 'error' && experiences.length === 0 ? (
					<div className="rounded-2xl bg-white p-7 text-center">
						<span className="text-3xl" aria-hidden="true">
							🌱
						</span>
						<p className="mt-3 font-bold text-ink">아직 이곳의 경험이 없어요</p>
						<p className="mt-1 text-sm leading-5 text-slate-500">
							지도를 움직이거나 다른 감정을 골라보세요.
						</p>
					</div>
				) : null}

				<ul className="space-y-2">
					{experiences.map((experience) => {
						const primaryEmotion = emotions.find(
							(item) => item.value === experience.emotions[0],
						)
						const activity = activities.find((item) => item.value === experience.activity)
						const isSelected = selectedExperience?.id === experience.id

						return (
							<li key={experience.id}>
								<button
									type="button"
									onClick={() => onExperienceSelect(experience)}
									className={`w-full rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-leaf/40 ${
										isSelected
											? 'border-leaf bg-white shadow-md shadow-leaf/10'
											: 'border-transparent bg-white/70 hover:border-slate-200 hover:bg-white'
									}`}
								>
									<div className="flex items-center gap-2">
										<span
											className="flex h-8 w-8 items-center justify-center rounded-full text-base"
											style={{ backgroundColor: `${primaryEmotion?.color ?? '#6ea995'}25` }}
										>
											{primaryEmotion?.emoji ?? '📍'}
										</span>
										<div className="min-w-0">
											<p className="truncate text-sm font-bold text-ink">
												{experience.placeName ?? '이름 없는 장소'}
											</p>
											<p className="text-xs text-slate-500">
												{primaryEmotion?.label} · {activity?.label}
											</p>
										</div>
									</div>
									<p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">
										{experience.body}
									</p>
								</button>
							</li>
						)
					})}
				</ul>
			</div>

			<div className="border-t border-slate-200/70 bg-white/70 p-4">
				<Link
					href="/experiences/new"
					className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3.5 text-sm font-bold text-white transition hover:bg-leaf focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:ring-offset-2"
				>
					<span aria-hidden="true">＋</span> 내 경험 기록하기
				</Link>
			</div>
		</aside>
	)
}
