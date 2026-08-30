import Head from 'next/head'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Brand } from '@/components/layout/Brand'

export default function LoginPage() {
	const { status } = useSession()
	const router = useRouter()
	const requestedCallback =
		typeof router.query.callbackUrl === 'string' ? router.query.callbackUrl : '/'
	const callbackUrl =
		requestedCallback.startsWith('/') && !requestedCallback.startsWith('//')
			? requestedCallback
			: '/'

	useEffect(() => {
		if (status === 'authenticated') void router.replace(callbackUrl)
	}, [callbackUrl, router, status])

	return (
		<>
			<Head>
				<title>로그인 · 마음지도</title>
			</Head>
			<main className='grid min-h-dvh place-items-center bg-gradient-to-b from-sky/60 to-paper px-5'>
				<section className='w-full max-w-md rounded-[2rem] border border-white/80 bg-white/85 p-7 text-center shadow-xl shadow-brand/10 backdrop-blur'>
					<div className='mb-8 flex justify-center'>
						<Brand className='h-24' />
					</div>
					<p className='text-sm font-medium text-brand'>오늘은 어떤 마음을 만나고 싶나요?</p>
					<h1 className='mt-2 text-3xl font-semibold tracking-tight'>감정으로 장소를 발견해요</h1>
					<p className='mx-auto mt-4 max-w-sm leading-relaxed text-ink/60'>
						지도와 추천은 로그인 없이 볼 수 있어요. 예약을 저장할 때만 계속해 주세요.
					</p>
					<button
						onClick={() => signIn('credentials', { callbackUrl })}
						className='btn-primary mt-8 w-full rounded-2xl px-5 py-4 font-black'
					>
						게스트로 체험하기
					</button>
					<button
						onClick={() => signIn('kakao', { callbackUrl })}
						className='mt-3 w-full rounded-2xl bg-[#FEE500] px-5 py-4 font-black text-[#191919]'
					>
						카카오로 계속하기
					</button>
				</section>
			</main>
		</>
	)
}
