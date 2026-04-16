import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: Request): Promise<Response> {
  let filePath = ""; // Define outside to use in cleanup
  
  try {
    const { code, language } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const id = Math.random().toString(36).substring(7);
    const tempDir = path.join(process.cwd(), "temp_exec");
    await fs.mkdir(tempDir, { recursive: true });

    let fileName = "";
    let dockerImage = "";
    let runCommand = "";

    switch (language) {
      case "python":
        fileName = `s_${id}.py`;
        dockerImage = "python:3.10-slim";
        runCommand = `python /app/${fileName}`;
        break;
      case "javascript":
        fileName = `s_${id}.js`;
        dockerImage = "node:18-slim";
        runCommand = `node /app/${fileName}`;
        break;
      case "cpp":
        fileName = `s_${id}.cpp`;
        dockerImage = "gcc:latest";
        runCommand = `g++ /app/${fileName} -o /app/out && /app/out`;
        break;
      default:
        return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, code);

    // Run Docker
    const { stdout, stderr } = await execAsync(
      `docker run --rm -v "${tempDir}":/app ${dockerImage} sh -c "${runCommand}"`,
      { timeout: 5000 }
    );

    // Cleanup
    await fs.unlink(filePath).catch(() => {});

    return NextResponse.json({ stdout, stderr });

  } catch (error: any) {
    // 💡 IMPORTANT: If code has a syntax error, Docker/Exec throws an error.
    // We still want to send that error back to the student.
    if (filePath) await fs.unlink(filePath).catch(() => {});

    return NextResponse.json(
      { 
        stdout: error.stdout || "", 
        stderr: error.stderr || error.message || "Execution Error" 
      }, 
      { status: 200 } // Return 200 so the frontend can display the compiler error
    );
  }
}