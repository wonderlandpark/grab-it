import Link from 'next/link'
import { useRouter } from 'next/router'

const items = [
	{ href: '/', label: '홈', icon: '⌂' },
	{ href: '/?view=map', label: '지도', icon: '⌖' },
	{ href: '/me', label: '예약', icon: '▣' },
	{ href: '/partner', label: '내 정보', icon: '◡' },
]

export function BottomNav() {
	const router = useRouter()

	return (
		<nav className='safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-paper/95 px-5 pt-2 backdrop-blur md:hidden'>
			<div className='mx-auto flex max-w-md items-center justify-around'>
				{items.map((item) => {
					const active =
						router.pathname === item.href ||
						(item.href !== '/' && router.pathname.startsWith(item.href))
					return (
						<Link
							key={item.href}
							href={item.href}
							className={`flex min-w-16 flex-col items-center gap-0.5 rounded-xl py-1 text-xs ${
								active ? 'font-semibold text-leaf' : 'text-ink/55'
							}`}
						>
							<span className='text-xl leading-none'>{item.icon}</span>
							{item.label}
						</Link>
					)
				})}
			</div>
		</nav>
	)
}
