import type { CSSProperties } from 'react'

type Option = { value: number; label: string }

function progressStyle(index: number, maximum: number) {
	return { '--range-progress': `${maximum ? (index / maximum) * 100 : 0}%` } as CSSProperties
}

export function NumberLineSlider({
	label,
	value,
	options,
	onChange,
}: {
	label: string
	value: number
	options: readonly Option[]
	onChange: (value: number) => void
}) {
	const index = Math.max(
		0,
		options.findIndex((option) => option.value === value)
	)
	return (
		<fieldset className='rounded-2xl border border-black/10 bg-paper/45 p-5'>
			<legend className='sr-only'>{label}</legend>
			<div className='flex items-center justify-between gap-3'>
				<span className='font-black'>{label}</span>
				<output className='rounded-full bg-leaf px-3 py-1 text-sm font-bold text-white'>
					{options[index].label}
				</output>
			</div>
			<input
				aria-label={label}
				type='range'
				min='0'
				max={options.length - 1}
				step='1'
				value={index}
				onChange={(event) => onChange(options[Number(event.target.value)].value)}
				className='number-line-range mt-6'
				style={progressStyle(index, options.length - 1)}
			/>
			<div className='mt-3 flex justify-between'>
				{options.map((option) => (
					<button
						key={option.value}
						type='button'
						onClick={() => onChange(option.value)}
						className={`max-w-16 text-center text-[11px] leading-tight ${option.value === value ? 'font-black text-leaf' : 'text-ink/45'}`}
					>
						{option.label}
					</button>
				))}
			</div>
		</fieldset>
	)
}

export function BudgetNumberLine({
	value,
	onChange,
}: {
	value: string
	onChange: (value: string) => void
}) {
	const numeric = value ? Number(value) : 0
	const sliderValue = Math.min(Math.max(numeric, 0), 100000)
	const display = numeric > 0 ? `${numeric.toLocaleString()}원` : '제한 없음'
	return (
		<fieldset className='rounded-2xl border border-black/10 bg-paper/45 p-5'>
			<legend className='sr-only'>최대 예산</legend>
			<div className='flex items-center justify-between gap-3'>
				<span className='font-black'>
					최대 예산 <span className='font-normal text-ink/40'>선택</span>
				</span>
				<output className='rounded-full bg-leaf px-3 py-1 text-sm font-bold text-white'>
					{display}
				</output>
			</div>
			<input
				aria-label='최대 예산 슬라이더'
				type='range'
				min='0'
				max='100000'
				step='1000'
				value={sliderValue}
				onChange={(event) => onChange(event.target.value === '0' ? '' : event.target.value)}
				className='number-line-range mt-6'
				style={progressStyle(sliderValue, 100000)}
			/>
			<div className='relative mt-3 h-4 text-[11px] text-ink/45'>
				<span className='absolute left-0'>제한 없음</span>
				<span className='absolute left-[20%] -translate-x-1/2'>2만원</span>
				<span className='absolute left-1/2 -translate-x-1/2'>5만원</span>
				<span className='absolute right-0'>10만원+</span>
			</div>
			<label className='mt-5 block text-sm font-bold'>
				정확한 금액 직접 입력
				<div className='relative mt-2'>
					<input
						value={value}
						onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 9))}
						inputMode='numeric'
						placeholder='예: 25000'
						className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 pr-10'
					/>
					<span className='absolute right-4 top-3 text-ink/40'>원</span>
				</div>
			</label>
		</fieldset>
	)
}
