import { Request, Response } from "express";
import { PrismaClient } from "~/prisma/generated/client";
import { matchedData } from "express-validator";
import { issueJWT } from "../utils/crypto";
import { ClientError } from "../middleware/error.middleware";
import { ADAPTER } from "../config/env.config";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient({ adapter: ADAPTER });

const getUsers = async (req: Request, res: Response) => {
	const { start, end, search, order } = matchedData(req);

	const users = await prisma.user.findMany({
		where: {
			name: { contains: search },
		},
		skip: start,
		take: end - start,
		orderBy: {
			name: order,
		},
		select: { id: true, name: true, email: true, role: true, bio: true },
	});

	res.status(200).json({
		status: "success",
		data: { count: users.length, users },
	});
};

const getUser = async (req: Request, res: Response) => {
	const { userId } = matchedData(req);

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true, name: true, email: true, role: true, bio: true },
	});

	res.status(200).json({ status: "success", data: { user } });
};

const updateUserRole = async (req: Request, res: Response) => {
	const { userId, role } = matchedData(req);

	const user = await prisma.user.update({
		where: { id: userId },
		data: { role },
		select: { id: true, name: true, email: true, role: true },
	});

	res.status(200).json({ status: "success", data: { user } });
};

const createUser = async (req: Request, res: Response) => {
	const { name, email, password } = matchedData(req);

	const hashedPassword = await bcryptjs.hash(password, 10);

	const user = await prisma.user.create({
		data: { name, email, password: hashedPassword },
		select: { id: true, name: true, email: true, role: true },
	});

	const token = issueJWT(user);

	res.status(201).json({ status: "success", data: { user, token } });
};

const deleteUser = async (req: Request, res: Response) => {
	const { userId } = matchedData(req);

	await prisma.user.delete({ where: { id: userId } });

	res.status(200).json({ status: "success", data: null });
};

const authenticate = async (req: Request, res: Response) => {
	const { email, password } = matchedData(req);

	const user = await prisma.user.findUnique({ where: { email } });

	const doesMatch = await bcryptjs.compare(password, user?.password || "");

	if (!user || !doesMatch)
		throw new ClientError({ user: "Wrong email or password" }, 401);

	const token = issueJWT(user);

	res.status(200).json({
		status: "success",
		data: {
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				bio: user.bio,
				...token,
			},
		},
	});
};

export default {
	getUsers,
	getUser,
	updateUserRole,
	createUser,
	deleteUser,
	authenticate,
};
