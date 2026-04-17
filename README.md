# CodeClass Live

CodeClass Live is a real-time collaborative learning platform designed for **tutors and students** to conduct interactive coding classes and system design sessions.

It combines **live coding, visual explanations, AI assistance, and video communication** into one seamless virtual classroom.

---

## Why CodeClass Live?

Most online classes are either:
- video-only (low engagement), or  
- code-only (no explanation layer)

CodeClass Live bridges both — enabling tutors to **teach, explain, collaborate, and get AI assistance live**, just like a physical classroom.

---

## Features

### Live Teaching Environment
- Conduct 1:1 or group sessions  
- Real-time interaction between tutor and students  
- Built specifically for teaching workflows  

---

### Collaborative Code Editor
- Powered by Monaco Editor (VS Code engine)  
- Multi-user real-time editing  
- Instant synchronization across participants  

---

### Architecture & Concept Visualizer
- Drag-and-drop canvas using ReactFlow  
- Ideal for:
  - System design  
  - Flowcharts  
  - Concept explanations  

---

### AI Tutor (Powered by Groq)
- Built-in AI assistant for:
  - Explaining code  
  - Debugging errors  
  - Generating examples  
  - Answering student doubts instantly  
- Helps tutors scale and students learn faster  
- Ultra-fast responses using Groq LLM inference  

---

### Built-in Video & Voice
- Integrated video and audio using ZegoCloud  
- No need for external tools like Zoom or Google Meet  

---

### Real-time Sync Engine
- Powered by Socket.io  
- Syncs:
  - Code changes  
  - Canvas updates  
  - Room state  

---

### Modern UI
- Clean, dark-themed interface  
- Fully responsive  
- Built with Tailwind CSS 4  

---

## Tech Stack

| Layer        | Technology                          |
|-------------|-------------------------------------|
| Framework   | Next.js 16 (App Router)             |
| Language    | TypeScript                          |
| Real-time   | Socket.io                           |
| Database    | MongoDB (Mongoose)                  |
| Styling     | Tailwind CSS 4                      |
| Code Editor | Monaco Editor                       |
| Diagrams    | ReactFlow                           |
| AI          | Groq (LLM inference)                |
| Video/Voice | ZegoCloud Prebuilt SDK              |

---

## 📦 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/codeclass-live.git
cd codeclass-live
```
### 2. Install dependencies
```bash
npm install
```
### 3. Environment Variables
```bash
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
```

### 4. Run the development servers
Terminal 1 (Frontend)
```bash
npm run dev
```
Terminal 2
```bash
num run socket
```

