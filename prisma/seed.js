const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const afterMinutes = (minutes) => new Date(Date.now() + minutes * 60000)

async function main() {
	await prisma.user.deleteMany({ where: { email: 'demo@emotion-map.local' } })
	const publicOwner = await prisma.user.upsert({
		where: { email: 'seed-partner@emotion-map.local' },
		update: { name: '공개 데모 공간 운영자', isDemo: false, demoExpiresAt: null },
		create: {
			id: 'public-seed-partner',
			name: '공개 데모 공간 운영자',
			email: 'seed-partner@emotion-map.local',
		},
	})
	await prisma.user.upsert({
		where: { email: 'admin@emotion-map.local' },
		update: { role: 'ADMIN' },
		create: { id: 'demo-admin', name: '운영자', email: 'admin@emotion-map.local', role: 'ADMIN' },
	})
	await prisma.partnerApplication.upsert({
		where: { userId: publicOwner.id },
		update: { status: 'APPROVED' },
		create: {
			id: 'public-seed-partner-application',
			userId: publicOwner.id,
			operatorName: '공개 데모 운영자',
			phone: '체험용',
			businessRegistrationNumber: 'SEED-DEMO',
			status: 'APPROVED',
		},
	})

	const seeds = [
		{
			space: {
				id: 'space-workshop',
				name: '성수 작은 공방',
				description: '햇빛 드는 테이블에서 손을 움직이는 작은 공방',
				typeCode: 'WORKSHOP',
				address: '서울 성동구 성수동1가',
				roadAddress: '서울 성동구 서울숲길 24',
				lat: 37.5452,
				lng: 127.0412,
				rules: '재료는 현장에서 제공하며 시작 10분 전부터 입장할 수 있어요.',
			},
			experience: {
				id: 'exp-pottery',
				title: '흙을 만지며 생각 비우기',
				description: '작은 찻잔 하나를 빚으며 복잡한 생각을 잠시 내려놓아요.',
				durationMinutes: 60,
				priceWon: 18000,
				ambienceTags: ['몰입', '햇빛', '손으로 만들기'],
				emotions: ['CALM', 'REFRESH', 'FOCUS'],
				starts: [50, 210, 900],
				capacity: 100,
			},
		},
		{
			space: {
				id: 'space-bookstore',
				name: '틈 독립서점',
				description: '혼자여도 외롭지 않은 조용한 동네 서점',
				typeCode: 'BOOKSTORE',
				address: '서울 성동구 성수동2가',
				roadAddress: '서울 성동구 연무장길 41',
				lat: 37.5431,
				lng: 127.0544,
				rules: '음료 한 잔이 포함되어 있어요.',
			},
			experience: {
				id: 'exp-reading',
				title: '조용한 창가에서 45분',
				description: '오늘의 기분에 맞춘 짧은 글과 따뜻한 차를 준비해 드려요.',
				durationMinutes: 45,
				priceWon: 6500,
				ambienceTags: ['조용함', '창가', '사람 온기'],
				emotions: ['CALM', 'COMFORT', 'FOCUS'],
				starts: [25, 120, 480],
				capacity: 100,
			},
		},
		{
			space: {
				id: 'space-fitness',
				name: '리셋 무브 스튜디오',
				description: '비수업 시간에 소규모 움직임 세션을 여는 스튜디오',
				typeCode: 'SPORTS',
				address: '서울 광진구 자양동',
				roadAddress: '서울 광진구 아차산로 221',
				lat: 37.5418,
				lng: 127.0677,
				rules: '편한 복장으로 오세요. 매트는 제공됩니다.',
			},
			experience: {
				id: 'exp-stretch',
				title: '몸부터 깨우는 리셋 스트레칭',
				description: '강도가 낮은 스트레칭으로 굳은 몸과 기분을 깨워요.',
				durationMinutes: 50,
				priceWon: 12000,
				ambienceTags: ['움직임', '해방감', '소규모'],
				emotions: ['ENERGY', 'LIBERATION', 'REFRESH'],
				starts: [80, 170, 600],
				capacity: 100,
			},
		},
		{
			space: {
				id: 'space-culture',
				name: '문래 소리방',
				description: '낮 시간에 비는 소규모 공연장을 감상실로 엽니다.',
				typeCode: 'CULTURE',
				address: '서울 영등포구 문래동3가',
				roadAddress: '서울 영등포구 도림로128길 3',
				lat: 37.5152,
				lng: 126.8958,
				rules: '정시 입장 후 자유롭게 머물 수 있어요.',
			},
			experience: {
				id: 'exp-listening',
				title: '낯선 음악에 기대는 한 시간',
				description: '오늘의 플레이리스트를 작은 공연장 음향으로 감상해요.',
				durationMinutes: 60,
				priceWon: 9000,
				ambienceTags: ['낯선 자극', '음악', '어두운 공간'],
				emotions: ['AWE', 'EXCITEMENT', 'REFRESH'],
				starts: [150, 720],
				capacity: 100,
			},
		},
	]

	for (const seed of seeds) {
		await prisma.space.upsert({
			where: { id: seed.space.id },
			update: { ...seed.space, ownerId: publicOwner.id, status: 'PUBLISHED' },
			create: { ...seed.space, ownerId: publicOwner.id, status: 'PUBLISHED' },
		})
		const exp = seed.experience
		await prisma.experience.upsert({
			where: { id: exp.id },
			update: {
				spaceId: seed.space.id,
				title: exp.title,
				description: exp.description,
				durationMinutes: exp.durationMinutes,
				priceWon: exp.priceWon,
				ambienceTags: exp.ambienceTags,
				status: 'PUBLISHED',
				isDemoPublic: true,
			},
			create: {
				id: exp.id,
				spaceId: seed.space.id,
				title: exp.title,
				description: exp.description,
				durationMinutes: exp.durationMinutes,
				priceWon: exp.priceWon,
				ambienceTags: exp.ambienceTags,
				status: 'PUBLISHED',
				isDemoPublic: true,
			},
		})
		await prisma.experienceEmotion.deleteMany({ where: { experienceId: exp.id } })
		await prisma.experienceEmotion.createMany({
			data: exp.emotions.map((emotion) => ({ experienceId: exp.id, emotion })),
		})
		for (const [index, minutes] of exp.starts.entries()) {
			const startsAt = afterMinutes(minutes)
			const data = {
				experienceId: exp.id,
				startsAt,
				endsAt: new Date(startsAt.getTime() + exp.durationMinutes * 60000),
				bookingClosesAt: new Date(startsAt.getTime() - 300000),
				capacity: exp.capacity,
				status: 'OPEN',
			}
			await prisma.slot.upsert({
				where: { id: `${exp.id}-slot-${index + 1}` },
				update: data,
				create: { id: `${exp.id}-slot-${index + 1}`, ...data },
			})
		}
	}
}

main()
	.catch((error) => {
		console.error(error)
		process.exitCode = 1
	})
	.finally(() => prisma.$disconnect())
