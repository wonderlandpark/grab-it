import Head from 'next/head'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { SignInButton } from '@/components/auth/SignInButton'
import { Brand } from '@/components/layout/Brand'

export default function LoginPage() {
	const { status } = useSession()
	const router = useRouter()

	useEffect(() => {
		if (status === 'authenticated') void router.replace('/')
	}, [router, status])

	return (
		<>
			<Head>
				<title>로그인 · 마음지도</title>
			</Head>
			<main className='grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_top,_#dce8e2,_#f7f4ed_55%)] px-5'>
				<section className='w-full max-w-md rounded-[2rem] border border-white/80 bg-white/85 p-7 text-center shadow-xl shadow-leaf/10 backdrop-blur'>
					<div className='mb-8 flex justify-center'>
						<Brand />
					</div>
					<p className='text-sm font-medium text-leaf'>오늘은 어떤 마음을 만나고 싶나요?</p>
					<h1 className='mt-2 text-3xl font-semibold tracking-tight'>감정으로 장소를 발견해요</h1>
					<p className='mx-auto mt-4 max-w-sm leading-relaxed text-ink/60'>
						지도 탐색은 로그인 없이 가능해요. 경험을 남기거나 공감할 때만 로그인합니다.
					</p>
					<SignInButton className='mt-8 w-full' />
				</section>
			</main>
		</>
	)
}
