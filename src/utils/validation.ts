import { NextFunction, Request, Response } from "express";
import { ClientError } from "../middleware/error.middleware";
import { validationResult, query, param, body } from "express-validator";
import { PrismaClient } from "~/prisma/generated/client";
import { ADAPTER } from "../config/env.config";

const prisma = new PrismaClient({ adapter: ADAPTER });

const validateResults = (req: Request, res: Response, next: NextFunction) => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		throw new ClientError(
			errors
				.formatWith(({ path, msg }) => {
					return { [path]: msg };
				})
				.array()
		);
	next();
};

const validateUser = () => [
	body("name").trim().notEmpty().withMessage("Name cannot be empty"),
	body("email")
		.trim()
		.escape()
		.notEmpty()
		.withMessage("Email cannot be empty")
		.isEmail()
		.withMessage("Email must be valid")
		.custom(async (email, { req }) => {
			const userExists = await prisma.user.findFirst({
				where: { id: { not: req?.params?.userId }, email },
			});
			if (userExists) throw new Error("Email already exists");
		}),
	body("password")
		.trim()
		.escape()
		.notEmpty()
		.withMessage("Password cannot be empty")
		.isLength({ min: 8, max: 16 })
		.withMessage("Password must be between 8-16 characters")
		.matches("[0-9]")
		.withMessage("Password must contain a number")
		.matches("(?=.*?[#@$?])")
		.withMessage("Password must contain a special character"),
	validateResults,
];

const validateUserRole = () => [
	body("role")
		.trim()
		.escape()
		.notEmpty()
		.withMessage("Role cannot be empty")
		.isString()
		.withMessage("Role must be a string")
		.custom((role) => role === "ADMIN" || role === "VISITOR")
		.withMessage("Role must be ADMIN or VISITOR"),
	validateResults,
];

const validateLogin = () => [
	body("email").trim().notEmpty().withMessage("Email cannot be empty"),
	body("password").trim().notEmpty().withMessage("Password cannot be empty"),
	validateResults,
];

const validateQueries = () => [
	query("start")
		.default(0)
		.toInt()
		.isNumeric()
		.isLength({ min: 0 })
		.withMessage("Start must be a number")
		.withMessage("Start cannot be negative")
		.customSanitizer((start) => {
			if (start > 0) return start - 1;
			return start;
		}),
	query("end")
		.default(10)
		.toInt()
		.isNumeric()
		.withMessage("End must be a number")
		.isLength({ min: 0 })
		.withMessage("End cannot be negative")
		.custom((end, { req }) => !(end <= Number(req?.query?.start)))
		.withMessage("End must be larger than start")
		.custom((end, { req }) => !(end - Number(req?.query?.start) >= 30))
		.withMessage("Maximum number of items requested is 30"),
	query("search")
		.default("")
		.trim()
		.isString()
		.withMessage("Search must be a string"),
	query("orderBy")
		.default("date")
		.trim()
		.escape()
		.custom((orderBy) => orderBy === "date" || orderBy === "title")
		.withMessage("Order must be by title or date"),
	query("order")
		.default("asc")
		.trim()
		.escape()
		.custom((order) => order === "asc" || order === "desc")
		.withMessage("Order must be asc or desc"),
	validateResults,
];

const validatePost = (validateId = false) => [
	body("title")
		.trim()
		.notEmpty()
		.withMessage("Title cannot be empty")
		.isString()
		.withMessage("Title must be a string")
		.custom(async (title, { req }) => {
			const postExists = await prisma.post.findFirst({
				where: { id: { not: req?.params?.postId }, title },
			});

			if (postExists) throw new Error("Title must be unique");
		}),
	body("content")
		.trim()
		.notEmpty()
		.withMessage("Content cannot be empty")
		.isString()
		.withMessage("Content must be a string"),
	body("authorId")
		.trim()
		.escape()
		.notEmpty()
		.withMessage("Author's id cannot be empty")
		.bail()
		.toInt()
		.isNumeric()
		.withMessage("Author's id must be a number")
		.bail()
		.custom(async (authorId) => {
			const userExists = await prisma.user.findUnique({
				where: { id: authorId },
			});

			if (!userExists) throw new Error("Author does not exist");
		}),
	body("categories")
		.trim()
		.optional()
		.toArray()
		.isArray()
		.withMessage("Categories must be an array"),
	validateResults,
];

const validatePostId = () => [
	param("postId")
		.trim()
		.escape()
		.notEmpty()
		.withMessage("Post's id cannot be empty")
		.bail()
		.toInt()
		.isNumeric()
		.withMessage("Post's id must be a number")
		.bail(),

	validateResults,

	async (req: Request, res: Response, next: NextFunction) => {
		const postExists = await prisma.post.findUnique({
			where: { id: req?.params?.postId as unknown as number },
		});

		if (!postExists)
			throw new ClientError({ resource: "Resource not found" }, 404);
		next();
	},
];

const validateCategory = (validateId = false) => [
	body("name")
		.trim()
		.notEmpty()
		.withMessage("Category cannot be empty")
		.bail()
		.isString()
		.withMessage("Category must be a string")
		.bail()
		.custom(async (name, { req }) => {
			const categoryExists = await prisma.category.findFirst({
				where: { id: { not: req?.params?.categoryId }, name },
			});

			if (categoryExists) throw new Error("Category must be unique");
		}),
	body("posts")
		.trim()
		.optional()
		.toArray()
		.isArray()
		.withMessage("Posts must be an array of titles")
		.bail()
		.custom(async (posts) => {
			for (let post of posts) {
				const postExists = await prisma.post.findUnique({
					where: { title: post },
				});

				if (!postExists) throw new Error("Some posts don't exist");
			}
		}),
	validateResults,
];

const validateCategoryId = () => [
	param("categoryId")
		.trim()
		.escape()
		.notEmpty()
		.withMessage("Category's id cannot be empty")
		.bail()
		.toInt()
		.isNumeric()
		.withMessage("Category's id must be a number")
		.bail(),

	validateResults,

	async (req: Request, res: Response, next: NextFunction) => {
		const categoryExists = await prisma.category.findUnique({
			where: { id: req?.params?.categoryId as unknown as number },
		});

		if (!categoryExists)
			throw new ClientError({ resource: "Resource not found" }, 404);
		next();
	},
];

const validateComment = () => [
	body("content")
		.trim()
		.notEmpty()
		.withMessage("Content cannot be empty")
		.isString()
		.withMessage("Content must be a string"),
	body("postId")
		.trim()
		.escape()
		.notEmpty()
		.withMessage("Post's id cannot be empty")
		.bail()
		.toInt()
		.isNumeric()
		.withMessage("Post's id must be a number")
		.bail()
		.custom(async (postId) => {
			const postExists = await prisma.post.findUnique({
				where: { id: postId },
			});

			if (!postExists) throw new Error("Post does not exist");
		}),
	body("parentCommentId")
		.optional()
		.toInt()
		.isNumeric()
		.withMessage("parent comment's id must be a number")
		.bail()
		.custom(async (parentCommentId) => {
			const parentCommentExists = await prisma.comment.findUnique({
				where: { id: parentCommentId },
			});

			if (!parentCommentExists)
				throw new Error("Parent comment does not exist");
		}),
	body("authorId")
		.trim()
		.escape()
		.notEmpty()
		.withMessage("Author's id cannot be empty")
		.bail()
		.toInt()
		.isNumeric()
		.withMessage("Author's id must be a number")
		.bail()
		.custom(async (authorId, { req }) => {
			const userExists = await prisma.user.findUnique({
				where: { id: authorId },
			});

			if (!userExists) throw new Error("Author does not exist");
		}),

	validateResults,

	async (req: Request, res: Response, next: NextFunction) => {
		if (
			req?.body?.authorId !== req?.user?.id &&
			req?.user?.role !== "ADMIN"
		)
			throw new ClientError(
				{ authorId: "Action is not authorized" },
				403
			);
	},
];

const validateCommentId = (validateUser = false) => [
	param("commentId")
		.trim()
		.escape()
		.notEmpty()
		.withMessage("Comment's id cannot be empty")
		.bail()
		.toInt()
		.isNumeric()
		.withMessage("Comment's id must be a number")
		.bail(),

	validateResults,

	async (req: Request, res: Response, next: NextFunction) => {
		const commentExists = await prisma.comment.findUnique({
			where: { id: req?.params?.commentId as unknown as number },
		});

		if (!commentExists)
			throw new ClientError({ resource: "Resource not found" }, 404);
		if (
			validateUser &&
			commentExists?.authorId !== req?.user?.id &&
			req?.user?.role !== "ADMIN"
		)
			throw new ClientError(
				{ authorId: "Action is not authorized" },
				403
			);
		next();
	},
];

const validateUserId = () => [
	param("userId")
		.trim()
		.escape()
		.notEmpty()
		.withMessage("User's id cannot be empty")
		.bail()
		.toInt()
		.isNumeric()
		.withMessage("User's id must be a number")
		.bail(),

	validateResults,

	async (req: Request, res: Response, next: NextFunction) => {
		const userExists = await prisma.user.findUnique({
			where: { id: req?.params?.userId as unknown as number },
		});

		if (!userExists)
			throw new ClientError({ resource: "Resource not found" }, 404);
		next();
	},
];

export {
	validateUser,
	validateUserRole,
	validateUserId,
	validateLogin,
	validateResults,
	validateQueries,
	validatePost,
	validatePostId,
	validateCategory,
	validateCategoryId,
	validateComment,
	validateCommentId,
};
