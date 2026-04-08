const http = require("http");
const fs = require("fs");
const path = require("path");
const distDir = path.join(process.cwd(), "dist");
const mimes = {".html":"text/html",".js":"application/javascript",".css":"text/css",".webp":"image/webp",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".json":"application/json",".woff2":"font/woff2",".ico":"image/x-icon",".mp4":"video/mp4"};
http.createServer((req, res) => {
  let filePath = path.join(distDir, req.url.split("?")[0]);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(distDir, "index.html");
  const ext = path.extname(filePath);
  res.setHeader("Content-Type", mimes[ext] || "text/plain");
  res.setHeader("Cache-Control", "no-cache");
  fs.createReadStream(filePath).pipe(res);
}).listen(3010, () => console.log("OK http://localhost:3010"));
