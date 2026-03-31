import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import OpenAI from "openai";
import { manualSource } from "./src/data/manual-source.mjs";
import { changeEvent } from "./src/data/change-event.mjs";
import { createDocumentationHubState, formatLocalizedSamplesMarkdown, formatManualMarkdown } from "./src/core/guidium-pilot.mjs";
import { buildGeneratedSystemSnapshot, setGeneratedSystemState } from "./src/data/generated-manual-store.mjs";
import { parseUploadedDocx } from "./src/import/docx-upload.mjs";
import { getDocumentationSystem } from "./src/data/system-registry.mjs";
import { buildManualDocx } from "./src/export/docx.mjs";

const root = process.cwd();
const port = process.env.PORT || 4173;
const host = process.env.HOST || "127.0.0.1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

const serviceNames = {
  ko: "AI 매뉴얼",
  ja: "AIマニュアル",
  en: "AI Manual"
};

const responseLanguageNames = {
  ko: "한국어",
  ja: "日本語",
  en: "English"
};

function getLocalizedServiceName(source, locale) {
  return source.localizedMeta?.[locale]?.serviceName ?? serviceNames[locale] ?? serviceNames.ko;
}

function getLocalizedDocumentName(source, language) {
  return source.localizedMeta?.[language]?.documentName ?? source.documentName;
}

function getDownloadDisplayFilename(source, language) {
  const baseName = getLocalizedDocumentName(source, language).replace(/\s+/g, "-");
  const suffix = language === "ko" ? "" : language === "ja" ? "-要約版" : "-Summary";
  return `${baseName}${suffix}-${language}.docx`;
}

function buildChatContext(hubState, locale) {
  if (locale === "ja" || locale === "en") {
    return formatLocalizedSamplesMarkdown(hubState.manual, locale);
  }
  return formatManualMarkdown(hubState.manual);
}

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function resolveSystemPayload(systemId) {
  const system = getDocumentationSystem(systemId || "myeongjang-ai");
  if (system.id === "new-product") {
    const generated = buildGeneratedSystemSnapshot(system.id);
    if (generated.available) {
      return {
        system,
        source: generated.source,
        changeEvent: generated.changeEvent,
        hubState: generated.hubState,
        uploadMeta: generated.uploadMeta,
        generated: true
      };
    }
    return {
      system,
      source: null,
      changeEvent: null,
      hubState: null,
      uploadMeta: null,
      generated: false
    };
  }

  const source = system.source ?? manualSource;
  const event = system.changeEvent ?? changeEvent;
  const hubState = createDocumentationHubState(source, event, {
    syncedAt: new Date().toISOString(),
    sourceRepository: system.repository ?? source.upstreamRepository
  });

  return {
    system,
    source,
    changeEvent: event,
    hubState,
    uploadMeta: null,
    generated: false
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
  const parsed = url.parse(req.url ?? "/");
  let pathname = decodeURIComponent(parsed.pathname || "/");
  pathname = pathname === "/" ? "/index.html" : pathname;

  if (pathname === "/api/new-product/state" && req.method === "GET") {
    writeJson(res, 200, buildGeneratedSystemSnapshot("new-product"));
    return;
  }

  if (pathname === "/api/new-product/upload" && req.method === "POST") {
    const body = await readBody(req);
    const { fileName, fileContentBase64, fileSize } = JSON.parse(body);

    if (!fileName || !fileContentBase64) {
      writeJson(res, 400, { error: "fileName and fileContentBase64 are required." });
      return;
    }

    if (!/\.docx$/i.test(fileName)) {
      writeJson(res, 400, { error: "Only .docx files are supported in this MVP." });
      return;
    }

    const buffer = Buffer.from(fileContentBase64, "base64");
    const uploadedAt = new Date().toISOString();
    const generated = await parseUploadedDocx({
      fileName,
      buffer,
      uploadedAt,
      fileSize: fileSize ?? buffer.byteLength
    });

    setGeneratedSystemState("new-product", generated);
    writeJson(res, 200, buildGeneratedSystemSnapshot("new-product"));
    return;
  }

  // ── OpenAI 대화 API ──────────────────────────────────
  if (pathname === "/api/chat" && req.method === "POST") {
    if (!OPENAI_API_KEY) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "OPENAI_API_KEY not set. Please create a .env file with OPENAI_API_KEY=your_key_here" }));
      return;
    }

    const body = await readBody(req);
    const { messages, systemId, locale } = JSON.parse(body);
    const responseLocale = ["ko", "ja", "en"].includes(locale) ? locale : "ko";

    const resolved = resolveSystemPayload(systemId);
    if (!resolved.source || !resolved.hubState) {
      writeJson(res, 409, { error: "Please upload a Word document for the new product before asking questions." });
      return;
    }

    const { system, source, hubState } = resolved;
    const manualText = buildChatContext(hubState, responseLocale);

    const systemPrompt = `당신은 ${getLocalizedServiceName(source, responseLocale)} 서비스의 AI 어시스턴트입니다.
  아래의 운영 매뉴얼을 바탕으로 사용자 질문에 친절하고 간결하게 ${responseLanguageNames[responseLocale]}로 답변하세요.
매뉴얼에 없는 내용은 "현재 문서에서 확인할 수 없습니다"라고 답변하세요.
  일본어와 영어는 전체 번역본이 아니라 요약본 기준으로 자연스럽게 설명하세요.
  브랜드 표기는 한국어는 명장 AI, 일본어는 マスターAI, 영어는 Master AI를 사용하세요.
  인사, 잡담, 또는 문서와 무관한 질문에는 문서 개요를 추측해서 답하지 말고 짧게 인사한 뒤 문서 관련 질문을 요청하세요.
  질문이 특정 규칙, 절차, 승인, 다운로드, 보안과 연결되지 않으면 임의의 섹션 내용을 일반 답변처럼 출력하지 마세요.
마크다운 포맷(볼드, 목록 등)을 자유롭게 사용하세요.

---
${manualText}`;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    try {
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        stream: true,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ]
      });

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
    return;
  }

  // ── 문서 다운로드 ──────────────────────────────────
  if (pathname === "/api/download/manual-docx") {
    const query = new URL(req.url ?? "/", `http://${host}:${port}`).searchParams;
    const systemId = query.get("system") ?? "myeongjang-ai";
    const language = query.get("language") ?? "ko";
    const resolved = resolveSystemPayload(systemId);
    if (!resolved.source || !resolved.hubState) {
      writeJson(res, 409, { error: "Please upload a Word document for the new product before downloading the package." });
      return;
    }

    const { system, source, hubState } = resolved;
    const buffer = await buildManualDocx(hubState, language, source.localizedMeta);
    const safeFilename = `${system.id}-${language}${language === "ko" ? "" : "-summary"}.docx`;
    const displayFilename = getDownloadDisplayFilename(source, language);
    const encodedFilename = encodeURIComponent(displayFilename);
    res.writeHead(200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`
    });
    res.end(buffer);
    return;
  }

  // ── 정적 파일 서브 ──────────────────────────────────
  let filePath = path.join(root, pathname);
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    let stats;
    try {
      stats = await fs.stat(filePath);
    } catch {
      if (!path.extname(filePath)) {
        filePath = path.join(root, `${pathname}.html`);
        stats = await fs.stat(filePath);
      } else {
        throw new Error("Not found");
      }
    }

    if (stats.isDirectory()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    const body = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "text/plain; charset=utf-8" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
  } catch (err) {
    console.error("Unhandled request error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
});

server.listen(port, host, () => {
  console.log(`AI 매뉴얼 서버 실행 중: http://${host}:${port}`);
});
