import Head from 'next/head'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { SignInButton } from '@/components/auth/SignInButton'
import { AppShell } from '@/components/layout/AppShell'
import { activities, emotions, type ExperienceDetail } from '@/types/domain'

export default function ExperienceDetailPage() {
	const router = useRouter()
	const { status } = useSession()
	const [experience, setExperience] = useState<ExperienceDetail | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [reporting, setReporting] = useState(false)
	const [reportReason, setReportReason] = useState('')

	useEffect(() => {
		if (!router.isReady) return
		void fetch(`/api/experiences/${router.query.id}`)
			.then(async (response) => {
				const data = await response.json()
				if (!response.ok) throw new Error(data.error ?? '경험을 찾지 못했습니다')
				setExperience(data.experience)
			})
			.catch((reason) => setError(reason instanceof Error ? reason.message : '불러오지 못했습니다'))
			.finally(() => setLoading(false))
	}, [router.isReady, router.query.id, status])

	async function toggleResonance() {
		if (!experience) return
		if (status !== 'authenticated') {
			await router.push('/login')
			return
		}
		const response = await fetch(`/api/experiences/${experience.id}/resonance`, {
			method: experience.hasResonated ? 'DELETE' : 'POST',
		})
		const data = await response.json()
		if (response.ok) {
			setExperience({
				...experience,
				hasResonated: data.hasResonated,
				resonanceCount: data.resonanceCount,
			})
		}
	}

	async function submitReport() {
		if (!experience || !reportReason.trim()) return
		const response = await fetch(`/api/experiences/${experience.id}/report`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ reason: reportReason }),
		})
		if (response.ok) {
			setReporting(false)
			setReportReason('')
			alert('신고가 접수됐습니다.')
		} else if (response.status === 401) {
			await router.push('/login')
		}
	}

	if (loading) {
		return <AppShell><div className='grid min-h-[70dvh] place-items-center text-ink/50'>경험을 불러오는 중…</div></AppShell>
	}
	if (error || !experience) {
		return <AppShell><div className='grid min-h-[70dvh] place-items-center px-5 text-center'><div><h1 className='text-2xl font-semibold'>경험을 열 수 없어요</h1><p className='mt-2 text-ink/55'>{error}</p></div></div></AppShell>
	}

	const activity = activities.find((item) => item.value === experience.activity)

	return (
		<AppShell>
			<Head><title>{experience.placeName ?? '감정 기록'} · 마음지도</title></Head>
			<article className='mx-auto max-w-5xl px-5 py-6 md:grid md:grid-cols-[1.15fr_0.85fr] md:gap-8 md:py-10'>
				<section>
					{experience.media.length ? (
						<div className='scrollbar-none flex snap-x gap-3 overflow-x-auto rounded-3xl'>
							{experience.media.map((media) => (
								// eslint-disable-next-line @next/next/no-img-element
								<img key={media.id} src={media.url} alt='경험 사진' className='aspect-[4/3] w-[88%] shrink-0 snap-center rounded-3xl object-cover sm:w-[70%] md:w-full' />
							))}
						</div>
					) : (
						<div className='grid aspect-[4/3] place-items-center rounded-3xl bg-[radial-gradient(circle_at_30%_30%,_#dce8e2,_#b7d0c5)] text-5xl'>🌿</div>
					)}
				</section>

				<section className='mt-6 md:mt-0'>
					<p className='text-sm font-semibold text-leaf'>{experience.placeName ?? '지도 위의 한 장소'}</p>
					<h1 className='mt-2 text-3xl font-semibold leading-tight tracking-tight'>{experience.body}</h1>
					<div className='mt-4 flex flex-wrap gap-2'>
						{experience.emotions.map((value) => {
							const emotion = emotions.find((item) => item.value === value)
							return emotion ? <span key={value} className='rounded-full bg-mist px-3 py-1.5 text-sm text-leaf'>{emotion.emoji} {emotion.label}</span> : null
						})}
					</div>
					<div className='mt-6 rounded-3xl bg-white p-5 shadow-sm'>
						<p className='text-sm text-ink/50'>{activity?.label} · {experience.author.name ?? '감정 여행자'}</p>
						<p className='mt-3 text-sm leading-relaxed text-ink/60'>공개 지도에서는 작성자의 정확한 위치 대신 주변의 흐린 위치만 표시해요.</p>
					</div>

					<button onClick={toggleResonance} className={`mt-5 w-full rounded-2xl px-5 py-4 font-semibold ${experience.hasResonated ? 'bg-mist text-leaf' : 'bg-leaf text-white'}`}>
						{experience.hasResonated ? '같은 경험을 남겼어요' : '나도 경험했어요'} · {experience.resonanceCount}
					</button>
					{status !== 'authenticated' ? <div className='mt-3 text-center'><SignInButton className='w-full' /></div> : null}

					{!experience.isOwner ? (
						<div className='mt-5'>
							<button onClick={() => setReporting((value) => !value)} className='text-sm text-ink/45 underline underline-offset-4'>부적절한 기록 신고</button>
							{reporting ? (
								<div className='mt-3 rounded-2xl bg-white p-4'>
									<textarea value={reportReason} onChange={(event) => setReportReason(event.target.value.slice(0, 300))} placeholder='신고 사유를 알려주세요' className='w-full rounded-xl border border-black/10 p-3 text-sm' rows={3} />
									<button onClick={submitReport} className='mt-2 rounded-xl bg-ink px-4 py-2 text-sm text-white'>신고 접수</button>
								</div>
							) : null}
						</div>
					) : null}
				</section>
			</article>
		</AppShell>
	)
}
