import Head from 'next/head'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { SignInButton } from '@/components/auth/SignInButton'
import { ActivityPicker } from '@/components/experience/ActivityPicker'
import { EmotionPicker } from '@/components/experience/EmotionPicker'
import { AppShell } from '@/components/layout/AppShell'
import dynamic from 'next/dynamic'
import type { ActivityValue, EmotionValue, PlaceSearchResult } from '@/types/domain'

const LocationPickerMap = dynamic(
	() => import('@/components/experience/LocationPickerMap'),
	{ ssr: false },
)

const defaultLocation = { latitude: 37.5666, longitude: 126.9784 }

export default function NewExperiencePage() {
	const { status } = useSession()
	const router = useRouter()
	const [location, setLocation] = useState(defaultLocation)
	const [locationLabel, setLocationLabel] = useState('서울시청 주변')
	const [placeQuery, setPlaceQuery] = useState('')
	const [places, setPlaces] = useState<PlaceSearchResult[]>([])
	const [searched, setSearched] = useState(false)
	const [place, setPlace] = useState<PlaceSearchResult | null>(null)
	const [activity, setActivity] = useState<ActivityValue>('WALK')
	const [selectedEmotions, setSelectedEmotions] = useState<EmotionValue[]>([])
	const [body, setBody] = useState('')
	const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
	const [images, setImages] = useState<File[]>([])
	const [loading, setLoading] = useState(false)
	const [message, setMessage] = useState('')
	const searchBoxRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handlePointerDown = (event: MouseEvent | TouchEvent) => {
			const target = event.target as Node | null
			if (!searchBoxRef.current || !target) return
			if (!searchBoxRef.current.contains(target)) {
				setPlaces([])
				setSearched(false)
			}
		}
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setPlaces([])
				setSearched(false)
			}
		}
		document.addEventListener('mousedown', handlePointerDown)
		document.addEventListener('touchstart', handlePointerDown)
		document.addEventListener('keydown', handleEscape)
		return () => {
			document.removeEventListener('mousedown', handlePointerDown)
			document.removeEventListener('touchstart', handlePointerDown)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [])

	useEffect(() => {
		if (!navigator.geolocation) return
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude })
				setLocationLabel('현재 위치')
			},
			() => undefined,
			{ enableHighAccuracy: true, timeout: 5000 },
		)
	}, [])

	async function searchPlace() {
		if (!placeQuery.trim()) return
		setMessage('')
		setSearched(false)
		const response = await fetch(`/api/places/search?q=${encodeURIComponent(placeQuery)}`)
		const data = await response.json()
		if (!response.ok) {
			setMessage(data.error ?? '장소를 검색하지 못했습니다')
			setPlaces([])
			setSearched(true)
			return
		}
		setPlaces(data.places ?? [])
		setSearched(true)
	}

	function selectPlace(result: PlaceSearchResult) {
		setPlace(result)
		setLocation({ latitude: result.latitude, longitude: result.longitude })
		setLocationLabel(result.name)
		setPlaces([])
		setSearched(false)
	}

	function pickLocation(point: { latitude: number; longitude: number }) {
		setLocation(point)
		if (place) {
			setPlace(null)
		}
		setLocationLabel('지도에서 직접 지정한 위치')
	}

	async function submit(event: FormEvent) {
		event.preventDefault()
		if (status !== 'authenticated') return
		if (!selectedEmotions.length) {
			setMessage('감정을 하나 이상 골라 주세요')
			return
		}
		if (!body.trim()) {
			setMessage('짧은 기록을 남겨 주세요')
			return
		}
		setLoading(true)
		setMessage('')
		try {
			const response = await fetch('/api/experiences', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					latitude: location.latitude,
					longitude: location.longitude,
					place: place ? { ...place, source: 'NAVER_LOCAL', externalId: place.id } : undefined,
					activity,
					emotions: selectedEmotions,
					body,
					visibility,
				}),
			})
			const data = await response.json()
			if (!response.ok) throw new Error(data.error ?? '기록을 저장하지 못했습니다')
			const id = data.experience.id as string
			if (images.length) {
				const form = new FormData()
				images.forEach((image) => form.append('images', image))
				const upload = await fetch(`/api/experiences/${id}/media`, { method: 'POST', body: form })
				if (!upload.ok) {
					const uploadData = await upload.json()
					throw new Error(uploadData.error ?? '사진 업로드에 실패했습니다')
				}
			}
			await router.push(`/experiences/${id}`)
		} catch (error) {
			setMessage(error instanceof Error ? error.message : '저장 중 문제가 생겼습니다')
		} finally {
			setLoading(false)
		}
	}

	if (status !== 'authenticated') {
		return (
			<AppShell>
				<div className='mx-auto grid min-h-[70dvh] max-w-lg place-items-center px-5 text-center'>
					<div>
						<p className='text-sm font-semibold text-leaf'>나만의 감정 핀</p>
						<h1 className='mt-2 text-3xl font-semibold'>경험을 남기려면 로그인해 주세요</h1>
						<p className='mt-3 text-ink/60'>비공개 일기로만 저장하는 것도 가능해요.</p>
						<SignInButton className='mt-6' />
					</div>
				</div>
			</AppShell>
		)
	}

	return (
		<AppShell>
			<Head>
				<title>경험 기록 · 마음지도</title>
			</Head>
			<form onSubmit={submit} className='mx-auto max-w-3xl px-5 py-6 md:py-10'>
				<header>
					<p className='text-sm font-semibold text-leaf'>새로운 감정 핀</p>
					<h1 className='mt-1 text-3xl font-semibold tracking-tight'>이 장소에서 무엇을 느꼈나요?</h1>
				</header>

				<div className='mt-7 grid gap-5'>
					<section className='rounded-3xl bg-white p-5 shadow-sm'>
						<label className='text-sm font-semibold'>1. 장소와 위치</label>
						<div ref={searchBoxRef} className='relative mt-3 flex gap-2'>
							<input
								value={placeQuery}
								onChange={(event) => setPlaceQuery(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										event.preventDefault()
										searchPlace()
									}
								}}
								placeholder='ex) 서울대입구역'
								className='min-w-0 flex-1 rounded-2xl border border-black/10 px-4 py-3'
							/>
							<button type='button' onClick={searchPlace} className='rounded-2xl bg-ink px-4 text-white'>
								검색
							</button>
							{places.length > 0 ? (
								<div className='absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-black/10 bg-white shadow-lg shadow-black/10'>
								{places.map((result) => (
									<button
										key={result.id}
										type='button'
										onClick={() => selectPlace(result)}
										className='block w-full border-b border-black/5 px-4 py-3 text-left last:border-0 hover:bg-mist/50'
									>
										<strong className='block text-sm'>{result.name}</strong>
										<span className='text-xs text-ink/50'>{result.roadAddress ?? result.address}</span>
									</button>
								))}
								</div>
							) : searched ? (
								<div className='absolute left-0 right-0 top-full z-20 mt-1 rounded-2xl border border-black/10 bg-white px-4 py-6 text-center shadow-lg shadow-black/10'>
									<p className='text-sm font-semibold text-ink/70'>검색 결과가 없습니다</p>
									<p className='mt-1 text-xs text-ink/40'>다른 이름이나 주소로 다시 검색해 보세요.</p>
								</div>
							) : null}
						</div>
						<div className='mt-4'>
							<LocationPickerMap value={location} onChange={pickLocation} />
							<p className='mt-2 text-xs text-ink/50'>
								지도를 움직여 가운데 핀을 원하는 위치에 맞춰 주세요.
							</p>
						</div>
						<div className='mt-3 rounded-2xl bg-mist/60 p-4 text-sm'>
							<strong>{locationLabel}</strong>
							<p className='mt-1 font-mono text-xs text-ink/55'>
								{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
							</p>
						</div>
					</section>

					<section className='rounded-3xl bg-white p-5 shadow-sm'>
						<label className='text-sm font-semibold'>2. 무엇을 했나요?</label>
						<div className='mt-3'><ActivityPicker value={activity} onChange={setActivity} /></div>
					</section>

					<section className='rounded-3xl bg-white p-5 shadow-sm'>
						<label className='text-sm font-semibold'>3. 어떤 감정을 느꼈나요?</label>
						<p className='mt-1 text-xs text-ink/50'>여러 개를 선택할 수 있어요.</p>
						<div className='mt-3'><EmotionPicker value={selectedEmotions} onChange={setSelectedEmotions} /></div>
					</section>

					<section className='rounded-3xl bg-white p-5 shadow-sm'>
						<div className='flex items-center justify-between'>
							<label htmlFor='body' className='text-sm font-semibold'>4. 짧게 기록해 주세요</label>
							<span className='text-xs text-ink/40'>{body.length}/500</span>
						</div>
						<textarea
							id='body'
							value={body}
							onChange={(event) => setBody(event.target.value.slice(0, 500))}
							rows={5}
							placeholder='이곳에서 마음이 어떻게 달라졌나요?'
							className='mt-3 w-full resize-none rounded-2xl border border-black/10 px-4 py-3 leading-relaxed'
						/>
						<label className='mt-4 block text-sm font-semibold'>사진 (최대 3장)</label>
						<input
							type='file'
							accept='image/jpeg,image/png,image/webp,image/gif'
							multiple
							onChange={(event) => setImages(Array.from(event.target.files ?? []).slice(0, 3))}
							className='mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-mist file:px-4 file:py-2 file:text-leaf'
						/>
					</section>

					<section className='rounded-3xl bg-white p-5 shadow-sm'>
						<label className='text-sm font-semibold'>5. 공개 범위</label>
						<div className='mt-3 grid grid-cols-2 gap-2'>
							{(['PUBLIC', 'PRIVATE'] as const).map((item) => (
								<button
									key={item}
									type='button'
									onClick={() => setVisibility(item)}
									className={`rounded-2xl border p-4 text-left ${visibility === item ? 'border-leaf bg-mist' : 'border-black/10'}`}
								>
									<strong className='text-sm'>{item === 'PUBLIC' ? '모두에게 공개' : '나만 보기'}</strong>
									<p className='mt-1 text-xs text-ink/50'>{item === 'PUBLIC' ? '흐린 위치로 지도에 표시돼요.' : '정확한 위치도 나만 볼 수 있어요.'}</p>
								</button>
							))}
						</div>
					</section>
				</div>

				{message ? <p className='mt-4 rounded-2xl bg-coral/10 p-3 text-sm text-coral'>{message}</p> : null}
				<button disabled={loading} className='mt-5 w-full rounded-2xl bg-leaf px-5 py-4 font-semibold text-white disabled:opacity-60'>
					{loading ? '기록을 저장하는 중…' : '감정 핀 남기기'}
				</button>
			</form>
		</AppShell>
	)
}
