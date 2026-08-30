import Link from 'next/link'
import { ExperiencePrice } from '@/components/experience/ExperiencePrice'
import { emotions, type EmotionValue, type ExperienceRecommendation } from '@/types/domain'

const time = (value: string) =>
	new Intl.DateTimeFormat('ko-KR', {
		timeZone: 'Asia/Seoul',
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(value))

const minutesUntil = (value: string) =>
	Math.max(1, Math.ceil((new Date(value).getTime() - Date.now()) / 60000))

export function RecommendationCard({
	experience,
	rank,
	wished = false,
	onToggleWish,
	onOpen,
	returnTo,
	desiredEmotions = [],
	highlightEmotionMatch = true,
}: {
	experience: ExperienceRecommendation
	rank?: number
	wished?: boolean
	onToggleWish?: () => void
	onOpen?: () => void
	returnTo?: string
	desiredEmotions?: EmotionValue[]
	highlightEmotionMatch?: boolean
}) {
	const matchedEmotions = desiredEmotions.filter((emotion) => experience.emotions.includes(emotion))
	const displayedEmotions = matchedEmotions.length
		? matchedEmotions
		: experience.emotions.slice(0, 1)
	const emotionLabel = displayedEmotions
		.map((emotion) => emotions.find((item) => item.value === emotion)?.label)
		.filter(Boolean)
		.join(' · ')
	const startsInMinutes = minutesUntil(experience.nextSlot.startsAt)
	const startsSoon = startsInMinutes <= 180

	return (
		<article className='group relative overflow-hidden rounded-3xl border border-action/25 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg'>
			<button
				type='button'
				onClick={onToggleWish}
				aria-label={wished ? `${experience.title} 잡기 취소` : `${experience.title} 잡기`}
				className={`absolute right-4 top-12 z-10 rounded-full px-3 py-2 text-sm font-black shadow-sm transition-colors ${wished ? 'bg-glow text-ink hover:bg-glow/80' : 'bg-white text-ink hover:bg-sky/40'}`}
			>
				{wished ? '★' : '☆'}
			</button>
			<Link
				href={{
					pathname: `/experiences/${experience.id}`,
					query: returnTo ? { returnTo } : undefined,
				}}
				onClick={onOpen}
				className='block'
			>
				<div className='flex min-h-36 flex-col justify-between bg-gradient-to-br from-mist to-white p-5'>
					<div className='flex items-center justify-between gap-3 text-xs font-bold text-brand'>
						<span
							className={
								matchedEmotions.length && highlightEmotionMatch
									? 'rounded-full bg-glow px-2.5 py-1 text-ink'
									: ''
							}
						>
							{rank ? `추천 ${rank}` : emotionLabel}
						</span>
						<span>{Math.round(experience.space.distanceMeters / 100) / 10}km</span>
					</div>
					<div>
						<h3 className='text-xl font-black'>{experience.title}</h3>
						<p className='mt-1 text-sm text-ink/60'>{experience.space.name}</p>
					</div>
				</div>
				<div className='p-5'>
					<div className='flex flex-wrap gap-2'>
						{experience.ambienceTags.slice(0, 3).map((tag) => (
							<span key={tag} className='rounded-full bg-paper px-3 py-1 text-xs'>
								#{tag}
							</span>
						))}
					</div>
					<div className='mt-4 flex items-end justify-between'>
						<div>
							<p className='flex flex-wrap items-center gap-x-2 gap-y-1 font-bold'>
								<span>
									{time(experience.nextSlot.startsAt)} · {experience.durationMinutes}분
								</span>
								{startsSoon && (
									<span className='text-xs text-brand md:basis-full'>
										{startsInMinutes}분 뒤 시작
									</span>
								)}
							</p>
							<p className='text-xs text-brand'>{experience.nextSlot.availableSeats}자리 남음</p>
						</div>
						<ExperiencePrice
							priceWon={experience.priceWon}
							originalPriceWon={experience.originalPriceWon}
							compact
						/>
					</div>
				</div>
			</Link>
		</article>
	)
}
