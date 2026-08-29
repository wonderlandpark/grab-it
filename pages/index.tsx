import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { RecommendationCard } from '@/components/discovery/RecommendationCard'
import { BudgetNumberLine, NumberLineSlider } from '@/components/discovery/NumberLineSlider'
import { AppShell } from '@/components/layout/AppShell'
import MapCanvas from '@/components/map/MapCanvas'
import {
	currentStates,
	emotions,
	startWindows,
	type EmotionValue,
	type ExperienceRecommendation,
	type PlaceSearchResult,
} from '@/types/domain'

const SEOUL = { latitude: 37.545, longitude: 127.045 }
const distanceOptions = [
	{ value: 1, label: '1km' },
	{ value: 3, label: '3km' },
	{ value: 5, label: '5km' },
	{ value: 10, label: '10km' },
	{ value: 30, label: '30km' },
]
const inferredEmotion: Record<string, EmotionValue> = {
	OVERWHELMED: 'CALM',
	TIRED: 'ENERGY',
	LONELY: 'COMFORT',
	RESTLESS: 'FOCUS',
	BORED: 'EXCITEMENT',
}

export default function Home() {
	const router = useRouter()
	const [currentState, setCurrentState] = useState('')
	const [desiredEmotion, setDesiredEmotion] = useState<EmotionValue | ''>('')
	const [unsure, setUnsure] = useState(false)
	const [startWithinMinutes, setWindow] = useState(180)
	const [maxDistanceKm, setDistance] = useState(3)
	const [maxBudget, setBudget] = useState('')
	const [location, setLocation] = useState(SEOUL)
	const [locationName, setLocationName] = useState('성수동 기준')
	const [locationQuery, setLocationQuery] = useState('')
	const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([])
	const [results, setResults] = useState<{
		recommended: ExperienceRecommendation[]
		all: ExperienceRecommendation[]
	} | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [showAll, setShowAll] = useState(false)
	const [showMap, setShowMap] = useState(false)
	const queryReady = router.isReady && typeof router.query.desiredEmotion === 'string'

	// Every discovery input is represented in asPath, so a shared URL restores the same result.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		if (!queryReady) return
		const desired = String(router.query.desiredEmotion) as EmotionValue
		const nextWindow = Number(router.query.startWithinMinutes || 180)
		const nextDistance = Number(router.query.maxDistanceKm || 3)
		const nextBudget = String(router.query.maxBudget || '')
		const nextLocation = {
			latitude: Number(router.query.latitude || SEOUL.latitude),
			longitude: Number(router.query.longitude || SEOUL.longitude),
		}
		setDesiredEmotion(desired)
		setUnsure(router.query.emotionMode === 'unsure')
		setCurrentState(String(router.query.currentState || ''))
		setWindow(nextWindow)
		setDistance(nextDistance)
		setBudget(nextBudget)
		setLocation(nextLocation)
		const params = new URLSearchParams({
			desiredEmotion: desired,
			startWithinMinutes: String(nextWindow),
			maxDistanceKm: String(nextDistance),
			latitude: String(nextLocation.latitude),
			longitude: String(nextLocation.longitude),
		})
		if (nextBudget) params.set('maxBudget', nextBudget)
		setLoading(true)
		fetch(`/api/discovery/recommendations?${params}`)
			.then(async (response) => {
				const data = await response.json()
				if (!response.ok) throw new Error(data.error)
				setResults(data)
			})
			.catch((reason) => setError(reason.message))
			.finally(() => setLoading(false))
	}, [queryReady, router.asPath])

	const locate = () =>
		navigator.geolocation?.getCurrentPosition(
			(position) => {
				setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude })
				setLocationName('현재 위치 기준')
			},
			() => {
				setLocation(SEOUL)
				setLocationName('위치 권한 없음 · 성수동 기준')
			}
		)

	async function searchLocation() {
		if (!locationQuery.trim()) return setError('지역이나 장소 이름을 입력해 주세요.')
		setError('')
		const response = await fetch(`/api/places/search?q=${encodeURIComponent(locationQuery)}`),
			data = await response.json()
		if (!response.ok) return setError(data.error)
		const places: PlaceSearchResult[] = data.places || []
		if (!places.length) return setError('검색된 장소가 없어요.')
		const first = places[0]
		setLocation({ latitude: first.latitude, longitude: first.longitude })
		setLocationName(`${first.name} 기준`)
		setPlaceResults(places.slice(1, 5))
	}

	async function discover() {
		const emotion = unsure ? inferredEmotion[currentState] : desiredEmotion
		if (unsure && !currentState) return setError('지금 상태를 하나 골라 주세요.')
		if (!emotion) return setError('원하는 감정을 먼저 골라 주세요.')
		setLoading(true)
		setError('')
		const params = new URLSearchParams({
			desiredEmotion: emotion,
			startWithinMinutes: String(startWithinMinutes),
			maxDistanceKm: String(maxDistanceKm),
			latitude: String(location.latitude),
			longitude: String(location.longitude),
		})
		if (currentState) params.set('currentState', currentState)
		if (unsure) params.set('emotionMode', 'unsure')
		if (maxBudget) params.set('maxBudget', maxBudget)
		sessionStorage.setItem(
			'discovery-intent',
			JSON.stringify({
				desiredEmotion: emotion,
				currentState,
				startWithinMinutes,
				maxDistanceKm,
				maxBudget: maxBudget ? Number(maxBudget) : undefined,
			})
		)
		await router.replace(`/?${params}`, undefined, { shallow: true })
		try {
			const response = await fetch(`/api/discovery/recommendations?${params}`),
				data = await response.json()
			if (!response.ok) throw new Error(data.error)
			setResults(data)
			window.setTimeout(
				() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }),
				0
			)
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : '추천을 불러오지 못했습니다.')
		} finally {
			setLoading(false)
		}
	}

	const displayed = useMemo(
		() => (showAll ? results?.all || [] : results?.recommended || []),
		[results, showAll]
	)
	return (
		<AppShell>
			<Head>
				<title>틈 — 지금 가능한 감정 경험</title>
			</Head>
			<section className='bg-gradient-to-b from-[#e9f6d9] to-paper px-5 py-14 md:py-24'>
				<div className='mx-auto max-w-5xl'>
					<p className='mb-3 font-bold text-leaf'>
						검색하다 지치기 전에, 지금의 나에게 맞는 한 가지
					</p>
					<h1 className='max-w-3xl text-4xl font-black leading-tight md:text-6xl'>
						어떤 감정을
						<br />
						느끼고 싶나요?
					</h1>
					<p className='mt-5 max-w-2xl text-ink/60'>
						원하는 감정과 오늘 비어 있는 좌석을 연결해, 몇 분 뒤 바로 시작할 경험을 찾아드려요.
					</p>
					<div className='mt-10 space-y-8 rounded-[2rem] bg-white p-6 shadow-xl md:p-10'>
						<fieldset>
							<legend className='text-xl font-black'>어떤 감정이 필요하신가요? *</legend>
							<div className='mt-4 grid grid-cols-2 gap-2 md:grid-cols-3'>
								{emotions.map((item) => (
									<button
										key={item.value}
										type='button'
										onClick={() => {
											setDesiredEmotion(item.value)
											setUnsure(false)
											setCurrentState('')
											setError('')
										}}
										className={`rounded-2xl border p-4 text-left transition ${!unsure && desiredEmotion === item.value ? 'border-leaf bg-mist ring-2 ring-leaf/20' : 'border-black/10 hover:border-leaf/40'}`}
									>
										<span className='text-xl'>{item.emoji}</span>
										<strong className='ml-2'>{item.label}</strong>
									</button>
								))}
								<button
									type='button'
									onClick={() => {
										setUnsure(true)
										setDesiredEmotion('')
										setError('')
									}}
									className={`rounded-2xl border p-4 text-left transition ${unsure ? 'border-leaf bg-mist ring-2 ring-leaf/20' : 'border-dashed border-black/20 hover:border-leaf/40'}`}
								>
									<span className='text-xl'>🤔</span>
									<strong className='ml-2'>잘 모르겠어요</strong>
								</button>
							</div>
						</fieldset>
						{unsure && (
							<fieldset className='rounded-3xl bg-mist/60 p-5 md:p-6'>
								<legend className='sr-only'>지금 상태 선택</legend>
								<h2 className='text-lg font-black'>그렇다면, 지금 상태는 어떤가요? *</h2>
								<p className='mt-1 text-sm text-ink/50'>
									현재 상태를 바탕으로 필요한 감정을 대신 골라드릴게요.
								</p>
								<div className='mt-4 flex flex-wrap gap-2'>
									{currentStates.map((item) => (
										<button
											key={item.value}
											type='button'
											onClick={() => {
												setCurrentState(item.value)
												setError('')
											}}
											className={`rounded-full border px-4 py-2 ${currentState === item.value ? 'border-leaf bg-leaf text-white' : 'border-black/10 bg-white'}`}
										>
											{item.label}
										</button>
									))}
								</div>
							</fieldset>
						)}
						<div className='grid gap-4 md:grid-cols-2'>
							<NumberLineSlider
								label='언제 시작할까요?'
								value={startWithinMinutes}
								options={startWindows}
								onChange={setWindow}
							/>
							<NumberLineSlider
								label='어디까지 이동할까요?'
								value={maxDistanceKm}
								options={distanceOptions}
								onChange={setDistance}
							/>
							<div className='md:col-span-2'>
								<BudgetNumberLine value={maxBudget} onChange={setBudget} />
							</div>
						</div>
						<div>
							<div className='flex flex-wrap items-center gap-3'>
								<button
									type='button'
									onClick={locate}
									className='rounded-full border px-4 py-3 text-sm font-bold'
								>
									◎ {locationName}
								</button>
								<input
									value={locationQuery}
									onChange={(event) => setLocationQuery(event.target.value)}
									placeholder='동네나 장소 직접 검색'
									className='min-w-48 flex-1 rounded-full border px-4 py-3 text-sm'
								/>
								<button
									type='button'
									onClick={searchLocation}
									className='rounded-full border px-4 py-3 text-sm font-bold'
								>
									지역 검색
								</button>
								<button
									type='button'
									onClick={discover}
									disabled={loading}
									className='w-full rounded-full bg-leaf px-7 py-4 font-black text-white disabled:opacity-50 md:w-auto'
								>
									{loading ? '빈자리 찾는 중…' : '지금 가능한 경험 찾기'}
								</button>
							</div>
							{placeResults.length > 0 && (
								<div className='mt-3 grid gap-2 md:grid-cols-2'>
									{placeResults.map((place) => (
										<button
											key={place.id}
											type='button'
											onClick={() => {
												setLocation({ latitude: place.latitude, longitude: place.longitude })
												setLocationName(`${place.name} 기준`)
												setPlaceResults([])
											}}
											className='rounded-xl border p-3 text-left text-sm'
										>
											<strong>{place.name}</strong>
											<span className='ml-2 text-ink/45'>{place.roadAddress || place.address}</span>
										</button>
									))}
								</div>
							)}
						</div>
						{error && <p className='text-sm font-bold text-coral'>{error}</p>}
					</div>
				</div>
			</section>
			{results && (
				<section id='results' className='mx-auto max-w-6xl px-5 py-16'>
					<div className='flex flex-wrap items-end justify-between gap-4'>
						<div>
							<p className='font-bold text-leaf'>지금 예약할 수 있어요</p>
							<h2 className='mt-1 text-3xl font-black'>
								오늘의 추천 {results.recommended.length}개
							</h2>
						</div>
						<div className='flex gap-2'>
							<button
								onClick={() => setShowMap(!showMap)}
								className='rounded-full border px-4 py-2 font-bold'
							>
								지도에서 보기
							</button>
							<button
								onClick={() => setShowAll(!showAll)}
								className='rounded-full border px-4 py-2 font-bold'
							>
								{showAll ? '추천만 보기' : `전체 ${results.all.length}개`}
							</button>
						</div>
					</div>
					{showMap && (
						<div className='mt-8'>
							<MapCanvas
								experiences={results.all}
								onSelect={(item) => void router.push(`/experiences/${item.id}`)}
							/>
						</div>
					)}
					<div className='mt-8 grid gap-5 md:grid-cols-3'>
						{displayed.map((item, index) => (
							<RecommendationCard
								key={item.id}
								experience={item}
								rank={showAll ? undefined : index + 1}
							/>
						))}
					</div>
					{!displayed.length && (
						<div className='mt-8 rounded-3xl bg-white p-10 text-center'>
							<h3 className='font-black'>조건에 맞는 빈자리가 아직 없어요.</h3>
							<p className='mt-2 text-ink/60'>거리나 시작 시간을 넓혀 다시 찾아보세요.</p>
						</div>
					)}
				</section>
			)}
		</AppShell>
	)
}
