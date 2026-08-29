import { useEffect, useRef, useState } from 'react'

declare global {
	interface Window {
		QRCode?: {
			toCanvas: (
				canvas: HTMLCanvasElement,
				text: string,
				options: object,
				callback: (error?: Error) => void
			) => void
		}
	}
}
export function QrTicket({ value }: { value: string }) {
	const canvas = useRef<HTMLCanvasElement>(null),
		[failed, setFailed] = useState(false)
	useEffect(() => {
		const source = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.1/qrcode.min.js'
		let script = document.getElementById('qr-code-lib') as HTMLScriptElement | null
		if (script && script.src !== source) {
			script.remove()
			script = null
		}
		const draw = () => {
			if (canvas.current && window.QRCode)
				window.QRCode.toCanvas(
					canvas.current,
					value,
					{ width: 240, margin: 2, color: { dark: '#27332f', light: '#ffffff' } },
					(error) => setFailed(Boolean(error))
				)
		}
		if (window.QRCode) draw()
		else {
			if (!script) {
				script = document.createElement('script')
				script.id = 'qr-code-lib'
				script.src = source
				script.async = true
				script.crossOrigin = 'anonymous'
				script.referrerPolicy = 'no-referrer'
				document.head.appendChild(script)
			}
			script.addEventListener('load', draw, { once: true })
			script.addEventListener(
				'error',
				() => {
					setFailed(true)
					script?.remove()
				},
				{ once: true }
			)
		}
	}, [value])
	return (
		<div className='text-center'>
			<canvas
				ref={canvas}
				className='mx-auto rounded-2xl bg-white p-2'
				aria-label='체크인 QR 코드'
			/>
			{failed && (
				<p className='mt-2 text-xs text-coral'>
					QR을 표시하지 못했어요. 아래 링크를 운영자에게 보여주세요.
				</p>
			)}
		</div>
	)
}
