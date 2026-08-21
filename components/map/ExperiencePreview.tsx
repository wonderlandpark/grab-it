import Link from 'next/link'
import { activities, emotions, type MapExperience } from '@/types/domain'

interface ExperiencePreviewProps {
	experience: MapExperience
	className?: string
	onClose?: () => void
}

export default function ExperiencePreview({
	experience,
	className = '',
	onClose,
}: ExperiencePreviewProps) {
	const activity = activities.find((item) => item.value === experience.activity)

	return (
		<article
			className={`overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur ${className}`}
		>
			<div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 md:hidden" />
			<div className="flex gap-4 p-4">
				{experience.mediaUrl ? (
					<div
						role="img"
						aria-label={`${experience.placeName ?? '장소'} 경험 사진`}
						className="h-24 w-24 shrink-0 rounded-2xl bg-slate-100 bg-cover bg-center"
						style={{ backgroundImage: `url(${JSON.stringify(experience.mediaUrl).slice(1, -1)})` }}
					/>
				) : (
					<div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-mist to-[#f8d7bf] text-3xl">
						<span aria-hidden="true">🗺️</span>
					</div>
				)}

				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-2">
						<div>
							<p className="truncate text-sm font-bold text-ink">
								{experience.placeName ?? '지도 위의 경험'}
							</p>
							<p className="mt-0.5 text-xs text-slate-500">{activity?.label ?? '경험했어요'}</p>
						</div>
						{onClose ? (
							<button
								type="button"
								onClick={onClose}
								aria-label="미리보기 닫기"
								className="-mr-1 -mt-1 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-leaf/40"
							>
								<span aria-hidden="true">×</span>
							</button>
						) : null}
					</div>

					<div className="mt-2 flex gap-1.5 overflow-hidden">
						{experience.emotions.slice(0, 3).map((value) => {
							const emotion = emotions.find((item) => item.value === value)
							return emotion ? (
								<span
									key={value}
									className="shrink-0 rounded-full px-2 py-1 text-[11px] font-bold text-white"
									style={{ backgroundColor: emotion.color }}
								>
									{emotion.emoji} {emotion.label}
								</span>
							) : null
						})}
					</div>

					<p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">{experience.body}</p>
				</div>
			</div>

			<div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
				<span className="text-xs font-semibold text-slate-500">
					같은 경험 {experience.resonanceCount.toLocaleString()}명
				</span>
				<Link
					href={`/experiences/${experience.id}`}
					className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-leaf focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:ring-offset-2"
				>
					경험 보기
				</Link>
			</div>
		</article>
	)
}
