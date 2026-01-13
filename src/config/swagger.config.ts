import { version } from "../../package.json";
import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Blogify Docs",
			version,
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
	},
	apis: ["./src/specs/*.yaml"],
	components: ["./src/specs/*.yaml"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
