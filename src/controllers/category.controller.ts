import { Request, Response } from "express";
import { PrismaClient } from "~/prisma/generated/client";
import { matchedData } from "express-validator";
import { ADAPTER } from "../config/env.config";

const prisma = new PrismaClient({ adapter: ADAPTER });

const getCategories = async (req: Request, res: Response) => {
	const { start, end, search, orderBy, order } = matchedData(req);

	const categories = await prisma.category.findMany({
		where: {
			name: { contains: search },
		},
		skip: start,
		take: end - start,
		orderBy: {
			[orderBy === "title" ? "name" : "createdAt"]: order,
		},
	});

	res.status(200).json({
		status: "success",
		data: { count: categories.length, categories },
	});
};

const getCategory = async (req: Request, res: Response) => {
	const { categoryId } = matchedData(req);

	const category = await prisma.category.findUnique({
		where: { id: categoryId },
		include: {
			_count: { select: { posts: true } },
		},
	});

	res.status(200).json({ status: "success", data: { category } });
};

const getCategoryPosts = async (req: Request, res: Response) => {
	const { start, end, search, order, orderBy, categoryId } = matchedData(req);

	const posts = await prisma.post.findMany({
		where: {
			categories: {
				some: {
					id: categoryId,
				},
			},
			OR: [
				{ title: { contains: search } },
				{ content: { contains: search } },
			],
		},
		skip: start,
		take: end - start,
		orderBy: {
			[orderBy === "title" ? "title" : "createdAt"]: order,
		},
		include: {
			author: {
				select: {
					id: true,
					name: true,
					email: true,
					bio: true,
					role: true,
				},
			},
			categories: true,
		},
	});

	res.status(200).json({
		status: "success",
		data: { count: posts.length, posts },
	});
};

const createCategory = async (req: Request, res: Response) => {
	const { name, posts } = matchedData(req);

	const newPosts =
		posts &&
		posts.map((post: string) => {
			return { title: post };
		});

	const category = await prisma.category.create({
		data: {
			name,
			posts: {
				connect: newPosts,
			},
		},
	});

	res.status(201).json({ status: "success", data: { category } });
};

const updateCategory = async (req: Request, res: Response) => {
	const { categoryId, name, posts } = matchedData(req);

	let newPosts;
	let excludedPosts;

	if (posts) {
		newPosts = posts.map((post: string) => {
			return { title: post };
		});

		const category = await prisma.category.findUnique({
			where: { id: categoryId },
			select: { posts: { select: { title: true } } },
		});

		excludedPosts = category?.posts.filter(
			(post) => !posts.includes(post.title)
		);
	}

	const category = await prisma.category.update({
		where: {
			id: categoryId,
		},
		data: {
			name,
			posts: {
				connect: newPosts,
				disconnect: excludedPosts,
			},
		},
		select: {
			id: true,
			name: true,
			createdAt: true,
			_count: { select: { posts: true } },
		},
	});

	res.status(200).json({ status: "success", data: { category } });
};

const deleteCategory = async (req: Request, res: Response) => {
	const { categoryId } = matchedData(req);

	await prisma.category.delete({ where: { id: categoryId } });

	res.status(200).json({ status: "success", data: null });
};

export default {
	getCategories,
	getCategory,
	getCategoryPosts,
	createCategory,
	updateCategory,
	deleteCategory,
};
