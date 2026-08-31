const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const minute = 60_000
const afterMinutes = (minutes) => new Date(Date.now() + minutes * minute)

// 장소명, 주소, 좌표, 업종은 2026-08-30 네이버 지역 검색 결과를 기준으로 구성했다.
// 경험 상품, 유휴 슬롯, 잔여석, 할인 가격은 실제 예약 재고가 아닌 시연용 데이터다.
const seeds = [
	{
		id: 'parfum',
		externalId: '8f6a7f51dfa962eb2e867898d23a5bd01fcf24fc',
		name: '파르풍',
		category: '생활,편의>공방',
		address: '서울특별시 관악구 봉천동 871-68 2층',
		roadAddress: '서울특별시 관악구 봉천로 461 2층',
		lat: 37.4825494,
		lng: 126.9512719,
		typeCode: 'WORKSHOP',
		title: '오늘의 향 블렌딩',
		description: '여러 향을 직접 시향하고 지금의 기분을 담은 조합을 완성해요.',
		durationMinutes: 60,
		priceWon: 19000,
		originalPriceWon: 29000,
		ambienceTags: ['향기', '직접 만들기', '기분 전환'],
		emotions: ['REFRESH', 'FOCUS', 'EXCITEMENT'],
		slots: [
			[1020, 2],
			[1260, 1],
		],
	},
	{
		id: 'jd-ring',
		externalId: '70dd9065bbb4e06734c15d8c225112fcc0f3a1fa',
		name: '제이디라스 반지공방',
		category: '생활,편의>공방',
		address: '서울특별시 관악구 봉천동 871-65 4층',
		roadAddress: '서울특별시 관악구 봉천로 465 4층',
		lat: 37.4825274,
		lng: 126.9515699,
		typeCode: 'WORKSHOP',
		title: '나만의 은반지 만들기',
		description: '모양과 질감을 골라 세상에 하나뿐인 은반지를 직접 만들어요.',
		durationMinutes: 70,
		priceWon: 32000,
		originalPriceWon: 45000,
		ambienceTags: ['은반지', '손으로 만들기', '이색 체험'],
		emotions: ['COMFORT', 'FOCUS', 'EXCITEMENT'],
		slots: [
			[1110, 3],
			[1320, 2],
		],
	},
	{
		id: 'jeongseonne',
		externalId: '4a6f8db700add087e41bf0db136fba39153f539f',
		name: '정선네생선구이',
		category: '한식>생선구이',
		address: '서울특별시 관악구 봉천동 851-28 1층',
		roadAddress: '서울특별시 관악구 봉천로 483 1층',
		lat: 37.4820623,
		lng: 126.9538414,
		typeCode: 'DINING',
		title: '노포에서 즐기는 생선구이 한 상',
		description: '불향 가득한 생선구이와 따뜻한 한 상으로 저녁의 분위기를 바꿔요.',
		durationMinutes: 60,
		priceWon: 12000,
		originalPriceWon: 17000,
		ambienceTags: ['노포 감성', '불향', '한 끼'],
		emotions: ['REFRESH', 'COMFORT'],
		slots: [
			[1210, 4],
			[1360, 2],
		],
	},
	{
		id: 'love-fishing',
		externalId: 'b595e7cc41c6ee7da37116f81f8b9b2785814b7d',
		name: 'LOVE낚시카페',
		category: '스포츠,오락>낚시터',
		address: '서울특별시 관악구 봉천동 892-23 지하1층',
		roadAddress: '서울특별시 관악구 봉천로 421 지하1층',
		lat: 37.4830765,
		lng: 126.9470155,
		typeCode: 'SPORTS',
		title: '초보도 즐기는 실내 대물 낚시',
		description: '장비를 빌려 낚싯대를 던지고 실내에서 짜릿한 손맛을 경험해요.',
		durationMinutes: 60,
		priceWon: 7000,
		originalPriceWon: 11000,
		ambienceTags: ['실내 낚시', '초보 강습', '짜릿한 손맛'],
		emotions: ['COMFORT', 'ENERGY', 'EXCITEMENT'],
		slots: [
			[1300, 5],
			[1410, 3],
		],
	},
	{
		id: 'the-finder',
		externalId: '046ac4672f9cd41d4b9f74d6418f2525b640ed63',
		name: '더파인더 방탈출 서울대입구점',
		category: '방탈출카페',
		address: '서울특별시 관악구 봉천동 853-2 4층',
		roadAddress: '서울특별시 관악구 관악로16길 13 4층',
		lat: 37.4804017,
		lng: 126.9534441,
		typeCode: 'OTHER',
		title: '단서를 모아 탈출하기',
		description: '낯선 공간의 단서를 연결해 제한된 시간 안에 이야기를 완성해요.',
		durationMinutes: 60,
		priceWon: 18000,
		originalPriceWon: 25000,
		ambienceTags: ['방탈출', '추리', '반전'],
		emotions: ['AWE', 'FOCUS', 'EXCITEMENT'],
		slots: [
			[1040, 4],
			[1240, 2],
		],
	},
	{
		id: 'wall-to-wall',
		externalId: '559c3f51e9149010350627b3c523d78a4ade9569',
		name: '월투월방탈출 서울대입구점',
		category: '방탈출카페',
		address: '서울특별시 관악구 봉천동 1601-2 지하1층',
		roadAddress: '서울특별시 관악구 남부순환로226길 9 지하1층',
		lat: 37.480244,
		lng: 126.9541115,
		typeCode: 'OTHER',
		title: '이야기 속 미스터리 풀기',
		description: '몰입도 높은 테마 속에서 장치와 암호를 하나씩 풀어가요.',
		durationMinutes: 65,
		priceWon: 17000,
		originalPriceWon: 24000,
		ambienceTags: ['미스터리', '테마 공간', '협동'],
		emotions: ['AWE', 'FOCUS'],
		slots: [
			[1160, 3],
			[1340, 6],
		],
	},
	{
		id: 'holmes-lupin',
		externalId: '20ddfb1bb0c1b241c09dffb4aa3de5f9e09cb602',
		name: '홈즈앤루팡 보드게임카페 서울대입구점',
		category: '스포츠,오락>보드카페',
		address: '서울특별시 관악구 봉천동 855-11 3층',
		roadAddress: '서울특별시 관악구 관악로 156 3층',
		lat: 37.4791492,
		lng: 126.9527067,
		typeCode: 'CAFE',
		title: '처음 만나는 보드게임 한 판',
		description: '취향에 맞는 게임을 추천받아 가볍게 배우고 한 판 즐겨요.',
		durationMinutes: 75,
		priceWon: 5000,
		originalPriceWon: 8000,
		ambienceTags: ['보드게임', '게임 추천', '왁자지껄'],
		emotions: ['ENERGY', 'EXCITEMENT', 'COMFORT'],
		slots: [
			[1130, 8],
			[1310, 6],
		],
	},
	{
		id: 'sono-pottery',
		externalId: '6a9935be9786d4298c0cdf1bdc9345aa9a925c7b',
		name: '소노가 도예공방',
		category: '생활,편의>공방',
		address: '서울특별시 관악구 봉천동 1619-18 지하 1호',
		roadAddress: '서울특별시 관악구 관악로14가길 13 지하 1호',
		lat: 37.4777877,
		lng: 126.9560805,
		typeCode: 'WORKSHOP',
		title: '흙으로 빚는 작은 그릇',
		description: '차분히 흙을 만지고 형태를 다듬어 나만의 작은 그릇을 만들어요.',
		durationMinutes: 80,
		priceWon: 26000,
		originalPriceWon: 39000,
		ambienceTags: ['도예', '흙', '손의 감각'],
		emotions: ['CALM', 'FOCUS', 'REFRESH'],
		slots: [
			[1080, 2],
			[1280, 4],
		],
	},
	{
		id: 'ddodingdong',
		externalId: 'aed0dfd49461cbb939efc266ee821a8c645637e4',
		name: '또딩동스튜디오',
		category: '생활,편의>공방',
		address: '서울특별시 관악구 봉천동 1620-35 3층 301호',
		roadAddress: '서울특별시 관악구 봉천로 544-1 3층 301호',
		lat: 37.4782418,
		lng: 126.9581918,
		typeCode: 'WORKSHOP',
		title: '손끝으로 완성하는 작은 오브제',
		description: '재료와 색을 직접 골라 일상에 둘 작은 오브제를 완성해요.',
		durationMinutes: 70,
		priceWon: 21000,
		originalPriceWon: 33000,
		ambienceTags: ['오브제', '색 조합', '손으로 만들기'],
		emotions: ['REFRESH', 'EXCITEMENT'],
		slots: [
			[1060, 3],
			[1270, 1],
		],
	},
	{
		id: 'miniature',
		externalId: 'f0be55aa106a12c344faa16a95b12c458326aa11',
		name: '무인 미니어처공방 & 야망 스터디룸',
		category: '생활,편의>공방',
		address: '서울특별시 관악구 봉천동 882-2 1층 102호',
		roadAddress: '서울특별시 관악구 남부순환로216길 16 1층 102호',
		lat: 37.4808309,
		lng: 126.9488423,
		typeCode: 'WORKSHOP',
		title: '작은 세계 조립하기',
		description: '작은 부품을 골라 집중해서 나만의 미니어처 장면을 만들어요.',
		durationMinutes: 65,
		priceWon: 13000,
		originalPriceWon: 20000,
		ambienceTags: ['미니어처', '조립', '무인 공간'],
		emotions: ['FOCUS', 'AWE', 'CALM'],
		slots: [
			[1150, 4],
			[1330, 7],
		],
	},
	{
		id: 'in-climbing',
		externalId: '2fdfc4ca6822c008fa146af7c9b91a2167cbf286',
		name: '인클라이밍센터',
		category: '스포츠,오락>암벽등반',
		address: '서울특별시 관악구 봉천동 1686-21 지하 1층',
		roadAddress: '서울특별시 관악구 남부순환로 1925 지하 1층',
		lat: 37.4775333,
		lng: 126.9633039,
		typeCode: 'SPORTS',
		title: '처음 오르는 실내 클라이밍',
		description: '기초 동작을 배우고 내 수준에 맞는 짧은 루트를 직접 올라봐요.',
		durationMinutes: 60,
		priceWon: 15000,
		originalPriceWon: 22000,
		ambienceTags: ['클라이밍', '초보 체험', '몸 쓰기'],
		emotions: ['LIBERATION', 'ENERGY', 'EXCITEMENT'],
		slots: [
			[1090, 5],
			[1290, 3],
		],
	},
	{
		id: 'lala-photo',
		externalId: '3d30797d7e15a9fc4c140f3734cf13e758796318',
		name: '라라스튜디오 서울대입구점',
		category: '생활,편의>사진,스튜디오',
		address: '서울특별시 관악구 봉천동 1598-20 2층',
		roadAddress: '서울특별시 관악구 관악로 148 2층',
		lat: 37.4784232,
		lng: 126.9525673,
		typeCode: 'OTHER',
		title: '오늘의 분위기를 남기는 셀프 촬영',
		description: '조명과 배경을 골라 지금의 표정과 분위기를 사진으로 남겨요.',
		durationMinutes: 30,
		priceWon: 9000,
		originalPriceWon: 15000,
		ambienceTags: ['셀프 촬영', '조명', '오늘의 기록'],
		emotions: ['EXCITEMENT', 'REFRESH', 'COMFORT'],
		slots: [
			[1010, 2],
			[1190, 4],
			[1370, 1],
		],
	},
	{
		id: 'holostore',
		externalId: 'df90179a77f6fd5a3136543b1c1f595a8d78f5f7',
		name: '홀로상점',
		category: '서점>독립서점',
		address: '서울특별시 관악구 봉천동 1604-42 1층',
		roadAddress: '서울특별시 관악구 관악로12길 25 1층',
		lat: 37.4781506,
		lng: 126.9539897,
		typeCode: 'BOOKSTORE',
		title: '마음에 남는 문장 수집하기',
		description: '작은 독립서점에서 낯선 책을 펼치고 오늘 간직할 문장을 골라요.',
		durationMinutes: 45,
		priceWon: 4000,
		originalPriceWon: 7000,
		ambienceTags: ['독립서점', '낯선 책', '한 문장'],
		emotions: ['CALM', 'AWE', 'FOCUS'],
		slots: [
			[1070, 6],
			[1230, 3],
		],
	},
	{
		id: 'beoltoon',
		externalId: 'a83b6aa1b2a0039fe51f38a6a276a6c3828f845f',
		name: '벌툰 몽유도원 서울대입구역점',
		category: '스포츠,오락>만화방',
		address: '서울특별시 관악구 봉천동 856-1 상가동 4층 401호',
		roadAddress: '서울특별시 관악구 관악로 168 상가동 4층 401호',
		lat: 37.4801939,
		lng: 126.9529922,
		typeCode: 'CAFE',
		title: '만화 속으로 잠시 숨기',
		description: '편한 좌석에 기대 평소 읽지 않던 만화 한 권에 푹 빠져봐요.',
		durationMinutes: 60,
		priceWon: 6000,
		originalPriceWon: 9000,
		ambienceTags: ['만화', '편한 좌석', '혼자 놀기'],
		emotions: ['CALM', 'COMFORT', 'FOCUS'],
		slots: [
			[1170, 9],
			[1350, 12],
		],
	},
	{
		id: 'manyverymuch',
		externalId: '36228eeca005b2a2622b8d1ed3646fbd4138383f',
		name: 'MANYVERYMUCH',
		category: '쇼핑,유통>문구,팬시용품',
		address: '서울특별시 관악구 봉천동 1620-42 1층',
		roadAddress: '서울특별시 관악구 관악로14길 105 1층',
		lat: 37.4778785,
		lng: 126.9582031,
		typeCode: 'OTHER',
		title: '취향대로 소품 큐레이션',
		description: '다양한 소품을 천천히 둘러보고 지금의 취향을 보여주는 하나를 골라요.',
		durationMinutes: 35,
		priceWon: 0,
		originalPriceWon: null,
		ambienceTags: ['소품', '취향 발견', '골목 산책'],
		emotions: ['AWE', 'REFRESH', 'EXCITEMENT'],
		slots: [
			[1050, 10],
			[1220, 8],
		],
	},
]

// 기본 3시간 검색만으로도 결과가 나오고, 어떤 경험을 골라도 다음 슬롯으로
// 이어 붙일 수 있도록 30분 뒤부터 60분 간격의 후보를 제공한다. 경험마다
// 0~20분의 차이를 두고 좌석 수도 1~8석 사이에서 다양하게 만든다.
const demoSlotBases = [30, 90, 150, 210, 270, 330, 390, 450, 510, 570, 630, 690]
seeds.forEach((seed, seedIndex) => {
	const minuteNudge = (seedIndex % 5) * 5
	seed.slots = demoSlotBases.map((base, slotIndex) => [
		base + minuteNudge,
		1 + ((seedIndex * 3 + slotIndex * 2) % 8),
	])
})

async function resetDatabase() {
	if (process.env.RESET_DATABASE !== 'confirm-production-demo') return
	await prisma.user.deleteMany()
	await prisma.place.deleteMany()
}

async function main() {
	await resetDatabase()

	const owner = await prisma.user.upsert({
		where: { email: 'seed-partner@emotion-map.local' },
		update: { name: 'grabit 시연 파트너', isDemo: false, demoExpiresAt: null },
		create: {
			id: 'public-seed-partner',
			name: 'grabit 시연 파트너',
			email: 'seed-partner@emotion-map.local',
		},
	})

	await prisma.user.upsert({
		where: { email: 'admin@emotion-map.local' },
		update: { role: 'ADMIN', isDemo: false, demoExpiresAt: null },
		create: {
			id: 'demo-admin',
			name: '운영자',
			email: 'admin@emotion-map.local',
			role: 'ADMIN',
		},
	})

	await prisma.partnerApplication.upsert({
		where: { userId: owner.id },
		update: { status: 'APPROVED', reviewedAt: new Date() },
		create: {
			id: 'public-seed-partner-application',
			userId: owner.id,
			operatorName: 'grabit 시연 파트너',
			phone: '010-0000-0000',
			businessRegistrationNumber: 'DEMO-REAL-PLACES',
			status: 'APPROVED',
			reviewedAt: new Date(),
		},
	})

	for (const seed of seeds) {
		const placeId = `place-${seed.id}`
		const spaceId = `space-${seed.id}`
		const experienceId = `exp-${seed.id}`
		await prisma.place.upsert({
			where: { source_externalId: { source: 'NAVER_LOCAL', externalId: seed.externalId } },
			update: {
				name: seed.name,
				category: seed.category,
				address: seed.address,
				roadAddress: seed.roadAddress,
				lat: seed.lat,
				lng: seed.lng,
			},
			create: {
				id: placeId,
				source: 'NAVER_LOCAL',
				externalId: seed.externalId,
				name: seed.name,
				category: seed.category,
				address: seed.address,
				roadAddress: seed.roadAddress,
				lat: seed.lat,
				lng: seed.lng,
			},
		})

		await prisma.space.upsert({
			where: { id: spaceId },
			update: {
				ownerId: owner.id,
				placeId,
				name: seed.name,
				description: `${seed.category}의 실제 장소 정보를 바탕으로 구성한 시연용 공간입니다.`,
				typeCode: seed.typeCode,
				address: seed.address,
				roadAddress: seed.roadAddress,
				lat: seed.lat,
				lng: seed.lng,
				rules: '실제 장소 기반 시연용 슬롯입니다. 예약과 결제는 실제로 이루어지지 않습니다.',
				status: 'PUBLISHED',
			},
			create: {
				id: spaceId,
				ownerId: owner.id,
				placeId,
				name: seed.name,
				description: `${seed.category}의 실제 장소 정보를 바탕으로 구성한 시연용 공간입니다.`,
				typeCode: seed.typeCode,
				address: seed.address,
				roadAddress: seed.roadAddress,
				lat: seed.lat,
				lng: seed.lng,
				rules: '실제 장소 기반 시연용 슬롯입니다. 예약과 결제는 실제로 이루어지지 않습니다.',
				status: 'PUBLISHED',
			},
		})

		await prisma.experience.upsert({
			where: { id: experienceId },
			update: {
				spaceId,
				title: seed.title,
				description: seed.description,
				durationMinutes: seed.durationMinutes,
				priceWon: seed.priceWon,
				originalPriceWon: seed.originalPriceWon,
				ambienceTags: seed.ambienceTags,
				status: 'PUBLISHED',
				isDemoPublic: true,
			},
			create: {
				id: experienceId,
				spaceId,
				title: seed.title,
				description: seed.description,
				durationMinutes: seed.durationMinutes,
				priceWon: seed.priceWon,
				originalPriceWon: seed.originalPriceWon,
				ambienceTags: seed.ambienceTags,
				status: 'PUBLISHED',
				isDemoPublic: true,
			},
		})

		await prisma.experienceEmotion.deleteMany({ where: { experienceId } })
		await prisma.experienceEmotion.createMany({
			data: seed.emotions.map((emotion) => ({ experienceId, emotion })),
		})
		// 이미 체험자가 예약한 슬롯은 유지하고, 예약이 없는 공개 시연 슬롯만 갱신한다.
		await prisma.slot.deleteMany({ where: { experienceId, bookings: { none: {} } } })
		await prisma.slot.createMany({
			data: seed.slots.map(([offset, capacity], index) => {
				const startsAt = afterMinutes(offset)
				return {
					id: `${experienceId}-slot-${index + 1}`,
					experienceId,
					startsAt,
					endsAt: new Date(startsAt.getTime() + seed.durationMinutes * minute),
					bookingClosesAt: new Date(startsAt.getTime() - 10 * minute),
					capacity,
					status: 'OPEN',
				}
			}),
			skipDuplicates: true,
		})
	}

	console.log(`Seeded ${seeds.length} real places and ${seeds.length} demo experiences.`)
	console.log(
		`Course window: ${afterMinutes(demoSlotBases[0]).toISOString()} ~ ${afterMinutes(demoSlotBases.at(-1) + 120).toISOString()}`
	)
}

main()
	.catch((error) => {
		console.error(error)
		process.exitCode = 1
	})
	.finally(() => prisma.$disconnect())
