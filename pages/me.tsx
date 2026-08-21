import Head from 'next/head'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { SignInButton } from '@/components/auth/SignInButton'
import { ExperienceCard } from '@/components/experience/ExperienceCard'
import { AppShell } from '@/components/layout/AppShell'
import type { MapExperience } from '@/types/domain'

export default function MyPage() {
	const { data: session, status } = useSession()
	const [tab, setTab] = useState<'mine' | 'resonated'>('mine')
	const [experiences, setExperiences] = useState<MapExperience[]>([])
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (status !== 'authenticated') return
		setLoading(true)
		const endpoint = tab === 'mine' ? '/api/me/experiences' : '/api/me/resonances'
		void fetch(endpoint)
			.then((response) => response.json())
			.then((data) => setExperiences(data.experiences ?? []))
			.finally(() => setLoading(false))
	}, [status, tab])

	if (status !== 'authenticated') {
		return (
			<AppShell>
				<div className='mx-auto grid min-h-[70dvh] max-w-lg place-items-center px-5 text-center'>
					<div><p className='text-sm font-semibold text-leaf'>나만의 감정 보관함</p><h1 className='mt-2 text-3xl font-semibold'>내 기록을 모아보세요</h1><p className='mt-3 text-ink/55'>공개하지 않은 경험도 안전하게 보관합니다.</p><SignInButton className='mt-6' /></div>
				</div>
			</AppShell>
		)
	}

	return (
		<AppShell>
			<Head><title>내 마음 · 마음지도</title></Head>
			<div className='mx-auto max-w-5xl px-5 py-7 md:py-10'>
				<header className='flex items-center gap-4'>
					{session?.user?.image ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={session.user.image} alt='' className='h-16 w-16 rounded-full object-cover' />
					) : <span className='grid h-16 w-16 place-items-center rounded-full bg-mist text-2xl'>◡</span>}
					<div><p className='text-sm text-ink/45'>마음 여행자</p><h1 className='text-2xl font-semibold'>{session?.user?.name ?? '감정 여행자'}</h1></div>
				</header>
				<div className='mt-8 flex gap-2 rounded-2xl bg-white p-1.5'>
					<button onClick={() => setTab('mine')} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === 'mine' ? 'bg-leaf text-white' : 'text-ink/55'}`}>내 기록</button>
					<button onClick={() => setTab('resonated')} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === 'resonated' ? 'bg-leaf text-white' : 'text-ink/55'}`}>공감한 경험</button>
				</div>
				{loading ? <p className='py-16 text-center text-ink/45'>기록을 불러오는 중…</p> : experiences.length ? (
					<div className='mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>{experiences.map((experience) => <ExperienceCard key={experience.id} experience={experience} />)}</div>
				) : <div className='mt-5 rounded-3xl bg-white px-5 py-16 text-center'><p className='text-3xl'>🗺️</p><p className='mt-3 font-semibold'>아직 기록이 없어요</p><p className='mt-1 text-sm text-ink/50'>지도에서 마음에 닿는 장소를 찾아보세요.</p></div>}
			</div>
		</AppShell>
	)
}
