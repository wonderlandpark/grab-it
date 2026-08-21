import { Head, Html, Main, NextScript } from 'next/document'

export default function Document() {
	return (
		<Html lang='ko'>
			<Head>
				<meta name='theme-color' content='#f7f4ed' />
				<meta name='description' content='느끼고 싶은 감정으로 장소를 발견하는 지도' />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	)
}
