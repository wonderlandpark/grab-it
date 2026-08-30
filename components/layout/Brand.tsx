import Image from 'next/image'
import Link from 'next/link'

export function Brand({
	className = 'h-11',
	showName = false,
}: {
	className?: string
	showName?: boolean
}) {
	return (
		<Link href='/' className='inline-flex items-center gap-2' aria-label='grabit 홈'>
			<Image
				src='/grabit-logo.png'
				alt='grabit'
				width={768}
				height={639}
				priority
				className={`w-auto object-contain ${className}`}
			/>
			{showName && <span className='text-xl font-black tracking-tight text-ink'>grabit</span>}
		</Link>
	)
}
