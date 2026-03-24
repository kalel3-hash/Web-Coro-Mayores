const fs = require("fs");
const path = require("path");

const AUDIOS_DIR = path.join(__dirname, "audios");
const OUT = path.join(AUDIOS_DIR, "manifest.json");

const files = fs
  .readdirSync(AUDIOS_DIR, { withFileTypes: true })
  .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".mp3"))
  .map((d) => d.name)
  .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

fs.writeFileSync(OUT, JSON.stringify(files, null, 2) + "\n", "utf8");
console.log("Wrote", path.relative(__dirname, OUT), "(" + files.length + " files)");
