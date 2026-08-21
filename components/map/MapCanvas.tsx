import { useEffect, useMemo, useRef, useState } from 'react'
import { emotions, type MapExperience } from '@/types/domain'

export interface MapViewport {
	west: number
	south: number
	east: number
	north: number
}

export interface MapPoint {
	latitude: number
	longitude: number
}

interface MapCanvasProps {
	experiences: MapExperience[]
	selectedExperience: MapExperience | null
	userLocation: MapPoint | null
	onExperienceSelect: (experience: MapExperience) => void
	onViewportChange: (viewport: MapViewport) => void
}

interface NaverCoordinate {
	lat: () => number
	lng: () => number
}

interface NaverBounds {
	getSW: () => NaverCoordinate
	getNE: () => NaverCoordinate
}

interface NaverMapInstance {
	getBounds: () => NaverBounds
	setCenter: (coordinate: unknown) => void
	setMapTypeId: (mapTypeId: string) => void
	destroy?: () => void
}

interface NaverMarkerInstance {
	setMap: (map: NaverMapInstance | null) => void
}

interface NaverEventListener {
	listener: unknown
}

interface NaverMapsApi {
	Map: new (element: HTMLElement, options: Record<string, unknown>) => NaverMapInstance
	LatLng: new (latitude: number, longitude: number) => unknown
	Point: new (x: number, y: number) => unknown
	Marker: new (options: Record<string, unknown>) => NaverMarkerInstance
	MapTypeRegistry: new (mapTypes: Record<string, unknown>) => unknown
	NaverStyleMapTypeOptions: { getVectorMap: () => unknown }
	MapTypeId: { NORMAL: string }
	Event: {
		addListener: (
			target: NaverMapInstance | NaverMarkerInstance,
			eventName: string,
			listener: () => void,
		) => NaverEventListener
		removeListener: (listener: NaverEventListener) => void
	}
}

declare global {
	interface Window {
		naver?: { maps: NaverMapsApi }
	}
}

const NAVER_SCRIPT_ID = 'naver-maps-sdk'
const SEOUL_CENTER = { latitude: 37.5665, longitude: 126.978 }

let sdkPromise: Promise<NaverMapsApi> | null = null

function loadNaverMaps(clientId: string): Promise<NaverMapsApi> {
	if (window.naver?.maps) return Promise.resolve(window.naver.maps)
	if (sdkPromise) return sdkPromise

	sdkPromise = new Promise((resolve, reject) => {
		const existing = document.getElementById(NAVER_SCRIPT_ID) as HTMLScriptElement | null
		const script = existing ?? document.createElement('script')

		const handleLoad = () => {
			if (window.naver?.maps) resolve(window.naver.maps)
			else reject(new Error('네이버 지도 SDK를 초기화하지 못했습니다.'))
		}
		const handleError = () => reject(new Error('네이버 지도 SDK를 불러오지 못했습니다.'))

		script.addEventListener('load', handleLoad, { once: true })
		script.addEventListener('error', handleError, { once: true })

		if (!existing) {
			script.id = NAVER_SCRIPT_ID
			script.async = true
			script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`
			document.head.appendChild(script)
		}
	})

	return sdkPromise
}

function markerGroups(experiences: MapExperience[]) {
	const groups = new Map<string, MapExperience[]>()

	experiences.forEach((experience) => {
		const key = `${experience.latitude.toFixed(3)}:${experience.longitude.toFixed(3)}`
		groups.set(key, [...(groups.get(key) ?? []), experience])
	})

	return Array.from(groups.values())
}

function markerHtml(experience: MapExperience, count: number, selected: boolean) {
	const emotion = emotions.find((item) => item.value === experience.emotions[0]) ?? emotions[0]
	const size = count > 1 ? 46 : 42
	const label = count > 1 ? count : emotion.emoji

	return `<div aria-label="${emotion.label} 경험 ${count}개" style="width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${emotion.color};color:white;font:700 14px sans-serif;border:${selected ? 4 : 3}px solid white;box-shadow:0 5px 16px rgba(39,51,47,.28);transform:${selected ? 'scale(1.14)' : 'scale(1)'};transition:transform .18s ease">${label}</div>`
}

function NaverMap({
	experiences,
	selectedExperience,
	userLocation,
	onExperienceSelect,
	onViewportChange,
}: MapCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const mapRef = useRef<NaverMapInstance | null>(null)
	const apiRef = useRef<NaverMapsApi | null>(null)
	const markersRef = useRef<NaverMarkerInstance[]>([])
	const currentLocationMarkerRef = useRef<NaverMarkerInstance | null>(null)
	const [failed, setFailed] = useState(false)

	useEffect(() => {
		const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
		if (!clientId || !containerRef.current) return

		let cancelled = false
		let idleListener: NaverEventListener | null = null

		loadNaverMaps(clientId)
			.then((maps) => {
				if (cancelled || !containerRef.current) return

				const map = new maps.Map(containerRef.current, {
					center: new maps.LatLng(SEOUL_CENTER.latitude, SEOUL_CENTER.longitude),
					zoom: 12,
					mapTypeId: maps.MapTypeId.NORMAL,
					mapTypes: new maps.MapTypeRegistry({
						normal: maps.NaverStyleMapTypeOptions.getVectorMap(),
					}),
					zoomControl: false,
					mapDataControl: false,
					logoControlOptions: { position: 7 },
				})
				map.setMapTypeId(maps.MapTypeId.NORMAL)
				mapRef.current = map
				apiRef.current = maps

				const publishViewport = () => {
					const bounds = map.getBounds()
					const southwest = bounds.getSW()
					const northeast = bounds.getNE()
					onViewportChange({
						west: southwest.lng(),
						south: southwest.lat(),
						east: northeast.lng(),
						north: northeast.lat(),
					})
				}

				idleListener = maps.Event.addListener(map, 'idle', publishViewport)
				publishViewport()
			})
			.catch(() => {
				if (!cancelled) setFailed(true)
			})

		return () => {
			cancelled = true
			if (idleListener && apiRef.current) apiRef.current.Event.removeListener(idleListener)
			mapRef.current?.destroy?.()
			mapRef.current = null
			apiRef.current = null
		}
	}, [onViewportChange])

	useEffect(() => {
		const map = mapRef.current
		const maps = apiRef.current
		if (!map || !maps) return

		markersRef.current.forEach((marker) => marker.setMap(null))
		markersRef.current = markerGroups(experiences).map((group) => {
			const experience = group[0]
			const marker = new maps.Marker({
				map,
				position: new maps.LatLng(experience.latitude, experience.longitude),
				icon: {
					content: markerHtml(
						experience,
						group.length,
						group.some((item) => item.id === selectedExperience?.id),
					),
					anchor: new maps.Point(21, 21),
				},
				zIndex: group.some((item) => item.id === selectedExperience?.id) ? 100 : 10,
			})
			maps.Event.addListener(marker, 'click', () => onExperienceSelect(experience))
			return marker
		})
	}, [experiences, onExperienceSelect, selectedExperience])

	useEffect(() => {
		const map = mapRef.current
		const maps = apiRef.current
		if (!map || !maps || !userLocation) return

		const coordinate = new maps.LatLng(userLocation.latitude, userLocation.longitude)
		map.setCenter(coordinate)
		currentLocationMarkerRef.current?.setMap(null)
		currentLocationMarkerRef.current = new maps.Marker({
			map,
			position: coordinate,
			icon: {
				content:
					'<div aria-label="현재 위치" style="width:20px;height:20px;border-radius:50%;background:#3579e8;border:4px solid white;box-shadow:0 2px 10px rgba(53,121,232,.45)"></div>',
				anchor: new maps.Point(10, 10),
			},
			zIndex: 200,
		})
	}, [userLocation])

	if (failed) {
		return (
			<MockMap
				{...{ experiences, selectedExperience, userLocation, onExperienceSelect, onViewportChange }}
			/>
		)
	}

	return (
		<div className="absolute inset-0 bg-[#e7ece7]">
			<div ref={containerRef} className="h-full w-full" aria-label="감정 경험 지도" role="region" />
		</div>
	)
}

function MockMap({
	experiences,
	selectedExperience,
	userLocation,
	onExperienceSelect,
}: MapCanvasProps) {
	const groups = useMemo(() => markerGroups(experiences), [experiences])
	const center = userLocation ?? SEOUL_CENTER
	const bounds = {
		west: center.longitude - 0.12,
		east: center.longitude + 0.12,
		south: center.latitude - 0.085,
		north: center.latitude + 0.085,
	}

	const position = (point: MapPoint) => ({
		left: `${Math.max(5, Math.min(95, ((point.longitude - bounds.west) / (bounds.east - bounds.west)) * 100))}%`,
		top: `${Math.max(8, Math.min(92, ((bounds.north - point.latitude) / (bounds.north - bounds.south)) * 100))}%`,
	})

	return (
		<div
			className="absolute inset-0 overflow-hidden bg-[#e5ece5]"
			aria-label="감정 경험 미리보기 지도"
			role="region"
		>
			<div
				className="absolute inset-0 opacity-80"
				style={{
					backgroundImage:
						'linear-gradient(32deg, transparent 46%, rgba(255,255,255,.96) 47%, rgba(255,255,255,.96) 49%, transparent 50%), linear-gradient(112deg, transparent 42%, rgba(255,255,255,.86) 43%, rgba(255,255,255,.86) 46%, transparent 47%), linear-gradient(172deg, transparent 58%, rgba(255,255,255,.8) 59%, rgba(255,255,255,.8) 61%, transparent 62%)',
					backgroundSize: '210px 180px, 280px 240px, 340px 250px',
				}}
			/>
			<svg
				className="absolute inset-0 h-full w-full"
				viewBox="0 0 1000 700"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<path
					d="M-80 510 C 180 390, 360 620, 590 470 S 860 310, 1100 405"
					fill="none"
					stroke="#b7dbe2"
					strokeWidth="58"
				/>
				<path
					d="M-80 510 C 180 390, 360 620, 590 470 S 860 310, 1100 405"
					fill="none"
					stroke="#d4eef2"
					strokeWidth="36"
				/>
				<path d="M80 40 L870 680" stroke="#fff" strokeWidth="15" opacity=".82" />
				<path d="M230 720 L760 -30" stroke="#fff" strokeWidth="10" opacity=".72" />
			</svg>

			<div className="absolute left-[15%] top-[20%] h-28 w-36 rounded-[45%] bg-[#cddfcb]/80" />
			<div className="absolute right-[9%] top-[11%] h-36 w-44 rounded-[50%] bg-[#d3e3cb]/70" />
			<span className="absolute left-[18%] top-[25%] text-xs font-bold tracking-[.2em] text-[#708473]">
				도심 숲
			</span>
			<span className="absolute right-[16%] top-[30%] text-xs font-bold tracking-[.2em] text-[#708473]">
				북쪽 언덕
			</span>

			{groups.map((group) => {
				const experience = group[0]
				const emotion = emotions.find((item) => item.value === experience.emotions[0]) ?? emotions[0]
				const selected = group.some((item) => item.id === selectedExperience?.id)

				return (
					<button
						type="button"
						key={`${experience.latitude}:${experience.longitude}`}
						onClick={() => onExperienceSelect(experience)}
						aria-label={`${experience.placeName ?? '장소'}의 ${emotion.label} 경험${group.length > 1 ? ` ${group.length}개` : ''}`}
						className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white font-bold text-white shadow-lg transition hover:scale-110 focus:outline-none focus:ring-4 focus:ring-white/70 ${
							selected ? 'h-12 w-12 scale-110' : 'h-11 w-11'
						}`}
						style={{ ...position(experience), backgroundColor: emotion.color }}
					>
						{group.length > 1 ? group.length : emotion.emoji}
					</button>
				)
			})}

			{userLocation ? (
				<div
					className="absolute z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-blue-500 shadow-lg shadow-blue-500/40"
					style={position(userLocation)}
					aria-label="현재 위치"
				/>
			) : null}

			<div className="absolute bottom-4 left-4 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold text-slate-500 shadow-sm backdrop-blur">
				지도 미리보기
			</div>
		</div>
	)
}

export default function MapCanvas(props: MapCanvasProps) {
	const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
	return clientId ? <NaverMap {...props} /> : <MockMap {...props} />
}
