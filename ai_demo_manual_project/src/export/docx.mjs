import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

const localeCopy = {
  ko: {
    product: "제품명",
    version: "버전",
    releaseDate: "배포일",
    language: "언어",
    summaryVersion: "요약본",
    previewPending: "미리보기를 준비 중입니다.",
    faq: "FAQ"
  },
  ja: {
    product: "製品名",
    version: "バージョン",
    releaseDate: "配布日",
    language: "言語",
    summaryVersion: "要約版",
    previewPending: "プレビューを準備中です。",
    faq: "FAQ"
  },
  en: {
    product: "Product",
    version: "Version",
    releaseDate: "Release Date",
    language: "Language",
    summaryVersion: "Summary Version",
    previewPending: "Preview is being prepared.",
    faq: "FAQ"
  }
};

function paragraph(text, options = {}) {
  return new Paragraph({
    spacing: { after: 140 },
    ...options,
    children: [new TextRun(text)]
  });
}

function languageLabel(language) {
  if (language === "ko") {
    return "한국어";
  }
  if (language === "zh") {
    return "中文";
  }
  if (language === "ja") {
    return "日本語";
  }
  if (language === "en") {
    return "English";
  }
  return language.toUpperCase();
}

function resolveLocalizedMeta(localizedMeta, language, manual) {
  const meta = localizedMeta?.[language] ?? {};
  return {
    productName: meta.productName ?? manual.productName,
    documentName: meta.documentName ?? manual.documentName
  };
}

export async function buildManualDocx(hubState, language = "ko", localizedMeta = {}) {
  const manual = hubState.manual;
  const copy = localeCopy[language] ?? localeCopy.ko;
  const meta = resolveLocalizedMeta(localizedMeta, language, manual);
  const children = [
    paragraph(meta.documentName, { heading: HeadingLevel.TITLE, spacing: { after: 240 } }),
    paragraph(`${copy.product}: ${meta.productName}`),
    paragraph(`${copy.version}: ${manual.version}`),
    paragraph(`${copy.releaseDate}: ${manual.releaseDate}`),
    paragraph(`${copy.language}: ${languageLabel(language)}`),
    paragraph("")
  ];

  if (language === "ko") {
    children.push(paragraph(manual.summary));
    children.push(paragraph(""));
    for (const section of manual.sections) {
      children.push(paragraph(section.section, {
        heading: HeadingLevel.HEADING_1, spacing: { before: 180, after: 120 }
      }));
      children.push(paragraph(section.subsection, { heading: HeadingLevel.HEADING_2 }));
      children.push(paragraph(section.content));
    }
    children.push(paragraph(copy.faq, { heading: HeadingLevel.HEADING_1, spacing: { before: 180, after: 120 } }));
    for (const item of manual.faqDraft) {
      children.push(paragraph(`Q. ${item.question}`, { spacing: { after: 80 } }));
      children.push(paragraph(`A. ${item.answer}`));
    }
  } else {
    const localized = manual.localizedSamples;
    children.push(paragraph(`${languageLabel(language)} ${copy.summaryVersion}`));
    children.push(paragraph(""));
    for (const sample of localized) {
      const sectionTitle = sample.titles?.[language]?.sectionTitle ?? sample.section;
      const subsectionTitle = sample.titles?.[language]?.subsectionTitle ?? sample.subsection;
      children.push(paragraph(sectionTitle, {
        heading: HeadingLevel.HEADING_1, spacing: { before: 180, after: 120 }
      }));
      children.push(paragraph(subsectionTitle, { heading: HeadingLevel.HEADING_2 }));
      children.push(paragraph(sample.samples[language] ?? copy.previewPending));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children
      }
    ]
  });

  return Packer.toBuffer(doc);
}
