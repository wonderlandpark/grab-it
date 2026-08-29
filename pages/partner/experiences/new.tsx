import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AppShell } from '@/components/layout/AppShell'
import { emotions } from '@/types/domain'

export default function NewExperience() {
	const router = useRouter(),
		[spaces, setSpaces] = useState<any[]>([]),
		[error, setError] = useState(''),
		[form, setForm] = useState({
			spaceId: '',
			title: '',
			description: '',
			durationMinutes: '60',
			priceWon: '0',
			originalPriceWon: '',
			emotions: [] as string[],
			ambienceTags: '',
		})
	useEffect(() => {
		fetch('/api/partner/spaces')
			.then((r) => r.json())
			.then((data) => {
				setSpaces(data)
				setForm((f) => ({ ...f, spaceId: data[0]?.id || '' }))
			})
	}, [])
	async function submit(e: FormEvent) {
		e.preventDefault()
		const r = await fetch('/api/partner/experiences', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...form,
					ambienceTags: form.ambienceTags.split(',').map((t) => t.trim()),
					durationMinutes: Number(form.durationMinutes),
					priceWon: Number(form.priceWon),
					originalPriceWon: form.originalPriceWon ? Number(form.originalPriceWon) : null,
				}),
			}),
			data = await r.json()
		if (!r.ok) return setError(data.error)
		void router.push('/partner/slots/new')
	}
	return (
		<AppShell>
			<div className='mx-auto max-w-2xl px-5 py-10'>
				<h1 className='text-4xl font-black'>경험 상품 등록</h1>
				<form onSubmit={submit} className='mt-7 space-y-5 rounded-3xl bg-white p-7'>
					<label className='block font-bold'>
						공간
						<select
							required
							value={form.spaceId}
							onChange={(e) => setForm({ ...form, spaceId: e.target.value })}
							className='mt-2 w-full rounded-xl border p-3'
						>
							{spaces.map((s) => (
								<option key={s.id} value={s.id}>
									{s.name}
								</option>
							))}
						</select>
					</label>
					<label className='block font-bold'>
						경험 이름
						<input
							required
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							className='mt-2 w-full rounded-xl border p-3'
						/>
					</label>
					<label className='block font-bold'>
						설명
						<textarea
							required
							value={form.description}
							onChange={(e) => setForm({ ...form, description: e.target.value })}
							className='mt-2 w-full rounded-xl border p-3'
						/>
					</label>
					<div className='grid gap-3 sm:grid-cols-3'>
						<label className='font-bold'>
							소요 시간(분)
							<input
								type='number'
								min='15'
								value={form.durationMinutes}
								onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
								className='mt-2 w-full rounded-xl border p-3'
							/>
						</label>
						<label className='font-bold'>
							판매가
							<input
								type='number'
								min='0'
								value={form.priceWon}
								onChange={(e) => setForm({ ...form, priceWon: e.target.value })}
								className='mt-2 w-full rounded-xl border p-3'
							/>
						</label>
						<label className='font-bold'>
							정상가 <span className='font-normal text-ink/40'>선택</span>
							<input
								type='number'
								min='0'
								value={form.originalPriceWon}
								onChange={(e) => setForm({ ...form, originalPriceWon: e.target.value })}
								placeholder='할인 전 금액'
								className='mt-2 w-full rounded-xl border p-3'
							/>
						</label>
					</div>
					<fieldset>
						<legend className='font-bold'>느끼고 싶은 감정 *</legend>
						<div className='mt-2 flex flex-wrap gap-2'>
							{emotions.map((em) => (
								<button
									type='button'
									key={em.value}
									onClick={() =>
										setForm({
											...form,
											emotions: form.emotions.includes(em.value)
												? form.emotions.filter((v) => v !== em.value)
												: [...form.emotions, em.value],
										})
									}
									className={`rounded-full border px-3 py-2 ${form.emotions.includes(em.value) ? 'bg-leaf text-white' : ''}`}
								>
									{em.emoji} {em.label}
								</button>
							))}
						</div>
					</fieldset>
					<label className='block font-bold'>
						분위기 태그 <span className='font-normal text-ink/40'>쉼표로 구분</span>
						<input
							value={form.ambienceTags}
							onChange={(e) => setForm({ ...form, ambienceTags: e.target.value })}
							placeholder='햇빛, 조용함, 몰입'
							className='mt-2 w-full rounded-xl border p-3'
						/>
					</label>
					<button className='w-full rounded-xl bg-leaf p-4 font-black text-white'>
						상품 공개하기
					</button>
					{error && <p className='text-coral'>{error}</p>}
				</form>
			</div>
		</AppShell>
	)
}
