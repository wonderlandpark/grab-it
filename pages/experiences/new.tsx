import { useEffect } from 'react'
import { useRouter } from 'next/router'
export default function LegacyNewExperience() {
	const router = useRouter()
	useEffect(() => {
		void router.replace('/partner/experiences/new')
	}, [router])
	return <p className='p-8'>공간 운영자 화면으로 이동 중…</p>
}
