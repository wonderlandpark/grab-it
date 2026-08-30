import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { AppShell } from '@/components/layout/AppShell'
import { authOptions } from '@/lib/auth'

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getServerSession(context.req, context.res, authOptions)
	return session?.user.role === 'ADMIN' ? { props: {} } : { notFound: true }
}

export default function AdminPartners() {
	const [items, setItems] = useState<any[]>([]),
		[error, setError] = useState('')
	const load = () =>
		fetch('/api/admin/partner-applications')
			.then(async (r) => {
				const d = await r.json()
				if (!r.ok) throw new Error(d.error)
				setItems(d)
			})
			.catch((e) => setError(e.message))
	useEffect(() => {
		void load()
	}, [])
	async function decide(id: string, status: 'APPROVED' | 'REJECTED') {
		await fetch(`/api/admin/partner-applications/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status }),
		})
		void load()
	}
	return (
		<AppShell>
			<div className='mx-auto max-w-4xl px-5 py-10'>
				<h1 className='text-4xl font-black'>파트너 승인</h1>
				{error && <p className='mt-4 text-coral'>{error}</p>}
				<div className='mt-7 space-y-3'>
					{items.map((item) => (
						<div key={item.id} className='rounded-2xl bg-white p-5'>
							<div className='flex flex-wrap justify-between gap-4'>
								<div>
									<strong>{item.operatorName}</strong>
									<p className='text-sm text-ink/55'>
										{item.user?.email} · {item.phone} · {item.businessRegistrationNumber}
									</p>
									<span className='mt-2 inline-block text-xs'>{item.status}</span>
								</div>
								{item.status === 'PENDING' && (
									<div className='flex gap-2'>
										<button
											onClick={() => decide(item.id, 'APPROVED')}
											className='btn-primary rounded-xl px-4'
										>
											승인
										</button>
										<button
											onClick={() => decide(item.id, 'REJECTED')}
											className='rounded-xl border px-4'
										>
											거절
										</button>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</AppShell>
	)
}
