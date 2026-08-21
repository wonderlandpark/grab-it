/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				ink: '#27332f',
				paper: '#f7f4ed',
				leaf: '#2f7764',
				mist: '#dce8e2',
				coral: '#ec8068',
			},
			fontFamily: {
				sans: ['Pretendard', 'Apple SD Gothic Neo', 'sans-serif'],
			},
		},
	},
	plugins: [],
}
