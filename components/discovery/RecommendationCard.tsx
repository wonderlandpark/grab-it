import Link from 'next/link'
import { emotions, type ExperienceRecommendation } from '@/types/domain'

const time = (value: string) =>
	new Intl.DateTimeFormat('ko-KR', {
		timeZone: 'Asia/Seoul',
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(value))
export function RecommendationCard({
	experience,
	rank,
}: {
	experience: ExperienceRecommendation
	rank?: number
}) {
	const emotionLabel = emotions.find((item) => item.value === experience.emotions[0])?.label
	return (
		<Link
			href={`/experiences/${experience.id}`}
			className='group block overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg'
		>
			<div className='flex min-h-36 flex-col justify-between bg-gradient-to-br from-mist to-white p-5'>
				<div className='flex items-center justify-between text-xs font-bold text-leaf'>
					<span>{rank ? `추천 ${rank}` : emotionLabel}</span>
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
						<p className='font-bold'>
							{time(experience.nextSlot.startsAt)} · {experience.durationMinutes}분
						</p>
						<p className='text-xs text-coral'>지금 {experience.nextSlot.availableSeats}자리 남음</p>
					</div>
					<strong className='text-right text-sm'>
						{experience.priceWon
							? `체험용 · ${experience.priceWon.toLocaleString()}원 현장결제 예정`
							: '체험용 · 무료'}
					</strong>
				</div>
			</div>
		</Link>
	)
}
