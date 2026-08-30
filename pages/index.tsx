import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { RecommendationCard } from '@/components/discovery/RecommendationCard'
import { EmotionOptionButton } from '@/components/discovery/EmotionOptionButton'
import { ActivityTimeRange, NumberLineSlider } from '@/components/discovery/NumberLineSlider'
import { CourseWishlistBar } from '@/components/course/CourseWishlistBar'
import { useCourseWishlist } from '@/components/course/useCourseWishlist'
import { AppShell } from '@/components/layout/AppShell'
import MapCanvas from '@/components/map/MapCanvas'
import { readDiscoveryView, writeDiscoveryView } from '@/lib/course-storage'
import {
	currentStates,
	emotions,
	type DiscoveryIntent,
	type EmotionValue,
	type ExperienceRecommendation,
	type PlaceSearchResult,
} from '@/types/domain'

const FALLBACK_LOCATION = { latitude: 37.4812071, longitude: 126.9527294 }
const PAGE_SIZE = 12
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

const emotionValues = new Set<EmotionValue>(emotions.map((emotion) => emotion.value))

function parseDesiredEmotions(
	value: string | string[] | undefined,
	legacyValue?: string | string[]
) {
	const raw = Array.isArray(value) ? value.join(',') : value || legacyValue || ''
	return [
		...new Set(
			String(raw)
				.split(',')
				.filter((emotion): emotion is EmotionValue => emotionValues.has(emotion as EmotionValue))
		),
	].slice(0, 2)
}

function readStoredDiscoveryIntent() {
	try {
		return JSON.parse(
			sessionStorage.getItem('discovery-intent') || 'null'
		) as DiscoveryIntent | null
	} catch {
		return null
	}
}

export default function Home() {
	const router = useRouter()
	const wishlist = useCourseWishlist()
	const [currentState, setCurrentState] = useState('')
	const [desiredEmotions, setDesiredEmotions] = useState<EmotionValue[]>([])
	const [unsure, setUnsure] = useState(false)
	const [availableFromMinutes, setAvailableFrom] = useState(0)
	const [availableUntilMinutes, setAvailableUntil] = useState(180)
	const [maxDistanceKm, setDistance] = useState(3)
	const [location, setLocation] = useState(FALLBACK_LOCATION)
	const [locationName, setLocationName] = useState('위치 확인 중…')
	const [locationQuery, setLocationQuery] = useState('')
	const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([])
	const [results, setResults] = useState<{
		items: ExperienceRecommendation[]
		total: number
		nextOffset: number | null
	} | null>(null)
	const [loading, setLoading] = useState(false)
	const [loadingMore, setLoadingMore] = useState(false)
	const [error, setError] = useState('')
	const [showMap, setShowMap] = useState(false)
	const [filtersCollapsed, setFiltersCollapsed] = useState(false)
	const mapLoadAttempted = useRef(false)
	const restored = useRef(false)
	const restoreScroll = useRef<number | null>(null)
	const resultSentinel = useRef<HTMLDivElement | null>(null)
	const activeRecommendationParams = useRef('')
	const requestSerial = useRef(0)
	const pendingResultScroll = useRef(false)
	const queryReady =
		router.isReady &&
		(typeof router.query.desiredEmotions === 'string' ||
			typeof router.query.desiredEmotion === 'string')
	const mapRequested = router.isReady && router.query.view === 'map'
	const activeEmotionLabels = (
		unsure
			? inferredEmotion[currentState]
				? [inferredEmotion[currentState]]
				: []
			: desiredEmotions
	)
		.map((value) => emotions.find((emotion) => emotion.value === value)?.label)
		.filter(Boolean)

	useEffect(() => {
		if (!mapRequested) return
		setShowMap(true)

		if (results) {
			window.setTimeout(
				() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }),
				0
			)
		}
	}, [mapRequested, results])

	async function loadRecommendationPages(params: URLSearchParams, targetCount = PAGE_SIZE) {
		const serial = ++requestSerial.current
		const baseParams = params.toString()
		activeRecommendationParams.current = baseParams
		setLoading(true)
		setError('')
		try {
			const items: ExperienceRecommendation[] = []
			let total = 0
			let nextOffset: number | null = 0
			do {
				const pageParams = new URLSearchParams(baseParams)
				pageParams.set('offset', String(nextOffset))
				pageParams.set('limit', String(PAGE_SIZE))
				const response = await fetch(`/api/discovery/recommendations?${pageParams}`)
				const data = await response.json()
				if (!response.ok) throw new Error(data.error)
				for (const item of data.items as ExperienceRecommendation[]) {
					if (!items.some((current) => current.id === item.id)) items.push(item)
				}
				total = data.total
				nextOffset = data.nextOffset
			} while (nextOffset !== null && items.length < targetCount)
			if (serial !== requestSerial.current) return
			setResults({ items, total, nextOffset })
			setFiltersCollapsed(true)
		} catch (reason) {
			if (serial !== requestSerial.current) return
			setError(reason instanceof Error ? reason.message : '추천을 불러오지 못했습니다.')
		} finally {
			if (serial === requestSerial.current) setLoading(false)
		}
	}

	async function loadMoreResults() {
		if (!results?.nextOffset || loadingMore || !activeRecommendationParams.current) return
		setLoadingMore(true)
		try {
			const params = new URLSearchParams(activeRecommendationParams.current)
			params.set('offset', String(results.nextOffset))
			params.set('limit', String(PAGE_SIZE))
			const response = await fetch(`/api/discovery/recommendations?${params}`)
			const data = await response.json()
			if (!response.ok) throw new Error(data.error)
			setResults((current) => {
				if (!current) return data
				const ids = new Set(current.items.map((item) => item.id))
				const nextItems = (data.items as ExperienceRecommendation[]).filter(
					(item) => !ids.has(item.id)
				)
				return {
					items: [...current.items, ...nextItems],
					total: data.total,
					nextOffset: data.nextOffset,
				}
			})
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : '다음 순간을 불러오지 못했습니다.')
		} finally {
			setLoadingMore(false)
		}
	}

	useEffect(() => {
		const target = resultSentinel.current
		if (!target || results?.nextOffset === null || loadingMore) return
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) void loadMoreResults()
			},
			{ rootMargin: '300px' }
		)
		observer.observe(target)
		return () => observer.disconnect()
	}, [loadingMore, results?.nextOffset]) // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!mapRequested || queryReady || results || mapLoadAttempted.current) return
		mapLoadAttempted.current = true

		const params = new URLSearchParams({
			desiredEmotion: 'CALM',
			availableFromMinutes: '0',
			availableUntilMinutes: '1440',
			maxDistanceKm: '30',
			latitude: String(FALLBACK_LOCATION.latitude),
			longitude: String(FALLBACK_LOCATION.longitude),
		})

		void loadRecommendationPages(params)
	}, [mapRequested, queryReady, results])

	// Every discovery input is represented in asPath, so a shared URL restores the same result.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		if (!queryReady) return
		const desired = parseDesiredEmotions(router.query.desiredEmotions, router.query.desiredEmotion)
		const legacyWindow = Number(router.query.startWithinMinutes || 180)
		const nextFrom = Number(router.query.availableFromMinutes || 0)
		const nextUntil = Number(router.query.availableUntilMinutes || legacyWindow)
		const nextDistance = Number(router.query.maxDistanceKm || 3)
		const nextLocation = {
			latitude: Number(router.query.latitude || FALLBACK_LOCATION.latitude),
			longitude: Number(router.query.longitude || FALLBACK_LOCATION.longitude),
		}
		setDesiredEmotions(desired)
		setUnsure(router.query.emotionMode === 'unsure')
		setCurrentState(String(router.query.currentState || ''))
		setAvailableFrom(nextFrom)
		setAvailableUntil(nextUntil)
		setDistance(nextDistance)
		setLocation(nextLocation)
		const params = new URLSearchParams({
			desiredEmotion: desired[0],
			desiredEmotions: desired.join(','),
			availableFromMinutes: String(nextFrom),
			availableUntilMinutes: String(nextUntil),
			maxDistanceKm: String(nextDistance),
			latitude: String(nextLocation.latitude),
			longitude: String(nextLocation.longitude),
		})
		const view = readDiscoveryView()
		const targetCount =
			view?.returnUrl === router.asPath
				? Math.max(PAGE_SIZE, view.loadedResultCount || 0)
				: PAGE_SIZE
		void loadRecommendationPages(params, targetCount)
	}, [queryReady, router.asPath])

	const locate = () => {
		if (!navigator.geolocation) {
			setLocation(FALLBACK_LOCATION)
			setLocationName('서울대입구역 기준')
			return
		}
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude })
				setLocationName('현재 위치 주변')
			},
			() => {
				setLocation(FALLBACK_LOCATION)
				setLocationName('위치 권한 없음 · 서울대입구역 기준')
			}
		)
	}

	useEffect(() => {
		if (!router.isReady || router.query.latitude || restored.current) return
		locate()
	}, [router.isReady]) // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!router.isReady || restored.current) return
		const view = readDiscoveryView()
		if (!view || router.asPath !== view.returnUrl) return
		restored.current = true
		setShowMap(view.showMap)
		setLocationName(view.locationName)
		restoreScroll.current = view.scrollY
	}, [router.asPath, router.isReady])

	useEffect(() => {
		if (!results || restoreScroll.current == null) return
		const y = restoreScroll.current
		restoreScroll.current = null
		window.setTimeout(() => window.scrollTo({ top: y }), 0)
	}, [results])

	useEffect(() => {
		if (!results || !pendingResultScroll.current) return
		pendingResultScroll.current = false
		window.setTimeout(
			() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }),
			0
		)
	}, [results])

	async function searchLocation() {
		if (!locationQuery.trim()) return setError('지역이나 장소 이름을 입력해 주세요.')
		setError('')
		setPlaceResults([])
		const response = await fetch(`/api/places/search?q=${encodeURIComponent(locationQuery)}`),
			data = await response.json()
		if (!response.ok) return setError(data.error)
		const places: PlaceSearchResult[] = data.places || []
		if (!places.length) return setError('검색된 장소가 없어요.')
		setPlaceResults(places.slice(0, 6))
	}

	async function discover() {
		const selectedEmotions = unsure
			? inferredEmotion[currentState]
				? [inferredEmotion[currentState]]
				: []
			: desiredEmotions
		if (unsure && !currentState) return setError('지금 상태를 하나 골라 주세요.')
		if (!selectedEmotions.length) return setError('원하는 감정을 먼저 골라 주세요.')
		setError('')
		const params = new URLSearchParams({
			desiredEmotion: selectedEmotions[0],
			desiredEmotions: selectedEmotions.join(','),
			availableFromMinutes: String(availableFromMinutes),
			availableUntilMinutes: String(availableUntilMinutes),
			maxDistanceKm: String(maxDistanceKm),
			latitude: String(location.latitude),
			longitude: String(location.longitude),
		})
		if (currentState) params.set('currentState', currentState)
		if (unsure) params.set('emotionMode', 'unsure')
		sessionStorage.setItem(
			'discovery-intent',
			JSON.stringify({
				desiredEmotion: selectedEmotions[0],
				desiredEmotions: selectedEmotions,
				currentState,
				availableFromMinutes,
				availableUntilMinutes,
				maxDistanceKm,
				latitude: location.latitude,
				longitude: location.longitude,
			})
		)
		if (mapRequested) params.set('view', 'map')
		pendingResultScroll.current = true
		const targetUrl = `/?${params}`
		if (router.asPath === targetUrl) await loadRecommendationPages(params)
		else await router.replace(targetUrl, undefined, { shallow: true })
	}

	function rememberDiscoveryView() {
		const selectedEmotions = unsure
			? inferredEmotion[currentState]
				? [inferredEmotion[currentState]]
				: []
			: desiredEmotions
		if (!selectedEmotions.length) return
		writeDiscoveryView({
			intent: {
				desiredEmotion: selectedEmotions[0],
				desiredEmotions: selectedEmotions,
				currentState: currentState || undefined,
				availableFromMinutes,
				availableUntilMinutes,
				maxDistanceKm,
				latitude: location.latitude,
				longitude: location.longitude,
			},
			currentState,
			emotionMode: unsure ? 'unsure' : 'direct',
			locationName,
			showMap,
			loadedResultCount: results?.items.length || PAGE_SIZE,
			scrollY: window.scrollY,
			returnUrl: router.asPath,
		})
	}

	function createCourse() {
		const selectedEmotions = unsure
			? inferredEmotion[currentState]
				? [inferredEmotion[currentState]]
				: []
			: desiredEmotions
		const savedView = readDiscoveryView()
		const storedIntent = savedView?.intent || readStoredDiscoveryIntent()
		const intent: DiscoveryIntent | null = selectedEmotions.length
			? {
					desiredEmotion: selectedEmotions[0],
					desiredEmotions: selectedEmotions,
					currentState: currentState || undefined,
					availableFromMinutes,
					availableUntilMinutes,
					maxDistanceKm,
					latitude: location.latitude,
					longitude: location.longitude,
				}
			: storedIntent
		if (!intent) {
			setError('먼저 감정과 시간대를 선택해 경험을 찾아 주세요.')
			return
		}
		sessionStorage.setItem('discovery-intent', JSON.stringify(intent))
		writeDiscoveryView({
			intent,
			currentState: selectedEmotions.length
				? currentState
				: savedView?.currentState || intent.currentState || '',
			emotionMode: selectedEmotions.length
				? unsure
					? 'unsure'
					: 'direct'
				: savedView?.emotionMode || 'direct',
			locationName: selectedEmotions.length
				? locationName
				: savedView?.locationName || '저장된 검색 위치',
			showMap: selectedEmotions.length ? showMap : savedView?.showMap || false,
			loadedResultCount: results?.items.length || PAGE_SIZE,
			scrollY: window.scrollY,
			returnUrl: selectedEmotions.length ? router.asPath : savedView?.returnUrl || router.asPath,
		})
		void router.push('/course')
	}

	return (
		<AppShell>
			<Head>
				<title>grabit — 지금 가능한 감정의 순간</title>
			</Head>
			<section className='light-hero px-5 py-14 md:py-24'>
				<div className='mx-auto max-w-5xl'>
					<p className='mb-1 text-lg font-black tracking-tight text-ink'>grabit</p>
					{/* <p className='mb-3 font-bold text-brand'>
						검색하다 지치기 전에, 지금의 나에게 맞는 오늘의 움직임
					</p> */}
					<h1 className='max-w-3xl text-4xl font-black leading-tight md:text-6xl '>
						어떤 감정을
						<br />
						느끼고 싶나요?
					</h1>
					<p className='mt-5 max-w-2xl text-ink/60'>
						원하는 감정과 비어 있는 좌석을 연결해, 순간순간들을 잡고, 짧은 궤적을 만들어드려요.
					</p>
					<div
						className={`search-panel-collapse ${filtersCollapsed && results ? 'is-collapsed' : ''}`}
						aria-hidden={filtersCollapsed && Boolean(results)}
					>
						<div className='search-panel-overflow'>
							<div className='space-y-8 rounded-[2rem] border border-white/80 bg-white p-6 md:p-10'>
								<fieldset>
									{(desiredEmotions.length > 0 || unsure || currentState) && (
										<div className='mb-4 flex min-h-6 items-center justify-between gap-3'>
											{!unsure && desiredEmotions.length > 0 ? (
												<span className='text-sm font-black text-brand'>
													{desiredEmotions.length}/2 선택
												</span>
											) : (
												<span />
											)}
											<button
												type='button'
												onClick={() => {
													setDesiredEmotions([])
													setUnsure(false)
													setCurrentState('')
													setError('')
												}}
												className='text-sm font-bold text-ink/45 underline decoration-ink/25 underline-offset-4 hover:text-ink'
											>
												선택 초기화
											</button>
										</div>
									)}
									<div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
										{emotions.map((item) => (
											<EmotionOptionButton
												key={item.value}
												label={item.label}
												selected={!unsure && desiredEmotions.includes(item.value)}
												onClick={() => {
													if (desiredEmotions.includes(item.value)) {
														setDesiredEmotions((current) =>
															current.filter((emotion) => emotion !== item.value)
														)
													} else if (desiredEmotions.length < 2) {
														setDesiredEmotions((current) => [...current, item.value])
													} else {
														setError('감정은 2개까지 선택할 수 있어요.')
														return
													}
													setUnsure(false)
													setCurrentState('')
													setError('')
												}}
											/>
										))}
										<EmotionOptionButton
											label='잘 모르겠어요'
											selected={unsure}
											dashed
											className='col-span-2 md:col-span-1'
											onClick={() => {
												setUnsure(true)
												setDesiredEmotions([])
												setError('')
											}}
										/>
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
													className={`btn-chip rounded-full px-4 py-2 ${currentState === item.value ? 'btn-chip-selected' : ''}`}
												>
													{item.label}
												</button>
											))}
										</div>
									</fieldset>
								)}
								<div className='grid gap-4'>
									<div>
										<ActivityTimeRange
											fromMinutes={availableFromMinutes}
											untilMinutes={availableUntilMinutes}
											onChange={(from, until) => {
												setAvailableFrom(from)
												setAvailableUntil(until)
											}}
										/>
									</div>
									<NumberLineSlider
										label='어디까지 이동할까요?'
										value={maxDistanceKm}
										options={distanceOptions}
										onChange={setDistance}
									/>
								</div>
								<div>
									<form
										onSubmit={(event) => {
											event.preventDefault()
											void searchLocation()
										}}
										className='flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center'
									>
										<button
											type='button'
											onClick={locate}
											className='btn-secondary w-full rounded-full px-4 py-3 text-sm font-bold md:w-auto'
										>
											◎ {locationName}
										</button>
										<div className='flex min-w-0 gap-3 md:contents'>
											<input
												value={locationQuery}
												onChange={(event) => setLocationQuery(event.target.value)}
												placeholder='동네·역·장소 검색'
												className='min-w-0 flex-1 rounded-full border border-action/30 px-4 py-3 text-sm transition focus:border-action focus:ring-2 focus:ring-action/20 md:min-w-48'
											/>
											<button
												type='submit'
												className='btn-secondary shrink-0 rounded-full px-4 py-3 text-sm font-bold'
											>
												검색
											</button>
										</div>
										<button
											type='button'
											onClick={discover}
											disabled={loading}
											className='btn-primary w-full rounded-full px-7 py-4 font-black md:w-auto'
										>
											{loading ? '빈자리 찾는 중…' : '지금 가능한 순간 찾기'}
										</button>
									</form>
									{placeResults.length > 0 && (
										<div className='mt-3 grid gap-2 md:grid-cols-2'>
											{placeResults.map((place) => (
												<button
													key={place.id}
													type='button'
													onClick={() => {
														setLocation({ latitude: place.latitude, longitude: place.longitude })
														setLocationName(`${place.name} 기준`)
														setLocationQuery('')
														setPlaceResults([])
														setError('')
													}}
													className='btn-secondary w-full justify-start rounded-xl p-3 text-left text-sm'
												>
													<strong>{place.name}</strong>
													<span className='ml-2 text-ink/45'>
														{place.roadAddress || place.address}
													</span>
												</button>
											))}
										</div>
									)}
								</div>
								{error && <p className='text-sm font-bold text-coral'>{error}</p>}
							</div>
						</div>
					</div>
					{filtersCollapsed && results && (
						<div className='search-summary-enter mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm'>
							<div className='min-w-0'>
								<p className='text-xs font-bold text-brand'>현재 검색 조건</p>
								<p className='mt-1 truncate text-sm font-black'>
									{activeEmotionLabels.join(' · ')} · {maxDistanceKm}km · {locationName}
								</p>
							</div>
							<button
								type='button'
								onClick={() => setFiltersCollapsed(false)}
								className='btn-secondary shrink-0 rounded-full px-4 py-2 text-sm font-bold'
							>
								검색 조건 수정
							</button>
						</div>
					)}
				</div>
			</section>
			{results && (
				<section id='results' className='px-5 py-16'>
					<div className='mx-auto max-w-5xl'>
						<div className='flex flex-wrap items-end justify-between gap-4'>
							<div>
								<p className='font-bold text-brand'>지금 예약할 수 있어요</p>
								<h2 className='mt-1 text-3xl font-black'>지금 가능한 순간 {results.total}개</h2>
								<p className='mt-2 text-sm text-ink/55'>
									별을 눌러 마음에 드는 순간을 잡아 보세요.
								</p>
							</div>
							<button
								onClick={() => setShowMap(!showMap)}
								className='btn-secondary rounded-full px-4 py-2 font-bold'
							>
								{showMap ? '지도 접기' : '지도에서 보기'}
							</button>
						</div>
						{showMap && (
							<div className='mt-8'>
								<MapCanvas
									experiences={results.items}
									onSelect={(item) => {
										rememberDiscoveryView()
										void router.push({
											pathname: `/experiences/${item.id}`,
											query: { returnTo: router.asPath },
										})
									}}
								/>
							</div>
						)}
						<div className='mt-8 grid gap-5 md:grid-cols-3'>
							{results.items.map((item) => (
								<RecommendationCard
									key={item.id}
									experience={item}
									wished={wishlist.wishIds.includes(item.id)}
									desiredEmotions={desiredEmotions}
									onToggleWish={() => wishlist.toggle(item.id)}
									onOpen={rememberDiscoveryView}
									returnTo={router.asPath}
								/>
							))}
						</div>
						{!results.items.length && (
							<div className='mt-8 rounded-3xl bg-white p-10 text-center'>
								<h3 className='font-black'>조건에 맞는 빈자리가 아직 없어요.</h3>
								<p className='mt-2 text-ink/60'>거리나 가능한 시간대를 넓혀 다시 찾아보세요.</p>
							</div>
						)}
						{results.items.length > 0 && (
							<div ref={resultSentinel} className='py-8 text-center text-sm text-ink/50'>
								{loadingMore
									? '다음 순간을 불러오는 중…'
									: results.nextOffset === null
										? '조건에 맞는 순간을 모두 확인했어요.'
										: '아래로 내리면 더 보여드려요.'}
							</div>
						)}
					</div>
				</section>
			)}
			<CourseWishlistBar
				wishIds={wishlist.wishIds}
				experiences={results?.items || []}
				onRemove={wishlist.remove}
				onClear={wishlist.clear}
				onCreate={createCourse}
			/>
		</AppShell>
	)
}
