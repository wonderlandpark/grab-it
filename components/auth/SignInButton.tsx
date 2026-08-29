import Link from 'next/link'
import { useRouter } from 'next/router'

export function SignInButton({
	className = '',
	label = '로그인하기',
	callbackUrl,
}: {
	className?: string
	label?: string
	callbackUrl?: string
}) {
	const router = useRouter()
	const destination = callbackUrl || router.asPath || '/'

	return (
		<Link
			href={{ pathname: '/login', query: { callbackUrl: destination } }}
			className={`inline-block rounded-2xl bg-[#FEE500] px-5 py-3 font-semibold text-[#191919] ${className}`}
		>
			{label}
		</Link>
	)
}
