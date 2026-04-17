"use client";

import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Play, Trash2, Code2, Terminal as TerminalIcon, Copy, Check, Keyboard } from "lucide-react";
import { getSocket } from "@/lib/socket";

interface CodeEditorProps {
  code: string;
  setCode: (val: string) => void;
  language: string;
  setLanguage: (val: string) => void;
  roomId: string;
  onRun?: (data: { code: string; output: string; language: string }) => void;
}

export default function CodeEditor({
  code,
  setCode,
  language,
  setLanguage,
  roomId,
  onRun
}: CodeEditorProps) {

  const [output, setOutput] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const editorRef = useRef<any>(null);
  const socketRef = useRef<any>(null);

  const isRemoteUpdate = useRef(false);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    socketRef.current = getSocket();

    // 🔥 JOIN ROOM
    socketRef.current.emit("join-room", roomId);

    // 🔥 CODE SYNC
    socketRef.current.on("code-change", ({ code: newCode }: any) => {
      if (newCode !== code) {
        isRemoteUpdate.current = true;
        setCode(newCode);
      }
    });

    // 🔥 INPUT SYNC
    socketRef.current.on("input-change", ({ input: newInput }: any) => {
      if (newInput !== customInput) {
        setCustomInput(newInput);
      }
    });

    // 🔥 OUTPUT SYNC
    socketRef.current.on("output-change", ({ output }: any) => {
      setOutput(output);
    });

    return () => {
      socketRef.current?.off("code-change");
      socketRef.current?.off("input-change");
      socketRef.current?.off("output-change");
    };
  }, [roomId]);

  // 🔥 CODE CHANGE (DEBOUNCED)
  const handleCodeChange = (value: string) => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    setCode(value);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      socketRef.current.emit("code-change", {
        sessionId: roomId,
        code: value,
      });
    }, 50);
  };

  // 🔥 INPUT CHANGE
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCustomInput(val);

    socketRef.current.emit("input-change", {
      sessionId: roomId,
      input: val,
    });
  };

  // 🔥 RUN CODE
  const handleRunCode = async () => {
    if (!code.trim()) return;

    setIsRunning(true);
    setOutput("> Running code...");

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, input: customInput }),
      });

      const data = await res.json();
      const result = data.stderr || data.stdout || "Success";

      setOutput(result);

      // 🔥 SYNC OUTPUT
      socketRef.current.emit("output-change", {
        sessionId: roomId,
        output: result,
      });

      onRun?.({ code, output: result, language });

    } catch {
      setOutput("> Error running code");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-zinc-300 font-sans overflow-hidden">

      {/* TOOLBAR */}
      <div className="h-12 border-b border-white/5 bg-[#1a1a1a] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Code2 size={16} className="text-blue-500" />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)} 
            className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-zinc-400 hover:text-white"
          >
            <option value="python">Python 3</option>
            <option value="javascript">Node.js</option>
            <option value="cpp">C++</option>
          </select>
        </div>
        <button 
          onClick={handleRunCode} 
          disabled={isRunning} 
          className="flex items-center gap-2 px-5 py-1.5 rounded-lg text-[10px] font-black uppercase bg-blue-600 hover:bg-blue-500 text-white disabled:bg-zinc-800 transition-all"
        >
          <Play size={12} /> {isRunning ? "Running..." : "Run Code"}
        </button>
      </div>

      <div className="flex-1 relative">
        <Editor 
          height="100%" 
          language={language} 
          theme="vs-dark" 
          value={code} 
          onMount={(e) => (editorRef.current = e)} 
          onChange={(v) => handleCodeChange(v || "")} 
          options={{ 
            minimap: { enabled: false }, 
            fontSize: 14, 
            automaticLayout: true,
            scrollBeyondLastLine: false 
          }} 
        />
      </div>

      {/* TERMINAL */}
      <div className="h-1/3 border-t border-white/10 bg-[#0a0a0a] flex flex-col shrink-0">
        <div className="h-9 border-b border-white/5 flex items-center justify-between px-4 bg-black/40">
          <div className="flex items-center">
            <TerminalIcon size={12} className="text-zinc-500 mr-2" />
            <span className="text-[10px] font-black uppercase text-zinc-500">Terminal & Input</span>
          </div>
          <button 
            onClick={() => { setOutput(""); setCustomInput(""); }} 
            className="hover:text-white transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-4 font-mono text-[13px] overflow-y-auto border-r border-white/5 text-blue-400">
            {output || <span className="text-zinc-700 italic text-[11px] uppercase tracking-widest">Idle...</span>}
          </div>

          <div className="w-1/3 flex flex-col bg-black/20">
            <div className="px-3 py-1 border-b border-white/5 flex items-center gap-2">
              <Keyboard size={10} className="text-zinc-600" />
              <span className="text-[9px] font-bold text-zinc-600 uppercase">Stdin / Input</span>
            </div>
            <textarea 
              value={customInput} 
              onChange={handleInputChange} 
              placeholder="Type input here..." 
              className="flex-1 bg-transparent p-3 text-[12px] font-mono outline-none resize-none text-orange-200/80" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}