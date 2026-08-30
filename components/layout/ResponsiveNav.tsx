import Link from 'next/link'
import { useRouter } from 'next/router'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Brand } from './Brand'

const items = [
	{ href: '/', label: '순간 찾기' },
	{ href: '/me', label: '나의 순간' },
	{ href: '/partner', label: '공간 운영' },
]

function isActive(pathname: string, href: string) {
	if (href === '/')
		return (
			pathname === '/' || pathname.startsWith('/experiences/') || pathname.startsWith('/course')
		)
	if (href === '/me') return pathname === '/me' || pathname.startsWith('/bookings/')
	return pathname === href || pathname.startsWith(`${href}/`)
}

export function ResponsiveNav() {
	const router = useRouter()
	const { data: session, status } = useSession()
	const [open, setOpen] = useState(false)

	useEffect(() => {
		if (!open) return
		const previousOverflow = document.body.style.overflow
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false)
		}
		document.body.style.overflow = 'hidden'
		window.addEventListener('keydown', closeOnEscape)
		return () => {
			document.body.style.overflow = previousOverflow
			window.removeEventListener('keydown', closeOnEscape)
		}
	}, [open])

	return (
		<header className='border-b border-black/5 bg-paper'>
			<div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-6'>
				<Brand className='h-9 md:h-10' />

				<nav className='hidden items-center gap-1 text-sm font-bold md:flex'>
					{items.map((item) => {
						const active = isActive(router.pathname, item.href)
						return (
							<Link
								key={item.href}
								href={item.href}
								aria-current={active ? 'page' : undefined}
								className={`rounded-full px-4 py-2 transition-colors ${
									active ? 'bg-mist text-ink' : 'text-ink/60 hover:bg-mist/60 hover:text-ink'
								}`}
							>
								{item.label}
							</Link>
						)
					})}
					{status === 'unauthenticated' && (
						<Link href='/login' className='btn-primary ml-2 rounded-full px-4 py-2'>
							로그인
						</Link>
					)}
					{session && (
						<button
							type='button'
							onClick={() => void signOut({ callbackUrl: '/' })}
							className='ml-2 rounded-full px-4 py-2 text-ink/60 transition-colors hover:bg-mist hover:text-ink'
						>
							로그아웃
						</button>
					)}
				</nav>

				<button
					type='button'
					aria-label='메뉴 열기'
					aria-expanded={open}
					aria-controls='mobile-navigation'
					onClick={() => setOpen(true)}
					className='grid h-11 w-11 place-items-center text-ink transition-opacity hover:opacity-60 md:hidden'
				>
					<svg aria-hidden='true' viewBox='0 0 24 24' className='h-6 w-6' fill='none'>
						<path
							d='M4 7h16M4 12h16M4 17h16'
							stroke='currentColor'
							strokeLinecap='round'
							strokeWidth='2'
						/>
					</svg>
				</button>
			</div>

			{open && (
				<div className='fixed inset-0 z-[70] md:hidden'>
					<button
						type='button'
						aria-label='메뉴 닫기'
						onClick={() => setOpen(false)}
						className='absolute inset-0 bg-ink/35 backdrop-blur-[2px]'
					/>
					<aside
						id='mobile-navigation'
						aria-label='모바일 메뉴'
						className='safe-bottom absolute inset-y-0 right-0 flex w-[min(84vw,340px)] flex-col bg-paper p-5 shadow-2xl'
					>
						<div className='flex items-center justify-between'>
							<div></div>
							<button
								type='button'
								aria-label='메뉴 닫기'
								onClick={() => setOpen(false)}
								className='grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-mist'
							>
								<svg aria-hidden='true' viewBox='0 0 24 24' className='h-6 w-6' fill='none'>
									<path
										d='m6 6 12 12M18 6 6 18'
										stroke='currentColor'
										strokeLinecap='round'
										strokeWidth='2'
									/>
								</svg>
							</button>
						</div>

						{/* {session?.user?.name && (
							<p className='mt-8 text-sm text-ink/50'>안녕하세요, {session.user.name}님.</p>
						)} */}
						<nav className='mt-6 space-y-2'>
							{items.map((item) => {
								const active = isActive(router.pathname, item.href)
								return (
									<Link
										key={item.href}
										href={item.href}
										aria-current={active ? 'page' : undefined}
										onClick={() => setOpen(false)}
										className={`block rounded-2xl px-4 py-4 text-lg font-black transition-colors ${
											active ? 'bg-mist text-brand' : 'text-ink hover:bg-mist/60'
										}`}
									>
										{item.label}
									</Link>
								)
							})}
						</nav>

						<div className='mt-auto border-t border-ink/10 pt-5'>
							{status === 'unauthenticated' && (
								<Link
									href='/login'
									onClick={() => setOpen(false)}
									className='btn-primary block w-full rounded-2xl px-5 py-4 text-center font-black'
								>
									로그인
								</Link>
							)}
							{session && (
								<button
									type='button'
									onClick={() => void signOut({ callbackUrl: '/' })}
									className='w-full rounded-2xl border border-ink/15 px-5 py-4 font-black text-ink'
								>
									로그아웃
								</button>
							)}
						</div>
					</aside>
				</div>
			)}
		</header>
	)
}
