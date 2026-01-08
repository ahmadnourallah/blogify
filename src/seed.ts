import { PrismaClient } from "~/prisma/generated/client";
import {
	ADMIN_EMAIL,
	ADMIN_NAME,
	ADMIN_PASS,
	ADAPTER,
} from "./config/env.config";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient({ adapter: ADAPTER });

async function purge() {
	await prisma.post.deleteMany();
	await prisma.user.deleteMany();
	await prisma.category.deleteMany();
	await prisma.comment.deleteMany();
}

async function seed() {
	const admin = await prisma.user.upsert({
		where: { email: ADMIN_EMAIL },
		update: {},
		create: {
			name: ADMIN_NAME,
			email: ADMIN_EMAIL,
			password: await bcryptjs.hash(ADMIN_PASS, 10),
			role: "ADMIN",
		},
	});
}

async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0 || (args[0] !== "seed" && args[0] !== "purge"))
		console.log("Pass purge or seed");

	try {
		if (args[0] === "seed") await seed();
		else await purge();
	} catch (e) {
		console.log(e);
		process.exit(1);
	}

	await prisma.$disconnect();
}

main();
