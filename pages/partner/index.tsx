import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'

export default function Partner() {
	const [application, setApplication] = useState<any>(undefined),
		[slots, setSlots] = useState<any[]>([])
	useEffect(() => {
		fetch('/api/partner/apply')
			.then(async (r) => (r.ok ? r.json() : null))
			.then(setApplication)
		fetch('/api/partner/dashboard')
			.then(async (r) => (r.ok ? r.json() : []))
			.then(setSlots)
	}, [])
	if (application === undefined)
		return (
			<AppShell>
				<div className='p-10 text-center'>확인 중…</div>
			</AppShell>
		)
	if (!application || application.status !== 'APPROVED')
		return (
			<AppShell>
				<div className='mx-auto max-w-xl px-5 py-20 text-center'>
					<h1 className='text-3xl font-black'>비는 시간을 경험으로 열어보세요</h1>
					<p className='mt-3 text-ink/55'>고객 계정 그대로 파트너 신청을 할 수 있어요.</p>
					<Link
						href='/partner/apply'
						className='mt-7 inline-block rounded-2xl bg-leaf px-7 py-4 font-black text-white'
					>
						파트너 신청하기
					</Link>
				</div>
			</AppShell>
		)
	const sold = slots.reduce((n, s) => n + s.soldSeats, 0),
		revenue = slots.reduce((n, s) => n + s.expectedRevenue, 0)
	return (
		<AppShell>
			<div className='mx-auto max-w-6xl px-5 py-10'>
				<p className='font-bold text-leaf'>
					예약 없이 사라질 공간·재료·인력을
					<br />
					오늘 판매 가능한 경험으로 전환해 보세요.
				</p>
				<h1 className='mt-3 text-4xl font-black'>내 공간</h1>
				<div className='mt-6 grid grid-cols-2 gap-3 md:grid-cols-4'>
					{[
						['열린 슬롯', slots.length],
						['판매된 유휴 좌석', sold],
						['회수 예상 매출', `${revenue.toLocaleString()}원`],
						['운영 상태', '승인됨'],
					].map(([label, value]) => (
						<div key={String(label)} className='rounded-2xl bg-white p-5'>
							<p className='text-xs text-ink/50'>{label}</p>
							<strong className='mt-2 block text-xl'>{value}</strong>
						</div>
					))}
				</div>
				<div className='mt-7 flex flex-wrap gap-3'>
					<Link
						href='/partner/spaces/new'
						className='rounded-xl bg-leaf px-5 py-3 font-bold text-white'
					>
						공간 등록
					</Link>
					<Link href='/partner/experiences/new' className='rounded-xl border px-5 py-3 font-bold'>
						경험 상품 등록
					</Link>
					<Link href='/partner/slots/new' className='rounded-xl border px-5 py-3 font-bold'>
						유휴 슬롯 열기
					</Link>
				</div>
				<h2 className='mt-10 text-2xl font-black'>다가오는 슬롯</h2>
				<div className='mt-4 overflow-x-auto rounded-2xl bg-white'>
					<table className='w-full min-w-[700px] text-left text-sm'>
						<thead>
							<tr className='border-b'>
								<th className='p-4'>경험</th>
								<th>시작</th>
								<th>예약/잔여</th>
								<th>체크인</th>
								<th>예상 매출</th>
							</tr>
						</thead>
						<tbody>
							{slots.map((s) => (
								<tr key={s.id} className='border-b last:border-0'>
									<td className='p-4 font-bold'>{s.experience.title}</td>
									<td>{new Date(s.startsAt).toLocaleString('ko-KR')}</td>
									<td>
										{s.soldSeats}명 / {s.remainingSeats}석
									</td>
									<td>{s.bookings.filter((b: any) => b.status === 'CHECKED_IN').length}명</td>
									<td>{s.expectedRevenue.toLocaleString()}원</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</AppShell>
	)
}
