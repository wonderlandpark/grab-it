import { useEffect, useRef, useState } from 'react'

interface LocationPoint {
	latitude: number
	longitude: number
}

interface LocationPickerMapProps {
	value: LocationPoint
	onChange: (point: LocationPoint) => void
}

let naverSdkPromise: Promise<NaverMapsApi> | null = null

function loadNaverMaps(clientId: string): Promise<NaverMapsApi> {
	if (window.naver?.maps.jsContentLoaded) return Promise.resolve(window.naver.maps)
	if (naverSdkPromise) return naverSdkPromise

	naverSdkPromise = new Promise((resolve, reject) => {
		const existing = document.getElementById('naver-maps-sdk') as HTMLScriptElement | null
		const script = existing ?? document.createElement('script')

		const resolveWhenReady = () => {
			const maps = window.naver?.maps
			if (!maps) {
				reject(new Error('네이버 지도 SDK를 초기화하지 못했습니다.'))
				return
			}
			if (maps.jsContentLoaded) {
				resolve(maps)
				return
			}
			maps.onJSContentLoaded = () => resolve(maps)
		}

		script.addEventListener('load', resolveWhenReady, { once: true })
		script.addEventListener('error', () => reject(new Error('네이버 지도 SDK를 불러오지 못했습니다.')), { once: true })

		if (existing && window.naver?.maps) {
			resolveWhenReady()
		} else if (!existing) {
			script.id = 'naver-maps-sdk'
			script.async = true
			script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}&submodules=gl`
			document.head.appendChild(script)
		}
	})

	return naverSdkPromise
}

export default function LocationPickerMap({ value, onChange }: LocationPickerMapProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const mapRef = useRef<NaverMapInstance | null>(null)
	const apiRef = useRef<NaverMapsApi | null>(null)
	const skipNextIdle = useRef(false)
	const onChangeRef = useRef(onChange)
	onChangeRef.current = onChange
	const [failed, setFailed] = useState(false)

	function moveToCurrentLocation() {
		if (!navigator.geolocation) return
		navigator.geolocation.getCurrentPosition(
			(position) => {
				onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude })
			},
			() => undefined,
			{ enableHighAccuracy: true, timeout: 5000 },
		)
	}

	useEffect(() => {
		const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
		const customStyleId = process.env.NEXT_PUBLIC_NAVER_MAP_STYLE_ID
		if (!clientId || !containerRef.current) return

		let cancelled = false
		let idleListener: NaverEventListener | null = null

		loadNaverMaps(clientId)
			.then((maps) => {
				if (cancelled || !containerRef.current) return

				const map = new maps.Map(containerRef.current, {
					center: new maps.LatLng(value.latitude, value.longitude),
					zoom: 14,
					gl: true,
					...(customStyleId ? { customStyleId } : { mapTypeId: maps.MapTypeId.NORMAL }),
					zoomControl: false,
					mapDataControl: false,
					scaleControl: false,
					logoControlOptions: { position: 6 },
				})
				mapRef.current = map
				apiRef.current = maps

				idleListener = maps.Event.addListener(map, 'idle', () => {
					if (skipNextIdle.current) {
						skipNextIdle.current = false
						return
					}
					const center = map.getCenter()
					onChangeRef.current({ latitude: center.lat(), longitude: center.lng() })
				})
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		const map = mapRef.current
		const maps = apiRef.current
		if (!map || !maps) return
		const current = map.getCenter()
		const moved =
			Math.abs(current.lat() - value.latitude) > 1e-7 ||
			Math.abs(current.lng() - value.longitude) > 1e-7
		if (moved) {
			skipNextIdle.current = false
			map.setCenter(new maps.LatLng(value.latitude, value.longitude))
		}
	}, [value])

	if (failed) {
		return (
			<div className="flex h-56 items-center justify-center rounded-2xl bg-mist/60 text-sm text-ink/50">
				지도를 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.
			</div>
		)
	}

	return (
		<div className="relative h-56 w-full overflow-hidden rounded-2xl border border-black/10">
			<div
				ref={containerRef}
				className="h-full w-full"
				aria-label="지도에서 위치 선택"
				role="region"
			/>
			<div
				className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full"
				aria-hidden="true"
			>
				<div className="relative flex flex-col items-center">
					<div className="h-7 w-7 rounded-full border-[3px] border-white bg-coral shadow-lg shadow-coral/40"
						style={{ borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)' }}
					/>
					<div className="mt-1 h-1.5 w-3 rounded-full bg-black/25 blur-[3px]" />
				</div>
			</div>
			<button
				type="button"
				onClick={moveToCurrentLocation}
				className="absolute bottom-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white shadow-md shadow-black/15 transition hover:bg-mist/70 focus:outline-none focus:ring-2 focus:ring-leaf/40"
				aria-label="현재 위치로 이동"
				title="현재 위치로 이동"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="h-4 w-4 text-ink"
				>
					<circle cx="12" cy="12" r="3" />
					<path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
				</svg>
			</button>
		</div>
	)
}
