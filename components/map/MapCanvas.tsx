import { useEffect, useRef, useState } from 'react'
import { emotions as emotionOptions, type ExperienceRecommendation } from '@/types/domain'

const emotionLabels = Object.fromEntries(
	emotionOptions.map((emotion) => [emotion.value, emotion.label.split('·')[0]])
)

function markerContent(item: ExperienceRecommendation) {
	const emotion = emotionLabels[item.emotions[0]] || item.emotions[0]

	return `
		<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);cursor:pointer;">
			<div style="white-space:nowrap;border:2px solid #fff;border-radius:18px;padding:8px 12px;background:#1E2A44;color:#fff;font:700 12px Pretendard,system-ui,sans-serif;box-shadow:0 5px 14px #0004;">
				${emotion} · ${item.durationMinutes}분 · ${item.nextSlot.availableSeats}석
			</div>
			<div style="width:2px;height:4px;background:#1E2A44;"></div>
			<svg width="20" height="26" viewBox="0 0 30 38" aria-hidden="true" style="filter:drop-shadow(0 3px 3px #0004);overflow:visible;">
				<path d="M15 1.5C7.55 1.5 1.5 7.55 1.5 15c0 10.2 13.5 21.5 13.5 21.5S28.5 25.2 28.5 15C28.5 7.55 22.45 1.5 15 1.5Z" fill="#F8FF8E" stroke="#1E2A44" stroke-width="3" />
				<circle cx="15" cy="15" r="5" fill="#fff" />
			</svg>
		</div>`
}

let loader: Promise<any> | null = null
function loadMap(key: string) {
	if (window.naver?.maps) return Promise.resolve(window.naver.maps)
	if (loader) return loader
	loader = new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(key)}`
		script.onload = () => (window.naver?.maps ? resolve(window.naver.maps) : reject())
		script.onerror = reject
		document.head.appendChild(script)
	})
	return loader
}

export default function MapCanvas({
	experiences,
	onSelect,
}: {
	experiences: ExperienceRecommendation[]
	onSelect?: (item: ExperienceRecommendation) => void
}) {
	const root = useRef<HTMLDivElement>(null)
	const mapRef = useRef<any>(null)
	const mapsRef = useRef<any>(null)
	const currentLocationMarker = useRef<any>(null)
	const [mock, setMock] = useState(!process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID)
	const [mapReady, setMapReady] = useState(false)
	const [locating, setLocating] = useState(false)
	const [locationError, setLocationError] = useState('')
	const [currentLocation, setCurrentLocation] = useState<{
		latitude: number
		longitude: number
	} | null>(null)

	function locateCurrentPosition() {
		if (!navigator.geolocation) {
			setLocationError('현재 위치를 확인할 수 없는 브라우저예요.')
			return
		}

		setLocating(true)
		setLocationError('')
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setCurrentLocation({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				})
				setLocating(false)
			},
			() => {
				setLocationError('위치 권한을 허용하면 현재 위치를 표시할 수 있어요.')
				setLocating(false)
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
		)
	}

	useEffect(() => {
		const key = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
		if (!key || !root.current) return
		let map: any,
			markers: any[] = [],
			cancelled = false
		loadMap(key)
			.then((maps) => {
				if (cancelled || !root.current) return
				const first = experiences[0]?.space
				map = new maps.Map(root.current, {
					center: new maps.LatLng(first?.latitude || 37.5665, first?.longitude || 126.978),
					zoom: 13,
				})
				mapRef.current = map
				mapsRef.current = maps
				setMapReady(true)
				markers = experiences.map((item) => {
					const marker = new maps.Marker({
						map,
						position: new maps.LatLng(item.space.latitude, item.space.longitude),
						icon: {
							content: markerContent(item),
							anchor: new maps.Point(0, 0),
						},
					})
					maps.Event.addListener(marker, 'click', () => onSelect?.(item))
					return marker
				})
			})
			.catch(() => setMock(true))
		return () => {
			cancelled = true
			currentLocationMarker.current?.setMap(null)
			currentLocationMarker.current = null
			mapRef.current = null
			mapsRef.current = null
			markers.forEach((marker) => marker.setMap(null))
			map?.destroy?.()
		}
	}, [experiences, onSelect])

	useEffect(() => {
		if (!mapReady || !currentLocation || !mapRef.current || !mapsRef.current) return

		const maps = mapsRef.current
		const map = mapRef.current
		const position = new maps.LatLng(currentLocation.latitude, currentLocation.longitude)
		currentLocationMarker.current?.setMap(null)
		currentLocationMarker.current = new maps.Marker({
			map,
			position,
			zIndex: 1000,
			icon: {
				content: `
					<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);pointer-events:none;">
						<span style="display:block;width:18px;height:18px;border:4px solid #fff;border-radius:50%;background:#00A3F1;box-shadow:0 2px 8px #0005;"></span>
					</div>`,
				anchor: new maps.Point(0, 0),
			},
		})
		map.panTo(position)
		if (map.getZoom() < 15) map.setZoom(15)
	}, [currentLocation, mapReady])

	if (mock)
		return (
			<div className='relative min-h-[460px] overflow-hidden rounded-3xl bg-mist p-6'>
				<div
					className='absolute inset-0 opacity-40'
					style={{
						backgroundImage:
							'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
						backgroundSize: '48px 48px',
					}}
				/>
				{experiences.map((item, index) => (
					<button
						key={item.id}
						onClick={() => onSelect?.(item)}
						className='absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center'
						style={{ left: `${12 + ((index * 23) % 70)}%`, top: `${18 + ((index * 19) % 62)}%` }}
					>
						<span className='whitespace-nowrap rounded-full border-2 border-white bg-ink px-3 py-2 text-xs font-bold text-white shadow-lg'>
							{item.title} · {item.nextSlot.availableSeats}석
						</span>
						<span className='h-1 w-0.5 bg-ink' />
						<svg
							width='20'
							height='26'
							viewBox='0 0 30 38'
							aria-hidden='true'
							className='drop-shadow-md'
						>
							<path
								d='M15 1.5C7.55 1.5 1.5 7.55 1.5 15c0 10.2 13.5 21.5 13.5 21.5S28.5 25.2 28.5 15C28.5 7.55 22.45 1.5 15 1.5Z'
								fill='#F8FF8E'
								stroke='#1E2A44'
								strokeWidth='3'
							/>
							<circle cx='15' cy='15' r='5' fill='#fff' />
						</svg>
					</button>
				))}
				{currentLocation && (
					<div className='absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center'>
						<span className='mb-1 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-blue-600 shadow-md'>
							내 위치
						</span>
						<span className='h-[18px] w-[18px] rounded-full border-4 border-white bg-blue-600 shadow-md' />
					</div>
				)}
				<LocationControl
					locating={locating}
					error={locationError}
					onClick={locateCurrentPosition}
				/>
				<p className='relative text-sm font-bold text-ink/50'>
					지도 키가 없어 목업 지도로 표시 중입니다.
				</p>
			</div>
		)
	return (
		<div className='relative overflow-hidden rounded-3xl'>
			<div ref={root} className='min-h-[460px]' aria-label='추천 순간 지도' />
			<LocationControl locating={locating} error={locationError} onClick={locateCurrentPosition} />
		</div>
	)
}

function LocationControl({
	locating,
	error,
	onClick,
}: {
	locating: boolean
	error: string
	onClick: () => void
}) {
	return (
		<div className='absolute bottom-4 right-4 z-30 flex max-w-[calc(100%-2rem)] flex-col items-end gap-2'>
			{error && (
				<p className='rounded-xl bg-white px-3 py-2 text-xs font-bold text-coral shadow-lg'>
					{error}
				</p>
			)}
			<button
				type='button'
				onClick={onClick}
				disabled={locating}
				className='flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-black text-ink shadow-lg disabled:opacity-60'
			>
				<span className='text-lg leading-none text-blue-600'>◎</span>
				{locating ? '위치 확인 중…' : '현위치'}
			</button>
		</div>
	)
}
