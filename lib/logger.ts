import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
const ERROR_LOG = path.join(LOG_DIR, "errors.log");

function timestamp() {
  return new Date().toISOString();
}

export function logError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const line = `[${timestamp()}] [ERROR] [${context}] ${message}${stack ? `\n${stack}` : ""}\n`;

  console.error(line.trim());

  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(ERROR_LOG, line);
  } catch {
    // Never let logging failures break the caller
  }
}
