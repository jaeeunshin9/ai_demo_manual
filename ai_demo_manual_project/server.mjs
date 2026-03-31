import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import { manualSource } from "./src/data/manual-source.mjs";
import { changeEvent } from "./src/data/change-event.mjs";
import { answerQuestion, createDocumentationHubState, formatLocalizedSamplesMarkdown, formatManualMarkdown } from "./src/core/guidium-pilot.mjs";
import { buildGeneratedSystemSnapshot, setGeneratedSystemState } from "./src/data/generated-manual-store.mjs";
import { parseUploadedDocx } from "./src/import/docx-upload.mjs";
import { getDocumentationSystem } from "./src/data/system-registry.mjs";
import { buildManualDocx } from "./src/export/docx.mjs";

const root = process.cwd();
const port = process.env.PORT || 4173;
const host = process.env.HOST || "127.0.0.1";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

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

function normalizeChatMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => (
      (message?.role === "user" || message?.role === "assistant")
      && typeof message?.content === "string"
      && message.content.trim()
    ))
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }]
    }));
}

function extractGeminiText(payload) {
  const candidates = Array.isArray(payload) ? payload.flatMap((item) => item?.candidates ?? []) : payload?.candidates ?? [];
  const parts = candidates[0]?.content?.parts ?? [];
  return parts
    .map((part) => part?.text ?? "")
    .filter(Boolean)
    .join("");
}

function getGeminiErrorMessage(payload, fallbackMessage) {
  if (payload?.error?.message) {
    return payload.error.message;
  }

  return fallbackMessage;
}

function streamTextResponse(res, text) {
  const chunkSize = 120;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  for (let index = 0; index < text.length; index += chunkSize) {
    const chunk = text.slice(index, index + chunkSize);
    res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
  }

  res.write("data: [DONE]\n\n");
  res.end();
}

function getLastUserMessage(messages) {
  if (!Array.isArray(messages)) {
    return "";
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user" && typeof message?.content === "string" && message.content.trim()) {
      return message.content.trim();
    }
  }

  return "";
}

function buildFallbackGreeting(locale) {
  return {
    ko: "안녕하세요. 운영 매뉴얼과 관련된 질문을 남겨주시면 문서 기준으로 안내해 드릴게요.",
    ja: "こんにちは。運用マニュアルに関する質問をいただければ、文書に基づいてご案内します。",
    en: "Hello. Ask a question about the operations manual and I will answer based on the document."
  }[locale] ?? "안녕하세요. 운영 매뉴얼과 관련된 질문을 남겨주시면 문서 기준으로 안내해 드릴게요.";
}

function isSmallTalk(query) {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [
    "안녕",
    "안녕하세요",
    "hello",
    "hi",
    "hey",
    "こんにちは",
    "おはよう",
    "반가워"
  ].some((keyword) => normalized.includes(keyword));
}

function buildManualFallbackResponse(hubState, messages, locale) {
  const query = getLastUserMessage(messages);
  if (!query || isSmallTalk(query)) {
    return buildFallbackGreeting(locale);
  }

  const fallback = answerQuestion(hubState, query, { locale });
  return fallback.answer;
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

  // ── Gemini 대화 API ──────────────────────────────────
  if (pathname === "/api/chat" && req.method === "POST") {
    if (!GEMINI_API_KEY) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "GEMINI_API_KEY not set. Please create or update .env with GEMINI_API_KEY=your_key_here" }));
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

    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: normalizeChatMessages(messages),
            generationConfig: {
              temperature: 0.2
            }
          })
        }
      );

      let payload = null;
      try {
        payload = await geminiResponse.json();
      } catch {
        payload = null;
      }

      if (!geminiResponse.ok) {
        const fallbackText = buildManualFallbackResponse(hubState, messages, responseLocale);
        streamTextResponse(res, fallbackText);
        return;
      }

      const responseText = extractGeminiText(payload).trim();
      if (!responseText) {
        const fallbackText = buildManualFallbackResponse(hubState, messages, responseLocale);
        streamTextResponse(res, fallbackText);
        return;
      }

      streamTextResponse(res, responseText);
    } catch (err) {
      if (!res.headersSent) {
        const fallbackText = buildManualFallbackResponse(hubState, messages, responseLocale);
        streamTextResponse(res, fallbackText);
        return;
      }

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
