const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const AUDIOS_DIR = path.join(ROOT, "audios");

function listMp3Files() {
  return fs
    .readdirSync(AUDIOS_DIR, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".mp3"))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
}

function safeAudioPath(urlPathname) {
  const relative = urlPathname.slice("/audios/".length);
  let decoded;
  try {
    decoded = decodeURIComponent(relative);
  } catch {
    return null;
  }
  const normalized = path.normalize(decoded);
  if (normalized.includes("..") || path.isAbsolute(normalized)) {
    return null;
  }
  const full = path.resolve(AUDIOS_DIR, normalized);
  const relToAudios = path.relative(path.resolve(AUDIOS_DIR), full);
  if (relToAudios.startsWith("..") || path.isAbsolute(relToAudios)) {
    return null;
  }
  return full;
}

const server = http.createServer((req, res) => {
  let parsed;
  try {
    parsed = new URL(req.url, `http://${req.headers.host}`);
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }

  const pathname = parsed.pathname;

  if (pathname === "/api/audios" && req.method === "GET") {
    try {
      if (!fs.existsSync(AUDIOS_DIR)) {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "Carpeta audios no encontrada" }));
        return;
      }
      const files = listMp3Files();
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(files));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: String(err.message) }));
    }
    return;
  }

  if (pathname.startsWith("/audios/") && req.method === "GET") {
    const full = safeAudioPath(pathname);
    if (!full) {
      res.writeHead(400);
      res.end();
      return;
    }
    fs.stat(full, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404);
        res.end();
        return;
      }
      const ext = path.extname(full).toLowerCase();
      const contentType =
        ext === ".mp3"
          ? "audio/mpeg"
          : ext === ".json"
            ? "application/json; charset=utf-8"
            : "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      fs.createReadStream(full).pipe(res);
    });
    return;
  }

  if ((pathname === "/" || pathname === "/index.html") && req.method === "GET") {
    const indexPath = path.join(ROOT, "index.html");
    fs.readFile(indexPath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`Audios: http://localhost:${PORT}`);
});
