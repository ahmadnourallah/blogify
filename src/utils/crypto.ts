import { JWT_EXPIRATION_TIME, JWT_SECRET } from "../config/env.config";
import type { User } from "~/prisma/generated/client";
import jwt from "jsonwebtoken";

function issueJWT(user: Omit<User, "password" | "bio">) {
	const id = user.id;
	const expiresIn = JWT_EXPIRATION_TIME;
	const payload = { id, iat: Date.now() };

	const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

	return { token, expiresIn };
}

export { issueJWT };
