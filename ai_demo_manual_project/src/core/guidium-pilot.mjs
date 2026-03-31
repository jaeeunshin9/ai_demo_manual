const STOP_WORDS = new Set([
  "은",
  "는",
  "이",
  "가",
  "을",
  "를",
  "에",
  "의",
  "와",
  "과",
  "도",
  "좀",
  "잘",
  "알려줘",
  "설명해줘",
  "무엇",
  "인가요",
  "어떻게",
  "해주세요",
  "있나요",
  "for",
  "the",
  "and"
]);

function tokenize(value) {
  const normalized = value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();

  const spacedTokens = normalized
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token));

  const cjkChunks = normalized.match(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]{2,}/gu) ?? [];
  const cjkBigrams = cjkChunks.flatMap((chunk) => {
    const grams = [];
    for (let index = 0; index < chunk.length - 1; index += 1) {
      grams.push(chunk.slice(index, index + 2));
    }
    return grams;
  });

  return Array.from(new Set([...spacedTokens, ...cjkBigrams]));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildSectionRecord(source, section) {
  return {
    documentName: source.documentName,
    language: source.sourceLanguage,
    sectionId: section.id,
    section: section.sectionTitle,
    subsection: section.subsectionTitle,
    intent: section.intent,
    content: section.content,
    keywords: [...section.keywords]
  };
}

function buildFaqDraft(sourceFaqs) {
  return sourceFaqs.map((item, index) => ({
    id: `FAQ-${index + 1}`,
    question: item.question,
    answer: item.answer
  }));
}

function buildSearchIndex(manual) {
  const manualEntries = manual.sections.map((section) => {
    const indexText = [
      section.section,
      section.subsection,
      section.intent,
      section.content,
      section.keywords.join(" ")
    ].join(" ");
    return {
      ...section,
      type: "manual",
      indexText
    };
  });

  const localizedEntries = manual.localizedSamples.flatMap((sample) => (
    ["ja", "en"].map((language) => {
      const sectionTitle = sample.titles?.[language]?.sectionTitle ?? sample.section;
      const subsectionTitle = sample.titles?.[language]?.subsectionTitle ?? sample.subsection;
      const content = sample.samples?.[language] ?? "";
      return {
        documentName: manual.localizedMeta?.[language]?.documentName ?? manual.documentName,
        language,
        sectionId: sample.sectionId,
        section: sectionTitle,
        subsection: subsectionTitle,
        intent: sectionTitle,
        content,
        keywords: tokenize(`${sectionTitle} ${subsectionTitle} ${content}`),
        type: "localized-sample",
        indexText: `${sectionTitle} ${subsectionTitle} ${content}`
      };
    })
  )).filter((entry) => entry.content);

  const faqEntries = manual.faqDraft.map((item) => ({
    documentName: `${manual.documentName} FAQ 초안`,
    language: "ko",
    sectionId: item.id,
    section: "FAQ 초안",
    subsection: item.question,
    intent: "운영 FAQ",
    content: item.answer,
    keywords: tokenize(`${item.question} ${item.answer}`),
    type: "faq",
    indexText: `${item.question} ${item.answer}`
  }));

  return [...manualEntries, ...localizedEntries, ...faqEntries];
}

export function generateInitialManual(source) {
  const sections = source.sections.map((section) => buildSectionRecord(source, section));
  const faqDraft = buildFaqDraft(source.faqSeeds);
  const localizedSamples = source.sections.map((section) => ({
    sectionId: section.id,
    section: section.sectionTitle,
    subsection: section.subsectionTitle,
    titles: section.translations ?? {},
    samples: section.sampleOutputs
  }));

  const manual = {
    productName: source.productName,
    documentName: source.documentName,
    owner: source.owner,
    localizedMeta: source.localizedMeta ?? {},
    version: source.version,
    releaseDate: source.releaseDate,
    audience: source.audience,
    summary: source.productSummary,
    sections,
    faqDraft,
    localizedSamples,
    changeLog: [],
    sourceFacts: [...source.structuredFacts]
  };

  return {
    manual,
    searchIndex: buildSearchIndex(manual)
  };
}

export function applyChangeEvent(generated, event) {
  const next = clone(generated);
  if (next.manual.changeLog.some((item) => item.eventId === event.eventId)) {
    next.searchIndex = buildSearchIndex(next.manual);
    return next;
  }

  for (const update of event.updates) {
    const target = next.manual.sections.find((section) => section.sectionId === update.sectionId);
    if (!target) {
      continue;
    }

    target.content = `${target.content}\n${update.contentAppend}`.trim();
    target.subsection = update.subsectionTitle;
    target.keywords = Array.from(new Set([...target.keywords, ...update.keywordsAdd]));
  }

  const existingQuestions = new Set(next.manual.faqDraft.map((item) => item.question));

  for (const addition of event.faqAdditions) {
    if (existingQuestions.has(addition.question)) {
      continue;
    }

    next.manual.faqDraft.push({
      id: `FAQ-${next.manual.faqDraft.length + 1}`,
      question: addition.question,
      answer: addition.answer
    });
  }

  next.manual.changeLog.push({
    eventId: event.eventId,
    effectiveDate: event.effectiveDate,
    title: event.title,
    summary: event.summary
  });

  next.searchIndex = buildSearchIndex(next.manual);
  return next;
}

function scoreEntry(entry, queryTokens) {
  const haystack = tokenize(entry.indexText);
  const tokenSet = new Set(haystack);
  let score = 0;

  for (const token of queryTokens) {
    if (tokenSet.has(token)) {
      score += 3;
    }

    if (entry.indexText.toLowerCase().includes(token)) {
      score += 1;
    }
  }

  return score;
}

function buildConfidenceLabel(score) {
  if (score >= 10) {
    return "high";
  }

  if (score >= 6) {
    return "medium";
  }

  return "low";
}

function buildConfidenceReason(entry, matchedTerms) {
  if (!matchedTerms.length) {
    return "질문과 직접 겹치는 키워드를 찾지 못했습니다.";
  }

  const location =
    entry.type === "faq"
      ? `${entry.documentName} > ${entry.section}`
      : `${entry.documentName} > ${entry.section} > ${entry.subsection}`;

  return `${matchedTerms.join(", ")} 키워드가 ${location}에서 확인되었습니다.`;
}

function getAnswerCopy(locale) {
  return {
    ko: {
      noMatch: `질문 "${"{query}"}"에 대한 직접 일치 항목을 찾지 못했습니다. 다른 키워드로 다시 검색해 주세요.`,
      faqPrefix: "에 대한 초안 답변입니다.",
      manualPrefix: "기준으로 답변합니다."
    },
    ja: {
      noMatch: `質問「${"{query}"}」に直接一致する項目が見つかりませんでした。別のキーワードで再度検索してください。`,
      faqPrefix: "に対するFAQ草案の回答です。",
      manualPrefix: "をもとに回答します。"
    },
    en: {
      noMatch: `No direct match was found for "${"{query}"}". Please try again with different keywords.`,
      faqPrefix: "FAQ draft answer:",
      manualPrefix: "Answer based on"
    }
  }[locale] ?? {
    noMatch: `질문 "${"{query}"}"에 대한 직접 일치 항목을 찾지 못했습니다. 다른 키워드로 다시 검색해 주세요.`,
    faqPrefix: "에 대한 초안 답변입니다.",
    manualPrefix: "기준으로 답변합니다."
  };
}

function buildAnswer(topMatch, query, locale = "ko") {
  const copy = getAnswerCopy(locale);
  if (!topMatch) {
    return copy.noMatch.replace("{query}", query);
  }

  if (topMatch.type === "localized-sample") {
    return topMatch.content;
  }

  if (topMatch.type === "faq") {
    if (locale === "en") {
      return `${copy.faqPrefix}\nQ: ${topMatch.subsection}\nA: ${topMatch.content}`;
    }
    return `${topMatch.subsection}${copy.faqPrefix}\n${topMatch.content}`;
  }

  if (locale === "en") {
    return `${copy.manualPrefix} ${topMatch.section} / ${topMatch.subsection}. ${topMatch.content}`;
  }
  return `${topMatch.section} / ${topMatch.subsection} ${copy.manualPrefix} ${topMatch.content}`;
}

export function answerQuestion(generated, query, options = {}) {
  const locale = options.locale ?? "ko";
  const queryTokens = tokenize(query);
  const ranked = generated.searchIndex
    .map((entry) => ({
      ...entry,
      score: scoreEntry(entry, queryTokens) + (entry.language === locale ? 2 : 0)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);
  const topMatch = ranked[0];

  const matches = ranked.slice(0, 3).map((entry) => ({
    sourceType: entry.type,
    documentName: entry.documentName,
    sectionId: entry.sectionId,
    section: entry.section,
    subsection: entry.subsection,
    locationLabel:
      entry.type === "faq"
        ? `${entry.documentName} > ${entry.section}`
        : `${entry.documentName} > ${entry.section} > ${entry.subsection}`,
    language: entry.language,
    excerpt: entry.content,
    matchedTerms: queryTokens.filter((token) => entry.indexText.toLowerCase().includes(token)),
    confidence: buildConfidenceLabel(entry.score),
    confidenceReason: buildConfidenceReason(
      entry,
      queryTokens.filter((token) => entry.indexText.toLowerCase().includes(token))
    )
  }));

  return {
    query,
    answer: buildAnswer(topMatch, query, locale),
    answerMode: topMatch?.type ?? "none",
    confidence: topMatch ? buildConfidenceLabel(topMatch.score) : "none",
    explanation: topMatch
      ? buildConfidenceReason(
          topMatch,
          queryTokens.filter((token) => topMatch.indexText.toLowerCase().includes(token))
        )
      : "직접 일치 항목이 없어 답변 근거를 제시할 수 없습니다.",
    sources: matches
  };
}

function buildReadiness(generated) {
  const hasSections = generated.manual.sections.length >= 5;
  const hasFaq = generated.manual.faqDraft.length >= 5;
  const hasChangeLog = generated.manual.changeLog.length > 0;
  const isSearchable = generated.searchIndex.length >= generated.manual.sections.length;
  const completedChecks = [hasSections, hasFaq, hasChangeLog, isSearchable].filter(Boolean).length;
  const percentage = Math.round((completedChecks / 4) * 100);

  return {
    label: percentage === 100 ? "Synchronized and ready" : "Needs review",
    percentage,
    checks: [
      {
        id: "manual",
        label: "Manual package mirrored",
        status: hasSections ? "ready" : "pending"
      },
      {
        id: "faq",
        label: "FAQ draft refreshed",
        status: hasFaq ? "ready" : "pending"
      },
      {
        id: "change",
        label: "Latest change applied",
        status: hasChangeLog ? "ready" : "pending"
      },
      {
        id: "search",
        label: "Search evidence indexed",
        status: isSearchable ? "ready" : "pending"
      }
    ]
  };
}

function buildSystemStates(source, event, syncedAt, overrides = {}) {
  const systems = source.upstreamSystems?.length
    ? source.upstreamSystems
    : [
        {
          id: "source-repo",
          label: "Source repository",
          kind: "git",
          repository: source.upstreamRepository ?? "myeongjangai-dummy",
          version: source.version,
          status: "synced",
          detail: "운영 문서 원본 저장소"
        }
      ];

  return systems.map((system) => {
    const override = overrides[system.id] ?? {};

    return {
      id: system.id,
      label: system.label,
      kind: system.kind,
      repository: override.repository ?? system.repository ?? source.upstreamRepository ?? null,
      version: override.version ?? system.version ?? source.version,
      status: override.status ?? system.status ?? "synced",
      detail: override.detail ?? system.detail ?? null,
      lastUpdatedAt: override.lastUpdatedAt ?? event.commit?.committedAt ?? syncedAt,
      lastEventId: override.lastEventId ?? event.eventId
    };
  });
}

function buildRefreshState(syncedAt, options = {}) {
  const status = options.refreshStatus ?? "idle";
  const requestedAt = options.refreshRequestedAt ?? syncedAt;
  const completedAt =
    options.refreshCompletedAt ?? (status === "refreshing" ? null : syncedAt);

  return {
    status,
    label:
      status === "refreshing"
        ? "Refreshing upstream state"
        : status === "failed"
          ? "Refresh failed"
          : "Refresh available",
    requestedAt,
    completedAt,
    canRefresh: status !== "refreshing"
  };
}

function buildLastUpdated(event, syncedAt) {
  const contentUpdatedAt = event.commit?.committedAt ?? event.effectiveDate ?? syncedAt;

  return {
    label: "Last updated",
    syncedAt,
    contentUpdatedAt,
    metadataRefreshedAt: syncedAt,
    source: event.commit?.committedAt ? "upstream_commit" : "sync"
  };
}

export function createDocumentationHubState(source, event, options = {}) {
  const generated = applyChangeEvent(generateInitialManual(source), event);
  const syncedAt = options.syncedAt ?? new Date().toISOString();
  const sourceRepository = options.sourceRepository ?? source.upstreamRepository ?? "myeongjangai-dummy";
  const latestChangeLog = generated.manual.changeLog.at(-1) ?? null;
  const systemStates = buildSystemStates(
    source,
    event,
    syncedAt,
    options.systemOverrides ?? {}
  );

  return {
    ...generated,
    sourceRepository,
    systemStates,
    sync: {
      mode: options.mode ?? "auto",
      status: "synced",
      syncedAt
    },
    refresh: buildRefreshState(syncedAt, options),
    currentVersion: generated.manual.version,
    latestChange: {
      eventId: latestChangeLog?.eventId ?? event.eventId,
      effectiveDate: latestChangeLog?.effectiveDate ?? event.effectiveDate,
      title: latestChangeLog?.title ?? event.title,
      summary: latestChangeLog?.summary ?? event.summary,
      commitHash: event.commit?.hash ?? null,
      commitMessage: event.commit?.message ?? null,
      commitAuthor: event.commit?.author ?? null,
      committedAt: event.commit?.committedAt ?? null
    },
    lastUpdated: buildLastUpdated(event, syncedAt),
    readiness: buildReadiness(generated),
    downloads: [
      {
        id: "manual-docx",
        label: "User manual",
        format: "DOCX",
        filename: "Manual.docx",
        description: "Current Korean operating manual",
        status: "ready",
        statusLabel: "Already synchronized",
        includes: [
          "Full KO manual body",
          "Latest approved operating rules",
          "Version and sync metadata"
        ]
      },
      {
        id: "faq-docx",
        label: "FAQ packet",
        format: "DOCX",
        filename: "FAQ.docx",
        description: "Latest FAQ draft with sync metadata",
        status: "ready",
        statusLabel: "Ready for handoff",
        includes: [
          "Latest FAQ draft",
          "Recent change event summary",
          "Sync timestamp"
        ]
      }
    ]
  };
}

export function buildDocumentationHubSnapshot(source, hubState) {
  return {
    selectedSystem: {
      id: "documentation-hub",
      label: "AI 매뉴얼 문서 허브"
    },
    sourceDocument: source.documentName,
    productName: source.productName,
    sourceRepository: hubState.sourceRepository,
    syncedAt: hubState.sync.syncedAt,
    version: hubState.currentVersion,
    refreshStatus: hubState.refresh.status,
    lastUpdated: {
      ...hubState.lastUpdated,
      releaseDate: source.releaseDate,
      latestChangeCommittedAt: hubState.latestChange.committedAt
    },
    supportedOutputLanguages: [...source.supportedOutputLanguages],
    visibleActions: {
      refresh: true,
      download: true,
      downloadCount: hubState.downloads.length
    },
    metrics: {
      sectionCount: hubState.manual.sections.length,
      faqCount: hubState.manual.faqDraft.length,
      searchIndexCount: hubState.searchIndex.length,
      latestChangeEvent: hubState.latestChange.eventId,
      readinessPercentage: hubState.readiness.percentage,
      systemCount: hubState.systemStates.length,
      syncedSystemCount: hubState.systemStates.filter((system) => system.status === "synced").length
    },
    quickQuestions: [
      "매뉴얼 생성 결과는 어떤 언어로 확인할 수 있나요?",
      "긴급 점검 문서 승인 규칙이 어떻게 되나요?",
      "출처는 어떻게 표시되나요?"
    ]
  };
}

export function formatManualMarkdown(manual) {
  const sectionLines = manual.sections.flatMap((section) => [
    `## ${section.section}`,
    `### ${section.subsection}`,
    section.content,
    `- 의도: ${section.intent}`,
    `- 키워드: ${section.keywords.join(", ")}`,
    ""
  ]);

  const faqLines = manual.faqDraft.flatMap((item) => [
    `- Q: ${item.question}`,
    `  A: ${item.answer}`
  ]);

  return [
    `# ${manual.documentName}`,
    "",
    `- 제품명: ${manual.productName}`,
    `- 버전: ${manual.version}`,
    `- 배포일: ${manual.releaseDate}`,
    `- 대상 사용자: ${manual.audience}`,
    "",
    manual.summary,
    "",
    "## 구조화 사실",
    ...manual.sourceFacts.map((fact) => `- ${fact}`),
    "",
    ...sectionLines,
    "## FAQ 초안",
    ...faqLines,
    "",
    "## 변경 이력",
    ...(manual.changeLog.length
      ? manual.changeLog.map(
          (item) => `- ${item.effectiveDate} ${item.eventId}: ${item.title} / ${item.summary}`
        )
      : ["- 아직 반영된 변경 이벤트가 없습니다."])
  ].join("\n");
}

export function formatLocalizedSamplesMarkdown(manual, language) {
  const label = language === "ja" ? "Japanese" : "English";
  const blocks = manual.localizedSamples.flatMap((sample) => [
    `## ${sample.section}`,
    `### ${sample.subsection}`,
    sample.samples[language],
    ""
  ]);

  return [
    `# ${manual.productName} ${label} Sample Output`,
    "",
    ...blocks
  ].join("\n");
}

export function formatFaqMarkdown(manual) {
  return [
    `# ${manual.productName} FAQ 초안`,
    "",
    ...manual.faqDraft.flatMap((item) => [`## ${item.question}`, item.answer, ""])
  ].join("\n");
}
