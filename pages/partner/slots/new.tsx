import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AppShell } from '@/components/layout/AppShell'
import { SegmentedControl } from '@/components/partner/SegmentedControl'

export default function NewSlot() {
	const router = useRouter(),
		[experiences, setExperiences] = useState<any[]>([]),
		[form, setForm] = useState({
			experienceId: '',
			startsAt: '',
			bookingClosesAt: '',
			capacity: '1',
		}),
		[error, setError] = useState('')
	useEffect(() => {
		fetch('/api/partner/experiences')
			.then((r) => r.json())
			.then((data) => {
				setExperiences(data)
				setForm((f) => ({ ...f, experienceId: data[0]?.id || '' }))
			})
	}, [])
	async function submit(e: FormEvent) {
		e.preventDefault()
		const startsAt = new Date(form.startsAt)
		const bookingClosesAt = new Date(form.bookingClosesAt)
		if (bookingClosesAt > startsAt) {
			setError('예약 마감 시각은 시작 시각과 같거나 이전이어야 해요.')
			return
		}
		const r = await fetch('/api/partner/slots', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...form, capacity: Number(form.capacity) }),
			}),
			data = await r.json()
		if (!r.ok) return setError(data.error)
		void router.push('/partner')
	}
	return (
		<AppShell>
			<div className='mx-auto max-w-xl px-5 py-10'>
				<h1 className='text-4xl font-black'>유휴 슬롯 열기</h1>
				<p className='mt-3 text-ink/55'>반복 일정 없이 실제로 비는 시간만 하나씩 엽니다.</p>
				<form onSubmit={submit} className='mt-7 space-y-5 rounded-3xl bg-white p-7'>
					<SegmentedControl
						label='순간'
						value={form.experienceId}
						options={experiences.map((experience) => ({
							value: experience.id,
							label: experience.title,
						}))}
						onChange={(experienceId) => setForm({ ...form, experienceId })}
						emptyMessage='먼저 순간을 등록해 주세요.'
					/>
					<label className='block font-bold'>
						시작 시각
						<input
							type='datetime-local'
							required
							value={form.startsAt}
							onChange={(e) => {
								const startsAt = e.target.value
								setForm((current) => ({
									...current,
									startsAt,
									bookingClosesAt:
										!current.bookingClosesAt ||
										new Date(current.bookingClosesAt) > new Date(startsAt)
											? startsAt
											: current.bookingClosesAt,
								}))
								setError('')
							}}
							className='mt-2 w-full rounded-xl border p-3'
						/>
					</label>
					<label className='block font-bold'>
						예약 마감 시각
						<input
							type='datetime-local'
							required
							value={form.bookingClosesAt}
							max={form.startsAt || undefined}
							onChange={(e) => {
								setForm({ ...form, bookingClosesAt: e.target.value })
								setError('')
							}}
							className='mt-2 w-full rounded-xl border p-3'
						/>
						<span className='mt-2 block text-sm font-normal text-ink/45'>
							시작 시각과 같거나 이전으로 설정해 주세요.
						</span>
					</label>
					<label className='block font-bold'>
						정원
						<input
							type='number'
							min='1'
							max='1000'
							value={form.capacity}
							onChange={(e) => setForm({ ...form, capacity: e.target.value })}
							className='mt-2 w-full rounded-xl border p-3'
						/>
					</label>
					<button className='btn-primary w-full rounded-xl p-4 font-black'>이 시간 열기</button>
					{error && <p className='text-coral'>{error}</p>}
				</form>
			</div>
		</AppShell>
	)
}
