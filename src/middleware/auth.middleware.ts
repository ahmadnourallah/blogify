import { Request, Response, NextFunction } from "express";
import { ClientError } from "./error.middleware";
import { User as PrismaUser } from "../prisma/src/db";
import passport from "passport";

declare global {
	namespace Express {
		interface User extends PrismaUser {}
	}
}

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
	passport.authenticate(
		"jwt",
		{ session: false },
		(err: Error, user: any, info: string) => {
			if (err) next(err);

			if (!user)
				next(
					new ClientError({ user: "User is not authenticated" }, 403)
				);

			req.user = user;
			next();
		}
	)(req, res, next);
};

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
	if (req?.user?.role !== "ADMIN")
		throw new ClientError({ user: "User is not authorized" }, 403);

	next();
};

export { isAuthenticated, isAdmin };
