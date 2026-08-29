import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AppShell } from '@/components/layout/AppShell'

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
					<label className='block font-bold'>
						경험
						<select
							value={form.experienceId}
							onChange={(e) => setForm({ ...form, experienceId: e.target.value })}
							className='mt-2 w-full rounded-xl border p-3'
						>
							{experiences.map((ex) => (
								<option key={ex.id} value={ex.id}>
									{ex.title}
								</option>
							))}
						</select>
					</label>
					<label className='block font-bold'>
						시작 시각
						<input
							type='datetime-local'
							required
							value={form.startsAt}
							onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
							className='mt-2 w-full rounded-xl border p-3'
						/>
					</label>
					<label className='block font-bold'>
						예약 마감 시각
						<input
							type='datetime-local'
							required
							value={form.bookingClosesAt}
							onChange={(e) => setForm({ ...form, bookingClosesAt: e.target.value })}
							className='mt-2 w-full rounded-xl border p-3'
						/>
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
					<button className='w-full rounded-xl bg-leaf p-4 font-black text-white'>
						이 시간 열기
					</button>
					{error && <p className='text-coral'>{error}</p>}
				</form>
			</div>
		</AppShell>
	)
}
