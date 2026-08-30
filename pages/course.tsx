import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCourseWishlist } from '@/components/course/useCourseWishlist'
import { AppShell } from '@/components/layout/AppShell'
import { readCourseDraft, readDiscoveryView, writeCourseDraft } from '@/lib/course-storage'
import { emotionArtwork, representativeEmotion } from '@/lib/emotion-artwork'
import type { CourseRecommendation, DiscoveryIntent, EmotionValue } from '@/types/domain'

const PENDING_COURSE_BOOKING_KEY = 'pending-course-booking:v1'
type BookingAnimationPhase = 'idle' | 'connecting' | 'success'

const wait = (milliseconds: number) =>
	new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))

const time = (value: string) =>
	new Intl.DateTimeFormat('ko-KR', {
		timeZone: 'Asia/Seoul',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(value))

const duration = (startsAt: string, endsAt: string) => {
	const minutes = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000)
	const hours = Math.floor(minutes / 60)
	const rest = minutes % 60
	return [hours ? `${hours}시간` : '', rest ? `${rest}분` : ''].filter(Boolean).join(' ')
}

function readIntent() {
	const view = readDiscoveryView()
	if (view?.intent) return view.intent
	try {
		return JSON.parse(
			sessionStorage.getItem('discovery-intent') || 'null'
		) as DiscoveryIntent | null
	} catch {
		return null
	}
}

export default function CoursePage() {
	const router = useRouter()
	const { status } = useSession()
	const wishlist = useCourseWishlist()
	const resumedBooking = useRef(false)
	const [courses, setCourses] = useState<CourseRecommendation[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [ready, setReady] = useState(false)
	const [booking, setBooking] = useState(false)
	const [bookingError, setBookingError] = useState('')
	const [bookingPhase, setBookingPhase] = useState<BookingAnimationPhase>('idle')
	const [litItemCount, setLitItemCount] = useState(0)
	const [loginModal, setLoginModal] = useState(false)
	const [desiredEmotions, setDesiredEmotions] = useState<EmotionValue[]>([])
	const candidateIndex =
		typeof router.query.candidate === 'string' ? Number(router.query.candidate) : null
	const selectedCourse =
		candidateIndex !== null && Number.isInteger(candidateIndex) ? courses[candidateIndex] : null

	const requestCourses = useCallback(async (wishIds: string[]) => {
		const view = readDiscoveryView()
		const intent = readIntent()
		if (!intent || !wishIds.length) {
			setCourses([])
			setError(wishIds.length ? '검색 조건을 다시 선택해 주세요.' : '잡은 순간이 없어요.')
			setLoading(false)
			return
		}

		setLoading(true)
		setError('')
		try {
			const response = await fetch('/api/discovery/course', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...intent, experienceIds: wishIds }),
			})
			const data = await response.json()
			if (!response.ok) throw new Error(data.error)
			const nextCourses = (data.courses || []) as CourseRecommendation[]
			setCourses(nextCourses)
			if (!nextCourses.length) setError('이 시간대에는 잡은 순간을 연결할 수 없어요.')
			else
				writeCourseDraft({
					createdAt: Date.now(),
					wishIds,
					intentKey: JSON.stringify(intent),
					excludedSignatures: [],
					courses: nextCourses,
					returnUrl: view?.returnUrl || '/',
				})
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : '궤적을 만들지 못했습니다.')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		const intent = readIntent()
		setDesiredEmotions(
			intent?.desiredEmotions?.length
				? intent.desiredEmotions
				: intent?.desiredEmotion
					? [intent.desiredEmotion]
					: []
		)
		setReady(true)
	}, [])
	useEffect(() => {
		if (!ready) return
		const intent = readIntent()
		const draft = readCourseDraft(wishlist.wishIds, JSON.stringify(intent))
		if (draft) {
			setCourses(draft.courses)
			setLoading(false)
			return
		}
		void requestCourses(wishlist.wishIds)
	}, [ready, requestCourses, wishlist.wishIds])

	function backToDiscovery() {
		void router.replace(readDiscoveryView()?.returnUrl || '/')
	}

	function removeExperience(id: string) {
		wishlist.remove(id)
		void router.replace('/course')
	}

	async function submitCourseBooking(course: CourseRecommendation) {
		const intent = readIntent()
		setBooking(true)
		setBookingError('')
		setBookingPhase('connecting')
		setLitItemCount(0)

		const animateTrajectory = async () => {
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				setLitItemCount(course.items.length)
				return
			}
			const interval = Math.max(400, Math.min(650, 2600 / Math.max(course.items.length, 1)))
			for (let index = 1; index <= course.items.length; index += 1) {
				await wait(interval)
				setLitItemCount(index)
			}
			await wait(220)
		}

		try {
			const [response] = await Promise.all([
				fetch('/api/bookings/course', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						slotIds: course.items.map((item) => item.slot.id),
						desiredEmotion: intent?.desiredEmotion || course.items[0]?.experience.emotions[0],
						currentState: intent?.currentState || null,
					}),
				}),
				animateTrajectory(),
			])
			const data = await response.json()
			if (!response.ok) throw new Error(data.error || '궤적을 예약하지 못했습니다.')

			setBookingPhase('success')
			await wait(900)
			sessionStorage.removeItem(PENDING_COURSE_BOOKING_KEY)
			wishlist.clear()
			await router.push({ pathname: '/me', query: { courseBooked: data.bookings.length } })
		} catch (reason) {
			setBooking(false)
			setBookingPhase('idle')
			setLitItemCount(0)
			setBookingError(reason instanceof Error ? reason.message : '궤적을 예약하지 못했습니다.')
		}
	}

	function reserveCourse(course: CourseRecommendation) {
		if (status !== 'authenticated') {
			sessionStorage.setItem(
				PENDING_COURSE_BOOKING_KEY,
				JSON.stringify({ signature: course.signature, candidateIndex })
			)
			setLoginModal(true)
			return
		}
		void submitCourseBooking(course)
	}

	useEffect(() => {
		if (
			status !== 'authenticated' ||
			!selectedCourse ||
			router.query.resumeCourseBooking !== '1' ||
			resumedBooking.current
		)
			return
		const pending = JSON.parse(sessionStorage.getItem(PENDING_COURSE_BOOKING_KEY) || 'null')
		if (pending?.signature !== selectedCourse.signature) return
		resumedBooking.current = true
		void submitCourseBooking(selectedCourse)
	}, [status, selectedCourse, router.query.resumeCourseBooking]) // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<AppShell>
			<Head>
				<title>오늘의 궤적 · grabit</title>
			</Head>
			<div className={`mx-auto px-5 py-8 ${selectedCourse ? 'max-w-6xl' : 'max-w-[1600px]'}`}>
				{selectedCourse ? (
					<CourseDetail
						course={selectedCourse}
						candidateIndex={candidateIndex!}
						desiredEmotions={desiredEmotions}
						onBack={() => void router.replace('/course')}
						onRemove={removeExperience}
						onReserve={() => reserveCourse(selectedCourse)}
						booking={booking}
						bookingPhase={bookingPhase}
						litItemCount={litItemCount}
						bookingError={bookingError}
					/>
				) : (
					<>
						<button onClick={backToDiscovery} className='mb-7 font-bold text-ink/60'>
							← 검색 결과로
						</button>
						<p className='font-bold text-brand'>잡은 순간으로 구성했어요</p>
						<h1 className='mt-2 text-4xl font-black'>가능한 궤적 {courses.length}개</h1>
						<p className='mt-3 text-ink/55'>
							시간·동선·남은 자리를 반영해 실행 가능한 순서로 정리했어요.
						</p>

						{loading && (
							<div className='mt-10 rounded-3xl bg-white p-10 text-center'>궤적 만드는 중…</div>
						)}
						{!loading && error && (
							<div className='mt-10 rounded-3xl bg-white p-10 text-center'>
								<p className='font-black'>{error}</p>
								<button
									onClick={backToDiscovery}
									className='btn-primary mt-5 rounded-full px-5 py-3 font-bold'
								>
									순간 다시 고르기
								</button>
							</div>
						)}
						{!loading && courses.length > 0 && (
							<div className='mt-8 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4'>
								{courses.slice(0, 4).map((course, index) => (
									<CourseCard
										key={course.signature}
										course={course}
										best={index === 0}
										desiredEmotions={desiredEmotions}
										onOpen={() =>
											void router.push({ pathname: '/course', query: { candidate: index } })
										}
									/>
								))}
							</div>
						)}
					</>
				)}
			</div>
			{loginModal && selectedCourse && (
				<div
					role='dialog'
					aria-modal='true'
					className='fixed inset-0 z-[100] grid place-items-center bg-black/40 p-5'
				>
					<div className='w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl'>
						<h2 className='text-2xl font-black'>궤적을 예약하려면 계속해 주세요.</h2>
						<p className='mt-2 text-sm text-ink/55'>
							선택한 {selectedCourse.items.length}개의 순간과 시간은 그대로 유지됩니다.
						</p>
						<Link
							href={{
								pathname: '/login',
								query: {
									callbackUrl: `/course?candidate=${candidateIndex}&resumeCourseBooking=1`,
								},
							}}
							className='btn-primary mt-7 w-full rounded-2xl p-4 font-black'
						>
							로그인 페이지로 계속하기
						</Link>
						<button
							onClick={() => setLoginModal(false)}
							className='mt-4 w-full text-sm text-ink/45'
						>
							닫기
						</button>
					</div>
				</div>
			)}
		</AppShell>
	)
}

function CourseCard({
	course,
	best,
	desiredEmotions,
	onOpen,
}: {
	course: CourseRecommendation
	best: boolean
	desiredEmotions: EmotionValue[]
	onOpen: () => void
}) {
	return (
		<article
			className={`relative flex min-h-[560px] flex-col rounded-[2rem] bg-white p-6 shadow-lg lg:min-h-[calc(100dvh-18rem)] ${best ? 'ring-2 ring-brand' : ''}`}
		>
			{best && (
				<span className='mb-5 self-start rounded-full bg-glow px-3 py-1 text-xs font-black text-ink'>
					가장 잘 맞는 궤적
				</span>
			)}
			<p className='text-sm font-bold text-brand'>{time(course.startsAt)} 시작</p>
			<h2 className='mt-2 text-2xl font-black'>{course.items.length}개의 순간을 이은 궤적</h2>
			<div className='mt-6 flex-1 space-y-4 border-y border-black/5 py-5'>
				{course.items.map((item) => (
					<div key={item.slot.id} className='flex gap-3'>
						<CourseEmotionMarker
							desiredEmotions={desiredEmotions}
							experienceEmotions={item.experience.emotions}
						/>
						<div className='min-w-0 pt-0.5'>
							<strong className='block leading-snug'>{item.experience.title}</strong>
							<span className='mt-1 block text-xs text-ink/45'>
								{time(item.slot.startsAt)} · {item.experience.durationMinutes}분
							</span>
						</div>
					</div>
				))}
			</div>
			<div className='mt-4 flex flex-wrap gap-2 text-xs'>
				<span className='rounded-full bg-paper px-3 py-2'>
					{duration(course.startsAt, course.endsAt)}
				</span>
				<span className='rounded-full bg-paper px-3 py-2'>이동 {course.totalTravelMinutes}분</span>
				<span className='rounded-full bg-paper px-3 py-2'>
					{course.totalPriceWon === 0 ? '무료' : `${course.totalPriceWon.toLocaleString()}원`}
				</span>
				{course.totalDiscountWon > 0 && (
					<span className='rounded-full bg-mist px-3 py-2 font-bold text-brand'>
						{course.totalDiscountWon.toLocaleString()}원 할인
					</span>
				)}
			</div>
			{course.omitted.length > 0 && (
				<p className='mt-4 text-xs text-ink/45'>잡은 순간 {course.omitted.length}개 제외</p>
			)}
			<div className='mt-auto pt-6'>
				<button
					onClick={onOpen}
					className='btn-secondary w-full rounded-2xl p-3 font-black text-brand'
				>
					이 궤적 선택하기
				</button>
			</div>
		</article>
	)
}

function CourseDetail({
	course,
	candidateIndex,
	desiredEmotions,
	onBack,
	onRemove,
	onReserve,
	booking,
	bookingPhase,
	litItemCount,
	bookingError,
}: {
	course: CourseRecommendation
	candidateIndex: number
	desiredEmotions: EmotionValue[]
	onBack: () => void
	onRemove: (id: string) => void
	onReserve: () => void
	booking: boolean
	bookingPhase: BookingAnimationPhase
	litItemCount: number
	bookingError: string
}) {
	const itemRefs = useRef<Array<HTMLDivElement | null>>([])

	useEffect(() => {
		if (bookingPhase !== 'connecting' || litItemCount < 1) return
		const currentItem = itemRefs.current[litItemCount - 1]
		if (!currentItem) return
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			currentItem.scrollIntoView({ behavior: 'auto', block: 'center' })
			return
		}

		const itemBounds = currentItem.getBoundingClientRect()
		const startY = window.scrollY
		const targetY = Math.max(
			0,
			startY + itemBounds.top - (window.innerHeight - itemBounds.height) / 2
		)
		const startedAt = performance.now()
		const duration = 540
		let animationFrame = 0

		const scrollStep = (now: number) => {
			const progress = Math.min(1, (now - startedAt) / duration)
			const easedProgress = 1 - Math.pow(1 - progress, 3)
			window.scrollTo(0, startY + (targetY - startY) * easedProgress)
			if (progress < 1) animationFrame = window.requestAnimationFrame(scrollStep)
		}

		animationFrame = window.requestAnimationFrame(scrollStep)
		return () => window.cancelAnimationFrame(animationFrame)
	}, [bookingPhase, litItemCount])

	return (
		<>
			<button onClick={onBack} className='mb-7 font-bold text-ink/60'>
				← 궤적 전체보기
			</button>
			<p className='font-bold text-brand'>궤적 전체를 한 번에 예약할 수 있어요</p>
			<h1 className='mt-2 text-4xl font-black'>오늘의 궤적</h1>
			<div className='mt-8 grid items-start gap-6 lg:grid-cols-[1fr_320px]'>
				<section
					className={`rounded-[2rem] bg-white p-6 shadow-lg transition-all duration-500 md:p-8 ${bookingPhase === 'success' ? 'shadow-[0_0_28px_rgba(248,255,142,0.55)] ring-2 ring-glow' : ''}`}
				>
					{bookingPhase === 'success' && (
						<div
							role='status'
							className='mb-6 animate-pulse rounded-2xl bg-glow px-5 py-4 text-center font-black text-ink motion-reduce:animate-none'
						>
							궤적을 잡았어요!
						</div>
					)}
					<div className='space-y-4'>
						{course.items.map((item, index) => (
							<div
								key={item.slot.id}
								ref={(element) => {
									itemRefs.current[index] = element
								}}
							>
								<div className='flex items-center gap-3 text-xs font-bold text-brand'>
									<CourseEmotionMarker
										desiredEmotions={desiredEmotions}
										experienceEmotions={item.experience.emotions}
										illuminated={
											bookingPhase === 'idle' || bookingPhase === 'success' || index < litItemCount
										}
										animating={bookingPhase !== 'idle'}
									/>
									{index === 0
										? `출발지에서 약 ${item.travelMinutes}분`
										: `이동·준비 약 ${item.travelMinutes}분`}
									{item.waitMinutes > 0 && ` · 대기 ${item.waitMinutes}분`}
								</div>
								<div
									className={`ml-4 border-l py-3 pl-6 transition-colors duration-500 ${
										bookingPhase !== 'idle' && index < litItemCount
											? 'border-glow'
											: 'border-action/20'
									}`}
								>
									<p className='text-sm font-bold'>
										{time(item.slot.startsAt)} ~ {time(item.slot.endsAt)}
									</p>
									<h2 className='mt-1 text-xl font-black'>{item.experience.title}</h2>
									<p className='text-sm text-ink/50'>
										{item.experience.space.name} · {item.slot.availableSeats}석
									</p>
									<div className='mt-4 flex items-center gap-3'>
										<Link
											href={{
												pathname: `/experiences/${item.experience.id}`,
												query: {
													returnTo: `/course?candidate=${candidateIndex}`,
												},
											}}
											className='btn-primary rounded-xl px-4 py-3 text-sm font-black'
										>
											상세 보기
										</Link>
										<button
											onClick={() => onRemove(item.experience.id)}
											className='text-sm text-ink/45 underline'
										>
											제외
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</section>
				<aside className='rounded-[2rem] bg-ink p-6 text-white lg:sticky lg:top-24'>
					<h2 className='text-2xl font-black'>궤적 요약</h2>
					<Summary label='총 소요시간' value={duration(course.startsAt, course.endsAt)} />
					<Summary label='총 이동시간' value={`${course.totalTravelMinutes}분`} />
					<Summary label='총 대기시간' value={`${course.totalWaitMinutes}분`} />
					{course.totalDiscountWon > 0 && (
						<Summary label='총 할인 금액' value={`${course.totalDiscountWon.toLocaleString()}원`} />
					)}
					{course.omitted.length > 0 && (
						<div className='mt-5 border-t border-white/15 pt-5'>
							<h3 className='font-black'>이번 궤적에 연결되지 못한 순간</h3>
							{course.omitted.map((item) => (
								<p key={item.experienceId} className='mt-3 text-xs leading-5 text-white/65'>
									<strong className='text-white'>{item.experienceTitle || '잡은 순간'}</strong>
									<br />
									{item.reason}
								</p>
							))}
						</div>
					)}
					<div className='mt-6 border-t-2 border-white/25 pt-5'>
						<div className='flex items-end justify-between gap-4'>
							<div>
								<p className='text-sm font-bold text-white/65'>예상 총액</p>
								{course.totalDiscountWon > 0 && (
									<p className='mt-1 text-xs text-white/40'>할인 금액 적용</p>
								)}
							</div>
							<strong className='text-xl font-black tracking-tight md:text-2xl'>
								{course.totalPriceWon === 0 ? '무료' : `${course.totalPriceWon.toLocaleString()}원`}
							</strong>
						</div>
					</div>
					<button
						onClick={onReserve}
						disabled={booking}
						className='btn-primary mt-6 w-full rounded-2xl p-4 font-black'
					>
						{bookingPhase === 'success'
							? '궤적을 잡았어요!'
							: booking
								? '순간을 연결하는 중…'
								: `${course.items.length}개 순간 예약하기`}
					</button>
					{bookingError && <p className='mt-3 text-sm font-bold text-coral'>{bookingError}</p>}
				</aside>
			</div>
		</>
	)
}

function CourseEmotionMarker({
	desiredEmotions,
	experienceEmotions,
	illuminated = true,
	animating = false,
}: {
	desiredEmotions: EmotionValue[]
	experienceEmotions: EmotionValue[]
	illuminated?: boolean
	animating?: boolean
}) {
	const emotion = representativeEmotion(desiredEmotions, experienceEmotions)

	return (
		<span
			className={`grid h-8 w-8 shrink-0 place-items-center transition-all duration-300 ${
				animating && illuminated
					? 'scale-110 rounded-full bg-glow shadow-[0_0_14px_rgba(248,255,142,0.75)]'
					: animating
						? 'scale-90 opacity-25 grayscale'
						: ''
			}`}
			aria-hidden='true'
		>
			{emotion ? (
				<img src={emotionArtwork[emotion].src} alt='' className='h-7 w-7 object-contain' />
			) : (
				<span className='h-2 w-2 rounded-full bg-ink/30' />
			)}
		</span>
	)
}

function Summary({ label, value }: { label: string; value: string }) {
	return (
		<div className='flex justify-between border-b border-white/15 py-3 text-sm'>
			<span className='text-white/60'>{label}</span>
			<strong>{value}</strong>
		</div>
	)
}
