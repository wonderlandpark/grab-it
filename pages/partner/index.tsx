import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { spaceTypes } from '@/types/domain'

const spaceTypeLabels = Object.fromEntries(spaceTypes) as Record<string, string>

export default function Partner() {
	const [application, setApplication] = useState<any>(undefined),
		[slots, setSlots] = useState<any[]>([]),
		[spaces, setSpaces] = useState<any[]>([]),
		[experiences, setExperiences] = useState<any[]>([])
	useEffect(() => {
		fetch('/api/partner/apply')
			.then(async (r) => (r.ok ? r.json() : null))
			.then(setApplication)
		fetch('/api/partner/dashboard')
			.then(async (r) => (r.ok ? r.json() : []))
			.then(setSlots)
		fetch('/api/partner/spaces')
			.then(async (r) => (r.ok ? r.json() : []))
			.then(setSpaces)
		fetch('/api/partner/experiences')
			.then(async (r) => (r.ok ? r.json() : []))
			.then(setExperiences)
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
					<h1 className='text-3xl font-black'>비는 시간을 새로운 순간으로 열어보세요</h1>
					<p className='mt-3 text-ink/55'>고객 계정 그대로 파트너 신청을 할 수 있어요.</p>
					<Link href='/partner/apply' className='btn-primary mt-7 rounded-2xl px-7 py-4 font-black'>
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
				<p className='font-bold text-brand'>
					예약 없이 사라질 공간·재료·인력을
					<br />
					오늘 판매 가능한 순간으로 전환해 보세요.
				</p>
				<h1 className='mt-3 text-4xl font-black'>내 공간</h1>
				<div className='mt-6 grid grid-cols-2 gap-3 md:grid-cols-4'>
					{[
						['열린 예약 시간', slots.length],
						['판매된 유휴 자리', sold],
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
					<Link href='/partner/spaces/new' className='btn-secondary rounded-xl px-5 py-3 font-bold'>
						공간 등록
					</Link>
					<Link
						href='/partner/experiences/new'
						className='btn-secondary rounded-xl px-5 py-3 font-bold'
					>
						경험 등록
					</Link>
					<Link href='/partner/slots/new' className='btn-primary rounded-xl px-5 py-3 font-bold'>
						예약 시간 열기
					</Link>
				</div>

				<section className='mt-10'>
					<div className='flex items-end justify-between gap-3'>
						<h2 className='text-2xl font-black'>등록된 공간</h2>
						<span className='text-sm font-bold text-ink/45'>{spaces.length}개</span>
					</div>
					{spaces.length ? (
						<div className='mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
							{spaces.map((space) => (
								<article key={space.id} className='rounded-2xl bg-white p-5'>
									<div className='flex items-start justify-between gap-3'>
										<h3 className='text-lg font-black'>{space.name}</h3>
										<span className='shrink-0 rounded-full bg-paper px-2.5 py-1 text-xs font-bold text-ink/50'>
											{space.status === 'PUBLISHED' ? '공개' : '비공개'}
										</span>
									</div>
									<p className='mt-2 text-sm font-bold text-brand'>
										{spaceTypeLabels[space.typeCode] || space.typeCode}
									</p>
									<p className='mt-2 text-sm text-ink/50'>{space.roadAddress || space.address}</p>
								</article>
							))}
						</div>
					) : (
						<div className='mt-4 rounded-2xl bg-white p-6 text-center'>
							<p className='text-sm text-ink/50'>아직 등록된 공간이 없어요.</p>
							<Link
								href='/partner/spaces/new'
								className='btn-secondary mt-4 rounded-xl px-4 py-2 text-sm font-bold'
							>
								공간 등록하기
							</Link>
						</div>
					)}
				</section>

				<section className='mt-10'>
					<div className='flex items-end justify-between gap-3'>
						<h2 className='text-2xl font-black'>등록된 경험</h2>
						<span className='text-sm font-bold text-ink/45'>{experiences.length}개</span>
					</div>
					{experiences.length ? (
						<div className='mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
							{experiences.map((experience) => (
								<article key={experience.id} className='rounded-2xl bg-white p-5'>
									<div className='flex items-start justify-between gap-3'>
										<h3 className='text-lg font-black'>{experience.title}</h3>
										<span className='shrink-0 rounded-full bg-paper px-2.5 py-1 text-xs font-bold text-ink/50'>
											{experience.status === 'PUBLISHED' ? '공개' : '비공개'}
										</span>
									</div>
									<p className='mt-2 text-sm font-bold text-brand'>{experience.space.name}</p>
									<div className='mt-3 flex flex-wrap gap-2 text-xs text-ink/55'>
										<span className='rounded-full bg-paper px-3 py-1.5'>
											{experience.durationMinutes}분
										</span>
										<span className='rounded-full bg-paper px-3 py-1.5'>
											{experience.priceWon === 0
												? '무료'
												: `${experience.priceWon.toLocaleString()}원`}
										</span>
									</div>
								</article>
							))}
						</div>
					) : (
						<div className='mt-4 rounded-2xl bg-white p-6 text-center'>
							<p className='text-sm text-ink/50'>아직 등록된 경험이 없어요.</p>
							<Link
								href='/partner/experiences/new'
								className='btn-secondary mt-4 rounded-xl px-4 py-2 text-sm font-bold'
							>
								경험 등록하기
							</Link>
						</div>
					)}
				</section>

				<h2 className='mt-10 text-2xl font-black'>다가오는 예약 시간</h2>
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
