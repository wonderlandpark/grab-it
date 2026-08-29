import Head from 'next/head'
import Image from 'next/image'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
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
const PENDING_KEY = 'pending-booking'

export default function ExperiencePage() {
	const router = useRouter(),
		{ status } = useSession(),
		resumed = useRef(false)
	const [experience, setExperience] = useState<ExperienceDetail | null>(null),
		[selectedSlot, setSlot] = useState(''),
		[error, setError] = useState(''),
		[booking, setBooking] = useState(false),
		[loginModal, setLoginModal] = useState(false)

	useEffect(() => {
		if (!router.isReady) return
		fetch(`/api/experiences/${router.query.id}`)
			.then(async (response) => {
				const data = await response.json()
				if (!response.ok) throw new Error(data.error)
				setExperience(data)
				const pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null')
				setSlot(pending?.experienceId === data.id ? pending.slotId : data.slots[0]?.id || '')
			})
			.catch((e) => setError(e.message))
	}, [router.isReady, router.query.id])

	async function submitBooking(slotId = selectedSlot) {
		if (!experience || !slotId) return
		setBooking(true)
		setError('')
		const intent = JSON.parse(sessionStorage.getItem('discovery-intent') || '{}')
		const response = await fetch('/api/bookings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				slotId,
				desiredEmotion: intent.desiredEmotion || experience.emotions[0],
				currentState: intent.currentState || null,
			}),
		})
		const data = await response.json()
		setBooking(false)
		if (!response.ok) return setError(data.error)
		sessionStorage.removeItem(PENDING_KEY)
		await router.push(`/bookings/${data.id}`)
	}

	useEffect(() => {
		if (
			status !== 'authenticated' ||
			!experience ||
			router.query.resumeBooking !== '1' ||
			resumed.current
		)
			return
		const pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null')
		if (pending?.experienceId === experience.id) {
			resumed.current = true
			void submitBooking(pending.slotId)
		}
	}, [status, experience, router.query.resumeBooking]) // eslint-disable-line react-hooks/exhaustive-deps

	function reserve() {
		if (!experience || !selectedSlot) return
		if (status !== 'authenticated') {
			sessionStorage.setItem(
				PENDING_KEY,
				JSON.stringify({ experienceId: experience.id, slotId: selectedSlot })
			)
			setLoginModal(true)
			return
		}
		void submitBooking()
	}

	async function guestContinue() {
		const result = await signIn('credentials', { redirect: false })
		if (result?.error) return setError('게스트 로그인을 시작하지 못했습니다.')
		setLoginModal(false)
		await submitBooking()
	}
	async function kakaoContinue() {
		await signIn('kakao', {
			callbackUrl: `${window.location.origin}${router.asPath.split('?')[0]}?resumeBooking=1`,
		})
	}

	if (!experience)
		return (
			<AppShell>
				<div className='grid min-h-[70vh] place-items-center'>{error || '경험을 불러오는 중…'}</div>
			</AppShell>
		)
	return (
		<AppShell>
			<Head>
				<title>{experience.title} · 틈</title>
			</Head>
			<article className='mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1.2fr_.8fr]'>
				<section>
					<div className='relative grid aspect-[16/9] place-items-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-mist to-[#f6e8ca]'>
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
					<p className='mt-8 font-bold text-leaf'>{experience.space.name}</p>
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
							<h2 className='text-2xl font-black'>감정 변화 영수증</h2>
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
						<p className='text-sm font-bold text-coral'>체험용 · 현장결제 예정</p>
						<p className='mt-1 text-2xl font-black'>
							{experience.priceWon ? `${experience.priceWon.toLocaleString()}원` : '무료'}
						</p>
						<p className='mt-1 text-sm'>{experience.durationMinutes}분 경험</p>
						<h2 className='mt-7 font-black'>시작 시간 선택</h2>
						<div className='mt-3 space-y-2'>
							{experience.slots.map((slot) => (
								<button
									key={slot.id}
									onClick={() => setSlot(slot.id)}
									className={`w-full rounded-2xl border p-4 text-left ${selectedSlot === slot.id ? 'border-leaf bg-mist' : ''}`}
								>
									<strong>{dateTime(slot.startsAt)}</strong>
									<span className='float-right text-sm text-coral'>{slot.availableSeats}석</span>
								</button>
							))}
						</div>
						{!experience.slots.length && (
							<p className='mt-3 text-sm text-ink/50'>예약 가능한 시간이 없습니다.</p>
						)}
						<button
							onClick={reserve}
							disabled={!selectedSlot || booking}
							className='mt-6 w-full rounded-2xl bg-leaf p-4 font-black text-white disabled:opacity-40'
						>
							{booking ? '좌석 확인 중…' : '이 경험 예약하기'}
						</button>
						{error && <p className='mt-3 text-sm font-bold text-coral'>{error}</p>}
					</div>
				</aside>
			</article>
			{loginModal && (
				<div
					role='dialog'
					aria-modal='true'
					className='fixed inset-0 z-[100] grid place-items-center bg-black/40 p-5'
				>
					<div className='w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl'>
						<h2 className='text-2xl font-black'>예약을 저장하려면 계속해 주세요.</h2>
						<p className='mt-2 text-sm text-ink/55'>선택한 경험과 시간은 그대로 유지됩니다.</p>
						<button
							onClick={guestContinue}
							className='mt-7 w-full rounded-2xl bg-leaf p-4 font-black text-white'
						>
							게스트로 체험하기
						</button>
						<button
							onClick={kakaoContinue}
							className='mt-3 w-full rounded-2xl bg-[#FEE500] p-4 font-black text-[#191919]'
						>
							카카오로 계속하기
						</button>
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
