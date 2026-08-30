import { FormEvent, useState } from 'react'
import { useRouter } from 'next/router'
import { AppShell } from '@/components/layout/AppShell'
import { SegmentedControl } from '@/components/partner/SegmentedControl'
import { spaceTypes, type PlaceSearchResult } from '@/types/domain'

export default function NewSpace() {
	const router = useRouter(),
		[query, setQuery] = useState(''),
		[places, setPlaces] = useState<PlaceSearchResult[]>([]),
		[error, setError] = useState(''),
		[form, setForm] = useState({
			name: '',
			description: '',
			typeCode: 'WORKSHOP',
			address: '',
			roadAddress: '',
			latitude: '',
			longitude: '',
			rules: '',
		})
	async function search() {
		const r = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`),
			data = await r.json()
		setPlaces(data.places || data.items || data || [])
	}
	function choose(p: PlaceSearchResult) {
		setForm({
			...form,
			name: p.name,
			address: p.address || p.roadAddress || '',
			roadAddress: p.roadAddress || '',
			latitude: String(p.latitude),
			longitude: String(p.longitude),
		})
		setPlaces([])
	}
	async function submit(e: FormEvent) {
		e.preventDefault()
		const r = await fetch('/api/partner/spaces', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form),
			}),
			data = await r.json()
		if (!r.ok) return setError(data.error)
		void router.push('/partner')
	}
	return (
		<AppShell>
			<div className='mx-auto max-w-2xl px-5 py-10'>
				<h1 className='text-4xl font-black'>공간 등록</h1>
				<div className='mt-7 rounded-2xl bg-mist p-5'>
					<label className='font-bold'>네이버 장소 검색</label>
					<div className='mt-2 flex gap-2'>
						<input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className='min-w-0 flex-1 rounded-xl border p-3'
						/>
						<button onClick={search} className='btn-primary rounded-xl px-5'>
							검색
						</button>
					</div>
					{places.map((p) => (
						<button
							key={p.id}
							onClick={() => choose(p)}
							className='mt-2 block w-full rounded-xl bg-white p-3 text-left'
						>
							<strong>{p.name}</strong>
							<small className='block'>{p.roadAddress || p.address}</small>
						</button>
					))}
				</div>
				<form onSubmit={submit} className='mt-5 space-y-4 rounded-3xl bg-white p-7'>
					<label className='block font-bold'>
						공간명
						<input
							required
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							className='mt-2 w-full rounded-xl border p-3'
						/>
					</label>
					<SegmentedControl
						label='유형'
						value={form.typeCode}
						options={spaceTypes.map(([value, label]) => ({ value, label }))}
						onChange={(typeCode) => setForm({ ...form, typeCode })}
						columns={3}
					/>
					<label className='block font-bold'>
						소개
						<textarea
							required
							value={form.description}
							onChange={(e) => setForm({ ...form, description: e.target.value })}
							className='mt-2 w-full rounded-xl border p-3'
						/>
					</label>
					<label className='block font-bold'>
						주소
						<input
							required
							value={form.address}
							onChange={(e) => setForm({ ...form, address: e.target.value })}
							className='mt-2 w-full rounded-xl border p-3'
						/>
					</label>
					<div className='grid grid-cols-2 gap-3'>
						<input
							required
							placeholder='위도'
							value={form.latitude}
							onChange={(e) => setForm({ ...form, latitude: e.target.value })}
							className='rounded-xl border p-3'
						/>
						<input
							required
							placeholder='경도'
							value={form.longitude}
							onChange={(e) => setForm({ ...form, longitude: e.target.value })}
							className='rounded-xl border p-3'
						/>
					</div>
					<label className='block font-bold'>
						이용 규칙
						<textarea
							value={form.rules}
							onChange={(e) => setForm({ ...form, rules: e.target.value })}
							className='mt-2 w-full rounded-xl border p-3'
						/>
					</label>
					<button className='btn-primary w-full rounded-xl p-4 font-black'>공간 저장하기</button>
					{error && <p className='text-coral'>{error}</p>}
				</form>
			</div>
		</AppShell>
	)
}
