import { getProviders, signIn } from 'next-auth/react'
import { useState } from 'react'

export function SignInButton({ className = '' }: { className?: string }) {
	const [loading, setLoading] = useState(false)

	async function handleSignIn() {
		setLoading(true)
		try {
			const providers = await getProviders()
			const provider = providers?.kakao ? 'kakao' : providers?.credentials ? 'credentials' : null
			if (!provider) throw new Error('로그인 설정이 필요합니다')
			await signIn(provider, { callbackUrl: '/' })
		} finally {
			setLoading(false)
		}
	}

	return (
		<button
			type='button'
			onClick={handleSignIn}
			disabled={loading}
			className={`rounded-2xl bg-[#FEE500] px-5 py-3 font-semibold text-[#191919] disabled:opacity-60 ${className}`}
		>
			{loading ? '로그인 연결 중…' : '카카오로 시작하기'}
		</button>
	)
}
