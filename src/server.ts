import { PORT } from "./config/env.config";
import app from "./app";

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
