import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { QrTicket } from '@/components/booking/QrTicket'
import { emotions, type BookingTicket, type EmotionValue } from '@/types/domain'

const format = (value: string) =>
	new Intl.DateTimeFormat('ko-KR', {
		timeZone: 'Asia/Seoul',
		dateStyle: 'full',
		timeStyle: 'short',
	}).format(new Date(value))
export default function BookingPage() {
	const router = useRouter(),
		{ data: session } = useSession(),
		[booking, setBooking] = useState<BookingTicket | null>(null),
		[error, setError] = useState(''),
		[afterEmotion, setAfter] = useState<EmotionValue>('REFRESH'),
		[body, setBody] = useState(''),
		[tags, setTags] = useState<string[]>([]),
		[demoConfirm, setDemoConfirm] = useState(false)
	const load = () =>
		fetch(`/api/bookings/${router.query.id}`)
			.then(async (r) => {
				const data = await r.json()
				if (!r.ok) throw new Error(data.error)
				setBooking(data)
			})
			.catch((e) => setError(e.message))
	useEffect(() => {
		if (router.isReady) void load()
	}, [router.isReady, router.query.id]) // eslint-disable-line react-hooks/exhaustive-deps
	async function cancel() {
		if (!confirm('이 예약을 취소할까요?')) return
		const r = await fetch(`/api/bookings/${router.query.id}/cancel`, { method: 'POST' })
		const data = await r.json()
		if (!r.ok) return setError(data.error)
		void load()
	}
	async function review() {
		const r = await fetch(`/api/bookings/${router.query.id}/review`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ afterEmotion, highlightTags: tags, body, isPublic: true }),
		})
		const data = await r.json()
		if (!r.ok) return setError(data.error)
		void load()
	}
	async function demoCheckIn() {
		const r = await fetch(`/api/bookings/${router.query.id}/demo-check-in`, { method: 'POST' }),
			data = await r.json()
		if (!r.ok) return setError(data.error)
		setDemoConfirm(false)
		void load()
	}
	if (!booking)
		return (
			<AppShell>
				<div className='grid min-h-[70vh] place-items-center'>{error || '예약을 불러오는 중…'}</div>
			</AppShell>
		)
	const checkInUrl =
		typeof window === 'undefined' ? '' : `${window.location.origin}/check-in/${booking.qrToken}`
	const courseReturnTo =
		typeof router.query.returnTo === 'string' && router.query.returnTo.startsWith('/course')
			? router.query.returnTo
			: null
	return (
		<AppShell>
			<div className='mx-auto max-w-2xl px-5 py-10'>
				{courseReturnTo && (
					<Link href={courseReturnTo} className='mb-6 inline-block font-bold text-ink/60'>
						← 코스로 돌아가기
					</Link>
				)}
				<p className='text-sm font-bold text-leaf'>예약 티켓</p>
				<h1 className='mt-2 text-3xl font-black'>{booking.slot.experience.title}</h1>
				<div className='mt-6 rounded-[2rem] bg-white p-7 shadow-lg'>
					<p className='font-bold'>{format(booking.slot.startsAt)}</p>
					<p className='mt-1 text-ink/60'>
						{booking.slot.experience.space.name} · {booking.slot.experience.space.address}
					</p>
					<p className='mt-2 text-xs font-bold text-coral'>현장결제 예정</p>
					<div className='my-7 border-t border-dashed' />
					{booking.status === 'CONFIRMED' && checkInUrl && (
						<>
							<QrTicket value={checkInUrl} />
							<p className='mt-4 text-center text-sm text-ink/55'>
								현장에서 운영자에게 보여주세요.
							</p>
							<details className='mt-3 text-center text-xs'>
								<summary>QR 대체 링크</summary>
								<a href={checkInUrl} className='break-all text-leaf'>
									{checkInUrl}
								</a>
							</details>
						</>
					)}
					{booking.status === 'CHECKED_IN' && (
						<p className='rounded-2xl bg-mist p-5 text-center font-black text-leaf'>
							체크인 완료 ✓
						</p>
					)}
					{booking.status === 'CANCELLED' && (
						<p className='rounded-2xl bg-black/5 p-5 text-center font-black'>취소된 예약입니다.</p>
					)}
				</div>
				{booking.status === 'CONFIRMED' &&
					session?.user.isDemo &&
					booking.slot.experience.isDemoPublic && (
						<button
							onClick={() => setDemoConfirm(true)}
							className='mt-4 w-full rounded-2xl border border-leaf p-4 font-black text-leaf'
						>
							데모 체크인 체험
						</button>
					)}
				{booking.status === 'CONFIRMED' && new Date(booking.slot.startsAt) > new Date() && (
					<button onClick={cancel} className='mt-4 text-sm text-ink/50 underline'>
						예약 취소
					</button>
				)}
				{booking.status === 'CHECKED_IN' && !booking.review && (
					<section className='mt-10 rounded-[2rem] bg-white p-7'>
						<h2 className='text-2xl font-black'>오기 전보다 어때요?</h2>
						<div className='mt-4 grid grid-cols-2 gap-2'>
							{emotions.map((e) => (
								<button
									key={e.value}
									onClick={() => setAfter(e.value)}
									className={`rounded-xl border p-3 ${afterEmotion === e.value ? 'border-leaf bg-mist' : ''}`}
								>
									{e.emoji} {e.label}
								</button>
							))}
						</div>
						<p className='mt-5 font-bold'>좋았던 요소</p>
						<div className='mt-2 flex flex-wrap gap-2'>
							{['햇빛', '조용함', '몰입', '사람 온기', '움직임', '낯선 자극'].map((tag) => (
								<button
									key={tag}
									onClick={() =>
										setTags(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag])
									}
									className={`rounded-full border px-3 py-2 text-sm ${tags.includes(tag) ? 'bg-leaf text-white' : ''}`}
								>
									{tag}
								</button>
							))}
						</div>
						<textarea
							value={body}
							onChange={(e) => setBody(e.target.value.slice(0, 500))}
							className='mt-4 w-full rounded-xl border p-3'
							placeholder='짧은 후기를 남겨 주세요'
						/>
						<button
							onClick={review}
							className='mt-3 w-full rounded-xl bg-leaf p-4 font-black text-white'
						>
							감정 변화 기록하기
						</button>
					</section>
				)}
				{booking.review && (
					<p className='mt-8 rounded-2xl bg-mist p-5 text-center font-bold text-leaf'>
						감정 변화 영수증을 기록했어요.
					</p>
				)}
				{error && <p className='mt-4 text-coral'>{error}</p>}
				{demoConfirm && (
					<div className='fixed inset-0 z-[100] grid place-items-center bg-black/40 p-5'>
						<div className='max-w-md rounded-3xl bg-white p-7'>
							<h2 className='text-2xl font-black'>데모 체크인을 진행할까요?</h2>
							<p className='mt-3 text-sm text-ink/60'>
								실제 현장에서는 공간 운영자가 QR을 확인합니다. 체험에서는 이 버튼으로 같은 상태
								변화를 확인할 수 있어요.
							</p>
							<button
								onClick={demoCheckIn}
								className='mt-6 w-full rounded-xl bg-leaf p-4 font-black text-white'
							>
								체크인 완료로 변경
							</button>
							<button onClick={() => setDemoConfirm(false)} className='mt-3 w-full text-sm'>
								취소
							</button>
						</div>
					</div>
				)}
			</div>
		</AppShell>
	)
}
