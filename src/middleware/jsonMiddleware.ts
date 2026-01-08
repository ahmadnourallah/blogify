import { json, Request, Response, NextFunction } from "express";
import { ClientError } from "./error.middleware";

const jsonParser = (req: Request, res: Response, next: NextFunction) => {
	json()(req, res, (err) => {
		if (err) next(new ClientError({ body: "Invalid JSON body" }, 422));
		next();
	});
};

export default jsonParser;
