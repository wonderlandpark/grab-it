import type { ButtonHTMLAttributes } from 'react'

interface EmotionOptionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	label: string
	selected: boolean
	dashed?: boolean
	artworkSrc?: string
	artworkPlacement?: 'left' | 'right' | 'both'
	artworkSize?: 'small' | 'medium' | 'large'
	artworkNudgeDown?: boolean
}

export function EmotionOptionButton({
	label,
	selected,
	dashed = false,
	artworkSrc,
	artworkPlacement = 'both',
	artworkSize = 'medium',
	artworkNudgeDown = false,
	className = '',
	...buttonProps
}: EmotionOptionButtonProps) {
	return (
		<button
			type='button'
			aria-pressed={selected}
			className={`relative h-24 min-w-0 overflow-hidden rounded-[50%] border-[3px] border-ink px-3 text-center md:h-28 md:px-8 ${
				selected
					? 'btn-chip btn-chip-selected shadow-md'
					: dashed
						? 'btn-chip border-dashed'
						: 'btn-chip'
			} ${className}`}
			{...buttonProps}
		>
			<span
				className={`relative z-10 items-center ${
					artworkSrc ? 'grid w-full grid-cols-[1fr_auto_1fr] md:px-3' : 'flex justify-center'
				}`}
			>
				<span className='flex justify-start'>
					{artworkSrc && artworkPlacement !== 'right' && (
						<EmotionArtwork
							src={artworkSrc}
							selected={selected}
							size={artworkSize}
							nudgeDown={artworkNudgeDown}
						/>
					)}
				</span>
				<strong className='shrink-0 whitespace-nowrap text-base font-black md:text-xl'>
					{label}
				</strong>
				<span className='flex justify-end'>
					{artworkSrc && artworkPlacement !== 'left' && (
						<EmotionArtwork
							src={artworkSrc}
							selected={selected}
							size={artworkSize}
							mirrored={artworkPlacement === 'both'}
							nudgeDown={artworkNudgeDown}
						/>
					)}
				</span>
			</span>
		</button>
	)
}

function EmotionArtwork({
	src,
	selected,
	size,
	mirrored = false,
	nudgeDown = false,
}: {
	src: string
	selected: boolean
	size: 'small' | 'medium' | 'large'
	mirrored?: boolean
	nudgeDown?: boolean
}) {
	const sizeClass = {
		small: 'w-5 md:w-8',
		medium: 'w-6 md:w-11',
		large: 'w-8 md:w-14',
	}[size]

	return (
		<img
			src={src}
			alt=''
			aria-hidden='true'
			className={`pointer-events-none h-auto shrink-0 object-contain transition-opacity ${sizeClass} ${
				mirrored ? '-scale-x-100' : ''
			} ${nudgeDown ? 'translate-y-2' : ''} ${selected ? 'opacity-80 invert' : 'opacity-75'}`}
		/>
	)
}
