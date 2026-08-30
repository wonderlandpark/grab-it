import Link from 'next/link'
import { ExperiencePrice } from '@/components/experience/ExperiencePrice'
import { emotionArtwork, representativeEmotion } from '@/lib/emotion-artwork'
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
	const cardEmotion = representativeEmotion(desiredEmotions, experience.emotions)
	const cardEmotionLabel = cardEmotion
		? emotions.find((emotion) => emotion.value === cardEmotion)?.label
		: undefined
	const emotionFilterId = `emotion-fill-${experience.id.replace(/[^a-zA-Z0-9_-]/g, '')}`
	const startsInMinutes = minutesUntil(experience.nextSlot.startsAt)
	const startsSoon = startsInMinutes <= 180

	return (
		<article className='group relative overflow-hidden rounded-3xl border-2 border-black bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg'>
			<button
				type='button'
				onClick={onToggleWish}
				aria-pressed={wished}
				aria-label={
					wished
						? `${experience.title} 잡기 취소`
						: cardEmotionLabel
							? `${cardEmotionLabel} 감정으로 ${experience.title} 잡기`
							: `${experience.title} 잡기`
				}
				className={`group/wish absolute right-4 top-4 z-10 grid h-9 w-[52px] cursor-pointer place-items-center rounded-[50%] border border-black p-1 shadow-[0_3px_0_rgba(30,42,68,0.8)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_5px_0_rgba(30,42,68,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 active:translate-y-0.5 active:shadow-none ${wished ? 'bg-glow' : 'bg-white/80'}`}
			>
				{cardEmotion ? (
					<EmotionWishArtwork
						src={emotionArtwork[cardEmotion].src}
						filterId={emotionFilterId}
						filled={wished}
					/>
				) : (
					<span aria-hidden='true' className='h-7 w-7' />
				)}
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
					<div className='flex min-h-9 items-center pr-16 text-xs font-bold text-brand'>
						<span>{emotionLabel}</span>
					</div>
					<div>
						<h3 className='text-xl font-black'>{experience.title}</h3>
						<p className='mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-ink/60'>
							<span>{experience.space.name}</span>
							<span aria-hidden='true'>·</span>
							<span>{Math.round(experience.space.distanceMeters / 100) / 10}km</span>
						</p>
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

function EmotionWishArtwork({
	src,
	filterId,
	filled,
}: {
	src: string
	filterId: string
	filled: boolean
}) {
	const outlineFilterId = `${filterId}-outline`

	return (
		<svg aria-hidden='true' viewBox='0 0 48 48' className='h-7 w-7 shrink-0 overflow-visible'>
			<defs>
				<filter id={outlineFilterId} colorInterpolationFilters='sRGB'>
					<feMorphology in='SourceAlpha' operator='dilate' radius='2' result='outlineShape' />
					<feFlood floodColor='#F8FF8E' result='yellow' />
					<feComposite in='yellow' in2='outlineShape' operator='in' />
				</filter>
			</defs>
			<image
				href={src}
				x='4'
				y='4'
				width='40'
				height='40'
				preserveAspectRatio='xMidYMid meet'
				filter={`url(#${outlineFilterId})`}
				className={`opacity-0 transition-opacity ${filled ? '' : 'group-hover/wish:opacity-100 group-focus-visible/wish:opacity-100'}`}
			/>
			<image
				href={src}
				x='4'
				y='4'
				width='40'
				height='40'
				preserveAspectRatio='xMidYMid meet'
				className='opacity-80'
			/>
		</svg>
	)
}
