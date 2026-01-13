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
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gmail.com";
export const ADMIN_PASS = process.env.ADMIN_PASS || "admin123!";
export const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";
export const ADAPTER = new PrismaPg({ connectionString: DB_URL });
