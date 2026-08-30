import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { SignInButton } from '@/components/auth/SignInButton'
import { emotionArtwork, representativeEmotion } from '@/lib/emotion-artwork'
import type { BookingTicket } from '@/types/domain'

const format = (value: string) =>
	new Intl.DateTimeFormat('ko-KR', {
		timeZone: 'Asia/Seoul',
		month: 'long',
		day: 'numeric',
		weekday: 'short',
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(value))

interface BookingGroup {
	id: string
	courseGroupId: string | null
	bookings: BookingTicket[]
}

function groupBookings(bookings: BookingTicket[]) {
	return bookings
		.reduce<BookingGroup[]>((groups, booking) => {
			const id = booking.courseGroupId || booking.id
			const group = groups.find((item) => item.id === id)
			if (group) group.bookings.push(booking)
			else groups.push({ id, courseGroupId: booking.courseGroupId, bookings: [booking] })
			return groups
		}, [])
		.map((group) => ({
			...group,
			bookings: group.bookings.sort(
				(left, right) =>
					(left.courseOrder ?? Number.MAX_SAFE_INTEGER) -
					(right.courseOrder ?? Number.MAX_SAFE_INTEGER)
			),
		}))
}

export default function Me() {
	const router = useRouter()
	const { data: session, status } = useSession()
	const [bookings, setBookings] = useState<BookingTicket[]>([])
	useEffect(() => {
		if (status === 'authenticated')
			fetch('/api/me/bookings')
				.then((r) => r.json())
				.then(setBookings)
	}, [status])

	if (status !== 'authenticated')
		return (
			<AppShell>
				<div className='grid min-h-[70vh] place-items-center text-center'>
					<div>
						<h1 className='text-3xl font-black'>나의 순간</h1>
						<p className='mt-2 text-ink/55'>예약과 감정 변화 기록을 확인해요.</p>
						<SignInButton className='mt-6' />
					</div>
				</div>
			</AppShell>
		)
	const groupedBookings = groupBookings(bookings)
	const upcomingGroups = groupedBookings
		.filter((group) =>
			group.courseGroupId
				? group.bookings.some((booking) => booking.status === 'CONFIRMED')
				: group.bookings[0].status === 'CONFIRMED' &&
					new Date(group.bookings[0].slot.startsAt) > new Date()
		)
		.sort(
			(left, right) =>
				new Date(left.bookings[0].slot.startsAt).getTime() -
				new Date(right.bookings[0].slot.startsAt).getTime()
		)
	const upcomingIds = new Set(upcomingGroups.map((group) => group.id))
	const pastGroups = groupedBookings.filter((group) => !upcomingIds.has(group.id))
	return (
		<AppShell>
			<Head>
				<title>나의 순간 · grabit</title>
			</Head>
			<div className='mx-auto max-w-4xl px-5 py-10'>
				<header>
					<p className='text-sm text-ink/50'>안녕하세요,</p>
					<span className='text-3xl font-black'>{session?.user?.name || '오늘의 여행자'}</span>
					<span className='pl-1 text-2xl font-bold'>님.</span>
				</header>
				{typeof router.query.courseBooked === 'string' && (
					<div className='mt-6 rounded-2xl bg-glow p-5 font-bold text-ink'>
						궤적의 순간 {router.query.courseBooked}개를 예약했어요.
					</div>
				)}
				<section className='mt-10'>
					<div className='flex items-center justify-between'>
						<h2 className='text-2xl font-black'>다가올 순간</h2>
						<Link href='/partner' className='text-sm font-bold text-brand hover:text-brand/80'>
							내 공간 관리 →
						</Link>
					</div>
					<div className='mt-4 space-y-3'>
						{upcomingGroups.map((group) =>
							group.courseGroupId ? (
								<CourseGroupCard key={group.id} bookings={group.bookings} />
							) : (
								<UpcomingBookingCard key={group.id} booking={group.bookings[0]} />
							)
						)}
						{!upcomingGroups.length && (
							<p className='rounded-3xl bg-white p-8 text-center text-ink/45'>
								예정된 예약이 없어요.
							</p>
						)}
					</div>
				</section>
				<section className='mt-10'>
					<h2 className='text-2xl font-black'>지나간 순간</h2>
					<div className='mt-4 space-y-3'>
						{pastGroups.map((group) =>
							group.courseGroupId ? (
								<CourseGroupCard key={group.id} bookings={group.bookings} />
							) : (
								<PastBookingCard key={group.id} booking={group.bookings[0]} />
							)
						)}
					</div>
				</section>
			</div>
		</AppShell>
	)
}

function UpcomingBookingCard({ booking }: { booking: BookingTicket }) {
	return (
		<article className='rounded-3xl bg-white p-2 shadow-sm'>
			<BookingMomentRow booking={booking} />
		</article>
	)
}

function CourseGroupCard({ bookings }: { bookings: BookingTicket[] }) {
	return (
		<article className='rounded-3xl border border-sky bg-white p-2 shadow-sm'>
			<div>
				{bookings.map((booking, index) => (
					<BookingMomentRow
						key={booking.id}
						booking={booking}
						connectToNext={index < bookings.length - 1}
					/>
				))}
			</div>
		</article>
	)
}

function PastBookingCard({ booking }: { booking: BookingTicket }) {
	return (
		<article className='rounded-3xl bg-white p-2 shadow-sm'>
			<BookingMomentRow booking={booking} />
		</article>
	)
}

function BookingMomentRow({
	booking,
	connectToNext = false,
}: {
	booking: BookingTicket
	connectToNext?: boolean
}) {
	const completed = booking.status === 'CHECKED_IN'
	const cancelled = booking.status === 'CANCELLED'
	const href = { pathname: `/bookings/${booking.id}`, query: { returnTo: '/me' } }

	return (
		<div className='group flex min-h-20 gap-4 rounded-2xl p-3 transition-colors hover:bg-sky/20'>
			<div className='relative flex w-10 shrink-0 justify-center'>
				<BookingEmotionIcon booking={booking} completed={completed} cancelled={cancelled} />
				{connectToNext && (
					<span
						className='absolute -bottom-7 left-1/2 top-10 w-px -translate-x-1/2 bg-action/35'
					/>
				)}
			</div>
			<Link href={href} className='min-w-0 flex-1 self-center'>
				<strong className={`block leading-tight ${cancelled ? 'text-ink/45 line-through' : ''}`}>
					{booking.slot.experience.title}
				</strong>
				<p className='mt-1 text-sm text-ink/55'>
					{format(booking.slot.startsAt)} · {booking.slot.experience.space.name}
				</p>
			</Link>
			<Link
				href={href}
				className={`shrink-0 self-center text-right text-xs font-bold opacity-75 group-hover:opacity-100 ${cancelled ? 'text-coral' : 'text-brand'}`}
			>
				{bookingActionLabel(booking)}
			</Link>
		</div>
	)
}

function bookingActionLabel(booking: BookingTicket) {
	if (booking.status === 'CANCELLED') return '취소됨'
	if (booking.review) return '기록 내용 보기 →'
	if (booking.status === 'CHECKED_IN') return '감정 변화 기록하기'
	return 'QR 티켓 보기 →'
}

function BookingEmotionIcon({
	booking,
	completed = false,
	cancelled = false,
}: {
	booking: BookingTicket
	completed?: boolean
	cancelled?: boolean
}) {
	const emotion = representativeEmotion([booking.desiredEmotion], booking.slot.experience.emotions)
	const fillFilterId = `completed-emotion-${booking.id.replace(/[^a-zA-Z0-9_-]/g, '')}`

	return (
		<span
			className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center transition ${cancelled ? 'opacity-35 grayscale' : ''}`}
		>
			{emotion && completed ? (
				<CompletedEmotionArtwork src={emotionArtwork[emotion].src} filterId={fillFilterId} />
			) : emotion ? (
				<img
					src={emotionArtwork[emotion].src}
					alt=''
					aria-hidden='true'
					className='h-8 w-8 object-contain'
				/>
			) : null}
		</span>
	)
}

function CompletedEmotionArtwork({ src, filterId }: { src: string; filterId: string }) {
	return (
		<svg aria-hidden='true' viewBox='0 0 48 48' className='h-8 w-8 overflow-visible'>
			<defs>
				<filter
					id={filterId}
					x='-35%'
					y='-35%'
					width='170%'
					height='170%'
					colorInterpolationFilters='sRGB'
				>
					<feMorphology in='SourceAlpha' operator='dilate' radius='6' result='expanded' />
					<feMorphology in='expanded' operator='erode' radius='4' result='filledShape' />
					<feFlood floodColor='#F8FF8E' result='yellow' />
					<feComposite in='yellow' in2='filledShape' operator='in' />
				</filter>
			</defs>
			<image
				href={src}
				x='4'
				y='4'
				width='40'
				height='40'
				preserveAspectRatio='xMidYMid meet'
				filter={`url(#${filterId})`}
			/>
			<image href={src} x='4' y='4' width='40' height='40' preserveAspectRatio='xMidYMid meet' />
		</svg>
	)
}
