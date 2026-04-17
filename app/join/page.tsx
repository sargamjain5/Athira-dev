"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Video, User, Key } from "lucide-react";

// 1. The actual content of your Join Page
function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [role, setRole] = useState("student");

  // Automatically fill Room ID from URL if present
  useEffect(() => {
    const sessionFromUrl = searchParams.get("sessionId");
    if (sessionFromUrl) setRoomId(sessionFromUrl);
  }, [searchParams]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !roomId) return alert("Please fill in all fields");

    // Redirect to the room with query parameters
    router.push(`/room?sessionId=${roomId}&name=${encodeURIComponent(name)}&role=${role}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0d1117] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Join Live Classroom</h1>
          <p className="text-zinc-500 text-sm mt-2 text-center">
            Enter your details to enter the session
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-all text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">
              Room ID
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Session ID"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-all text-sm font-mono"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                role === "student" ? "bg-white text-black" : "bg-white/5 text-zinc-500 hover:bg-white/10"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole("tutor")}
              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                role === "tutor" ? "bg-blue-600 text-white" : "bg-white/5 text-zinc-500 hover:bg-white/10"
              }`}
            >
              Tutor
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black font-black py-4 rounded-xl mt-4 hover:bg-zinc-200 transition-all text-xs uppercase tracking-widest"
          >
            Enter Classroom
          </button>
        </form>
      </div>
    </div>
  );
}

// 2. The Main Page Export (This fixes the Vercel Build Error)
export default function JoinPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">
            Configuring Session...
          </p>
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}