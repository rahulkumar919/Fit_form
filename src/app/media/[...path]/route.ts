/**
 * GET /media/YYYY/MM/<id>-<size>.webp        — images stored by the "server" provider
 * GET /media/videos/YYYY/MM/<id>.(mp4|webm)  — reel videos, with HTTP Range support (required by Safari/iOS)
 * Strict path whitelist prevents directory traversal.
 */
import path from "node:path";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { STORAGE_DIR } from "@/lib/storage";

type Ctx = { params: Promise<{ path: string[] }> };

const IMAGE_RE = /^\d{4}\/\d{2}\/[a-f0-9]{16}-(large|medium|thumb)\.webp$/;
const VIDEO_RE = /^videos\/\d{4}\/\d{2}\/[a-f0-9]{16}\.(mp4|webm)$/;
const IMMUTABLE = "public, max-age=31536000, immutable";
const notFound = () => new NextResponse("Not found", { status: 404 });

export async function GET(req: NextRequest, { params }: Ctx) {
  const rel = (await params).path.join("/");
  const isVideo = VIDEO_RE.test(rel);
  if (!isVideo && !IMAGE_RE.test(rel)) return notFound();

  const file = path.join(/*turbopackIgnore: true*/ STORAGE_DIR, rel);
  if (!file.startsWith(STORAGE_DIR + path.sep)) return notFound();

  if (!isVideo) {
    try {
      const data = await readFile(file);
      return new NextResponse(new Uint8Array(data), {
        headers: {
          "Content-Type": "image/webp",
          "Content-Length": String(data.length),
          // file names are content-unique, so they can be cached forever (and by a CDN)
          "Cache-Control": IMMUTABLE,
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      return notFound();
    }
  }

  let size: number;
  try {
    size = (await stat(file)).size;
  } catch {
    return notFound();
  }
  const type = rel.endsWith(".webm") ? "video/webm" : "video/mp4";
  const base = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": IMMUTABLE, "X-Content-Type-Options": "nosniff" };

  const range = req.headers.get("range");
  if (!range) {
    const body = Readable.toWeb(createReadStream(file)) as ReadableStream;
    return new NextResponse(body, { headers: { ...base, "Content-Length": String(size) } });
  }

  // Single range only: "bytes=start-end" or "bytes=start-" or "bytes=-suffix"
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!m || (m[1] === "" && m[2] === "")) {
    return new NextResponse(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${size}` } });
  }
  let start: number;
  let end: number;
  if (m[1] === "") {
    const suffix = Number(m[2]);
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) {
    return new NextResponse(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${size}` } });
  }
  const body = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
  return new NextResponse(body, {
    status: 206,
    headers: { ...base, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
  });
}
