import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
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
	const router = useRouter()
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
						<h1 className='text-3xl font-black'>나의 순간</h1>
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
						<h2 className='text-2xl font-black'>예정 순간</h2>
						<Link href='/partner' className='text-sm font-bold text-brand hover:text-brand/80'>
							내 공간 관리 →
						</Link>
					</div>
					<div className='mt-4 space-y-3'>
						{upcoming.map((booking) => (
							<Link
								key={booking.id}
								href={{ pathname: `/bookings/${booking.id}`, query: { returnTo: '/me' } }}
								className='block rounded-3xl bg-white p-6 shadow-sm transition-colors duration-200 hover:bg-sky/20'
							>
								<div className='flex flex-wrap items-center gap-2'>
									<p className='font-black leading-tight'>{booking.slot.experience.title}</p>
									<span className='inline-flex h-7 items-center rounded-full bg-mist px-3 text-xs font-bold leading-none text-brand'>
										QR 티켓 보기
									</span>
								</div>
								<p className='mt-2 text-sm'>
									{format(booking.slot.startsAt)} · {booking.slot.experience.space.name}
								</p>
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
					<h2 className='text-2xl font-black'>지난 순간</h2>
					<div className='mt-4 space-y-3'>
						{past.map((booking) => (
							<article
								key={booking.id}
								className='rounded-2xl bg-white p-5 transition-colors duration-200 hover:bg-sky/20'
							>
								<Link
									href={{ pathname: `/bookings/${booking.id}`, query: { returnTo: '/me' } }}
									className='flex justify-between gap-4'
								>
									<span>
										<strong>{booking.slot.experience.title}</strong>
										<small className='mt-1 block text-ink/50'>
											{format(booking.slot.startsAt)}
										</small>
									</span>
									<span className='shrink-0 text-sm'>
										{booking.review
											? '기록 내용 보기 →'
											: booking.status === 'CHECKED_IN'
												? '감정 변화 기록하기'
												: booking.status === 'CANCELLED'
													? '취소됨'
													: '이용 전'}
									</span>
								</Link>
							</article>
						))}
					</div>
				</section>
			</div>
		</AppShell>
	)
}
