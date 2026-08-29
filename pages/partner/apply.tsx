import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AppShell } from '@/components/layout/AppShell'

export default function Apply() {
	const router = useRouter(),
		[form, setForm] = useState({ operatorName: '', phone: '', businessRegistrationNumber: '' }),
		[status, setStatus] = useState<string | null>(null),
		[error, setError] = useState('')
	useEffect(() => {
		fetch('/api/partner/apply')
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => setStatus(data?.status || null))
	}, [])
	async function submit(e: FormEvent) {
		e.preventDefault()
		const r = await fetch('/api/partner/apply', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(form),
		})
		const data = await r.json()
		if (!r.ok) return setError(data.error)
		setStatus(data.status)
	}
	return (
		<AppShell>
			<div className='mx-auto max-w-xl px-5 py-12'>
				<p className='font-bold text-leaf'>누구나 공간 운영자가 될 수 있어요</p>
				<h1 className='mt-2 text-4xl font-black'>공간 파트너 신청</h1>
				{status && (
					<div className='mt-6 rounded-2xl bg-mist p-5 font-bold'>
						현재 상태:{' '}
						{status === 'PENDING' ? '승인 대기 중' : status === 'APPROVED' ? '승인 완료' : '반려됨'}
					</div>
				)}
				{status !== 'APPROVED' && (
					<form onSubmit={submit} className='mt-8 space-y-5 rounded-3xl bg-white p-7'>
						{[
							['operatorName', '운영자명'],
							['phone', '연락처'],
							['businessRegistrationNumber', '사업자등록번호'],
						].map(([key, label]) => (
							<label key={key} className='block font-bold'>
								{label}
								<input
									required
									value={form[key as keyof typeof form]}
									onChange={(e) => setForm({ ...form, [key]: e.target.value })}
									className='mt-2 w-full rounded-xl border p-3'
								/>
							</label>
						))}
						<button className='w-full rounded-xl bg-leaf p-4 font-black text-white'>
							신청하기
						</button>
					</form>
				)}
				{status === 'APPROVED' && (
					<button
						onClick={() => router.push('/partner')}
						className='mt-6 rounded-xl bg-leaf px-6 py-4 font-black text-white'
					>
						대시보드로 이동
					</button>
				)}
				{error && <p className='mt-3 text-coral'>{error}</p>}
			</div>
		</AppShell>
	)
}
