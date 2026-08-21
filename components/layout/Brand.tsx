import Link from 'next/link'

export function Brand() {
	return (
		<Link href='/' className='inline-flex items-center gap-2 font-semibold tracking-tight'>
			<span className='grid h-9 w-9 place-items-center rounded-2xl bg-leaf text-lg text-white'>
				온
			</span>
			<span>마음지도</span>
		</Link>
	)
}
