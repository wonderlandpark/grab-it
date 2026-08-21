import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { SignInButton } from '@/components/auth/SignInButton'
import { Brand } from './Brand'

export function DesktopNav() {
	const { data: session } = useSession()

	return (
		<header className='hidden h-16 items-center justify-between border-b border-black/5 bg-paper px-6 md:flex'>
			<Brand />
			<nav className='flex items-center gap-2 text-sm'>
				<Link href='/' className='rounded-full px-4 py-2 hover:bg-black/5'>
					지도 탐색
				</Link>
				<Link href='/experiences/new' className='rounded-full bg-leaf px-4 py-2 text-white'>
					경험 기록
				</Link>
				<Link href='/me' className='rounded-full px-4 py-2 hover:bg-black/5'>
					내 마음
				</Link>
				{session ? (
					<button onClick={() => signOut()} className='rounded-full px-3 py-2 text-ink/60'>
						로그아웃
					</button>
				) : (
					<SignInButton className='!rounded-full !px-3 !py-2 !text-xs' />
				)}
			</nav>
		</header>
	)
}
