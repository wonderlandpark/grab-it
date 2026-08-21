import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { DesktopNav } from './DesktopNav'

export function AppShell({ children, fullHeight = false }: { children: ReactNode; fullHeight?: boolean }) {
	return (
		<div className={fullHeight ? 'h-dvh overflow-hidden' : 'min-h-dvh pb-24 md:pb-0'}>
			<DesktopNav />
			<main className={fullHeight ? 'h-full md:h-[calc(100dvh-4rem)]' : ''}>{children}</main>
			<BottomNav />
		</div>
	)
}
