import mammoth from "mammoth";
import { newProductSource } from "../data/new-product-source.mjs";

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<br\s*\/?>/gi, " ");
}

function stripTags(value) {
  return decodeHtml(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBlocks(html) {
  const blocks = [];
  const blockPattern = /<(h1|h2|h3|p)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = blockPattern.exec(html)) !== null) {
    const text = stripTags(match[2]);
    if (text) {
      blocks.push({ tag: match[1].toLowerCase(), text });
    }
  }
  return blocks;
}

function splitFileName(fileName) {
  return fileName.replace(/\.[^.]+$/, "").trim();
}

function normalizeTitle(rawTitle, fileName) {
  const fallback = splitFileName(fileName) || "New Product";
  return rawTitle?.trim() || fallback;
}

function inferProductName(documentTitle) {
  return documentTitle
    .replace(/(사용자 매뉴얼|운영 매뉴얼|매뉴얼|user manual|operations manual)/gi, "")
    .replace(/\s+/g, " ")
    .trim() || documentTitle;
}

function makeLocalizedMeta(documentTitle, productName) {
  return {
    ko: {
      productName,
      documentName: documentTitle,
      serviceName: "AI 매뉴얼",
      owner: "AI 매뉴얼 Service Ops"
    },
    ja: {
      productName,
      documentName: `${productName} ユーザーマニュアル`,
      serviceName: "AIマニュアル",
      owner: "AIマニュアル Service Ops"
    },
    en: {
      productName,
      documentName: `${productName} User Manual`,
      serviceName: "AI Manual",
      owner: "AI Manual Service Ops"
    }
  };
}

function isLikelyHeading(block) {
  return block.tag !== "p"
    || /^(\d+(\.\d+)*\.?\s+)/.test(block.text)
    || (block.text.length <= 42 && !/[.!?。다]$/.test(block.text));
}

function chunkParagraphs(paragraphs) {
  const chunks = [];
  for (let index = 0; index < paragraphs.length; index += 2) {
    chunks.push(paragraphs.slice(index, index + 2));
  }
  return chunks;
}

function buildSection(sectionIndex, sectionTitle, subsectionTitle, content) {
  const indexLabel = sectionIndex + 1;
  const compact = content.replace(/\s+/g, " ").trim();
  const summarySnippet = compact.slice(0, 220);
  const normalizedSectionTitle = /^(\d+(\.\d+)*\.?\s+)/.test(sectionTitle)
    ? sectionTitle
    : `${indexLabel}. ${sectionTitle}`;
  const normalizedSubsectionTitle = /^(\d+(\.\d+)*\.?\s+)/.test(subsectionTitle)
    ? subsectionTitle
    : `${indexLabel}.1 ${subsectionTitle}`;
  return {
    id: `uploaded-section-${indexLabel}`,
    sectionTitle: normalizedSectionTitle,
    subsectionTitle: normalizedSubsectionTitle,
    intent: `${sectionTitle} 관련 핵심 정보`,
    content: compact,
    keywords: Array.from(new Set(compact.split(/\s+/).filter(Boolean))).slice(0, 12),
    translations: {
      ja: {
        sectionTitle: `${indexLabel}. アップロードセクション ${indexLabel}`,
        subsectionTitle: `${indexLabel}.1 要点`
      },
      en: {
        sectionTitle: `${indexLabel}. Uploaded Section ${indexLabel}`,
        subsectionTitle: `${indexLabel}.1 Key Points`
      }
    },
    sampleOutputs: {
      ja: `アップロードされた原文から抽出した要約版です。主な内容: ${summarySnippet}`,
      en: `This is a summary version extracted from the uploaded source document. Key content: ${summarySnippet}`
    }
  };
}

function buildSections(blocks) {
  const contentBlocks = [...blocks];
  const summaryParagraphs = [];
  const sections = [];
  let currentHeading = "업로드 문서 개요";
  let currentSubheading = "핵심 내용";
  let currentParagraphs = [];
  let hasExplicitHeading = false;

  const flushSection = () => {
    if (!currentParagraphs.length) {
      return;
    }
    sections.push(buildSection(
      sections.length,
      currentHeading,
      currentSubheading,
      currentParagraphs.join(" ")
    ));
    currentParagraphs = [];
  };

  for (const block of contentBlocks) {
    if (!hasExplicitHeading && !isLikelyHeading(block) && summaryParagraphs.length < 2) {
      summaryParagraphs.push(block.text);
      continue;
    }

    if (isLikelyHeading(block)) {
      hasExplicitHeading = true;
      flushSection();
      currentHeading = block.text;
      currentSubheading = block.tag === "h3" ? block.text : "핵심 내용";
      continue;
    }

    currentParagraphs.push(block.text);
  }

  flushSection();

  if (!sections.length) {
    const paragraphs = contentBlocks.map((block) => block.text).filter(Boolean);
    const chunks = chunkParagraphs(paragraphs.slice(2));
    return {
      summaryParagraphs: paragraphs.slice(0, 2),
      sections: chunks.map((chunk, index) => buildSection(index, `업로드 섹션 ${index + 1}`, "핵심 내용", chunk.join(" ")))
    };
  }

  return {
    summaryParagraphs,
    sections
  };
}

function buildFaqSeeds(productName) {
  return [
    {
      question: "업로드한 문서는 언제 반영되었나요?",
      answer: "문서 업로드가 완료되면 즉시 문서 패키지가 재생성되며 운영 페이지에 업로드 시각이 기록됩니다."
    },
    {
      question: "어떤 기준으로 섹션이 생성되나요?",
      answer: "Word 문서의 제목과 본문 단락 구조를 바탕으로 섹션과 하위 섹션을 자동 추정합니다. 필요 시 원문을 수정해 다시 업로드할 수 있습니다."
    },
    {
      question: `${productName} 문서는 어떤 언어로 제공되나요?`,
      answer: "한국어 원문과 일본어·영어 요약본이 함께 생성됩니다. 요약본은 검토 전 자동 생성본입니다."
    }
  ];
}

export async function parseUploadedDocx({ fileName, buffer, uploadedAt, fileSize }) {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  const { value: rawText } = await mammoth.extractRawText({ buffer });
  const blocks = extractBlocks(html);
  const textParagraphs = rawText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const documentTitle = normalizeTitle(textParagraphs[0] ?? blocks.find((block) => block.tag === "h1")?.text, fileName);
  const productName = inferProductName(documentTitle);
  const { summaryParagraphs, sections } = buildSections(blocks.length ? blocks.slice(blocks[0]?.text === documentTitle ? 1 : 0) : textParagraphs.map((text) => ({ tag: "p", text })));
  const summary = (summaryParagraphs.length ? summaryParagraphs : textParagraphs.slice(1, 3)).join(" ").trim()
    || `${productName} 문서가 업로드되어 자동 패키지화되었습니다.`;
  const localizedMeta = makeLocalizedMeta(documentTitle, productName);
  const uploadVersion = new Date(uploadedAt).toISOString().slice(0, 16).replace(/[-:T]/g, ".");
  const source = {
    ...newProductSource,
    productName,
    documentName: documentTitle,
    owner: localizedMeta.ko.owner,
    localizedMeta,
    upstreamRepository: splitFileName(fileName).toLowerCase().replace(/\s+/g, "-") || "uploaded-manual",
    upstreamSystems: [
      {
        id: "uploaded-manual",
        label: "Uploaded Word document",
        kind: "upload",
        repository: fileName,
        version: uploadVersion,
        status: "synced",
        detail: "사용자가 업로드한 Word 원문 파일"
      },
      {
        id: "package-generator",
        label: "Document package generator",
        kind: "automation",
        repository: "in-memory-package-builder",
        version: "1.0.0",
        status: "synced",
        detail: "업로드 원문에서 문서 패키지를 자동 생성"
      }
    ],
    version: `upload-${new Date(uploadedAt).toISOString().slice(0, 10)}`,
    releaseDate: new Date(uploadedAt).toISOString().slice(0, 10),
    audience: `${productName} 운영 담당자, QA 담당자, 현장 관리자`,
    productSummary: summary,
    structuredFacts: [
      `원본 파일명: ${fileName}`,
      `추출된 섹션 수: ${sections.length}`,
      `총 문단 수: ${textParagraphs.length}`
    ],
    sections,
    faqSeeds: buildFaqSeeds(productName)
  };

  const eventId = `UPLOAD-${new Date(uploadedAt).toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
  const changeEvent = {
    eventId,
    effectiveDate: new Date(uploadedAt).toISOString().slice(0, 10),
    title: "업로드 문서 패키지 생성",
    localizations: {
      ja: {
        title: "アップロード文書パッケージ生成",
        summary: `${fileName} をもとに文書パッケージを自動生成しました。`
      },
      en: {
        title: "Uploaded document package generated",
        summary: `A document package was generated automatically from ${fileName}.`
      }
    },
    commit: {
      hash: eventId.slice(-7).toLowerCase(),
      message: `docs(upload): generate package from ${fileName}`,
      author: "AI 매뉴얼 Upload Bot",
      localizedAuthors: {
        ko: "AI 매뉴얼 Upload Bot",
        ja: "AIマニュアル Upload Bot",
        en: "AI Manual Upload Bot"
      },
      committedAt: uploadedAt
    },
    summary: `${fileName} 업로드를 기반으로 문서 패키지를 자동 생성했습니다.`,
    updates: sections.slice(0, 2).map((section) => ({
      sectionId: section.id,
      subsectionTitle: section.subsectionTitle,
      contentAppend: "업로드 원문 기준으로 패키지를 재생성했습니다.",
      keywordsAdd: ["업로드", "자동 생성", productName]
    })),
    faqAdditions: [
      {
        question: "업로드된 문서는 어디서 확인하나요?",
        answer: "문서 패키지 페이지에서 미리보기와 언어별 다운로드를 바로 확인할 수 있습니다."
      }
    ]
  };

  return {
    source,
    changeEvent,
    uploadMeta: {
      fileName,
      fileSize,
      uploadedAt,
      documentTitle,
      productName,
      paragraphCount: textParagraphs.length,
      sectionCount: sections.length,
      summaryLength: summary.length
    }
  };
}
