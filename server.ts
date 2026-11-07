import "dotenv/config";
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

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

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

  app.post("/api/editor-advice", async (req, res) => {
    try {
      const { projectTitle, projectDescription, currentGrade } = req.body || {};
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          advice: "• Experiment with faster intercutting.\n• Try a more desaturated color palette.\n• Layer more ambient soundscapes."
        });
      }
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an expert AI video editing assistant built into a portfolio website. 
The current project being viewed is "${projectTitle || 'Video Project'}". 
Description: ${projectDescription || 'Creative showcase'}. 
Current Color Grade applied: ${currentGrade || 'REC709'}.

Provide 3 brief, punchy editing or storytelling tips (15 words each) for this specific project. 
Return them as a simple bulleted list. 
Keep the tone technical, cool, and professional.`,
      });
      res.json({ advice: response.text });
    } catch (error) {
      console.error("AI Assistant Error:", error);
      res.json({
        advice: "• Experiment with faster intercutting.\n• Try a more desaturated color palette.\n• Layer more ambient soundscapes."
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
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

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
