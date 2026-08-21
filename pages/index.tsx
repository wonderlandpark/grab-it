import Head from 'next/head'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import DiscoverySidebar from '@/components/map/DiscoverySidebar'
import EmotionFilter from '@/components/map/EmotionFilter'
import ExperiencePreview from '@/components/map/ExperiencePreview'
import MapCanvas, { type MapPoint, type MapViewport } from '@/components/map/MapCanvas'
import { type EmotionValue, type MapExperience } from '@/types/domain'

const INITIAL_VIEWPORT: MapViewport = {
	west: 126.86,
	south: 37.4815,
	east: 127.098,
	north: 37.6515,
}

function parseExperiences(payload: unknown): MapExperience[] {
	if (Array.isArray(payload)) return payload as MapExperience[]
	if (payload && typeof payload === 'object') {
		const data = payload as { experiences?: unknown; items?: unknown }
		if (Array.isArray(data.experiences)) return data.experiences as MapExperience[]
		if (Array.isArray(data.items)) return data.items as MapExperience[]
	}
	throw new Error('지도 경험 응답 형식이 올바르지 않습니다.')
}

export default function DiscoveryPage() {
	const [selectedEmotions, setSelectedEmotions] = useState<EmotionValue[]>([])
	const [experiences, setExperiences] = useState<MapExperience[]>([])
	const [selectedExperience, setSelectedExperience] = useState<MapExperience | null>(null)
	const [viewport, setViewport] = useState<MapViewport>(INITIAL_VIEWPORT)
	const [userLocation, setUserLocation] = useState<MapPoint | null>(null)
	const [locationMessage, setLocationMessage] = useState('')
	const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
		'idle',
	)
	const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading')
	const [retryToken, setRetryToken] = useState(0)

	const handleViewportChange = useCallback((nextViewport: MapViewport) => {
		setViewport((current) => {
			const unchanged = (Object.keys(current) as Array<keyof MapViewport>).every(
				(key) => Math.abs(current[key] - nextViewport[key]) < 0.00001,
			)
			return unchanged ? current : nextViewport
		})
	}, [])

	const handleExperienceSelect = useCallback((experience: MapExperience) => {
		setSelectedExperience(experience)
	}, [])

	useEffect(() => {
		const controller = new AbortController()
		const timer = window.setTimeout(() => {
			const parameters = new URLSearchParams({
				west: String(viewport.west),
				south: String(viewport.south),
				east: String(viewport.east),
				north: String(viewport.north),
			})
			if (selectedEmotions.length > 0) {
				parameters.set('emotions', selectedEmotions.join(','))
			}

			setStatus('loading')
			fetch(`/api/map/experiences?${parameters.toString()}`, { signal: controller.signal })
				.then(async (response) => {
					if (!response.ok) throw new Error('경험 목록을 불러오지 못했습니다.')
					return parseExperiences(await response.json())
				})
				.then((items) => {
					setExperiences(items)
					setSelectedExperience((current) =>
						current && items.some((item) => item.id === current.id) ? current : null,
					)
					setStatus('idle')
				})
				.catch((error: unknown) => {
					if (error instanceof DOMException && error.name === 'AbortError') return
					setStatus('error')
				})
		}, 250)

		return () => {
			window.clearTimeout(timer)
			controller.abort()
		}
	}, [retryToken, selectedEmotions, viewport])

	const findCurrentLocation = () => {
		if (locationStatus === 'loading') return
		setLocationStatus('loading')
		setLocationMessage('현재 위치를 찾고 있어요.')
		if (!navigator.geolocation) {
			setLocationStatus('error')
			setLocationMessage('이 브라우저에서는 위치 찾기를 사용할 수 없어요.')
			return
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const point = {
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				}
				setUserLocation(point)
				setViewport({
					west: point.longitude - 0.12,
					south: point.latitude - 0.085,
					east: point.longitude + 0.12,
					north: point.latitude + 0.085,
				})
				setLocationStatus('success')
				setLocationMessage('현재 위치로 이동했어요.')
			},
			() => {
				setLocationStatus('error')
				setLocationMessage('위치 권한을 허용하면 내 주변 경험을 볼 수 있어요.')
			},
			{ enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
		)
	}

	return (
		<>
			<Head>
				<title>마음지도 — 감정으로 발견하는 장소</title>
				<meta
					name="description"
					content="원하는 감정을 고르고, 다른 사람의 경험이 머문 장소를 지도에서 발견하세요."
				/>
				<meta name="theme-color" content="#f7f4ed" />
			</Head>

			<main className="fixed inset-0 flex overflow-hidden bg-paper font-sans text-ink">
				<DiscoverySidebar
					experiences={experiences}
					selectedEmotions={selectedEmotions}
					selectedExperience={selectedExperience}
					onEmotionsChange={setSelectedEmotions}
					onExperienceSelect={handleExperienceSelect}
					status={status}
					onRetry={() => setRetryToken((token) => token + 1)}
				/>

				<section className="relative min-w-0 flex-1" aria-label="지도 탐색">
					<MapCanvas
						experiences={experiences}
						selectedExperience={selectedExperience}
						userLocation={userLocation}
						onExperienceSelect={handleExperienceSelect}
						onViewportChange={handleViewportChange}
					/>

					<div className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-white/95 via-white/70 to-transparent pb-8 lg:hidden">
						<div className="pointer-events-auto flex items-center justify-between px-4 pb-1 pt-[max(1rem,env(safe-area-inset-top))]">
							<Link
								href="/"
								className="flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-leaf/40"
							>
								<span className="flex h-7 w-7 items-center justify-center rounded-xl bg-leaf text-white">
									<span aria-hidden="true">⌁</span>
								</span>
								<span className="text-sm font-black">마음지도</span>
							</Link>
							<Link
								href="/me"
								aria-label="마이페이지"
								className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-leaf/40"
							>
								<span aria-hidden="true">☺</span>
							</Link>
						</div>
						<div className="pointer-events-auto">
							<EmotionFilter
								selected={selectedEmotions}
								onChange={setSelectedEmotions}
								compact
							/>
						</div>
					</div>

					<div className="absolute right-4 top-40 z-30 flex flex-col items-end gap-2 lg:right-5 lg:top-5">
						<button
							type="button"
							onClick={findCurrentLocation}
							aria-label="현재 위치로 이동"
							aria-busy={locationStatus === 'loading'}
							disabled={locationStatus === 'loading'}
							className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/70 bg-white/95 px-4 text-sm font-bold text-ink shadow-lg backdrop-blur transition hover:bg-white disabled:cursor-wait disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:ring-offset-2"
						>
							<span
								aria-hidden="true"
								className={locationStatus === 'loading' ? 'animate-pulse' : ''}
							>
								◎
							</span>
							{locationStatus === 'loading' ? '찾는 중' : '내 위치'}
						</button>
						{locationStatus !== 'idle' && locationMessage ? (
							<p
								className={`max-w-64 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur ${
									locationStatus === 'error' ? 'text-coral' : 'text-slate-600'
								}`}
								aria-live="polite"
							>
								{locationMessage}
							</p>
						) : null}
					</div>

					{status === 'loading' && experiences.length > 0 ? (
						<div
							className="absolute left-1/2 top-36 z-20 -translate-x-1/2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-slate-500 shadow backdrop-blur lg:top-5"
							aria-live="polite"
						>
							지도를 살펴보는 중…
						</div>
					) : null}

					{status === 'error' && experiences.length > 0 ? (
						<button
							type="button"
							onClick={() => setRetryToken((token) => token + 1)}
							className="absolute left-1/2 top-36 z-20 -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-coral shadow-lg focus:outline-none focus:ring-2 focus:ring-coral/40 lg:top-5"
						>
							업데이트 실패 · 다시 시도
						</button>
					) : null}

					{selectedExperience ? (
						<ExperiencePreview
							experience={selectedExperience}
							onClose={() => setSelectedExperience(null)}
							className="absolute inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-40 md:left-auto md:right-5 md:w-[400px] lg:bottom-5 lg:left-5 lg:right-auto"
						/>
					) : (
						<>
							{status === 'error' && experiences.length === 0 ? (
								<div className="absolute inset-x-4 bottom-24 z-30 rounded-2xl bg-white/95 p-4 text-center shadow-xl backdrop-blur lg:hidden">
									<p className="text-sm font-bold">경험을 불러오지 못했어요</p>
									<button
										type="button"
										onClick={() => setRetryToken((token) => token + 1)}
										className="mt-2 text-sm font-bold text-leaf underline underline-offset-4"
									>
										다시 시도
									</button>
								</div>
							) : null}
							<Link
								href="/experiences/new"
								className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-30 flex items-center gap-2 rounded-full bg-ink px-5 py-3.5 text-sm font-bold text-white shadow-xl transition hover:bg-leaf focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:ring-offset-2 lg:hidden"
							>
								<span aria-hidden="true">＋</span> 기록하기
							</Link>
						</>
					)}
				</section>
			</main>
		</>
	)
}
