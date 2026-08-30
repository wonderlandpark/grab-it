const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const afterMinutes = (minutes) => new Date(Date.now() + minutes * 60000)
const reviewWindowStart = new Date(process.env.DEMO_REVIEW_START || '2026-08-31T14:00:00+09:00')
const reviewOffsets = [
	10, 25, 40, 55, 70, 85, 100, 115, 130, 145, 160, 175, 190, 205, 220, 235, 250,
]

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
				name: '봉천 작은 공방',
				description: '햇빛 드는 테이블에서 손을 움직이는 작은 공방',
				typeCode: 'WORKSHOP',
				address: '서울 관악구 봉천동',
				roadAddress: '서울 관악구 관악로14길 24',
				lat: 37.4819,
				lng: 126.9511,
				rules: '재료는 현장에서 제공하며 시작 10분 전부터 입장할 수 있어요.',
			},
			experience: {
				id: 'exp-pottery',
				title: '흙을 만지며 생각 비우기',
				description: '작은 찻잔 하나를 빚으며 복잡한 생각을 잠시 내려놓아요.',
				durationMinutes: 60,
				priceWon: 18000,
				originalPriceWon: 30000,
				ambienceTags: ['몰입', '햇빛', '손으로 만들기'],
				emotions: ['CALM', 'REFRESH', 'FOCUS'],
				starts: [95, 300, 900],
				capacities: [2, 4, 1],
			},
		},
		{
			space: {
				id: 'space-bookstore',
				name: '샤로수길 grabit 독립서점',
				description: '혼자여도 외롭지 않은 조용한 동네 서점',
				typeCode: 'BOOKSTORE',
				address: '서울 관악구 봉천동',
				roadAddress: '서울 관악구 관악로14길 41',
				lat: 37.4798,
				lng: 126.9534,
				rules: '음료 한 잔이 포함되어 있어요.',
			},
			experience: {
				id: 'exp-reading',
				title: '조용한 창가에서 45분',
				description: '오늘의 기분에 맞춘 짧은 글과 따뜻한 차를 준비해 드려요.',
				durationMinutes: 45,
				priceWon: 6500,
				originalPriceWon: 10000,
				ambienceTags: ['조용함', '창가', '이색적'],
				emotions: ['CALM', 'COMFORT', 'FOCUS'],
				starts: [25, 120, 480],
				capacities: [6, 3, 8],
			},
		},
		{
			space: {
				id: 'space-fitness',
				name: '리셋 무브 스튜디오',
				description: '비수업 시간에 소규모 움직임 세션을 여는 스튜디오',
				typeCode: 'SPORTS',
				address: '서울 관악구 낙성대동',
				roadAddress: '서울 관악구 남부순환로 1913',
				lat: 37.4772,
				lng: 126.9621,
				rules: '편한 복장으로 오세요. 매트는 제공됩니다.',
			},
			experience: {
				id: 'exp-stretch',
				title: '몸부터 깨우는 리셋 스트레칭',
				description: '강도가 낮은 스트레칭으로 굳은 몸과 기분을 깨워요.',
				durationMinutes: 50,
				priceWon: 12000,
				originalPriceWon: 20000,
				ambienceTags: ['움직임', '해방감', '소규모'],
				emotions: ['ENERGY', 'LIBERATION', 'REFRESH'],
				starts: [180, 360, 600],
				capacities: [3, 5, 2],
			},
		},
		{
			space: {
				id: 'space-culture',
				name: '관악 소리방',
				description: '낮 시간에 비는 소규모 공연장을 감상실로 엽니다.',
				typeCode: 'CULTURE',
				address: '서울 관악구 청룡동',
				roadAddress: '서울 관악구 쑥고개로 3',
				lat: 37.4839,
				lng: 126.9438,
				rules: '정시 입장 후 자유롭게 머물 수 있어요.',
			},
			experience: {
				id: 'exp-listening',
				title: '낯선 음악에 기대는 한 시간',
				description: '오늘의 플레이리스트를 작은 공연장 음향으로 감상해요.',
				durationMinutes: 60,
				priceWon: 9000,
				originalPriceWon: 15000,
				ambienceTags: ['낯선 자극', '음악', '어두운 공간'],
				emotions: ['AWE', 'EXCITEMENT', 'REFRESH'],
				starts: [150, 720],
				capacities: [12, 6],
			},
		},
		{
			space: {
				id: 'space-siheung-workshop',
				name: '배곧 바다빛 공방',
				description: '시흥캠퍼스 인근에서 바다색 소품을 만드는 작은 공방',
				typeCode: 'WORKSHOP',
				address: '경기도 시흥시 배곧동',
				roadAddress: '경기도 시흥시 서울대학로 173 인근',
				lat: 37.3657,
				lng: 126.7208,
				rules: '재료와 앞치마를 제공하며 시작 5분 전부터 입장할 수 있어요.',
			},
			experience: {
				id: 'exp-siheung-seaglass',
				title: '바다 유리로 작은 모빌 만들기',
				description: '빛을 머금은 조각을 엮으며 머릿속을 가볍게 비워요.',
				durationMinutes: 70,
				priceWon: 19000,
				originalPriceWon: 32000,
				ambienceTags: ['손으로 만들기', '몰입', '바다색'],
				emotions: ['CALM', 'REFRESH', 'FOCUS'],
				starts: [35, 240, 600],
				capacities: [2, 5, 1],
			},
		},
		{
			space: {
				id: 'space-siheung-fitness',
				name: '캠퍼스 리커버리룸',
				description: '수업 사이 비는 시간에 소규모 회복 세션을 여는 움직임 공간',
				typeCode: 'FITNESS',
				address: '경기도 시흥시 배곧동',
				roadAddress: '경기도 시흥시 서울대학로 190 인근',
				lat: 37.3636,
				lng: 126.7197,
				rules: '편한 복장으로 참여해 주세요. 운동 도구는 현장에서 제공합니다.',
			},
			experience: {
				id: 'exp-siheung-recovery',
				title: '굳은 몸을 깨우는 40분 리커버리',
				description: '가벼운 움직임과 호흡으로 오래 앉아 있던 몸을 깨워요.',
				durationMinutes: 40,
				priceWon: 11000,
				originalPriceWon: 18000,
				ambienceTags: ['움직임', '호흡', '해방감'],
				emotions: ['ENERGY', 'LIBERATION', 'REFRESH'],
				starts: [120, 330, 720],
				capacities: [4, 2, 6],
			},
		},
		{
			space: {
				id: 'space-siheung-book-lounge',
				name: '배곧 수변 북라운지',
				description: '창밖의 물빛을 보며 혼자 머물 수 있는 조용한 북라운지',
				typeCode: 'BOOKSTORE',
				address: '경기도 시흥시 배곧동',
				roadAddress: '경기도 시흥시 서울대학로278번길 인근',
				lat: 37.3691,
				lng: 126.7253,
				rules: '차 한 잔이 포함되며 좌석 내 통화는 어려워요.',
			},
			experience: {
				id: 'exp-siheung-reading',
				title: '물빛 보며 혼자 읽는 50분',
				description: '오늘의 감정에 어울리는 짧은 책과 따뜻한 차를 준비해요.',
				durationMinutes: 50,
				priceWon: 7000,
				originalPriceWon: 12000,
				ambienceTags: ['조용함', '창가', '물빛'],
				emotions: ['CALM', 'COMFORT', 'FOCUS'],
				starts: [75, 270, 510],
				capacities: [8, 4, 10],
			},
		},
		{
			space: {
				id: 'space-siheung-culture',
				name: '오션 사운드 스튜디오',
				description: '한산한 시간의 소형 스튜디오를 음악 감상 공간으로 엽니다.',
				typeCode: 'CULTURE',
				address: '경기도 시흥시 배곧동',
				roadAddress: '경기도 시흥시 배곧2로 82 인근',
				lat: 37.3662,
				lng: 126.7246,
				rules: '정시 입장 후 지정 좌석에서 자유롭게 감상할 수 있어요.',
			},
			experience: {
				id: 'exp-siheung-sound',
				title: '낯선 음악으로 환기하는 한 시간',
				description: '작은 스튜디오의 풍부한 소리로 익숙한 하루에 자극을 더해요.',
				durationMinutes: 60,
				priceWon: 8000,
				originalPriceWon: 14000,
				ambienceTags: ['음악', '낯선 자극', '몰입'],
				emotions: ['AWE', 'EXCITEMENT', 'REFRESH'],
				starts: [165, 390, 780],
				capacities: [12, 6, 3],
			},
		},
		{
			space: {
				id: 'space-siheung-cafe',
				name: '캠퍼스 루프 라운지',
				description: '햇빛과 사람 기척을 적당히 느낄 수 있는 캠퍼스 인근 라운지',
				typeCode: 'CAFE',
				address: '경기도 시흥시 배곧동',
				roadAddress: '경기도 시흥시 서울대학로 173 인근',
				lat: 37.3677,
				lng: 126.7215,
				rules: '음료 한 잔과 지정 좌석 이용이 포함되어 있어요.',
			},
			experience: {
				id: 'exp-siheung-sunset',
				title: '햇빛 드는 자리에서 느리게 쉬기',
				description: '창가 좌석과 따뜻한 음료로 혼자여도 편안한 쉼을 만들어요.',
				durationMinutes: 45,
				priceWon: 5500,
				originalPriceWon: 9000,
				ambienceTags: ['햇빛', '창가', '사람 온기'],
				emotions: ['COMFORT', 'CALM', 'REFRESH'],
				starts: [210, 450, 840],
				capacities: [5, 2, 7],
			},
		},
		{
			space: {
				id: 'space-beauty',
				name: '샤로수길 무드 네일',
				description: '예약 사이에 비는 자리를 짧은 손끝 케어로 여는 작은 뷰티숍',
				typeCode: 'BEAUTY',
				address: '서울 관악구 봉천동',
				roadAddress: '서울 관악구 봉천로 534 인근',
				lat: 37.4786,
				lng: 126.9557,
				rules: '간단한 컬러와 케어 중 현장에서 선택할 수 있어요.',
			},
			experience: {
				id: 'exp-nail-reset',
				title: '손끝부터 바꾸는 40분 무드 케어',
				description: '짧은 컬러 케어로 오늘의 분위기를 가볍게 전환해요.',
				durationMinutes: 40,
				priceWon: 22000,
				originalPriceWon: 35000,
				ambienceTags: ['기분 전환', '컬러', '1인 케어'],
				emotions: ['REFRESH', 'EXCITEMENT', 'COMFORT'],
				starts: [45, 210, 430, 780],
				capacities: [1, 2, 1, 3],
			},
		},
		{
			space: {
				id: 'space-focus-desk',
				name: '관악 포커스 데스크',
				description: '한산한 시간대의 창가 집중석을 짧게 여는 공유 작업 공간',
				typeCode: 'COWORKING',
				address: '서울 관악구 청룡동',
				roadAddress: '서울 관악구 관악로 164 인근',
				lat: 37.4815,
				lng: 126.9491,
				rules: '콘센트와 와이파이를 제공하며 통화는 라운지에서 가능해요.',
			},
			experience: {
				id: 'exp-focus-desk',
				title: '창가 집중석에서 몰입하는 90분',
				description: '해야 할 일 하나만 정해 조용한 창가에서 끝내보세요.',
				durationMinutes: 90,
				priceWon: 4000,
				originalPriceWon: 8000,
				ambienceTags: ['콘센트', '자연광', '조용함'],
				emotions: ['FOCUS', 'CALM'],
				starts: [60, 260, 520, 850],
				capacities: [7, 3, 9, 2],
			},
		},
		{
			space: {
				id: 'space-counter-dining',
				name: '낙성 작은 식탁',
				description: '예약 전 비는 바 좌석에서 계절 한 접시를 내는 작은 다이닝',
				typeCode: 'DINING',
				address: '서울 관악구 낙성대동',
				roadAddress: '서울 관악구 인헌길 23 인근',
				lat: 37.4764,
				lng: 126.9594,
				rules: '알레르기가 있다면 입장 전에 운영자에게 알려주세요.',
			},
			experience: {
				id: 'exp-seasonal-plate',
				title: '혼자 앉는 오늘의 한 접시',
				description: '바 좌석에서 계절 재료로 만든 한 접시를 천천히 즐겨요.',
				durationMinutes: 60,
				priceWon: 25000,
				originalPriceWon: 40000,
				ambienceTags: ['바 좌석', '계절 메뉴', '혼자 식사'],
				emotions: ['COMFORT', 'EXCITEMENT', 'REFRESH'],
				starts: [110, 330, 570, 900],
				capacities: [2, 1, 4, 2],
			},
		},
		{
			space: {
				id: 'space-pet-care',
				name: '봉천 포근펫 케어룸',
				description: '예약 사이 비는 케어 테이블을 산책 전 간단 관리에 활용해요.',
				typeCode: 'PET_CARE',
				address: '서울 관악구 봉천동',
				roadAddress: '서울 관악구 은천로 92 인근',
				lat: 37.486,
				lng: 126.9427,
				rules: '반려동물의 특이사항을 시작 전에 알려주세요.',
			},
			experience: {
				id: 'exp-pet-refresh',
				title: '산책 전 45분 포근 케어',
				description: '발 세정과 빗질을 마치고 가벼운 산책 준비까지 도와드려요.',
				durationMinutes: 45,
				priceWon: 16000,
				originalPriceWon: 26000,
				ambienceTags: ['반려동물', '포근함', '산책 준비'],
				emotions: ['COMFORT', 'ENERGY', 'REFRESH'],
				starts: [80, 290, 490, 820],
				capacities: [1, 1, 2, 1],
			},
		},
		{
			space: {
				id: 'space-siheung-perfume',
				name: '배곧 바람 향 작업실',
				description: '수변의 향을 작은 병에 담아보는 시흥캠퍼스 인근 작업실',
				typeCode: 'WORKSHOP',
				address: '경기도 시흥시 배곧동',
				roadAddress: '경기도 시흥시 배곧4로 32 인근',
				lat: 37.3671,
				lng: 126.7182,
				rules: '향료 알레르기가 있다면 참여 전에 알려주세요.',
			},
			experience: {
				id: 'exp-siheung-perfume',
				title: '바다 향 미니 향수 블렌딩',
				description: '세 가지 향을 골라 오늘의 기분을 작은 향수로 남겨요.',
				durationMinutes: 55,
				priceWon: 17000,
				originalPriceWon: 29000,
				ambienceTags: ['향기', '손으로 만들기', '바다'],
				emotions: ['REFRESH', 'FOCUS', 'EXCITEMENT'],
				starts: [50, 230, 470, 760],
				capacities: [3, 1, 5, 2],
			},
		},
		{
			space: {
				id: 'space-siheung-focus-booth',
				name: '캠퍼스 사이 집중 부스',
				description: '회의 사이 비는 방음 부스를 개인 몰입 공간으로 엽니다.',
				typeCode: 'COWORKING',
				address: '경기도 시흥시 배곧동',
				roadAddress: '경기도 시흥시 서울대학로 173 인근',
				lat: 37.365,
				lng: 126.7193,
				rules: '부스 내 음식 섭취는 어렵고 생수는 제공돼요.',
			},
			experience: {
				id: 'exp-siheung-focus-booth',
				title: '방해 없이 끝내는 집중 60분',
				description: '조용한 부스에서 미뤄둔 일 하나를 끝내는 시간을 가져요.',
				durationMinutes: 60,
				priceWon: 3000,
				originalPriceWon: 6000,
				ambienceTags: ['방음', '몰입', '1인 공간'],
				emotions: ['FOCUS', 'CALM'],
				starts: [30, 195, 405, 690],
				capacities: [5, 2, 8, 4],
			},
		},
		{
			space: {
				id: 'space-siheung-gallery',
				name: '수변 포켓 갤러리',
				description: '전시 교체 전 비는 작은 공간을 짧은 감상 세션으로 엽니다.',
				typeCode: 'CULTURE',
				address: '경기도 시흥시 배곧동',
				roadAddress: '경기도 시흥시 배곧2로 95 인근',
				lat: 37.3698,
				lng: 126.7221,
				rules: '작품과의 안전거리를 지켜주세요. 사진 촬영은 가능해요.',
			},
			experience: {
				id: 'exp-siheung-pocket-gallery',
				title: '낯선 이미지에 머무는 35분',
				description: '작은 전시와 큐레이션 카드로 익숙한 하루에 자극을 더해요.',
				durationMinutes: 35,
				priceWon: 0,
				originalPriceWon: null,
				ambienceTags: ['전시', '낯선 자극', '조용함'],
				emotions: ['AWE', 'EXCITEMENT', 'CALM'],
				starts: [70, 245, 455, 740],
				capacities: [9, 4, 12, 6],
			},
		},
		{
			space: {
				id: 'space-siheung-running',
				name: '배곧 수변 러닝 베이스',
				description: '러닝 클래스 전 비는 시간에 짧은 워밍업 세션을 엽니다.',
				typeCode: 'SPORTS',
				address: '경기도 시흥시 배곧동',
				roadAddress: '경기도 시흥시 해송십리로 61 인근',
				lat: 37.371,
				lng: 126.728,
				rules: '운동화와 편한 복장으로 참여해 주세요.',
			},
			experience: {
				id: 'exp-siheung-running',
				title: '수변을 깨우는 45분 러닝',
				description: '가벼운 워밍업 뒤 수변을 천천히 달리며 몸과 기분을 깨워요.',
				durationMinutes: 45,
				priceWon: 6000,
				originalPriceWon: 12000,
				ambienceTags: ['야외', '움직임', '바람'],
				emotions: ['ENERGY', 'LIBERATION', 'REFRESH'],
				starts: [90, 275, 500, 800],
				capacities: [6, 10, 3, 8],
			},
		},
	]

	for (const [seedIndex, seed] of seeds.entries()) {
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
				originalPriceWon: exp.originalPriceWon,
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
				originalPriceWon: exp.originalPriceWon,
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
				capacity: exp.capacities[index],
				status: 'OPEN',
			}
			await prisma.slot.upsert({
				where: { id: `${exp.id}-slot-${index + 1}` },
				update: data,
				create: { id: `${exp.id}-slot-${index + 1}`, ...data },
			})
		}

		for (let index = 0; index < 3; index += 1) {
			const offset = reviewOffsets[(seedIndex + index * 6) % reviewOffsets.length]
			const startsAt = new Date(reviewWindowStart.getTime() + offset * 60000)
			const data = {
				experienceId: exp.id,
				startsAt,
				endsAt: new Date(startsAt.getTime() + exp.durationMinutes * 60000),
				bookingClosesAt: startsAt,
				capacity: [1, 2, 3, 4, 6, 8, 12][(seedIndex + index * 2) % 7],
				status: 'OPEN',
			}
			await prisma.slot.upsert({
				where: { id: `${exp.id}-review-slot-${index + 1}` },
				update: data,
				create: { id: `${exp.id}-review-slot-${index + 1}`, ...data },
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
