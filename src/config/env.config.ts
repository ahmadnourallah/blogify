import { PrismaPg } from "@prisma/adapter-pg";
import type { StringValue } from "ms";
import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;
export const DB_URL = process.env.DB_URL || "";
export const JWT_SECRET = process.env.JWT_SECRET || "";
export const JWT_EXPIRATION_TIME =
	(process.env.JWT_EXPIRATION_TIME as StringValue) || "2d";
export const ALLOWED_ORIGINS = JSON.parse(process.env.ALLOWED_ORIGINS || "[]");
export const THUMBNAILS_PATH = process.env.THUMBNAILS_PATH || "";
export const ADAPTER = new PrismaPg({ connectionString: DB_URL });
