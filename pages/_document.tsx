import { Head, Html, Main, NextScript } from 'next/document'

export default function Document() {
	return (
		<Html lang='ko'>
			<Head>
				<link rel='icon' href='/favicon.ico' sizes='any' />
				<link rel='icon' type='image/png' sizes='32x32' href='/favicon-32x32.png' />
				<link rel='apple-touch-icon' sizes='180x180' href='/apple-touch-icon.png' />
				<meta name='theme-color' content='#F3FAFF' />
				<meta name='description' content='느끼고 싶은 감정으로 장소를 발견하는 지도' />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	)
}
