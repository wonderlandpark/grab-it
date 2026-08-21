import { emotions, type EmotionValue } from '@/types/domain'

export function EmotionPicker({
	value,
	onChange,
}: {
	value: EmotionValue[]
	onChange: (value: EmotionValue[]) => void
}) {
	function toggle(emotion: EmotionValue) {
		onChange(value.includes(emotion) ? value.filter((item) => item !== emotion) : [...value, emotion])
	}

	return (
		<div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
			{emotions.map((emotion) => {
				const active = value.includes(emotion.value)
				return (
					<button
						key={emotion.value}
						type='button'
						aria-pressed={active}
						onClick={() => toggle(emotion.value)}
						className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-left transition ${
							active ? 'border-leaf bg-mist font-semibold text-leaf' : 'border-black/10 bg-white'
						}`}
					>
						<span>{emotion.emoji}</span>
						{emotion.label}
					</button>
				)
			})}
		</div>
	)
}
