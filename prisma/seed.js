const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
	const demoUser = await prisma.user.upsert({
		where: { email: 'demo@emotion-map.local' },
		update: { name: '감정 여행자' },
		create: {
			id: 'demo-user',
			name: '감정 여행자',
			email: 'demo@emotion-map.local',
		},
	})
	const neighbor = await prisma.user.upsert({
		where: { email: 'neighbor@emotion-map.local' },
		update: { name: '서울 산책자' },
		create: {
			id: 'demo-neighbor',
			name: '서울 산책자',
			email: 'neighbor@emotion-map.local',
		},
	})
	await prisma.user.upsert({
		where: { email: 'admin@emotion-map.local' },
		update: { role: 'ADMIN' },
		create: {
			id: 'demo-admin',
			name: '운영자',
			email: 'admin@emotion-map.local',
			role: 'ADMIN',
		},
	})

	const places = await Promise.all(
		[
			{
				id: 'demo-place-seoul-forest',
				externalId: 'demo-seoul-forest',
				name: '서울숲',
				category: '도시공원',
				address: '서울특별시 성동구 성수동1가 685-20',
				roadAddress: '서울특별시 성동구 뚝섬로 273',
				latitude: 37.5444,
				longitude: 127.0374,
			},
			{
				id: 'demo-place-nodeul',
				externalId: 'demo-nodeul-island',
				name: '노들섬',
				category: '문화공간',
				address: '서울특별시 용산구 이촌동 302-146',
				roadAddress: '서울특별시 용산구 양녕로 445',
				latitude: 37.5177,
				longitude: 126.958,
			},
			{
				id: 'demo-place-bukchon',
				externalId: 'demo-bukchon',
				name: '북촌한옥마을',
				category: '관광명소',
				address: '서울특별시 종로구 계동',
				roadAddress: '서울특별시 종로구 계동길 37',
				latitude: 37.5815,
				longitude: 126.9849,
			},
		].map((place) =>
			prisma.place.upsert({
				where: { source_externalId: { source: 'DEMO', externalId: place.externalId } },
				update: place,
				create: { ...place, source: 'DEMO' },
			}),
		),
	)

	const experienceData = [
			{
				id: 'demo-exp-calm',
				authorId: neighbor.id,
				placeId: places[0].id,
				activity: 'WALK',
				body: '나무 사이로 천천히 걸으니 복잡했던 마음이 차분해졌어요.',
				exactLatitude: 37.5444,
				exactLongitude: 127.0374,
				displayLatitude: 37.5451,
				displayLongitude: 127.0365,
			},
			{
				id: 'demo-exp-refresh',
				authorId: demoUser.id,
				placeId: places[1].id,
				activity: 'REST',
				body: '강바람을 맞으며 잠깐 쉬었더니 머리가 맑아졌습니다.',
				exactLatitude: 37.5177,
				exactLongitude: 126.958,
				displayLatitude: 37.5185,
				displayLongitude: 126.9591,
			},
			{
				id: 'demo-exp-awe',
				authorId: neighbor.id,
				placeId: places[2].id,
				activity: 'VIEW',
				body: '해 질 무렵 지붕 너머로 번지는 빛을 한참 바라봤어요.',
				exactLatitude: 37.5815,
				exactLongitude: 126.9849,
				displayLatitude: 37.5807,
				displayLongitude: 126.9858,
			},
			{
				id: 'demo-exp-comfort',
				authorId: demoUser.id,
				placeId: places[0].id,
				activity: 'TALK',
				body: '벤치에 앉아 오래 미뤄둔 이야기를 나누고 위로받았어요.',
				exactLatitude: 37.5439,
				exactLongitude: 127.0382,
				displayLatitude: 37.5432,
				displayLongitude: 127.0391,
			},
			{
				id: 'demo-exp-private',
				authorId: demoUser.id,
				placeId: places[1].id,
				activity: 'OTHER',
				body: '나만 간직하고 싶은 개인 기록입니다.',
				visibility: 'PRIVATE',
				exactLatitude: 37.5172,
				exactLongitude: 126.9585,
				displayLatitude: 37.5164,
				displayLongitude: 126.9576,
			},
	]
	for (const experience of experienceData) {
		await prisma.experience.upsert({
			where: { id: experience.id },
			create: experience,
			update: experience,
		})
	}

	await prisma.experienceEmotion.createMany({
		data: [
			{ experienceId: 'demo-exp-calm', emotion: 'CALM' },
			{ experienceId: 'demo-exp-refresh', emotion: 'REFRESH' },
			{ experienceId: 'demo-exp-refresh', emotion: 'LIBERATION' },
			{ experienceId: 'demo-exp-awe', emotion: 'AWE' },
			{ experienceId: 'demo-exp-awe', emotion: 'EXCITEMENT' },
			{ experienceId: 'demo-exp-comfort', emotion: 'COMFORT' },
			{ experienceId: 'demo-exp-private', emotion: 'CALM' },
		],
		skipDuplicates: true,
	})
	await prisma.resonance.createMany({
		data: [{ experienceId: 'demo-exp-calm', userId: demoUser.id }],
		skipDuplicates: true,
	})
}

main()
	.catch((error) => {
		console.error(error)
		process.exitCode = 1
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
