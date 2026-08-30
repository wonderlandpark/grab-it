import type { ReactNode } from 'react'
import { ResponsiveNav } from './ResponsiveNav'

export function AppShell({
	children,
	fullHeight = false,
}: {
	children: ReactNode
	fullHeight?: boolean
}) {
	return (
		<div className={fullHeight ? 'h-dvh overflow-hidden' : 'min-h-dvh'}>
			{/* <div className='bg-ink px-4 py-2 text-center text-[11px] text-white/80'>
				예약과 결제는 실제로 이루어지지 않으며 임시 데이터는 24시간 후 삭제될 수 있습니다.
			</div> */}
			<ResponsiveNav />
			<main className={fullHeight ? 'h-full md:h-[calc(100dvh-4rem)]' : ''}>{children}</main>
		</div>
	)
}
