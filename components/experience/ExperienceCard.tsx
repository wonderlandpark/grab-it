import Link from 'next/link'
import { activities, emotions, type MapExperience } from '@/types/domain'

export function ExperienceCard({ experience }: { experience: MapExperience }) {
	const activity = activities.find((item) => item.value === experience.activity)

	return (
		<Link
			href={`/experiences/${experience.id}`}
			className='grid gap-3 rounded-3xl border border-black/5 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'
		>
			{experience.mediaUrl ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={experience.mediaUrl}
					alt='경험 사진'
					className='aspect-[16/9] w-full rounded-2xl object-cover'
				/>
			) : null}
			<div className='flex flex-wrap gap-1.5'>
				{experience.emotions.map((value) => {
					const emotion = emotions.find((item) => item.value === value)
					return emotion ? (
						<span key={value} className='rounded-full bg-mist px-2.5 py-1 text-xs text-leaf'>
							{emotion.emoji} {emotion.label}
						</span>
					) : null
				})}
			</div>
			<div>
				<p className='text-xs text-ink/50'>
					{experience.placeName ?? '지도 위의 한 장소'} · {activity?.label}
				</p>
				<p className='mt-1 line-clamp-2 leading-relaxed'>{experience.body}</p>
			</div>
			<p className='text-xs text-ink/45'>나도 경험했어요 {experience.resonanceCount}</p>
		</Link>
	)
}
