import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { watsonConfig, watsonMessage } from "./lib/watson.mjs";

const root = fileURLToPath(new URL("./public/", import.meta.url));
const envPath = fileURLToPath(new URL("./.env", import.meta.url));
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[2] === "") continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, "$2");
    process.env[match[1]] ??= value;
  }
}
const port = Number(process.env.PORT || 3000);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let data = "";
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 100_000) throw new Error("Request too large");
  }
  return JSON.parse(data || "{}");
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === "/api/status") {
      return sendJson(res, 200, { watsonConfigured: Boolean(watsonConfig()) });
    }
    if (req.url === "/api/watson/message" && req.method === "POST") {
      const { text } = await readBody(req);
      if (!text || typeof text !== "string") return sendJson(res, 400, { error: "A text message is required." });
      try {
        return sendJson(res, 200, { reply: await watsonMessage(text.slice(0, 1000)) });
      } catch (error) {
        return sendJson(res, watsonConfig() ? 502 : 503, { error: error.message });
      }
    }

    const requestPath = new URL(req.url, "http://localhost").pathname;
    const relative = requestPath === "/" ? "index.html" : requestPath.slice(1);
    const safePath = normalize(relative).replace(/^(\.\.[/\\])+/, "");
    const file = join(root, safePath);
    if (!file.startsWith(root)) return sendJson(res, 403, { error: "Forbidden" });
    const content = await readFile(file);
    res.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
    res.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      const fallback = await readFile(join(root, "index.html"));
      res.writeHead(200, { "content-type": mime[".html"] });
      res.end(fallback);
    } else {
      sendJson(res, 500, { error: "Unexpected server error." });
    }
  }
});

server.listen(port, () => {
  console.log(`PathPilot AI is running at http://localhost:${port}`);
  console.log(`IBM watsonx Assistant: ${watsonConfig() ? "configured" : "optional integration not configured"}`);
});
