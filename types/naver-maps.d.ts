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
	getCenter: () => NaverCoordinate
	setCenter: (coordinate: unknown) => void
	setZoom: (zoom: number) => void
	setMapTypeId: (mapTypeId: string) => void
	destroy?: () => void
}

interface NaverMarkerInstance {
	setMap: (map: NaverMapInstance | null) => void
	setPosition: (coordinate: unknown) => void
}

interface NaverEventListener {
	listener: unknown
}

interface NaverMapsApi {
	jsContentLoaded: boolean
	onJSContentLoaded: () => void
	Map: new (element: HTMLElement, options: Record<string, unknown>) => NaverMapInstance
	LatLng: new (latitude: number, longitude: number) => unknown
	Point: new (x: number, y: number) => unknown
	Marker: new (options: Record<string, unknown>) => NaverMarkerInstance
	MapTypeId: { NORMAL: string }
	Event: {
		addListener: (
			target: NaverMapInstance | NaverMarkerInstance,
			eventName: string,
			listener: (event?: { coord?: NaverCoordinate }) => void,
		) => NaverEventListener
		removeListener: (listener: NaverEventListener) => void
	}
}

interface Window {
	naver?: { maps: NaverMapsApi }
}
