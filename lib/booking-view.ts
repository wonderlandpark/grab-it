import { bookingToken } from '@/lib/booking-token'

export function bookingView(booking: any) {
	const active = booking.slot.bookings
		? booking.slot.bookings.filter(
				(item: any) => item.status === 'CONFIRMED' || item.status === 'CHECKED_IN'
			).length
		: 0
	return {
		id: booking.id,
		status: booking.status,
		currentState: booking.currentState,
		desiredEmotion: booking.desiredEmotion,
		qrToken: bookingToken(booking.id),
		createdAt: booking.createdAt.toISOString(),
		cancelledAt: booking.cancelledAt?.toISOString() || null,
		checkedInAt: booking.checkedInAt?.toISOString() || null,
		review: booking.review ? { id: booking.review.id } : null,
		slot: {
			id: booking.slot.id,
			startsAt: booking.slot.startsAt.toISOString(),
			endsAt: booking.slot.endsAt.toISOString(),
			bookingClosesAt: booking.slot.bookingClosesAt.toISOString(),
			capacity: booking.slot.capacity,
			availableSeats: Math.max(0, booking.slot.capacity - active),
			experience: {
				id: booking.slot.experience.id,
				title: booking.slot.experience.title,
				priceWon: booking.slot.experience.priceWon,
				isDemoPublic: booking.slot.experience.isDemoPublic,
				space: {
					id: booking.slot.experience.space.id,
					name: booking.slot.experience.space.name,
					address:
						booking.slot.experience.space.roadAddress || booking.slot.experience.space.address,
				},
			},
		},
	}
}

export const bookingInclude = {
	review: { select: { id: true } },
	slot: {
		include: { bookings: { select: { status: true } }, experience: { include: { space: true } } },
	},
} as const
