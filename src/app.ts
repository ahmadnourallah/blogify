import {
	serverErrorHandler,
	clientErrorHandler,
} from "./middleware/error.middleware";
import { ALLOWED_ORIGINS } from "./config/env.config";
import express from "express";
import postRouter from "./routes/post.router";
import categoryRouter from "./routes/category.router";
import commentRouter from "./routes/comment.router";
import userRouter from "./routes/user.router";
import miscRouter from "./routes/misc.router";
import cors from "cors";
import "./config/passport.config";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	cors({
		origin: function (origin: string | undefined, callback: Function) {
			// allow requests with no origin
			if (!origin) return callback(null, true);
			if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
				var msg =
					"The CORS policy for this site does not " +
					"allow access from the specified Origin.";
				return callback(new Error(msg), false);
			}
			return callback(null, true);
		},
	})
);

app.use("/thumbnails", express.static("thumbnails/"));
app.use("/posts", postRouter);
app.use("/categories", categoryRouter);
app.use("/comments", commentRouter);
app.use("/users", userRouter);
app.use("/", miscRouter);

app.use(clientErrorHandler);
app.use(serverErrorHandler);

export default app;
