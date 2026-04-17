"use client";
import Link from "next/link";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Draggable from "react-draggable";
import { getSocket } from "@/lib/socket"; // ✅ Updated to use your lib
import CodeEditor from "./CodeEditor";
import AIPanel from "./AIPanel";
import ProfessorReviewTab from "./ProfessorReviewTab";
import { Loader2, Code, MessageSquare, ShieldAlert } from "lucide-react";

function RoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const zpRef = useRef<any>(null);
  const socketRef = useRef<any>(null);
  const nodeRef = useRef(null);

  // State
  const [showEditor, setShowEditor] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [code, setCode] = useState("// Start coding your solution...");
  const [language, setLanguage] = useState("python");
  const [lastRunData, setLastRunData] = useState<any>(null);

  // URL Params
  const sessionId = searchParams.get("sessionId") || "test-room";
  const role = searchParams.get("role") || "student";
  const userName = searchParams.get("name") || "Anonymous User";

  // --- SOCKET CONNECTION ---
  useEffect(() => {
    // Use the singleton socket from your library
    socketRef.current = getSocket();

    const handleConnect = () => {
      console.log("✅ Socket Connected:", socketRef.current.id);
      socketRef.current.emit("join-room", sessionId);
    };

    if (socketRef.current.connected) {
      handleConnect();
    }

    socketRef.current.on("connect", handleConnect);

    // Listen for student execution (useful for Tutor role)
    socketRef.current.on("student-code-executed", (data: any) => {
      if (role === "tutor") {
        setLastRunData(data);
      }
    });

    return () => {
      // Clean up specific listeners, but don't disconnect the global socket
      socketRef.current?.off("connect", handleConnect);
      socketRef.current?.off("student-code-executed");
    };
  }, [sessionId, role]);

  // --- CODE EXECUTION ---
  const handleCodeExecution = (executionData: {
    code: string;
    output: string;
    language: string;
  }) => {
    const dataToSend = { ...executionData, studentName: userName, sessionId };
    setLastRunData(dataToSend);

    if (role === "student" && socketRef.current) {
      // Emit the run event so the tutor sees the result
      socketRef.current.emit("code-run", dataToSend);
    }
  };

  function LeaveRoom() {

  }

  // --- ZEGOCLOUD ---
  useEffect(() => {
    let isMounted = true;

    const initVideo = async () => {
      try {
        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
        if (!isMounted || !containerRef.current) return;

        const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID) || 1229551732;
        const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "40990824d9dff7f992df09ab658c72dd";

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          sessionId,
          Date.now().toString(),
          userName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        zp.joinRoom({
          container: containerRef.current,
          scenario: { mode: ZegoUIKitPrebuilt.VideoConference },
          showPreJoinView: false,
          turnOnCameraWhenJoining: true,
          showMyCameraToggleButton: true,
          showAudioVideoSettingsButton: true,
          onReturnToHomeScreenClicked: () => {
            router.push(`/dashboard/${role}`);
          },
        });
      } catch (e) {
        console.error("Zego Init Error:", e);
      }
    };

    initVideo();

    return () => {
      isMounted = false;
      if (zpRef.current) zpRef.current.destroy();
    };
  }, [sessionId, role, router, userName]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#050505] text-white relative overflow-hidden">
      {/* HEADER */}
      <nav className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0d1117]/90 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                CodeClass Live
              </h1>
              <p className="text-[9px] text-zinc-500 font-mono -mt-1 uppercase tracking-tighter">
                Session: {sessionId}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 mr-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              {role} mode
            </span>
          </div>

          <button
            onClick={() => setShowEditor(!showEditor)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              showEditor
                ? "bg-white text-black border-white"
                : "bg-transparent text-white border-white/20 hover:bg-white/5"
            }`}
          >
            {showEditor ? "Hide Editor" : "Show Editor"}
          </button>

          <button
            onClick={LeaveRoom}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
             "bg-white text-black border-white"
            }`}
          >
           { role == "tutor" ? <Link href="/dashboard/tutor">Dashboard</Link> : <Link href="/dashboard/student">Dashboard</Link> }
          </button>

          <button
            onClick={() => setShowAI(!showAI)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20"
          >
            <MessageSquare className="w-3 h-3" />
            AI Tutor
          </button>
        </div>
      </nav>

      <main className="flex flex-1 overflow-hidden relative">
        <div
          className={`transition-all duration-700 border-r border-white/5 bg-[#1e1e1e] shadow-2xl z-20 ${
            showEditor ? "w-1/2" : "w-0 overflow-hidden"
          }`}
        >
          <CodeEditor
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            roomId={sessionId}
            onRun={handleCodeExecution}
          />
        </div>

        <div className="flex-1 bg-black relative z-10">
          <div className="absolute inset-0" ref={containerRef} />

          {role === "tutor" && lastRunData && !showEditor && (
            <div className="absolute top-4 left-4 z-50 bg-blue-600 p-3 rounded-lg flex items-center gap-3 animate-bounce shadow-2xl">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Student Ran Code!
              </span>
            </div>
          )}
        </div>

        {role === "tutor" && (
          <ProfessorReviewTab lastRunData={lastRunData} />
        )}
      </main>

      {showAI && (
        <Draggable nodeRef={nodeRef} handle=".handle" bounds="parent">
          <div
            ref={nodeRef}
            className="absolute top-20 right-10 w-96 h-[600px] z-[9999] shadow-2xl"
          >
            <AIPanel
              activeCode={code}
              language={language}
              onClose={() => setShowAI(false)}
            />
          </div>
        </Draggable>
      )}
    </div>
  );
}

export default function VideoRoom() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 animate-pulse">
            Establishing Secure Stream
          </p>
        </div>
      }
    >
      <RoomContent />
    </Suspense>
  );
}