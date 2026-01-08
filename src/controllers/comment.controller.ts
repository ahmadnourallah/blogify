import { Request, Response } from "express";
import { PrismaClient } from "~/prisma/generated/client";
import { matchedData } from "express-validator";
import { ADAPTER } from "../config/env.config";

const prisma = new PrismaClient({ adapter: ADAPTER });

const getComments = async (req: Request, res: Response) => {
	const { start, end, search, order } = matchedData(req);

	const comments = await prisma.comment.findMany({
		where: {
			content: { contains: search },
		},
		skip: start,
		take: end - start,
		orderBy: {
			createdAt: order,
		},
	});

	res.status(200).json({
		status: "success",
		data: { count: comments.length, comments },
	});
};

const getComment = async (req: Request, res: Response) => {
	const { commentId } = matchedData(req);

	const comment = await prisma.comment.findUnique({
		where: { id: commentId },
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
			replies: true,
		},
	});

	res.status(200).json({ status: "success", data: { comment } });
};

const createComment = async (req: Request, res: Response) => {
	const { content, authorId, postId, parentCommentId } = matchedData(req);

	const comment = await prisma.comment.create({
		data: {
			content,
			author: { connect: { id: authorId } },
			post: { connect: { id: postId } },
			parentComment:
				parentCommentId !== undefined
					? { connect: { id: parentCommentId } }
					: undefined,
		},
	});

	res.status(201).json({ status: "success", data: { comment } });
};

const updateComment = async (req: Request, res: Response) => {
	const { commentId, content, authorId, postId, parentCommentId } =
		matchedData(req);

	const comment = await prisma.comment.update({
		where: {
			id: commentId,
		},

		data: {
			content,
			author: { connect: { id: authorId } },
			post: { connect: { id: postId } },
			parentComment:
				parentCommentId !== undefined
					? { connect: { id: parentCommentId } }
					: undefined,
		},

		include: { replies: true },
	});

	res.status(200).json({ status: "success", data: { comment } });
};

const deleteComment = async (req: Request, res: Response) => {
	const { commentId } = matchedData(req);

	await prisma.comment.delete({ where: { id: commentId } });

	res.status(200).json({ status: "success", data: null });
};

export default {
	getComments,
	getComment,
	createComment,
	updateComment,
	deleteComment,
};
