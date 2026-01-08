import { ExtractJwt, Strategy } from "passport-jwt";
import { ADAPTER, JWT_SECRET } from "./env.config";
import { PrismaClient } from "~/prisma/generated/client";
import type { JwtPayload } from "jsonwebtoken";
import type { VerifiedCallback, StrategyOptions } from "passport-jwt";
import passport from "passport";

const prisma = new PrismaClient({ adapter: ADAPTER });

const opts: StrategyOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: JWT_SECRET,
};

passport.use(
	new Strategy(opts, async (payload: JwtPayload, done: VerifiedCallback) => {
		try {
			const user = await prisma.user.findUnique({
				where: {
					id: payload.id,
				},
			});

			if (user) return done(null, user);
			else return done(null, false);
		} catch (error) {
			return done(error);
		}
	})
);
