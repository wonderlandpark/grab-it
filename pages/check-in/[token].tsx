import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { SignInButton } from '@/components/auth/SignInButton'

export default function CheckInPage() {
	const router = useRouter(),
		{ status } = useSession(),
		[message, setMessage] = useState(''),
		[loading, setLoading] = useState(false)
	async function confirm() {
		setLoading(true)
		const response = await fetch('/api/partner/check-in', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token: router.query.token }),
		})
		const data = await response.json()
		setLoading(false)
		setMessage(
			response.ok
				? `${data.guestName || '예약자'}님, ${data.experienceTitle} 체크인을 완료했습니다.`
				: data.error
		)
	}
	return (
		<AppShell>
			<div className='mx-auto grid min-h-[70vh] max-w-lg place-items-center px-5 text-center'>
				<div className='w-full rounded-[2rem] bg-white p-8 shadow-lg'>
					<p className='text-5xl'>✓</p>
					<h1 className='mt-4 text-3xl font-black'>현장 체크인</h1>
					<p className='mt-3 text-ink/55'>이 공간의 승인된 운영자가 예약을 확인합니다.</p>
					{status === 'authenticated' ? (
						<button
							onClick={confirm}
							disabled={loading}
							className='btn-primary mt-7 w-full rounded-2xl p-4 font-black'
						>
							{loading ? '확인 중…' : '체크인 확정'}
						</button>
					) : (
						<SignInButton className='mt-7 w-full' />
					)}
					{message && <p className='mt-5 font-bold'>{message}</p>}
				</div>
			</div>
		</AppShell>
	)
}
