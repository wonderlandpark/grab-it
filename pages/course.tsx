import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { useCourseWishlist } from '@/components/course/useCourseWishlist'
import { AppShell } from '@/components/layout/AppShell'
import { readCourseDraft, readDiscoveryView, writeCourseDraft } from '@/lib/course-storage'
import type { CourseRecommendation, DiscoveryIntent } from '@/types/domain'

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
	const wishlist = useCourseWishlist()
	const [courses, setCourses] = useState<CourseRecommendation[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [ready, setReady] = useState(false)
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

	useEffect(() => setReady(true), [])
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
						onBack={() => void router.replace('/course')}
						onRemove={removeExperience}
					/>
				) : (
					<>
						<button onClick={backToDiscovery} className='mb-7 font-bold text-ink/60'>
							← 검색 결과로
						</button>
						<p className='font-bold text-brand'>잡은 순간으로 구성했어요</p>
						<h1 className='mt-2 text-4xl font-black'>가능한 궤적 {courses.length}개</h1>
						<p className='mt-3 text-ink/55'>
							시간·동선·남은 좌석을 반영해 실행 가능한 순서로 정리했어요.
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
		</AppShell>
	)
}

function CourseCard({
	course,
	best,
	onOpen,
}: {
	course: CourseRecommendation
	best: boolean
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
				{course.items.map((item, index) => (
					<div key={item.slot.id} className='flex gap-3'>
						<span className='grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mist text-xs font-black text-brand'>
							{index + 1}
						</span>
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
					<span className='rounded-full bg-glow/60 px-3 py-2 font-bold text-ink'>
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
					이 궤적 보기
				</button>
			</div>
		</article>
	)
}

function CourseDetail({
	course,
	candidateIndex,
	onBack,
	onRemove,
}: {
	course: CourseRecommendation
	candidateIndex: number
	onBack: () => void
	onRemove: (id: string) => void
}) {
	return (
		<>
			<button onClick={onBack} className='mb-7 font-bold text-ink/60'>
				← 궤적 전체보기
			</button>
			<p className='font-bold text-brand'>실시간 좌석은 예약할 때 다시 확인해요</p>
			<h1 className='mt-2 text-4xl font-black'>오늘의 궤적</h1>
			<div className='mt-8 grid items-start gap-6 lg:grid-cols-[1fr_320px]'>
				<section className='rounded-[2rem] bg-white p-6 shadow-lg md:p-8'>
					<div className='space-y-4'>
						{course.items.map((item, index) => (
							<div key={item.slot.id}>
								<div className='flex items-center gap-3 text-xs font-bold text-brand'>
									<span className='grid h-7 w-7 place-items-center rounded-full bg-action text-white'>
										{index + 1}
									</span>
									{index === 0
										? `출발지에서 약 ${item.travelMinutes}분`
										: `이동·준비 약 ${item.travelMinutes}분`}
									{item.waitMinutes > 0 && ` · 대기 ${item.waitMinutes}분`}
								</div>
								<div className='ml-3.5 border-l-2 border-mist py-3 pl-6'>
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
													slotId: item.slot.id,
													returnTo: `/course?candidate=${candidateIndex}`,
												},
											}}
											className='btn-primary rounded-xl px-4 py-3 text-sm font-black'
										>
											상세·예약
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
					<Summary
						label='예상 총액'
						value={
							course.totalPriceWon === 0 ? '무료' : `${course.totalPriceWon.toLocaleString()}원`
						}
					/>
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
				</aside>
			</div>
		</>
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
