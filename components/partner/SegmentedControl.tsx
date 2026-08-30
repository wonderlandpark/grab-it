interface SegmentedOption {
	value: string
	label: string
}

interface SegmentedControlProps {
	label: string
	value: string
	options: SegmentedOption[]
	onChange: (value: string) => void
	columns?: 2 | 3
	emptyMessage?: string
}

export function SegmentedControl({
	label,
	value,
	options,
	onChange,
	columns = 2,
	emptyMessage = '선택할 항목이 없어요.',
}: SegmentedControlProps) {
	const columnsClass = columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'

	return (
		<fieldset>
			<legend className='font-bold'>{label}</legend>
			{options.length ? (
				<div
					role='radiogroup'
					aria-label={label}
					className={`mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-paper p-1 ${columnsClass}`}
				>
					{options.map((option) => {
						const selected = option.value === value
						return (
							<button
								key={option.value}
								type='button'
								role='radio'
								aria-checked={selected}
								onClick={() => onChange(option.value)}
								className={`min-h-12 rounded-xl px-3 py-2 text-sm font-bold transition ${
									selected
										? 'bg-action text-white shadow-sm'
										: 'text-ink/60 hover:bg-white hover:text-ink'
								}`}
							>
								{option.label}
							</button>
						)
					})}
				</div>
			) : (
				<p className='mt-2 rounded-2xl bg-paper p-4 text-sm text-ink/50'>{emptyMessage}</p>
			)}
		</fieldset>
	)
}
