import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import { setupSwagger } from "./swagger";
import msgsRouter from "./routes/msgs.routes";
import userRouter from "./routes/user.routes";
import path from "path";
import { auth } from "./middleware/auth";


const app = express();
const server = http.createServer(app);

const dbPath = process.env.NODE_ENV === 'production' 
  ? '/data/dev.db' 
  : path.join(__dirname, '../prisma/dev.db');


app.use(helmet());
app.use(express.json());
app.use(cors({
  origin: [process.env.FRONTEND_URL || "http://localhost:5173"].filter(Boolean),
  credentials: true,
}));

app.use("/msgs" ,auth, msgsRouter);
app.use("/",userRouter);
setupSwagger(app);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} with WebSocket support`);
  console.log(`📊 SQLite path: ${dbPath}`);
});