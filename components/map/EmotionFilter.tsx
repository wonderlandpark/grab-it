import { emotions, type EmotionValue } from '@/types/domain'

interface EmotionFilterProps {
	selected: EmotionValue[]
	onChange: (emotions: EmotionValue[]) => void
	compact?: boolean
}

export default function EmotionFilter({
	selected,
	onChange,
	compact = false,
}: EmotionFilterProps) {
	const toggleEmotion = (emotion: EmotionValue) => {
		onChange(
			selected.includes(emotion)
				? selected.filter((value) => value !== emotion)
				: [...selected, emotion],
		)
	}

	return (
		<div
			className={`flex gap-2 ${compact ? 'overflow-x-auto px-4 pb-2 pt-3' : 'flex-wrap'}`}
			aria-label="감정 필터"
		>
			{emotions.map((emotion) => {
				const isSelected = selected.includes(emotion.value)

				return (
					<button
						key={emotion.value}
						type="button"
						aria-pressed={isSelected}
						onClick={() => toggleEmotion(emotion.value)}
						className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:ring-offset-2 ${
							isSelected
								? 'border-transparent text-white'
								: 'border-white/80 bg-white/90 text-ink hover:bg-white'
						}`}
						style={isSelected ? { backgroundColor: emotion.color } : undefined}
					>
						<span aria-hidden="true">{emotion.emoji}</span>
						{emotion.label}
					</button>
				)
			})}
			{selected.length > 0 && !compact ? (
				<button
					type="button"
					onClick={() => onChange([])}
					className="rounded-full px-2 py-2 text-sm font-semibold text-slate-500 hover:text-ink focus:outline-none focus:ring-2 focus:ring-leaf/40"
				>
					초기화
				</button>
			) : null}
		</div>
	)
}
