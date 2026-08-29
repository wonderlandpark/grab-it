const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
	const now = new Date()
	const result = await prisma.user.deleteMany({
		where: { isDemo: true, demoExpiresAt: { lt: now } },
	})
	console.log(`만료된 게스트 ${result.count}명을 정리했습니다.`)
}

main()
	.catch((error) => {
		console.error(error)
		process.exitCode = 1
	})
	.finally(() => prisma.$disconnect())
