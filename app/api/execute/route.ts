import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: Request): Promise<Response> {
  try {
    const { code, language, input } = await req.json(); // Catch the input string

    const id = Math.random().toString(36).substring(7);
    const tempDir = path.join(process.cwd(), "temp_exec");
    await fs.mkdir(tempDir, { recursive: true });

    const codeFile = language === "python" ? `s_${id}.py` : `s_${id}.js`;
    const inputFile = `in_${id}.txt`; // Temp file for STDIN
    
    await fs.writeFile(path.join(tempDir, codeFile), code);
    await fs.writeFile(path.join(tempDir, inputFile), input || "");

    let runCommand = "";
    let dockerImage = "";

    if (language === "python") {
      dockerImage = "python:3.10-slim";
      // PIPE the input file into the script to avoid EOFError
      runCommand = `python /app/${codeFile} < /app/${inputFile}`;
    } else if (language === "javascript") {
      dockerImage = "node:18-slim";
      runCommand = `node /app/${codeFile} < /app/${inputFile}`;
    }

    try {
      const { stdout, stderr } = await execAsync(
        `docker run --rm -v "${tempDir}":/app ${dockerImage} sh -c "${runCommand}"`,
        { timeout: 5000 }
      );

      // Cleanup
      await fs.unlink(path.join(tempDir, codeFile));
      await fs.unlink(path.join(tempDir, inputFile));

      return NextResponse.json({ stdout, stderr });
    } catch (execError: any) {
      // Cleanup files on error too
      await fs.unlink(path.join(tempDir, codeFile)).catch(() => {});
      await fs.unlink(path.join(tempDir, inputFile)).catch(() => {});
      
      return NextResponse.json({ 
        stdout: execError.stdout || "", 
        stderr: execError.stderr || execError.message 
      });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}