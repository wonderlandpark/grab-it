import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { AppShell } from '@/components/layout/AppShell'
import { authOptions } from '@/lib/auth'
export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getServerSession(context.req, context.res, authOptions)
	return session?.user.role === 'ADMIN' ? { props: {} } : { notFound: true }
}
export default function Reports() {
	const [items, setItems] = useState<any[]>([])
	const load = () =>
		fetch('/api/admin/reports')
			.then((r) => r.json())
			.then(setItems)
	useEffect(() => {
		void load()
	}, [])
	async function act(id: string, action: string) {
		await fetch(`/api/admin/reports/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action }),
		})
		void load()
	}
	return (
		<AppShell>
			<div className='mx-auto max-w-4xl px-5 py-10'>
				<h1 className='text-4xl font-black'>후기 신고</h1>
				<div className='mt-7 space-y-3'>
					{items.map((item) => (
						<div key={item.id} className='rounded-2xl bg-white p-5'>
							<strong>{item.review?.booking?.slot?.experience?.title}</strong>
							<p className='mt-2'>{item.review?.body || '내용 없음'}</p>
							<p className='mt-2 text-sm text-coral'>신고: {item.reason}</p>
							<div className='mt-4 flex gap-2'>
								<button
									onClick={() => act(item.id, 'HIDE')}
									className='rounded-xl bg-ink px-4 py-2 text-white'
								>
									숨김
								</button>
								<button
									onClick={() => act(item.id, 'DISMISS')}
									className='rounded-xl border px-4 py-2'
								>
									기각
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</AppShell>
	)
}
