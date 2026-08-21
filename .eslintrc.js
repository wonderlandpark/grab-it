module.exports = {
	root: true,
	extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'prettier'],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	rules: {
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-unused-vars': ['warn'],
		quotes: ['error', 'single'],
		semi: ['error', 'never'],
	},
}
