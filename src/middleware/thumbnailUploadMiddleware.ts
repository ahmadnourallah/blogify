import type { Request, Response, NextFunction } from "express";
import { ClientError } from "./error.middleware";
import multer from "multer";

const thumbnailUploadMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const upload = multer({
		dest: "thumbnails/",
		fileFilter: (req: Request, file, callback: Function) => {
			if (!file.mimetype.startsWith("image/")) {
				return callback(new Error("Thumbnail must be an image."));
			}

			callback(null, true);
		},
		limits: { files: 1, fileSize: 2e7 }, // 20mb file size limit
	}).single("thumbnail");

	upload(req, res, (err) => {
		if (err) {
			next(
				new ClientError({
					thumbnail: err.message,
				})
			);
		}

		next();
	});
};

export default thumbnailUploadMiddleware;
