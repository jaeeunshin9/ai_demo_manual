import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import { manualSource } from "./src/data/manual-source.mjs";
import { changeEvent } from "./src/data/change-event.mjs";
import { answerQuestion, createDocumentationHubState, formatLocalizedSamplesMarkdown, formatManualMarkdown } from "./src/core/manual-pilot.mjs";
import { buildGeneratedSystemSnapshot, setGeneratedSystemState } from "./src/data/generated-manual-store.mjs";
import { parseUploadedDocx } from "./src/import/docx-upload.mjs";
import { getDocumentationSystem } from "./src/data/system-registry.mjs";
import { buildManualDocx } from "./src/export/docx.mjs";
import { newProductSource } from "./src/data/new-product-source.mjs";
import { newProductChangeEvent } from "./src/data/new-product-change-event.mjs";

const root = process.cwd();
const port = process.env.PORT || 4173;
const host = process.env.HOST || "127.0.0.1";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

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

  // 업로드된 상태가 있으면 모든 시스템에 대해 우선 반환
  const generatedSnapshot = buildGeneratedSystemSnapshot(system.id);
  if (generatedSnapshot.available) {
    return {
      system,
      source: generatedSnapshot.source,
      changeEvent: generatedSnapshot.changeEvent,
      hubState: generatedSnapshot.hubState,
      uploadMeta: generatedSnapshot.uploadMeta,
      generated: true
    };
  }

  // new-product는 정적 소스가 없으므로 null 반환
  if (system.id === "new-product") {
    return {
      system,
      source: null,
      changeEvent: null,
      hubState: null,
      uploadMeta: null,
      generated: false
    };
  }

  // 그 외 시스템은 정적 소스로 fallback
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
    ko: "안녕하세요. 매뉴얼과 관련된 질문을 남겨주시면 매뉴얼 기준으로 안내해 드릴게요.",
    ja: "こんにちは。マニュアルに関する質問をいただければ、マニュアルに基づいてご案内します。",
    en: "Hello. Ask a question about the manuals and I will answer based on them."
  }[locale] ?? "안녕하세요. 매뉴얼과 관련된 질문을 남겨주시면 매뉴얼 기준으로 안내해 드릴게요.";
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

async function fetchGitHubCommits(githubRepo) {
  const apiUrl = `https://api.github.com/repos/${githubRepo}/commits?per_page=3`;
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "ai-manual-server"
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(apiUrl, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API 오류: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.map((item) => ({
    sha: item.sha.slice(0, 7),
    message: item.commit.message.split("\n")[0],
    author: item.commit.author.name,
    committedAt: item.commit.author.date,
    url: item.html_url
  }));
}

const server = http.createServer(async (req, res) => {
  try {
  const parsed = url.parse(req.url ?? "/");
  let pathname = decodeURIComponent(parsed.pathname || "/");
  pathname = pathname === "/" ? "/index.html" : pathname;

  if (pathname === "/api/commits" && req.method === "GET") {
    const qs = new URL(req.url ?? "/", `http://${host}:${port}`).searchParams;
    const systemId = qs.get("system") ?? "myeongjang-ai";
    const system = getDocumentationSystem(systemId);
    const githubRepo = system.githubRepo ?? "jaeeunshin9/ai_manual_docs";
    try {
      const commits = await fetchGitHubCommits(githubRepo);
      writeJson(res, 200, { systemId, githubRepo, commits });
    } catch (err) {
      console.error("GitHub API 오류:", err.message);
      writeJson(res, 502, { error: `GitHub 커밋 조회 실패: ${err.message}` });
    }
    return;
  }

  if (pathname === "/api/commit-diff" && req.method === "GET") {
    const qs = new URL(req.url ?? "/", `http://${host}:${port}`).searchParams;
    const sha = qs.get("sha");
    const systemId = qs.get("system") ?? "myeongjang-ai";

    if (!sha) {
      writeJson(res, 400, { error: "sha is required" });
      return;
    }

    const system = getDocumentationSystem(systemId);
    const githubRepo = system.githubRepo ?? "jaeeunshin9/ai_manual_docs";
    const resolved = resolveSystemPayload(systemId);
    const sectionIds = (resolved.source?.sections ?? []).map((s) => s.id);

    try {
      const ghHeaders = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "ai-manual-server"
      };
      if (process.env.GITHUB_TOKEN) {
        ghHeaders["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
      }

      const commitRes = await fetch(`https://api.github.com/repos/${githubRepo}/commits/${sha}`, { headers: ghHeaders });
      if (!commitRes.ok) throw new Error(`GitHub API 오류: ${commitRes.status}`);
      const commitData = await commitRes.json();

      // 모든 변경 파일의 patch 수집 (파일 종류 무관)
      const commitMessage = commitData.commit?.message ?? "";
      const patchText = (commitData.files ?? [])
        .map((f) => `[${f.filename}]\n${f.patch ?? ""}`)
        .join("\n\n");
      const fullContext = `커밋 메시지: ${commitMessage}\n\n${patchText}`.slice(0, 5000);

      if (!fullContext.trim()) {
        writeJson(res, 200, { changedSectionIds: [] });
        return;
      }

      if (!GEMINI_API_KEY) {
        writeJson(res, 200, { changedSectionIds: [] });
        return;
      }

      const sectionDescriptions = (resolved.source?.sections ?? [])
        .map((s) => `"${s.id}": ${s.sectionTitle} — ${s.subsectionTitle}`)
        .join("\n");

      const diffPrompt = `아래는 GitHub 커밋 내용입니다. 이 변경사항이 매뉴얼의 어느 섹션과 관련이 있는지 분석하세요.

매뉴얼 섹션 목록:
${sectionDescriptions}

커밋 내용:
${fullContext}

위 커밋이 영향을 주는 섹션의 id만 JSON 배열로 반환하세요.
예시: ["operations", "search"]
관련 섹션이 없으면 []를 반환하세요.
반드시 JSON 배열만 반환하고 다른 텍스트는 포함하지 마세요.`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: diffPrompt }] }],
            generationConfig: { temperature: 0, responseMimeType: "application/json" }
          })
        }
      );

      const geminiData = await geminiRes.json();
      const rawText = extractGeminiText(geminiData).trim();

      let changedSectionIds = [];
      try {
        const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
        const parsed = JSON.parse(cleaned);
        changedSectionIds = Array.isArray(parsed) ? parsed.filter((id) => sectionIds.includes(id)) : [];
      } catch {
        changedSectionIds = [];
      }

      writeJson(res, 200, { changedSectionIds });
    } catch (err) {
      console.error("commit-diff 오류:", err.message);
      writeJson(res, 502, { error: err.message });
    }
    return;
  }

  const validUploadSystems = ["new-product", "myeongjang-ai"];

  const stateRouteMatch = pathname.match(/^\/api\/([^\/]+)\/state$/);
  if (stateRouteMatch && validUploadSystems.includes(stateRouteMatch[1]) && req.method === "GET") {
    writeJson(res, 200, buildGeneratedSystemSnapshot(stateRouteMatch[1]));
    return;
  }

  const wordUploadMatch = pathname.match(/^\/api\/([^\/]+)\/upload$/);
  if (wordUploadMatch && validUploadSystems.includes(wordUploadMatch[1]) && req.method === "POST") {
    const routeSystemId = wordUploadMatch[1];
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

    setGeneratedSystemState(routeSystemId, generated);
    writeJson(res, 200, buildGeneratedSystemSnapshot(routeSystemId));
    return;
  }

  const imageUploadMatch = pathname.match(/^\/api\/([^\/]+)\/upload-images$/);
  if (imageUploadMatch && validUploadSystems.includes(imageUploadMatch[1]) && req.method === "POST") {
    const routeSystemId = imageUploadMatch[1];
    const body = await readBody(req);
    const { images } = JSON.parse(body);

    if (!Array.isArray(images) || images.length === 0) {
      writeJson(res, 400, { error: "이미지 데이터가 없습니다." });
      return;
    }

    if (images.length > 10) {
      writeJson(res, 400, { error: "최대 10장까지 업로드할 수 있습니다." });
      return;
    }

    if (!GEMINI_API_KEY) {
      writeJson(res, 500, { error: "GEMINI_API_KEY가 설정되지 않았습니다." });
      return;
    }

    const imageParts = images.map((img) => ({
      inlineData: { mimeType: img.mimeType, data: img.data }
    }));

    const visionPrompt = `당신은 전문 기술 문서 작성자입니다.
아래 스크린샷들을 분석하여 시스템의 사용자 매뉴얼을 작성해주세요.

반드시 아래 JSON 형식만 반환하세요. 다른 텍스트는 절대 포함하지 마세요:
{
  "productName": "시스템 이름 (한국어)",
  "documentTitle": "사용자 매뉴얼 제목 (한국어)",
  "summary": "시스템 요약 설명 2-3문장 (한국어)",
  "sections": [
    {
      "id": "overview",
      "titleKo": "1. 서비스 개요",
      "subtitleKo": "1.1 제품 목적",
      "contentKo": "한국어 내용",
      "titleJa": "1. サービス概要",
      "subtitleJa": "1.1 製品目的",
      "contentJa": "일본어 내용",
      "titleEn": "1. Service Overview",
      "subtitleEn": "1.1 Product Purpose",
      "contentEn": "영어 내용"
    },
    {
      "id": "setup",
      "titleKo": "2. 시작하기",
      "subtitleKo": "2.1 초기 설정",
      "contentKo": "한국어 내용",
      "titleJa": "2. はじめに",
      "subtitleJa": "2.1 初期設定",
      "contentJa": "일본어 내용",
      "titleEn": "2. Getting Started",
      "subtitleEn": "2.1 Initial Setup",
      "contentEn": "영어 내용"
    },
    {
      "id": "features",
      "titleKo": "3. 주요 기능",
      "subtitleKo": "3.1 기능 설명",
      "contentKo": "한국어 내용",
      "titleJa": "3. 主要機能",
      "subtitleJa": "3.1 機能説明",
      "contentJa": "일본어 내용",
      "titleEn": "3. Key Features",
      "subtitleEn": "3.1 Feature Description",
      "contentEn": "영어 내용"
    },
    {
      "id": "operations",
      "titleKo": "4. 운영 규칙",
      "subtitleKo": "4.1 운영 정책",
      "contentKo": "한국어 내용",
      "titleJa": "4. 運用ルール",
      "subtitleJa": "4.1 運用ポリシー",
      "contentJa": "일본어 내용",
      "titleEn": "4. Operations Rules",
      "subtitleEn": "4.1 Operations Policy",
      "contentEn": "영어 내용"
    },
    {
      "id": "faq",
      "titleKo": "5. 자주 묻는 질문",
      "subtitleKo": "5.1 FAQ",
      "contentKo": "한국어 내용",
      "titleJa": "5. よくある質問",
      "subtitleJa": "5.1 FAQ",
      "contentJa": "일본어 내용",
      "titleEn": "5. Frequently Asked Questions",
      "subtitleEn": "5.1 FAQ",
      "contentEn": "영어 내용"
    }
  ],
  "faq": [
    { "question": "한국어 질문", "answer": "한국어 답변" },
    { "question": "한국어 질문", "answer": "한국어 답변" },
    { "question": "한국어 질문", "answer": "한국어 답변" }
  ]
}`;

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: visionPrompt }, ...imageParts] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 8192,
              responseMimeType: "application/json"
            }
          })
        }
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error("Gemini Vision 오류:", errText);
        writeJson(res, 502, { error: "Gemini Vision API 호출에 실패했습니다." });
        return;
      }

      const geminiData = await geminiRes.json();
      const rawText = extractGeminiText(geminiData).trim();
      console.log("[Vision] Gemini 응답 앞부분:", rawText.slice(0, 300));

      // JSON 추출 — responseMimeType 설정으로 순수 JSON이 오지만 혹시 코드블록이면 제거
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      let generated;
      try {
        generated = JSON.parse(cleaned);
      } catch (parseErr) {
        const fallbackMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!fallbackMatch) {
          console.error("[Vision] JSON 파싱 실패. 원문:", rawText.slice(0, 500));
          writeJson(res, 500, { error: "매뉴얼 생성 결과를 파싱할 수 없습니다." });
          return;
        }
        generated = JSON.parse(fallbackMatch[0]);
      }
      const uploadedAt = new Date().toISOString();

      const sections = (generated.sections || []).map((s) => ({
        id: s.id || "section",
        sectionTitle: s.titleKo || s.id,
        subsectionTitle: s.subtitleKo || "",
        intent: s.titleKo || "",
        content: s.contentKo || "",
        keywords: [],
        translations: {
          ja: { sectionTitle: s.titleJa || s.titleKo, subsectionTitle: s.subtitleJa || "" },
          en: { sectionTitle: s.titleEn || s.titleKo, subsectionTitle: s.subtitleEn || "" }
        },
        sampleOutputs: {
          ja: s.contentJa || s.contentKo || "",
          en: s.contentEn || s.contentKo || ""
        }
      }));

      const faqSeeds = (generated.faq || []).map((f) => ({
        question: f.question || "",
        answer: f.answer || ""
      }));

      const productName = generated.productName || "신규 프로덕트";
      const documentTitle = generated.documentTitle || "신규 프로덕트 사용자 매뉴얼";

      const baseSource = routeSystemId === "myeongjang-ai" ? manualSource : newProductSource;
      const baseChangeEvent = routeSystemId === "myeongjang-ai" ? changeEvent : newProductChangeEvent;

      const source = {
        ...baseSource,
        productName,
        documentName: documentTitle,
        version: `screenshot-${uploadedAt.slice(0, 10)}`,
        releaseDate: uploadedAt.slice(0, 10),
        productSummary: generated.summary || "",
        sections,
        faqSeeds,
        localizedMeta: {
          ...baseSource.localizedMeta,
          ko: { ...baseSource.localizedMeta.ko, productName, documentName: documentTitle }
        }
      };

      const uploadMeta = {
        fileName: `스크린샷 ${images.length}장`,
        fileSize: images.reduce((sum, img) => sum + img.data.length, 0),
        uploadedAt,
        documentTitle,
        productName,
        paragraphCount: sections.length,
        sectionCount: sections.length,
        summaryLength: (generated.summary || "").length
      };

      const imageChangeEvent = {
        ...baseChangeEvent,
        eventId: `CE-SCREENSHOT-${Date.now()}`,
        title: "스크린샷 기반 매뉴얼 생성",
        summary: `${images.length}장의 스크린샷을 분석하여 매뉴얼을 자동 생성했습니다.`
      };

      setGeneratedSystemState(routeSystemId, { source, changeEvent: imageChangeEvent, uploadMeta });
      writeJson(res, 200, buildGeneratedSystemSnapshot(routeSystemId));
    } catch (err) {
      console.error("이미지 업로드 처리 오류:", err);
      writeJson(res, 500, { error: err.message || "이미지 분석 중 오류가 발생했습니다." });
    }
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
        const errStatus = geminiResponse.status;
        const errMsg = payload?.error?.message ?? `Gemini API 오류 (${errStatus})`;
        console.error(`[chat] Gemini 오류 ${errStatus}:`, errMsg);
        if (errStatus === 429) {
          const quotaMsg = {
            ko: "⚠️ AI 응답 한도(할당량)가 초과됐습니다. 잠시 후 다시 시도해 주세요.",
            ja: "⚠️ AI の応答制限（クォータ）を超えました。しばらくしてからもう一度お試しください。",
            en: "⚠️ AI response quota exceeded. Please wait a moment and try again."
          }[responseLocale] ?? "⚠️ AI 응답 한도가 초과됐습니다. 잠시 후 다시 시도해 주세요.";
          streamTextResponse(res, quotaMsg);
          return;
        }
        const fallbackText = buildManualFallbackResponse(hubState, messages, responseLocale);
        streamTextResponse(res, fallbackText);
        return;
      }

      const responseText = extractGeminiText(payload).trim();
      if (!responseText) {
        console.warn("[chat] Gemini 응답이 비어있습니다.");
        const fallbackText = buildManualFallbackResponse(hubState, messages, responseLocale);
        streamTextResponse(res, fallbackText);
        return;
      }

      streamTextResponse(res, responseText);
    } catch (err) {
      console.error("[chat] 예외 발생:", err.message);
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
  import("node:os").then((os) => {
    const nets = os.networkInterfaces();
    const externalIps = Object.values(nets)
      .flat()
      .filter((n) => n.family === "IPv4" && !n.internal)
      .map((n) => n.address);
    console.log(`AI 매뉴얼 서버 실행 중: http://localhost:${port}`);
    externalIps.forEach((ip) => console.log(`  외부 접속 주소:       http://${ip}:${port}`));
  });
});
