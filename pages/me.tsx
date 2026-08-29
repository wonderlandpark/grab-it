import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { SignInButton } from '@/components/auth/SignInButton'
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
export default function Me() {
	const { data: session, status } = useSession(),
		[bookings, setBookings] = useState<BookingTicket[]>([])
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
						<h1 className='text-3xl font-black'>내 경험을 한곳에서</h1>
						<p className='mt-2 text-ink/55'>예약과 감정 변화 기록을 확인해요.</p>
						<SignInButton className='mt-6' />
					</div>
				</div>
			</AppShell>
		)
	const upcoming = bookings.filter(
			(b) => b.status === 'CONFIRMED' && new Date(b.slot.startsAt) > new Date()
		),
		past = bookings.filter((b) => !upcoming.includes(b))
	return (
		<AppShell>
			<Head>
				<title>내 정보 · 틈</title>
			</Head>
			<div className='mx-auto max-w-4xl px-5 py-10'>
				<header>
					<p className='text-sm text-ink/50'>안녕하세요</p>
					<h1 className='text-3xl font-black'>{session?.user?.name || '오늘의 여행자'}님</h1>
				</header>
				<section className='mt-10'>
					<div className='flex items-center justify-between'>
						<h2 className='text-2xl font-black'>예정 예약</h2>
						<Link href='/partner' className='text-sm font-bold text-leaf'>
							내 공간 관리 →
						</Link>
					</div>
					<div className='mt-4 space-y-3'>
						{upcoming.map((booking) => (
							<Link
								key={booking.id}
								href={`/bookings/${booking.id}`}
								className='block rounded-3xl bg-white p-6 shadow-sm'
							>
								<p className='font-black'>{booking.slot.experience.title}</p>
								<p className='mt-2 text-sm'>
									{format(booking.slot.startsAt)} · {booking.slot.experience.space.name}
								</p>
								<span className='mt-3 inline-block rounded-full bg-mist px-3 py-1 text-xs font-bold text-leaf'>
									QR 티켓 보기
								</span>
							</Link>
						))}
						{!upcoming.length && (
							<p className='rounded-3xl bg-white p-8 text-center text-ink/45'>
								예정된 예약이 없어요.
							</p>
						)}
					</div>
				</section>
				<section className='mt-10'>
					<h2 className='text-2xl font-black'>지난 경험</h2>
					<div className='mt-4 space-y-3'>
						{past.map((booking) => (
							<Link
								key={booking.id}
								href={`/bookings/${booking.id}`}
								className='flex justify-between rounded-2xl bg-white p-5'
							>
								<span>
									<strong>{booking.slot.experience.title}</strong>
									<small className='mt-1 block text-ink/50'>{format(booking.slot.startsAt)}</small>
								</span>
								<span className='text-sm'>
									{booking.review
										? '기록 완료'
										: booking.status === 'CHECKED_IN'
											? '후기 쓰기'
											: booking.status === 'CANCELLED'
												? '취소됨'
												: '이용 전'}
								</span>
							</Link>
						))}
					</div>
				</section>
			</div>
		</AppShell>
	)
}
