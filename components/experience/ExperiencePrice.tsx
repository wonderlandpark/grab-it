export function ExperiencePrice({
	priceWon,
	originalPriceWon,
	compact = false,
}: {
	priceWon: number
	originalPriceWon: number | null
	compact?: boolean
}) {
	const free = priceWon === 0
	const discounted = originalPriceWon !== null && originalPriceWon > priceWon
	if (free && !discounted)
		return <strong className={compact ? 'text-sm' : 'text-2xl font-black'}>무료</strong>

	const discountRate = discounted
		? Math.round(((originalPriceWon - priceWon) / originalPriceWon) * 100)
		: 0

	return (
		<div className={compact ? 'text-right' : ''}>
			{discounted && (
				<p className='text-xs text-ink/40 line-through'>{originalPriceWon.toLocaleString()}원</p>
			)}
			<div className='flex items-baseline justify-end gap-1.5'>
				{discounted && <span className='text-sm font-black text-brand'>{discountRate}%</span>}
				<strong className={compact ? 'text-sm' : 'text-2xl font-black'}>
					{free ? '무료' : `${priceWon.toLocaleString()}원`}
				</strong>
			</div>
			{discounted && !compact && (
				<p className='mt-1 text-xs font-bold text-brand'>
					{(originalPriceWon - priceWon).toLocaleString()}원 할인
				</p>
			)}
		</div>
	)
}
