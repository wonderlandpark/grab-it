import Link from 'next/link'
import { useRouter } from 'next/router'
import { signOut, useSession } from 'next-auth/react'
import { Brand } from './Brand'

export function DesktopNav() {
	const { data: session } = useSession()
	const router = useRouter()
	const partnerMode = router.pathname.startsWith('/partner')
	const discoveryMode = router.pathname === '/' || router.pathname.startsWith('/experiences/')

	return (
		<header className='hidden h-16 items-center justify-between border-b border-black/5 bg-paper px-6 md:flex'>
			<Brand />
			<nav className='flex items-center gap-1 text-sm font-bold text-ink/60'>
				{session?.user.isDemo ? (
					<div className='mr-2 flex rounded-full bg-mist p-1'>
						<Link
							href='/'
							className={`rounded-full px-4 py-2 transition-colors ${
								discoveryMode ? 'bg-white text-ink shadow-sm' : 'hover:bg-white/60 hover:text-ink'
							}`}
						>
							순간 찾기
						</Link>
						<Link
							href='/partner'
							className={`rounded-full px-4 py-2 transition-colors ${
								partnerMode ? 'bg-white text-ink shadow-sm' : 'hover:bg-white/60 hover:text-ink'
							}`}
						>
							공간 운영
						</Link>
					</div>
				) : null}
				<Link
					href='/me'
					className='rounded-full px-4 py-2 transition-colors hover:bg-mist hover:text-ink'
				>
					내 예약
				</Link>
				{session ? (
					<button
						onClick={() => signOut()}
						className='rounded-full px-4 py-2 font-bold transition-colors hover:bg-mist hover:text-ink'
					>
						로그아웃
					</button>
				) : (
					<Link href='/login' className='btn-primary rounded-full px-4 py-2 text-sm font-bold'>
						로그인
					</Link>
				)}
			</nav>
		</header>
	)
}
