import Link from 'next/link'

export function Brand() {
	return (
		<Link href='/' className='inline-flex items-center gap-2 font-semibold tracking-tight'>
			{/* <span className='grid h-9 w-9 place-items-center rounded-2xl bg-brand text-lg text-white'>
				grabit
			</span> */}
			<span>grabit</span>
		</Link>
	)
}
