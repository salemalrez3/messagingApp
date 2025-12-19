import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import { setupSwagger } from "./swagger";
import msgsRouter from "./routes/msgs.routes";
import userRouter from "./routes/user.routes";
import chatRouter from "./routes/chat.routes";
import profileRouter from "./routes/profile.routes";
import path from "path";
import { auth, validateContact } from "./middleware/auth";
import os from "os"; // ADD THIS!

const app = express();
const server = http.createServer(app);

const dbPath = process.env.NODE_ENV === 'production' 
  ? '/data/dev.db' 
  : path.join(__dirname, '../prisma/dev.db');

// ADD: Auto-detect IP function
function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168.')) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const YOUR_IP = getLocalIP(); // This will be 192.168.1.108
const PORT = parseInt(process.env.PORT || '5000', 10);

// CORS
app.use(cors({
  origin: '*', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(express.json());

app.get("/ping", (req, res) => {
  res.json({
    success: true,
    message: "✅ Server is running!",
    serverTime: new Date().toISOString(),
    serverIP: YOUR_IP,
    port: PORT,
    clientIP: req.ip,
    endpoints: {
      docs: "/api/docs",
      apiBase: "/",
      testAuth: "/ping-auth"
    }
  });
});

app.get("/ping-auth", auth, (req: any, res) => {
  res.json({
    success: true,
    message: "✅ Auth is working!",
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

app.use("/chats", auth,validateContact, chatRouter);
app.use("/msgs", auth,validateContact, msgsRouter);
app.use("/profile", auth,validateContact, profileRouter);
app.use("/",validateContact, userRouter);

// Pass your IP to swagger
setupSwagger(app, YOUR_IP, PORT);

server.listen({
  port: PORT,
  host: '0.0.0.0' 
}, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                     SERVER IS RUNNING                    ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║     FOR MOBILE TESTING (Your Phone):                     ║
║     http://${YOUR_IP}:${PORT}/api/docs                   ║
║     http://${YOUR_IP}:${PORT}/ping                       ║
║                                                          ║
║     FOR LOCAL BROWSER (Your Computer):                   ║
║     http://localhost:${PORT}/api/docs                    ║
║     http://localhost:${PORT}/ping                        ║
║                                                          ║
║      API BASE URL for Mobile App:                        ║
║      http://${YOUR_IP}:${PORT}                           ║
║                                                          ║
║      Database path: ${dbPath}                            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

🔥 QUICK TEST:
   On your phone browser, open: http://${YOUR_IP}:${PORT}/ping
   
   If you see JSON, SUCCESS!
   If you see error, check:
   1. Same WiFi ✓
   2. Firewall off ✓
   3. IP correct: ${YOUR_IP} ✓
`);
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ PORT ${PORT} is already in use!`);
    console.log(`💡 Try: kill -9 $(lsof -t -i:${PORT}) or use different port`);
    process.exit(1);
  }
  console.error('❌ Server error:', error);
});