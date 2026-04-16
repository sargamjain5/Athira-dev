import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

// Explicitly define the return type to satisfy Vercel's Type Checker
export async function POST(req: Request): Promise<Response> {
  try {
    const { code, language } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    // Create a unique ID for this execution session
    const id = Math.random().toString(36).substring(7);
    const tempDir = path.join(process.cwd(), "temp_exec");
    
    // Ensure the temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    let fileName = "";
    let dockerImage = "";
    let runCommand = "";

    // Map languages to Docker images and commands
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

    const filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, code);

    try {
      // Execute in Docker (Note: This will only work on local/VPS with Docker installed)
      const { stdout, stderr } = await execAsync(
        `docker run --rm -v "${tempDir}":/app ${dockerImage} sh -c "${runCommand}"`,
        { timeout: 5000 }
      );

      // Clean up the file after execution
      await fs.unlink(filePath);

      return NextResponse.json({ stdout, stderr });
    } catch (execError: any) {
      // Clean up even if the code fails/crashes
      if (await fs.stat(filePath).catch(() => false)) await fs.unlink(filePath);
      
      return NextResponse.json({ 
        stdout: execError.stdout || "", 
        stderr: execError.stderr || execError.message 
      }, { status: 200 }); // We return 200 so the UI can show the compiler error
    }

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}