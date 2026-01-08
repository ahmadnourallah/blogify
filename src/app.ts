import {
	serverErrorHandler,
	clientErrorHandler,
} from "./middleware/error.middleware";
import { existsSync, mkdir } from "fs";
import express from "express";
import postRouter from "./routes/post.router";
import categoryRouter from "./routes/category.router";
import commentRouter from "./routes/comment.router";
import userRouter from "./routes/user.router";
import miscRouter from "./routes/misc.router";
import cors from "cors";
import jsonParser from "./middleware/jsonMiddleware";
import multer from "multer";
import "./config/passport.config";

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(jsonParser);

if (!existsSync("thumbnails")) mkdir("thumbnails", () => null);

app.use("/thumbnails", express.static("thumbnails/"));
app.use("/posts", postRouter);
app.use(multer().none());
app.use("/categories", categoryRouter);
app.use("/comments", commentRouter);
app.use("/users", userRouter);
app.use("/", miscRouter);

app.use(clientErrorHandler);
app.use(serverErrorHandler);

export default app;
