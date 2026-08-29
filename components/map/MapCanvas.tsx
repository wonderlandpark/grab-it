import { useEffect, useRef, useState } from 'react'
import type { ExperienceRecommendation } from '@/types/domain'

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
	const root = useRef<HTMLDivElement>(null),
		[mock, setMock] = useState(!process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID)
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
				markers = experiences.map((item) => {
					const marker = new maps.Marker({
						map,
						position: new maps.LatLng(item.space.latitude, item.space.longitude),
						icon: {
							content: `<button style="white-space:nowrap;border:0;border-radius:18px;padding:8px 12px;background:#2f7764;color:white;font:700 12px sans-serif;box-shadow:0 4px 12px #0003">${item.emotions[0]} · ${item.durationMinutes}분 · ${item.nextSlot.availableSeats}석</button>`,
						},
					})
					maps.Event.addListener(marker, 'click', () => onSelect?.(item))
					return marker
				})
			})
			.catch(() => setMock(true))
		return () => {
			cancelled = true
			markers.forEach((marker) => marker.setMap(null))
			map?.destroy?.()
		}
	}, [experiences, onSelect])
	if (mock)
		return (
			<div className='relative min-h-[460px] overflow-hidden rounded-3xl bg-[#e6ece8] p-6'>
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
						className='absolute z-10 rounded-full bg-leaf px-3 py-2 text-xs font-bold text-white shadow-lg'
						style={{ left: `${12 + ((index * 23) % 70)}%`, top: `${18 + ((index * 19) % 62)}%` }}
					>
						{item.title} · {item.nextSlot.availableSeats}석
					</button>
				))}
				<p className='relative text-sm font-bold text-ink/50'>
					지도 키가 없어 목업 지도로 표시 중입니다.
				</p>
			</div>
		)
	return <div ref={root} className='min-h-[460px] rounded-3xl' aria-label='추천 경험 지도' />
}
