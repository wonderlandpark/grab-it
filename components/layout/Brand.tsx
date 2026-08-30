import Image from 'next/image'
import Link from 'next/link'

export function Brand({ className = 'h-11' }: { className?: string }) {
	return (
		<Link href='/' className='inline-flex items-center' aria-label='grabit 홈'>
			<Image
				src='/grabit-logo.png'
				alt='grabit'
				width={768}
				height={639}
				priority
				className={`w-auto object-contain ${className}`}
			/>
		</Link>
	)
}
