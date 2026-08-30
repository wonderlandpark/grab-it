import type { ButtonHTMLAttributes } from 'react'

interface EmotionOptionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	label: string
	selected: boolean
	dashed?: boolean
}

export function EmotionOptionButton({
	label,
	selected,
	dashed = false,
	className = '',
	...buttonProps
}: EmotionOptionButtonProps) {
	return (
		<button
			type='button'
			aria-pressed={selected}
			className={`min-h-[72px] min-w-0 rounded-full px-3 py-4 text-center md:min-h-[78px] md:px-8 ${
				selected
					? 'btn-chip btn-chip-selected shadow-md'
					: dashed
						? 'btn-chip border-dashed'
						: 'btn-chip'
			} ${className}`}
			{...buttonProps}
		>
			<strong className='whitespace-nowrap text-[13px] font-black md:text-base'>{label}</strong>
		</button>
	)
}
