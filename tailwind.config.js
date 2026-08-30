/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				brand: '#006B9F',
				action: '#00A3F1',
				sky: '#C4F6FF',
				paper: '#F3FAFF',
				mist: '#E6F8FC',
				glow: '#F8FF8E',
				ink: '#1E2A44',
				coral: '#ec8068',
			},
			fontFamily: {
				sans: [
					'Pretendard Variable',
					'Pretendard',
					'system-ui',
					'Segoe UI',
					'Malgun Gothic',
					'sans-serif',
				],
			},
		},
	},
	plugins: [],
}
