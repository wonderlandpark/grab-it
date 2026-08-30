import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { CourseWishlistBar } from '@/components/course/CourseWishlistBar'
import { useCourseWishlist } from '@/components/course/useCourseWishlist'
import { AppShell } from '@/components/layout/AppShell'
import { ExperiencePrice } from '@/components/experience/ExperiencePrice'
import { emotions, type ExperienceDetail } from '@/types/domain'

const dateTime = (value: string) =>
	new Intl.DateTimeFormat('ko-KR', {
		timeZone: 'Asia/Seoul',
		month: 'short',
		day: 'numeric',
		weekday: 'short',
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(value))

export default function ExperiencePage() {
	const router = useRouter(),
		wishlist = useCourseWishlist()
	const [experience, setExperience] = useState<ExperienceDetail | null>(null),
		[error, setError] = useState('')
	const safeReturnTo =
		typeof router.query.returnTo === 'string' &&
		router.query.returnTo.startsWith('/') &&
		!router.query.returnTo.startsWith('//')
			? router.query.returnTo
			: null
	const courseReturnTo = safeReturnTo?.startsWith('/course') ? safeReturnTo : null

	useEffect(() => {
		if (!router.isReady) return
		fetch(`/api/experiences/${router.query.id}`)
			.then(async (response) => {
				const data = await response.json()
				if (!response.ok) throw new Error(data.error)
				setExperience(data)
			})
			.catch((e) => setError(e.message))
	}, [router.isReady, router.query.id])

	function createCourse() {
		if (!experience) return
		if (!sessionStorage.getItem('discovery-intent')) {
			const desiredEmotions = experience.emotions.slice(0, 2)
			sessionStorage.setItem(
				'discovery-intent',
				JSON.stringify({
					desiredEmotion: desiredEmotions[0],
					desiredEmotions,
					availableFromMinutes: 0,
					availableUntilMinutes: 1440,
					latitude: experience.space.latitude,
					longitude: experience.space.longitude,
					maxDistanceKm: 30,
				})
			)
		}
		void router.push('/course')
	}

	if (!experience)
		return (
			<AppShell>
				<div className='grid min-h-[70vh] place-items-center'>{error || '순간을 불러오는 중…'}</div>
			</AppShell>
		)
	return (
		<AppShell>
			<Head>
				<title>{experience.title} · grabit</title>
			</Head>
			<article className='mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1.2fr_.8fr]'>
				<section>
					{safeReturnTo && (
						<Link href={safeReturnTo} className='mb-5 inline-block font-bold text-ink/60'>
							{courseReturnTo ? '← 궤적으로 돌아가기' : '← 검색 결과로'}
						</Link>
					)}
					<div className='relative grid aspect-[16/9] place-items-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-mist to-glow/40'>
						{experience.mediaUrl ? (
							<Image
								src={experience.mediaUrl}
								alt=''
								fill
								sizes='(min-width: 768px) 60vw, 100vw'
								className='object-cover'
							/>
						) : (
							<span className='text-7xl'>✨</span>
						)}
					</div>
					<p className='mt-8 font-bold text-brand'>{experience.space.name}</p>
					<h1 className='mt-2 text-4xl font-black'>{experience.title}</h1>
					<p className='mt-4 leading-7 text-ink/65'>{experience.description}</p>
					<div className='mt-5 flex flex-wrap gap-2'>
						{experience.ambienceTags.map((tag) => (
							<span key={tag} className='rounded-full bg-white px-3 py-2 text-sm'>
								#{tag}
							</span>
						))}
					</div>
					<div className='mt-8 rounded-3xl bg-white p-6'>
						<h2 className='font-black'>공간 안내</h2>
						<p className='mt-2'>{experience.space.address}</p>
						{experience.rules && <p className='mt-3 text-sm text-ink/60'>{experience.rules}</p>}
					</div>
					{experience.reviews.length > 0 && (
						<div className='mt-8'>
							<h2 className='text-2xl font-black'>감정 변화</h2>
							{experience.reviews.map((review) => (
								<div key={review.id} className='mt-3 rounded-2xl bg-white p-5'>
									<strong>{emotions.find((e) => e.value === review.afterEmotion)?.label}</strong>
									<p className='mt-2 text-sm'>{review.body}</p>
									<p className='mt-2 text-xs text-ink/45'>{review.highlightTags.join(' · ')}</p>
								</div>
							))}
						</div>
					)}
				</section>
				<aside>
					<div className='sticky top-24 rounded-[2rem] bg-white p-6 shadow-lg'>
						<p className='text-sm font-bold text-ink/50'>현장결제 예정</p>
						<div className='mt-1'>
							<ExperiencePrice
								priceWon={experience.priceWon}
								originalPriceWon={experience.originalPriceWon}
							/>
						</div>
						<p className='mt-1 text-sm'>{experience.durationMinutes}분</p>
						<h2 className='mt-7 font-black'>지금 잡을 수 있는 시간</h2>
						<div className='mt-3 space-y-2'>
							{experience.slots.map((slot) => (
								<div key={slot.id} className='w-full rounded-2xl bg-paper p-4'>
									<strong>{dateTime(slot.startsAt)}</strong>
									<span className='float-right text-sm font-bold text-brand'>
										{slot.availableSeats}석
									</span>
								</div>
							))}
						</div>
						{!experience.slots.length && (
							<p className='mt-3 text-sm text-ink/50'>예약 가능한 시간이 없습니다.</p>
						)}
						<button
							type='button'
							onClick={() => wishlist.toggle(experience.id)}
							aria-pressed={wishlist.wishIds.includes(experience.id)}
							className={`mt-6 w-full rounded-2xl border-2 p-4 font-black transition-all ${
								wishlist.wishIds.includes(experience.id)
									? 'border-glow bg-glow text-ink shadow-[0_8px_24px_rgba(248,255,142,0.45)] hover:bg-glow/80'
									: 'border-sky bg-white text-brand hover:border-action hover:bg-sky/15'
							}`}
						>
							{wishlist.wishIds.includes(experience.id) ? '★ 순간을 잡았어요!' : '☆ 순간을 잡기'}
						</button>
						{error && <p className='mt-3 text-sm font-bold text-coral'>{error}</p>}
					</div>
				</aside>
			</article>
			<CourseWishlistBar
				wishIds={wishlist.wishIds}
				experiences={[experience]}
				onRemove={wishlist.remove}
				onClear={wishlist.clear}
				onCreate={createCourse}
			/>
		</AppShell>
	)
}
