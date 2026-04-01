import { manualSource } from "./src/data/manual-source.mjs";
import { changeEvent } from "./src/data/change-event.mjs";
import { createDocumentationHubState, answerQuestion } from "./src/core/guidium-pilot.mjs";
import { documentationSystems, defaultSystemId, getDocumentationSystem } from "./src/data/system-registry.mjs";

const page = document.body.dataset.page;
const storageKeys = {
  system: "ai-manual:selected-system",
  locale: "ai-manual:locale",
  documentLanguage: "ai-manual:document-language"
};

const uiCopy = {
  ko: {
    brand: { appName: "AI 매뉴얼" },
    nav: ["대시보드", "매뉴얼", "연결", "Q&A 챗봇"],
    pages: {
      overview: ["대시보드", "매뉴얼 허브", "동기화와 준비 상태", "연결 상태"],
      documents: ["매뉴얼", "매뉴얼", "언어별 매뉴얼 다운로드", "매뉴얼", "매뉴얼 미리보기", "미리보기"],
      operations: ["연결", "연결", "시스템 연결 상태", "연결", "최근 반영", "변경 이력"],
      search: ["Q&A 챗봇", "Q&A 챗봇", "질문하기", "대화", "근거 위치", "아티팩트"]
    },
    controls: {
      system: "시스템", locale: "언어", ask: "질문하기",
      download: "다운로드", status: "허브 상태",
      connected: "연결됨", waiting: "연결 대기", preparing: "준비 중",
      sync: "동기화 시각", version: "현재 버전", latest: "최근 이벤트",
      source: "원천 저장소", owner: "운영 주체", activeSystem: "선택 시스템",
      pendingSystems: "대기 시스템",
      previewEmpty: "이 시스템의 매뉴얼 미리보기를 준비 중입니다.",
      fullManual: "전체 매뉴얼",
      summaryVersion: "요약본",
      summaryPreview: "요약 미리보기",
      citation: "출처",
      greeting: "안녕하세요. AI 매뉴얼 서비스입니다. 매뉴얼에 대해 무엇이든 물어보세요.",
      chatError: "AI 응답 서버에 연결하지 못했습니다. 서버와 Gemini API 설정을 확인해 주세요.",
      noAnswer: "현재 질문에 대한 답변을 생성하지 못했습니다. 다른 표현으로 다시 질문해 주세요.",
      event: "이벤트",
      uploadTitle: "신규 프로덕트 Word 업로드",
      uploadDescription: "신규 프로덕트는 기존 매뉴얼이 없으므로 Word(.docx) 원문을 업로드해 매뉴얼을 생성합니다.",
      uploadButton: "업로드 후 매뉴얼 생성",
      uploadEmpty: "업로드된 문서가 없습니다. Word 파일을 올리면 매뉴얼과 연결 정보가 생성됩니다.",
      uploadPending: "Word 파일을 업로드하는 중입니다...",
      uploadSuccess: "매뉴얼 생성이 완료되었습니다.",
      uploadError: "Word 업로드에 실패했습니다. 파일 형식과 내용을 확인해 주세요.",
      uploadRequired: "신규 프로덕트는 Word 문서를 먼저 업로드해야 Q&A 챗봇과 매뉴얼 생성을 이용할 수 있습니다.",
      selectedFile: "선택 파일",
      uploadedAt: "업로드 시각",
      sectionCount: "섹션 수",
      paragraphCount: "문단 수",
      generatedPackage: "생성된 매뉴얼",
      sourceFile: "원본 파일"
    }
  },
  ja: {
    brand: { appName: "AIマニュアル" },
    nav: ["ダッシュボード", "マニュアル", "連携", "Q&Aチャットボット"],
    pages: {
      overview: ["ダッシュボード", "マニュアルハブ", "同期と準備状態", "連携状態"],
      documents: ["マニュアル", "マニュアル", "言語別マニュアルダウンロード", "マニュアル", "マニュアルプレビュー", "プレビュー"],
      operations: ["連携", "連携", "システム連携状態", "連携", "最新反映", "変更履歴"],
      search: ["Q&Aチャットボット", "Q&Aチャットボット", "質問する", "対話", "根拠位置", "アーティファクト"]
    },
    controls: {
      system: "システム", locale: "言語", ask: "質問する",
      download: "ダウンロード", status: "ハブ状態",
      connected: "接続済み", waiting: "接続待機", preparing: "準備中",
      sync: "同期時刻", version: "現在バージョン", latest: "最新イベント",
      source: "ソース保存先", owner: "運営主体", activeSystem: "選択システム",
      pendingSystems: "待機システム",
      previewEmpty: "このシステムのマニュアルプレビューを準備中です。",
      fullManual: "完全版マニュアル",
      summaryVersion: "要約版",
      summaryPreview: "要約プレビュー",
      citation: "出典",
      greeting: "こんにちは。AIマニュアルサービスです。マニュアルについて何でも聞いてください。",
      chatError: "AI 応答サーバーに接続できませんでした。サーバーと Gemini API 設定を確認してください。",
      noAnswer: "この質問に対する回答を生成できませんでした。別の表現で再度お試しください。",
      event: "イベント",
      uploadTitle: "新規プロダクト Word アップロード",
      uploadDescription: "新規プロダクトには既存マニュアルがないため、Word(.docx) 原本をアップロードしてマニュアルを生成します。",
      uploadButton: "アップロードしてマニュアル生成",
      uploadEmpty: "アップロード済み文書がありません。Word ファイルをアップロードするとマニュアルと連携情報が生成されます。",
      uploadPending: "Word ファイルをアップロードしています...",
      uploadSuccess: "マニュアルの生成が完了しました。",
      uploadError: "Word アップロードに失敗しました。ファイル形式と内容を確認してください。",
      uploadRequired: "新規プロダクトは先に Word 文書をアップロードしてから Q&Aチャットボットとマニュアル生成を利用できます。",
      selectedFile: "選択ファイル",
      uploadedAt: "アップロード時刻",
      sectionCount: "セクション数",
      paragraphCount: "段落数",
      generatedPackage: "生成済みマニュアル",
      sourceFile: "元ファイル"
    }
  },
  en: {
    brand: { appName: "AI Manual" },
    nav: ["Dashboard", "Manuals", "Connections", "Q&A Chatbot"],
    pages: {
      overview: ["Dashboard", "Manual Hub", "Sync & Readiness", "Connection Status"],
      documents: ["Manuals", "Manuals", "Manual Downloads by Language", "Manual", "Manual Preview", "Preview"],
      operations: ["Connections", "Connections", "System Connection Status", "Connection", "Latest Update", "Change Log"],
      search: ["Q&A Chatbot", "Q&A Chatbot", "Ask Questions", "Chat", "Citation", "Artifact"]
    },
    controls: {
      system: "System", locale: "Language", ask: "Ask",
      download: "Download", status: "Hub Status",
      connected: "Connected", waiting: "Pending", preparing: "Preparing",
      sync: "Synced At", version: "Current Version", latest: "Latest Event",
      source: "Source Repo", owner: "Owner", activeSystem: "Active System",
      pendingSystems: "Pending Systems",
      previewEmpty: "The manual preview is being prepared for this system.",
      fullManual: "Full Manual",
      summaryVersion: "Summary Version",
      summaryPreview: "Summary Preview",
      citation: "Citation",
      greeting: "Hello. This is AI Manual. Ask anything about the manuals.",
      chatError: "Couldn't reach the AI response server. Check the server and Gemini API configuration.",
      noAnswer: "Couldn't generate an answer for this question. Please try rephrasing it.",
      event: "Event",
      uploadTitle: "New Product Word Upload",
      uploadDescription: "New Product has no existing manual yet, so upload a Word (.docx) source file to generate manuals.",
      uploadButton: "Upload and Generate Manuals",
      uploadEmpty: "No uploaded document yet. Upload a Word file to generate manuals and connection details.",
      uploadPending: "Uploading the Word file...",
      uploadSuccess: "Manuals were generated successfully.",
      uploadError: "Word upload failed. Please check the file format and contents.",
      uploadRequired: "Upload a Word document for New Product before using the Q&A chatbot or manual generation.",
      selectedFile: "Selected File",
      uploadedAt: "Uploaded At",
      sectionCount: "Section Count",
      paragraphCount: "Paragraph Count",
      generatedPackage: "Generated Manuals",
      sourceFile: "Source File"
    }
  }
};

const quickQuestions = {
  ko: [
    "긴급 점검 문서 승인 규칙이 어떻게 되나요?",
    "매뉴얼 생성 결과는 어떤 언어로 볼 수 있나요?",
    "출처는 어떻게 표시되나요?"
  ],
  ja: [
    "緊急点検文書の承認ルールはどうなっていますか。",
    "マニュアル生成結果はどの言語で確認できますか。",
    "出典はどのように表示されますか。"
  ],
  en: [
    "What are the approval rules for urgent inspection documents?",
    "In what languages can I view manual generation results?",
    "How are citations displayed?"
  ]
};

const state = {
  locale: localStorage.getItem(storageKeys.locale) || "ko",
  systemId: localStorage.getItem(storageKeys.system) || defaultSystemId,
  documentLanguage: localStorage.getItem(storageKeys.documentLanguage) || "ko",
  chatHistory: [],
  currentViewModel: null,
  selectedUploadFile: null,
  selectedImageFiles: [],
  uploadMode: "word",
  uploadStatus: { type: "idle", message: "" },
  lastSeenCommitSha: localStorage.getItem("ai-manual:last-commit-sha") || null,
  lastCheckedAt: null,
  syncIntervalId: null
};

state.documentLanguage = state.locale;
localStorage.setItem(storageKeys.documentLanguage, state.documentLanguage);

const elements = {
  systemSelect: document.querySelector("#systemSelect"),
  localeSelect: document.querySelector("#localeSelect"),
  systemBadge: document.querySelector("#systemBadge"),
  sidebarStatus: document.querySelector("#sidebarStatus"),
  overviewSummary: document.querySelector("#overviewSummary"),
  readinessRail: document.querySelector("#readinessRail"),
  newProductUploadSection: document.querySelector("#newProductUploadSection"),
  newProductUploadTitle: document.querySelector("#newProductUploadTitle"),
  newProductUploadDescription: document.querySelector("#newProductUploadDescription"),
  newProductUploadStatus: document.querySelector("#newProductUploadStatus"),
  newProductFileInput: document.querySelector("#newProductFileInput"),
  newProductUploadButton: document.querySelector("#newProductUploadButton"),
  documentLanguageTabs: document.querySelector("#documentLanguageTabs"),
  documentPackages: document.querySelector("#documentPackages"),
  documentPreview: document.querySelector("#documentPreview"),
  packageSection: document.querySelector(".package-section"),
  previewSection: document.querySelector(".preview-section"),
  operationsSummary: document.querySelector("#operationsSummary"),
  pipelineGrid: document.querySelector("#pipelineGrid"),
  latestChange: document.querySelector("#latestChange"),
  chatLog: document.querySelector("#chatLog"),
  chatForm: document.querySelector("#chatForm"),
  chatInput: document.querySelector("#chatInput"),
  commitHistory: document.querySelector("#commitHistory"),
  commitRepoLabel: document.querySelector("#commitRepoLabel"),
  syncBadge: document.querySelector("#syncBadge"),
  commitNotificationBanner: document.querySelector("#commitNotificationBanner")
};

function isNewProductSystem(systemId = state.systemId) {
  return systemId === "new-product";
}

function isUploadableSystem(systemId = state.systemId) {
  return ["new-product", "myeongjang-ai"].includes(systemId);
}

function getIntlLocale(locale = state.locale) {
  return locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "ko-KR";
}

function formatTimestamp(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(getIntlLocale(), { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(getIntlLocale(), { dateStyle: "medium" }).format(new Date(value));
}

function getLocaleCopy(locale = state.locale) {
  return uiCopy[locale] ?? uiCopy.ko;
}

function getSelectedSystem() {
  return getDocumentationSystem(state.systemId);
}

function getCurrentViewModel() {
  return state.currentViewModel;
}

function getSystemDisplayName(system) {
  return system.localizedNames?.[state.locale] ?? system.name;
}

function getLocalizedSourceMeta(source, language = state.locale) {
  const localeMeta = source?.localizedMeta?.[language] ?? {};
  const serviceName = localeMeta.serviceName ?? getLocaleCopy(language).brand.appName;
  return {
    productName: localeMeta.productName ?? source?.productName ?? "",
    documentName: localeMeta.documentName ?? source?.documentName ?? "",
    serviceName,
    owner: localeMeta.owner ?? `${serviceName} Service Ops`
  };
}

function getLocalizedChange(system, hubState, locale = state.locale, changeOverride = system.changeEvent) {
  const change = changeOverride;
  const localized = change?.localizations?.[locale] ?? {};
  return {
    title: localized.title ?? hubState.latestChange.title,
    summary: localized.summary ?? hubState.latestChange.summary,
    author: change?.commit?.localizedAuthors?.[locale] ?? hubState.latestChange.commitAuthor ?? change?.commit?.author ?? "-"
  };
}

function getLocalizedSectionLabels(manual, sectionId, locale = state.locale) {
  const sample = manual.localizedSamples.find((item) => item.sectionId === sectionId);
  if (!sample) {
    return { section: "", subsection: "" };
  }
  if (locale === "ko") {
    return { section: sample.section, subsection: sample.subsection };
  }
  return {
    section: sample.titles?.[locale]?.sectionTitle ?? sample.section,
    subsection: sample.titles?.[locale]?.subsectionTitle ?? sample.subsection
  };
}

function getLocalizedConfidence(confidence, locale = state.locale) {
  const labels = {
    ko: { high: "높음", medium: "보통", low: "낮음" },
    ja: { high: "高", medium: "中", low: "低" },
    en: { high: "High", medium: "Medium", low: "Low" }
  };
  return labels[locale]?.[confidence] ?? confidence;
}

function buildCitationLocation(documentSource, citation, manual, locale = state.locale) {
  const meta = getLocalizedSourceMeta(documentSource, locale);
  const docName = meta.documentName;
  if (citation.sourceType === "faq") {
    const faqLabel = locale === "ja" ? "FAQ 下書き" : locale === "en" ? "FAQ Draft" : "FAQ 초안";
    return `${docName} > ${faqLabel}`;
  }
  const titles = getLocalizedSectionLabels(manual, citation.sectionId, locale);
  return `${docName} > ${titles.section || citation.section} > ${titles.subsection || citation.subsection}`;
}

function buildStaticViewModel(system) {
  if (system.source && system.changeEvent) {
    return {
      system,
      source: system.source,
      changeEvent: system.changeEvent,
      hubState: createDocumentationHubState(system.source, system.changeEvent, {
        syncedAt: new Date().toISOString(),
        sourceRepository: system.repository
      }),
      uploadMeta: null,
      generated: false
    };
  }

  return {
    system,
    source: system.source,
    changeEvent: system.changeEvent,
    hubState: {
      manual: null,
      searchIndex: [],
      sourceRepository: system.repository,
      currentVersion: system.hubPreview.currentVersion,
      latestChange: system.hubPreview.latestChange,
      readiness: system.hubPreview.readiness,
      systemStates: [],
      downloads: [],
      sync: system.hubPreview.sync
    },
    uploadMeta: null,
    generated: false
  };
}

async function loadSystemViewModel() {
  const system = getSelectedSystem();

  // 업로드 가능한 시스템은 서버에서 생성된 상태를 먼저 확인
  if (isUploadableSystem(system.id)) {
    try {
      const response = await fetch(`/api/${system.id}/state`, { cache: "no-store" });
      if (response.ok) {
        const payload = await response.json();
        if (payload.available) {
          return {
            system,
            source: payload.source,
            changeEvent: payload.changeEvent,
            hubState: payload.hubState,
            uploadMeta: payload.uploadMeta,
            generated: true
          };
        }
      }
    } catch {
      // 에러 시 fallback
    }

    // new-product는 정적 소스 없음, myeongjang-ai는 정적 소스로 fallback
    if (isNewProductSystem(system.id)) {
      return {
        ...buildStaticViewModel(system),
        hubState: {
          ...buildStaticViewModel(system).hubState,
          manual: null,
          searchIndex: []
        }
      };
    }
  }

  return buildStaticViewModel(system);
}

// ── 인메모리 매뉴얼 → HTML (신뢰 소스, XSS 안전) ──
function buildDocHtml(manual, language, source) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const langLabel = { ko: "한국어", ja: "日本語", en: "English" };
  const summaryLabel = { ko: "전체 매뉴얼", ja: "日本語 要約版", en: "English Summary Version" };
  const previewEmpty = {
    ko: "미리보기를 준비 중입니다.",
    ja: "プレビューを準備中です。",
    en: "Preview is being prepared."
  };
  const meta = getLocalizedSourceMeta(source, language);

  let html = `<h1>${esc(meta.documentName)}</h1>`;
  html += `<p class="doc-meta">${esc(meta.productName)} · v${esc(manual.version)} · ${esc(manual.releaseDate)} · ${langLabel[language] || language.toUpperCase()}</p>`;

  if (language === "ko") {
    html += `<p>${esc(manual.summary)}</p><hr>`;
    for (const s of manual.sections) {
      html += `<h2>${esc(s.section)}</h2><h3>${esc(s.subsection)}</h3><p>${esc(s.content)}</p>`;
    }
    html += `<h2>FAQ</h2>`;
    for (const item of manual.faqDraft) {
      html += `<p><strong>Q.</strong> ${esc(item.question)}</p><p>${esc(item.answer)}</p>`;
    }
  } else {
    html += `<p>${esc(summaryLabel[language] || summaryLabel.en)}</p><hr>`;
    html += `<hr>`;
    for (const sample of manual.localizedSamples) {
      const text = sample.samples?.[language];
      const sectionTitle = sample.titles?.[language]?.sectionTitle ?? sample.section;
      const subsectionTitle = sample.titles?.[language]?.subsectionTitle ?? sample.subsection;
      html += `<h2>${esc(sectionTitle)}</h2><h3>${esc(subsectionTitle)}</h3>`;
      html += text ? `<p>${esc(text)}</p>` : `<p class="muted">${esc(previewEmpty[language] || previewEmpty.en)}</p>`;
    }
  }
  return html;
}

// ── 정적 카피 세팅 ─────────────────────────────────────
function setStaticCopy() {
  const copy = getLocaleCopy();
  document.documentElement.lang = state.locale;
  document.querySelectorAll(".nav-link").forEach((node, i) => {
    node.textContent = copy.nav[i];
  });

  document.querySelectorAll(".brand-mark").forEach((node) => {
    node.textContent = copy.brand.appName;
  });

  const eyebrow = document.querySelector(".page-title .eyebrow");
  const title = document.querySelector(".page-title h1");
  const headings = copy.pages[page];
  if (eyebrow) eyebrow.textContent = headings[0];
  if (title) title.textContent = headings[1];
  document.title = page === "overview" ? copy.brand.appName : `${copy.brand.appName} — ${headings[1]}`;

  const panelEyebrows = document.querySelectorAll(".panel:not([data-copy-skip='true']) .eyebrow");
  const panelTitles = document.querySelectorAll(".panel:not([data-copy-skip='true']) h2");
  if (headings[3] && panelEyebrows[0]) panelEyebrows[0].textContent = headings[3];
  if (headings[2] && panelTitles[0]) panelTitles[0].textContent = headings[2];
  if (headings[5] && panelEyebrows[1]) panelEyebrows[1].textContent = headings[5];
  if (headings[4] && panelTitles[1]) panelTitles[1].textContent = headings[4];

  document.querySelectorAll(".select-wrap span").forEach((node, i) => {
    node.textContent = i === 0 ? copy.controls.system : copy.controls.locale;
  });

  document.querySelectorAll("button[type='submit']").forEach((node) => {
    node.textContent = copy.controls.ask;
  });
}

function renderSystemSelectors() {
  if (!elements.systemSelect || !elements.localeSelect) return;

  elements.systemSelect.innerHTML = documentationSystems
    .map((s) => {
      const displayName = s.localizedNames?.[state.locale] ?? s.name;
      return `<option value="${s.id}">${displayName}</option>`;
    })
    .join("");
  elements.systemSelect.value = state.systemId;

  elements.localeSelect.innerHTML = [
    ["ko", "한국어"], ["ja", "日本語"], ["en", "English"]
  ].map(([code, label]) => `<option value="${code}">${label}</option>`).join("");
  elements.localeSelect.value = state.locale;
}

function renderSidebarStatus(viewModel) {
  if (!elements.sidebarStatus) return;
  const { hubState, system, generated } = viewModel;
  const copy = getLocaleCopy();
  const displayName = getSystemDisplayName(system);
  const statusLabel =
    (isNewProductSystem(system.id) && !generated) ? copy.controls.preparing :
    system.lifecycle === "active" ? copy.controls.connected :
    system.lifecycle === "planned" ? copy.controls.waiting :
    copy.controls.preparing;

  if (elements.systemBadge) {
    elements.systemBadge.textContent = `${displayName} · ${statusLabel}`;
  }

  elements.sidebarStatus.innerHTML = `
    <p class="eyebrow">${copy.controls.status}</p>
    <strong>${displayName}</strong>
    <span>${statusLabel}</span>
    <span>${formatTimestamp(hubState.sync?.syncedAt)}</span>
  `;
}

function getUploadStatusMessage(viewModel, copy = getLocaleCopy()) {
  if (state.uploadStatus.message) {
    return state.uploadStatus.message;
  }
  if (state.selectedUploadFile) {
    return `${copy.controls.selectedFile}: ${state.selectedUploadFile.name}`;
  }
  if (viewModel.generated && viewModel.uploadMeta) {
    return `${copy.controls.sourceFile}: ${viewModel.uploadMeta.fileName}`;
  }
  return copy.controls.uploadEmpty;
}

function renderNewProductUpload(viewModel) {
  if (!elements.newProductUploadSection) return;

  const showUploadBar = page === "documents" && isUploadableSystem(viewModel.system.id);
  elements.newProductUploadSection.hidden = !showUploadBar;
  if (!showUploadBar) return;

  const copy = getLocaleCopy();
  const isLoading = state.uploadStatus.type === "pending";
  const isWord = state.uploadMode === "word";

  const t = {
    ko: {
      wordTab: "📄 Word 업로드",
      imageTab: "🖼️ 스크린샷 업로드",
      wordDesc: "Word 파일을 업로드하면 AI가 자동으로 매뉴얼을 생성합니다.",
      imageDesc: "스크린샷을 업로드하면 AI가 화면을 분석하여 매뉴얼을 자동 생성합니다. (최대 10장)",
      wordUploadBtn: copy.controls.uploadButton || "업로드 및 생성",
      imageUploadBtn: "스크린샷으로 매뉴얼 생성",
      analyzingWord: "AI가 문서를 분석하고 있습니다...",
      analyzingImage: "AI가 스크린샷을 분석하고 있습니다...",
      analyzingSub: "잠시만 기다려 주세요. 매뉴얼을 생성 중입니다.",
      selected: (n) => `🖼️ ${n}장 선택됨`,
      wordStatus: state.uploadStatus.message || (state.selectedUploadFile ? `선택된 파일: ${state.selectedUploadFile.name}` : "파일을 선택해 주세요.")
    },
    ja: {
      wordTab: "📄 Wordアップロード",
      imageTab: "🖼️ スクリーンショット",
      wordDesc: "Wordファイルをアップロードすると、AIが自動でマニュアルを生成します。",
      imageDesc: "スクリーンショットをアップロードすると、AIが画面を分析してマニュアルを生成します。（最大10枚）",
      wordUploadBtn: copy.controls.uploadButton || "アップロードして生成",
      imageUploadBtn: "スクリーンショットでマニュアル生成",
      analyzingWord: "AIがドキュメントを分析しています...",
      analyzingImage: "AIがスクリーンショットを分析しています...",
      analyzingSub: "しばらくお待ちください。マニュアルを生成中です。",
      selected: (n) => `🖼️ ${n}枚選択済み`,
      wordStatus: state.uploadStatus.message || (state.selectedUploadFile ? `選択ファイル: ${state.selectedUploadFile.name}` : "ファイルを選択してください。")
    },
    en: {
      wordTab: "📄 Upload Word",
      imageTab: "🖼️ Screenshots",
      wordDesc: "Upload a Word file and AI will automatically generate a manual.",
      imageDesc: "Upload screenshots and AI will analyze the screens to generate a manual. (Max 10)",
      wordUploadBtn: copy.controls.uploadButton || "Upload & Generate",
      imageUploadBtn: "Generate Manual from Screenshots",
      analyzingWord: "AI is analyzing the document...",
      analyzingImage: "AI is analyzing the screenshots...",
      analyzingSub: "Please wait while the manual is being generated.",
      selected: (n) => `🖼️ ${n} image(s) selected`,
      wordStatus: state.uploadStatus.message || (state.selectedUploadFile ? `Selected: ${state.selectedUploadFile.name}` : "Please select a file.")
    }
  }[state.locale] || {};

  const wordStatusClass = state.uploadStatus.type && state.uploadStatus.type !== "idle"
    ? `upload-status ${state.uploadStatus.type}`
    : "upload-status";

  const thumbnailsHtml = state.selectedImageFiles.length > 0
    ? `<div class="image-thumbnail-grid">${state.selectedImageFiles.map((f) => `<img src="${URL.createObjectURL(f)}" alt="${f.name}" />`).join("")}</div>
       <div class="image-count-badge">${t.selected(state.selectedImageFiles.length)}</div>`
    : "";

  elements.newProductUploadSection.innerHTML = `
    <div class="upload-tab-buttons">
      <button type="button" class="upload-tab-btn${isWord ? " active" : ""}" data-upload-tab="word">${t.wordTab}</button>
      <button type="button" class="upload-tab-btn${!isWord ? " active" : ""}" data-upload-tab="image">${t.imageTab}</button>
    </div>
    <p class="upload-copy">${isWord ? t.wordDesc : t.imageDesc}</p>
    ${isWord ? `
      <div class="upload-banner-actions">
        <input id="newProductFileInput" class="upload-input" type="file" accept=".docx" ${isLoading ? "disabled" : ""} />
        <button id="newProductUploadButton" type="button" class="blue" ${(!state.selectedUploadFile || isLoading) ? "disabled" : ""}>${t.wordUploadBtn}</button>
      </div>
      <div class="${wordStatusClass}">${t.wordStatus}</div>
    ` : `
      <div class="upload-banner-actions">
        <input id="imageFileInput" class="upload-input" type="file" accept="image/*" multiple ${isLoading ? "disabled" : ""} />
        <button id="imageUploadButton" type="button" class="blue" ${(state.selectedImageFiles.length === 0 || isLoading) ? "disabled" : ""}>${t.imageUploadBtn}</button>
      </div>
      ${thumbnailsHtml}
    `}
    ${isLoading ? `
      <div class="upload-loading-overlay">
        <div class="upload-spinner"></div>
        <div class="upload-loading-text">${isWord ? t.analyzingWord : t.analyzingImage}</div>
        <div class="upload-loading-sub">${t.analyzingSub}</div>
      </div>
    ` : ""}
  `;
}

function buildNewProductUploadMarkup(viewModel, variant = "preview") {
  const copy = getLocaleCopy();
  const statusMessage = getUploadStatusMessage(viewModel, copy);
  const statusClass = state.uploadStatus.type && state.uploadStatus.type !== "idle"
    ? `upload-status ${state.uploadStatus.type}`
    : "upload-status";
  const buttonDisabled = !state.selectedUploadFile || state.uploadStatus.type === "pending" ? "disabled" : "";
  const title = variant === "preview" ? copy.controls.uploadTitle : copy.controls.generatedPackage;
  const description = variant === "preview" ? copy.controls.uploadDescription : copy.controls.uploadEmpty;

  return `
    <article class="preview-card upload-inline-card">
      <p class="eyebrow">${title}</p>
      <h3>${title}</h3>
      <p class="upload-copy">${description}</p>
      <div class="upload-actions">
        <input id="newProductFileInput" class="upload-input" type="file" accept=".docx" />
        <button id="newProductUploadButton" type="button" class="blue" ${buttonDisabled}>${copy.controls.uploadButton}</button>
      </div>
      <div class="${statusClass}">${statusMessage}</div>
    </article>
  `;
}

function renderOverview(hubState) {
  if (!elements.overviewSummary) return;
  const copy = getLocaleCopy();
  const system = getSelectedSystem();
  const displayName = getSystemDisplayName(system);

  elements.overviewSummary.innerHTML = `
    <article class="stat-card">
      <p class="eyebrow">${copy.controls.activeSystem}</p>
      <strong>${displayName}</strong>
      <span>${copy.controls.connected}</span>
    </article>
    <article class="stat-card highlight">
      <p class="eyebrow">${copy.controls.version}</p>
      <strong>${hubState.currentVersion}</strong>
      <span>${copy.controls.source}: ${hubState.sourceRepository}</span>
    </article>
    <article class="stat-card">
      <p class="eyebrow">${copy.controls.sync}</p>
      <strong>${formatTimestamp(hubState.sync?.syncedAt)}</strong>
      <span>${copy.controls.latest}: ${hubState.latestChange.eventId}</span>
    </article>
  `;

  elements.readinessRail.innerHTML = (hubState.readiness?.checks ?? []).slice(0, 4)
    .map((check) => `
      <article class="check-card ${check.status}">
        <strong>${check.label}</strong>
        <span>${check.status === "ready" ? copy.controls.connected : copy.controls.preparing}</span>
      </article>
    `).join("");
}

function getDocumentLanguages() {
  const labels = {
    ko: { ko: "한", ja: "일", en: "영" },
    ja: { ko: "韓", ja: "日", en: "英" },
    en: { ko: "KO", ja: "JA", en: "EN" }
  };
  return [
    { code: "ko", label: labels[state.locale]?.ko ?? "KO", full: true },
    { code: "ja", label: labels[state.locale]?.ja ?? "JA", full: false },
    { code: "en", label: labels[state.locale]?.en ?? "EN", full: false }
  ];
}

function renderDocumentTabs() {
  if (!elements.documentLanguageTabs) return;
  elements.documentLanguageTabs.innerHTML = getDocumentLanguages()
    .map((lang) => `
      <button type="button" class="segment-button ${state.locale === lang.code ? "active" : ""}"
        data-doc-language="${lang.code}">${lang.label}</button>
    `).join("");
}

function renderDocuments(viewModel) {
  if (!elements.documentPackages || !elements.documentPreview) return;

  const { system, source, hubState } = viewModel;
  const copy = getLocaleCopy();
  renderNewProductUpload(viewModel);

  const hideContent = isNewProductSystem(system.id) && !viewModel.generated;
  if (elements.packageSection) elements.packageSection.hidden = hideContent;
  if (elements.previewSection) elements.previewSection.hidden = hideContent;

  if (hideContent) {
    if (elements.documentLanguageTabs) elements.documentLanguageTabs.innerHTML = "";
    return;
  }

  if (!system.source || !hubState.manual) {
    elements.documentPackages.innerHTML = `<article class="list-card empty">${copy.controls.previewEmpty}</article>`;
    elements.documentPreview.innerHTML = `<article class="preview-card empty">${copy.controls.previewEmpty}</article>`;
    return;
  }

  elements.documentPackages.innerHTML = getDocumentLanguages()
    .map((lang) => `
      <article class="list-card ${state.locale === lang.code ? "emphasis" : ""}">
        <div>
          <p class="eyebrow">${lang.code.toUpperCase()}</p>
          <h3>${getLocalizedSourceMeta(source, lang.code).documentName}</h3>
          <p>${lang.full ? copy.controls.fullManual : copy.controls.summaryVersion} · ${hubState.currentVersion}</p>
        </div>
        <div class="list-actions">
          <button type="button" class="ghost" data-download-language="${lang.code}">${copy.controls.download}</button>
        </div>
      </article>
    `).join("");

  const viewer = document.createElement("div");
  viewer.className = "doc-viewer";
  viewer.innerHTML = buildDocHtml(hubState.manual, state.locale, source);
  elements.documentPreview.innerHTML = "";
  elements.documentPreview.appendChild(viewer);
}

async function fetchCommitHistory(systemId) {
  try {
    const res = await fetch(`/api/commits?system=${encodeURIComponent(systemId)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function renderCommitHistory(data) {
  if (!elements.commitHistory) return;
  const labels = {
    ko: { empty: "커밋 이력이 없습니다.", by: "작성자" },
    ja: { empty: "コミット履歴がありません。", by: "作成者" },
    en: { empty: "No commit history.", by: "by" }
  }[state.locale] ?? { empty: "커밋 이력이 없습니다.", by: "작성자" };

  if (!data) {
    elements.commitHistory.innerHTML = `<article class="list-card empty"><p>${labels.empty}</p></article>`;
    if (elements.commitRepoLabel) elements.commitRepoLabel.textContent = "";
    return;
  }

  if (elements.commitRepoLabel) {
    elements.commitRepoLabel.innerHTML = `<a class="repo-link" href="https://github.com/${data.githubRepo}" target="_blank" rel="noopener">⎇ ${data.githubRepo}</a>`;
  }

  elements.commitHistory.innerHTML = (data.commits ?? []).map((commit) => {
    const date = commit.committedAt
      ? new Intl.DateTimeFormat(
          state.locale === "ja" ? "ja-JP" : state.locale === "en" ? "en-US" : "ko-KR",
          { dateStyle: "medium", timeStyle: "short" }
        ).format(new Date(commit.committedAt))
      : "-";
    const colonIdx = commit.message.indexOf(":");
    const hasType = colonIdx > 0 && colonIdx < 10;
    const typeLabel = hasType ? commit.message.slice(0, colonIdx).trim() : "";
    const msgBody = hasType ? commit.message.slice(colonIdx + 1).trim() : commit.message;
    return `
      <article class="commit-card">
        <div class="commit-main">
          ${typeLabel ? `<span class="commit-type commit-type--${typeLabel}">${typeLabel}</span>` : ""}
          <span class="commit-message">${msgBody}</span>
        </div>
        <div class="commit-meta">
          <span class="commit-hash">${commit.sha}</span>
          <span>${labels.by}: ${commit.author}</span>
          <span>${date}</span>
        </div>
      </article>`;
  }).join("");
}

async function renderOperations(viewModel) {
  if (!elements.operationsSummary || !elements.pipelineGrid || !elements.latestChange) return;

  const { system, source, hubState, changeEvent, uploadMeta } = viewModel;
  const displayName = getSystemDisplayName(system);
  const copy = getLocaleCopy();
  const localizedChange = getLocalizedChange(system, hubState, state.locale, changeEvent);
  const otherSystems = documentationSystems.filter((s) => s.id !== system.id);
  const pendingSystems = otherSystems.map((s) => getSystemDisplayName(s)).join(", ");

  const uploadCards = isUploadableSystem(system.id)
    ? (uploadMeta
        ? `
          <article class="stat-card highlight">
            <p class="eyebrow">${copy.controls.sourceFile}</p>
            <strong>${uploadMeta.fileName}</strong>
            <span>${copy.controls.selectedFile}: ${uploadMeta.documentTitle}</span>
          </article>
          <article class="stat-card">
            <p class="eyebrow">${copy.controls.uploadedAt}</p>
            <strong>${formatTimestamp(uploadMeta.uploadedAt)}</strong>
            <span>${copy.controls.generatedPackage}</span>
          </article>
          <article class="stat-card">
            <p class="eyebrow">${copy.controls.sectionCount}</p>
            <strong>${uploadMeta.sectionCount}</strong>
            <span>${copy.controls.paragraphCount}: ${uploadMeta.paragraphCount}</span>
          </article>
        `
        : `
          <article class="stat-card highlight">
            <p class="eyebrow">${copy.controls.generatedPackage}</p>
            <strong>${copy.controls.uploadEmpty}</strong>
            <span>${copy.controls.uploadDescription}</span>
          </article>
        `)
    : "";

  elements.operationsSummary.innerHTML = `
    <article class="stat-card">
      <p class="eyebrow">${copy.controls.activeSystem}</p>
      <strong>${displayName}</strong>
      <span>${hubState.currentVersion}</span>
    </article>
    <article class="stat-card">
      <p class="eyebrow">${copy.controls.source}</p>
      <strong>${hubState.sourceRepository}</strong>
      <span>${copy.controls.owner}: ${getLocalizedSourceMeta(source ?? system.source, state.locale).owner}</span>
    </article>
    <article class="stat-card">
      <p class="eyebrow">${copy.controls.pendingSystems}</p>
      <strong>${pendingSystems || "-"}</strong>
      <span>${copy.controls.latest}: ${hubState.latestChange.eventId}</span>
    </article>
    ${uploadCards}
  `;

  elements.pipelineGrid.innerHTML = ((source ?? system.source)?.upstreamSystems ?? [])
    .map((item) => `
      <article class="check-card ${item.status === "synced" ? "ready" : "pending"}">
        <strong>${item.label}</strong>
        <span>${item.repository}</span>
      </article>
    `).join("");

  elements.latestChange.innerHTML = `
    <article class="list-card emphasis">
      <div>
        <p class="eyebrow">${copy.controls.latest}</p>
        <h3>${localizedChange.title}</h3>
        <p>${localizedChange.summary}</p>
      </div>
    </article>
    <article class="list-card">
      <div>
        <p class="eyebrow">${copy.controls.event}</p>
        <strong>${hubState.latestChange.eventId}</strong>
      </div>
      <div class="operation-meta">
        <span>${formatDate(hubState.latestChange.effectiveDate)}</span>
        <span>${hubState.latestChange.commitHash ?? "-"}</span>
        <span>${localizedChange.author}</span>
      </div>
    </article>
  `;

  if (elements.commitHistory) {
    elements.commitHistory.innerHTML = `<article class="list-card empty"><p>${{ ko: "불러오는 중...", ja: "読み込み中...", en: "Loading..." }[state.locale] ?? "불러오는 중..."}</p></article>`;
    const commitData = await fetchCommitHistory(system.id);
    renderCommitHistory(commitData);
    if (commitData?.commits?.length) {
      startSyncPolling(system.id);
    }
  }
}

function formatTimeAgo(date) {
  if (!date) return "-";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const t = {
    ko: { just: "방금 전", min: (n) => `${n}분 전`, hour: (n) => `${n}시간 전` },
    ja: { just: "たった今", min: (n) => `${n}分前`, hour: (n) => `${n}時間前` },
    en: { just: "just now", min: (n) => `${n}m ago`, hour: (n) => `${n}h ago` }
  }[state.locale] ?? { just: "방금 전", min: (n) => `${n}분 전`, hour: (n) => `${n}시간 전` };
  if (seconds < 60) return t.just;
  if (seconds < 3600) return t.min(Math.floor(seconds / 60));
  return t.hour(Math.floor(seconds / 3600));
}

function renderSyncBadge() {
  const badge = document.querySelector("#syncBadge");
  if (!badge) return;
  const label = { ko: "GitHub 자동 동기화 중", ja: "GitHub 自動同期中", en: "Auto-syncing with GitHub" }[state.locale] ?? "GitHub 자동 동기화 중";
  const checkedLabel = { ko: "마지막 확인", ja: "最終確認", en: "Last checked" }[state.locale] ?? "마지막 확인";
  badge.innerHTML = `<span class="sync-dot"></span><span class="sync-label">${label}</span><span class="sync-time">${checkedLabel}: ${formatTimeAgo(state.lastCheckedAt)}</span>`;
}

function showCommitNotificationBanner(commit) {
  const banner = document.querySelector("#commitNotificationBanner");
  if (!banner) return;
  const msg = { ko: "새 커밋이 감지되었습니다", ja: "新しいコミットが検出されました", en: "New commit detected" }[state.locale] ?? "새 커밋이 감지되었습니다";
  const subMsg = { ko: "매뉴얼 연동 데이터가 업데이트되었습니다.", ja: "マニュアル連携データが更新されました。", en: "Manual sync data has been updated." }[state.locale] ?? "매뉴얼 연동 데이터가 업데이트되었습니다.";
  const closeLabel = { ko: "닫기", ja: "閉じる", en: "Dismiss" }[state.locale] ?? "닫기";
  banner.hidden = false;
  banner.innerHTML = `
    <div class="commit-banner-inner">
      <span class="commit-banner-icon">🔔</span>
      <div class="commit-banner-body">
        <strong>${msg} &mdash; <em>${commit.message}</em></strong>
        <span>${subMsg}</span>
      </div>
      <button class="commit-banner-close" type="button">${closeLabel}</button>
    </div>`;
  banner.querySelector(".commit-banner-close").addEventListener("click", () => { banner.hidden = true; });
  setTimeout(() => { banner.hidden = true; }, 10000);
}

async function checkNewCommit(systemId) {
  try {
    const data = await fetchCommitHistory(systemId);
    state.lastCheckedAt = new Date();
    renderSyncBadge();
    if (data?.commits?.length) {
      const latestSha = data.commits[0].sha;
      if (state.lastSeenCommitSha && latestSha !== state.lastSeenCommitSha) {
        // 새 커밋 감지 → 배너 + 커밋 목록 갱신
        showCommitNotificationBanner(data.commits[0]);
        const commitEl = document.querySelector("#commitHistory");
        if (commitEl) renderCommitHistory(data);
      }
      // SHA 갱신 (초기값 null 포함)
      state.lastSeenCommitSha = latestSha;
      localStorage.setItem("ai-manual:last-commit-sha", latestSha);
    }
  } catch { /* 네트워크 오류 무시 */ }
}

function startSyncPolling(systemId) {
  if (state.syncIntervalId) clearInterval(state.syncIntervalId);
  state.lastCheckedAt = new Date();
  renderSyncBadge();
  // 페이지 로드 직후 즉시 한 번 체크
  checkNewCommit(systemId);
  // 이후 15초마다 반복 체크
  state.syncIntervalId = setInterval(() => checkNewCommit(systemId), 15000);
}

// ── 출처 카드 렌더링 ────────────────────────────────
function renderCitations(card, sources, manual, source) {
  if (!sources.length) return;
  const copy = getLocaleCopy();
  const wrap = document.createElement("div");
  wrap.className = "citation-wrap";
  const label = document.createElement("p");
  label.className = "citation-label";
  label.textContent = copy.controls.citation;
  wrap.appendChild(label);
  for (const src of sources.slice(0, 3)) {
    const item = document.createElement("div");
    item.className = "citation-item";
    const loc = document.createElement("span");
    loc.className = "citation-loc";
    loc.textContent = buildCitationLocation(source, src, manual);
    const conf = document.createElement("span");
    conf.className = `citation-conf conf-${src.confidence}`;
    conf.textContent = getLocalizedConfidence(src.confidence);
    item.appendChild(loc);
    item.appendChild(conf);
    wrap.appendChild(item);
  }
  card.appendChild(wrap);
}

function shouldRenderCitations(result) {
  if (!result?.sources?.length) return false;
  return result.confidence === "high" || result.confidence === "medium";
}

// ── 채팅 카드 (DOM API 사용 — 사용자 입력 XSS 방지) ──
function createChatCard(role) {
  const card = document.createElement("article");
  card.className = `chat-card ${role}`;

  if (role === "assistant") {
    const label = document.createElement("strong");
    label.textContent = "AI";
    card.appendChild(label);
  }

  const body = document.createElement("div");
  body.className = "chat-body";
  card.appendChild(body);
  return card;
}

function appendChatCard(role, text) {
  if (!elements.chatLog) return null;
  const card = createChatCard(role);
  card.querySelector(".chat-body").textContent = text;
  elements.chatLog.appendChild(card);
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
  return card;
}

// ── Gemini 스트리밍 채팅 ──────────────────────────────
async function askQuestion(query) {
  const text = query.trim();
  if (!text) return;
  if (elements.chatInput) elements.chatInput.value = "";

  const currentView = state.currentViewModel ?? await loadSystemViewModel();
  state.currentViewModel = currentView;

  if (isNewProductSystem() && !currentView.generated) {
    appendChatCard("assistant", getLocaleCopy().controls.uploadRequired);
    return;
  }

  state.chatHistory.push({ role: "user", content: text });
  appendChatCard("user", text);

  const assistantCard = createChatCard("assistant");
  assistantCard.classList.add("streaming");
  elements.chatLog.appendChild(assistantCard);
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
  const bodyEl = assistantCard.querySelector(".chat-body");
  const hubState = currentView.hubState;
  const localResult = hubState.manual ? answerQuestion(hubState, text, { locale: state.locale }) : null;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: state.chatHistory, systemId: state.systemId, locale: state.locale })
    });

    if (!res.ok) {
      const errorText = await res.text();
      let message = errorText;
      try {
        message = JSON.parse(errorText).error ?? errorText;
      } catch {
        message = errorText;
      }
      throw new Error(message || getLocaleCopy().controls.chatError);
    }

    if (!res.body) {
      throw new Error(getLocaleCopy().controls.chatError);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    let streamError = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            streamError = parsed.error;
            continue;
          }
          const chunk = parsed.text ?? parsed.choices?.[0]?.delta?.content ?? "";
          if (chunk) {
            fullText += chunk;
            bodyEl.textContent = fullText;
            elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
          }
        } catch { /* 불완전한 청크 무시 */ }
      }
    }

    if (!fullText.trim() && streamError) {
      throw new Error(streamError);
    }

    if (!fullText.trim()) {
      throw new Error(getLocaleCopy().controls.noAnswer);
    }

    assistantCard.classList.remove("streaming");
    state.chatHistory.push({ role: "assistant", content: fullText });

    if (hubState.manual && shouldRenderCitations(localResult)) {
      renderCitations(assistantCard, localResult.sources, hubState.manual, currentView.source);
    }

  } catch (error) {
    assistantCard.classList.remove("streaming");
    bodyEl.textContent = error?.message || getLocaleCopy().controls.chatError;
  }
}

function renderSearchInitial() {
  if (!elements.chatLog) return;
  elements.chatLog.innerHTML = "";
  state.chatHistory = [];
  const currentView = state.currentViewModel;
  const intro = isNewProductSystem() && currentView && !currentView.generated
    ? getLocaleCopy().controls.uploadRequired
    : getLocaleCopy().controls.greeting;
  appendChatCard("assistant", intro);

  document.querySelectorAll(".quick-question").forEach((node, i) => {
    node.textContent = quickQuestions[state.locale][i];
  });
}

function buildDownloadUrl(language) {
  const params = new URLSearchParams({ system: state.systemId, language, locale: state.locale });
  return `/api/download/manual-docx?${params.toString()}`;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

async function uploadNewProductDocument() {
  if (!state.selectedUploadFile) {
    state.uploadStatus = { type: "error", message: getLocaleCopy().controls.uploadEmpty };
    renderPage();
    return;
  }

  state.uploadStatus = { type: "pending", message: getLocaleCopy().controls.uploadPending };
  renderPage();

  try {
    const fileContentBase64 = await readFileAsBase64(state.selectedUploadFile);
    const response = await fetch(`/api/${state.systemId}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: state.selectedUploadFile.name,
        fileSize: state.selectedUploadFile.size,
        fileContentBase64
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? getLocaleCopy().controls.uploadError);
    }

    state.currentViewModel = {
      system: getSelectedSystem(),
      source: payload.source,
      changeEvent: payload.changeEvent,
      hubState: payload.hubState,
      uploadMeta: payload.uploadMeta,
      generated: true
    };
    state.uploadStatus = { type: "success", message: getLocaleCopy().controls.uploadSuccess };
    await renderPage();
  } catch (error) {
    state.uploadStatus = { type: "error", message: error.message || getLocaleCopy().controls.uploadError };
    renderPage();
  }
}

async function uploadNewProductImages() {
  if (state.selectedImageFiles.length === 0) {
    state.uploadStatus = { type: "error", message: { ko: "이미지를 선택해 주세요.", ja: "画像を選択してください。", en: "Please select images." }[state.locale] || "이미지를 선택해 주세요." };
    renderPage();
    return;
  }

  state.uploadStatus = { type: "pending", message: { ko: "AI가 분석 중...", ja: "AI分析中...", en: "AI analyzing..." }[state.locale] || "" };
  renderPage();

  try {
    const images = await Promise.all(
      state.selectedImageFiles.map(async (file) => ({
        name: file.name,
        mimeType: file.type || "image/png",
        data: await readFileAsBase64(file)
      }))
    );

    const response = await fetch(`/api/${state.systemId}/upload-images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? { ko: "분석 실패", ja: "分析失敗", en: "Analysis failed" }[state.locale]);
    }

    state.currentViewModel = {
      system: getSelectedSystem(),
      source: payload.source,
      changeEvent: payload.changeEvent,
      hubState: payload.hubState,
      uploadMeta: payload.uploadMeta,
      generated: true
    };
    state.uploadStatus = { type: "success", message: { ko: "매뉴얼이 생성되었습니다!", ja: "マニュアルが生成されました！", en: "Manual generated successfully!" }[state.locale] || "" };
    state.selectedImageFiles = [];
    await renderPage();
  } catch (error) {
    state.uploadStatus = { type: "error", message: error.message || { ko: "오류가 발생했습니다.", ja: "エラーが発生しました。", en: "An error occurred." }[state.locale] };
    renderPage();
  }
}

function bindEvents() {
  if (elements.systemSelect) {
    elements.systemSelect.addEventListener("change", (e) => {
      state.systemId = e.target.value;
      localStorage.setItem(storageKeys.system, state.systemId);
      state.currentViewModel = null;
      renderPage();
    });
  }

  if (elements.localeSelect) {
    elements.localeSelect.addEventListener("change", (e) => {
      state.locale = e.target.value;
      state.documentLanguage = state.locale;
      localStorage.setItem(storageKeys.locale, state.locale);
      localStorage.setItem(storageKeys.documentLanguage, state.documentLanguage);
      renderPage();
    });
  }

  if (elements.chatForm) {
    elements.chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = elements.chatInput?.value.trim();
      if (value) askQuestion(value);
    });
  }

  document.addEventListener("click", (e) => {
    const tabBtn = e.target.closest("[data-upload-tab]");
    if (tabBtn) {
      state.uploadMode = tabBtn.dataset.uploadTab;
      state.uploadStatus = { type: "idle", message: "" };
      state.selectedUploadFile = null;
      state.selectedImageFiles = [];
      renderPage();
      return;
    }

    const uploadButton = e.target.closest("#newProductUploadButton");
    if (uploadButton) {
      uploadNewProductDocument();
      return;
    }

    const imageUploadButton = e.target.closest("#imageUploadButton");
    if (imageUploadButton) {
      uploadNewProductImages();
      return;
    }

    const langBtn = e.target.closest("[data-doc-language]");
    if (langBtn) {
      state.documentLanguage = langBtn.dataset.docLanguage;
      state.locale = state.documentLanguage;
      localStorage.setItem(storageKeys.documentLanguage, state.documentLanguage);
      localStorage.setItem(storageKeys.locale, state.locale);
      renderPage();
      return;
    }

    const quick = e.target.closest(".quick-question");
    if (quick) {
      askQuestion(quick.textContent.trim());
      return;
    }

    const dl = e.target.closest("[data-download-language]");
    if (dl) {
      window.location.href = buildDownloadUrl(dl.dataset.downloadLanguage);
    }
  });

  document.addEventListener("change", (e) => {
    const fileInput = e.target.closest("#newProductFileInput");
    if (fileInput) {
      state.selectedUploadFile = fileInput.files?.[0] ?? null;
      state.uploadStatus = { type: "idle", message: "" };
      renderPage();
      return;
    }

    const imageInput = e.target.closest("#imageFileInput");
    if (imageInput) {
      const files = Array.from(imageInput.files || []);
      if (files.length > 10) {
        const msg = { ko: "최대 10장까지 선택 가능합니다.", ja: "最大10枚まで選択可能です。", en: "You can select up to 10 images." }[state.locale] || "";
        state.uploadStatus = { type: "error", message: msg };
        imageInput.value = "";
        state.selectedImageFiles = [];
      } else {
        state.selectedImageFiles = files;
        state.uploadStatus = { type: "idle", message: "" };
      }
      renderPage();
      return;
    }
  });
}

function markActiveNav() {
  const current = page === "overview" ? "/" : `/${page}`;
  document.querySelectorAll(".nav-link").forEach((node) => {
    node.classList.toggle("active", node.getAttribute("href") === current);
  });
}

async function renderPage() {
  state.documentLanguage = state.locale;
  state.currentViewModel = state.currentViewModel ?? await loadSystemViewModel();
  renderSystemSelectors();
  setStaticCopy();
  markActiveNav();

  renderSidebarStatus(state.currentViewModel);

  if (page === "overview") {
    renderOverview(state.currentViewModel.hubState);
    startSyncPolling(state.systemId);
  }
  if (page === "documents") { renderDocumentTabs(); renderDocuments(state.currentViewModel); }
  if (page === "operations") await renderOperations(state.currentViewModel);
  if (page === "search") renderSearchInitial();
}

bindEvents();
renderPage();
