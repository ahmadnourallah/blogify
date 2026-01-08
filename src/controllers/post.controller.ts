import { Request, Response } from "express";
import { PrismaClient } from "~/prisma/generated/client";
import { matchedData } from "express-validator";
import { ADAPTER } from "../config/env.config";

const prisma = new PrismaClient({ adapter: ADAPTER });

const getPosts = async (req: Request, res: Response) => {
	const { start, end, search, orderBy, order } = matchedData(req);

	const posts = await prisma.post.findMany({
		where: {
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

const getPost = async (req: Request, res: Response) => {
	const { postId } = matchedData(req);

	const post = await prisma.post.findUnique({
		where: { id: postId },
		include: {
			author: { select: { name: true, email: true, bio: true } },
			categories: true,
		},
	});

	res.status(200).json({ status: "success", data: { post } });
};

const getPostComments = async (req: Request, res: Response) => {
	const { postId, start, end, search, order } = matchedData(req);

	const comments = await prisma.comment.findMany({
		where: {
			post: { id: postId },
			content: { contains: search },
		},
		skip: start,
		take: end - start,
		orderBy: {
			createdAt: order,
		},
		include: {
			author: { select: { name: true, email: true } },
			replies: true,
		},
	});

	res.status(200).json({
		status: "success",
		data: { count: comments.length, comments },
	});
};

const createPost = async (req: Request, res: Response) => {
	const { title, content, authorId, categories } = matchedData(req);

	const newCategories =
		categories &&
		categories.map((category: string) => {
			return {
				where: { name: category },
				create: { name: category },
			};
		});

	const post = await prisma.post.create({
		data: {
			title,
			thumbnail: req.file?.path,
			content,
			authorId,
			categories: {
				connectOrCreate: newCategories,
			},
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

	res.status(201).json({ status: "success", data: { post } });
};

const updatePost = async (req: Request, res: Response) => {
	const { postId, title, content, authorId, categories } = matchedData(req);

	let newCategories;
	let excludedCategories;

	if (categories) {
		newCategories = categories.map((category: string) => {
			return {
				where: { name: category },
				create: { name: category },
			};
		});

		const post = await prisma.post.findUnique({
			where: { id: postId },
			select: { categories: { select: { name: true } } },
		});

		excludedCategories = post?.categories.filter(
			(category) => !categories.includes(category.name)
		);
	}

	const post = await prisma.post.update({
		where: {
			id: postId,
		},
		data: {
			title,
			thumbnail: req.file?.path,
			content,
			authorId,
			categories: {
				connectOrCreate: newCategories,
				disconnect: excludedCategories,
			},
		},

		include: {
			author: { select: { name: true, email: true, bio: true } },
			categories: true,
		},
	});

	res.status(200).json({ status: "success", data: { post } });
};

const deletePost = async (req: Request, res: Response) => {
	const { postId } = matchedData(req);

	await prisma.post.delete({ where: { id: postId } });

	res.status(200).json({ status: "success", data: null });
};

export default {
	getPosts,
	getPost,
	getPostComments,
	createPost,
	updatePost,
	deletePost,
};
