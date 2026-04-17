import { Server } from "socket.io";
import http from "http";

// Create a basic HTTP server to attach Socket.io to
const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow your Next.js frontend
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("✅ User Connected:", socket.id);

  // Join a specific session room
  socket.on("join-room", (roomId: string) => {
    socket.join(roomId);
    console.log(`👤 User ${socket.id} joined room: ${roomId}`);
  });

  // Sync Code Changes
  // We use .broadcast.to() so the sender doesn't receive their own typing back
  socket.on("code-change", ({ sessionId, code }: { sessionId: string; code: string }) => {
    socket.broadcast.to(sessionId).emit("code-change", code);
  });

  // Sync Stdin/Input Changes
  socket.on("input-change", ({ sessionId, input }: { sessionId: string; input: string }) => {
    socket.broadcast.to(sessionId).emit("input-change", input);
  });

  // Handle Code Execution broadcast (Student -> Tutor)
  socket.on("code-run", (data: any) => {
    // data usually contains { sessionId, code, output, language, studentName }
    if (data.sessionId) {
      socket.broadcast.to(data.sessionId).emit("student-code-executed", data);
      console.log(`🚀 Code execution broadcasted in room: ${data.sessionId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User Disconnected:", socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Socket server running on http://localhost:${PORT}`);
});