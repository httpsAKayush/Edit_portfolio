import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.join(__dirname, "shared-state.json");

async function startServer() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  // Initial state retrieval
  const getInitialState = () => {
    if (fs.existsSync(STATE_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
      } catch (e) {
        return {};
      }
    }
    return {};
  };

  let sharedState = getInitialState();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    
    // Send current state to newly connected client
    socket.emit("init:state", sharedState);

    socket.on("sequence:update", (data: { projectId: string, sequence: any[] }) => {
      const { projectId, sequence } = data;
      console.log(`[SOCKET] Received update for ${projectId}. Sequence parts: ${sequence.length}`);
      sharedState[projectId] = sequence;
      
      // Persist to file
      try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(sharedState, null, 2));
        console.log(`[STATE] Persisted state to ${STATE_FILE}`);
      } catch (e) {
        console.error(`[ERR] Failed to write state file:`, e);
      }
      
      // Broadcast to all other clients
      socket.broadcast.emit("sequence:updated", { projectId, sequence });
      console.log(`[SOCKET] Broadcasted update for ${projectId} to all clients`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API Routes
  app.get("/api/state", (req, res) => {
    res.json(sharedState);
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
