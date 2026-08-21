import { activities, type ActivityValue } from '@/types/domain'

export function ActivityPicker({
	value,
	onChange,
}: {
	value: ActivityValue
	onChange: (value: ActivityValue) => void
}) {
	return (
		<div className='flex flex-wrap gap-2'>
			{activities.map((activity) => (
				<button
					key={activity.value}
					type='button'
					aria-pressed={value === activity.value}
					onClick={() => onChange(activity.value)}
					className={`rounded-full border px-4 py-2 text-sm ${
						value === activity.value
							? 'border-leaf bg-leaf text-white'
							: 'border-black/10 bg-white text-ink/70'
					}`}
				>
					{activity.label}
				</button>
			))}
		</div>
	)
}
