export const changeEvent = {
  eventId: "CE-2026-03-18-OPS",
  effectiveDate: "2026-03-18",
  title: "긴급 점검 라벨과 승인 주기 조정",
  localizations: {
    ja: {
      title: "緊急点検ラベルと承認サイクルの調整",
      summary: "現場運用チームの要請により、緊急点検文書に赤色ラベル規則を追加し、安全関連文書の承認サイクルを週1回から登録後24時間以内のレビューへ強化します。"
    },
    en: {
      title: "Emergency inspection label and approval cycle update",
      summary: "At the request of the field operations team, a red label rule is added for urgent inspection documents and the approval cycle for safety-related documents is tightened from weekly review to review within 24 hours of registration."
    }
  },
  commit: {
    hash: "4f2c9ad",
    message: "docs(ops): tighten emergency inspection approval window",
    author: "명장 AI Docs Bot",
    localizedAuthors: {
      ko: "명장 AI Docs Bot",
      ja: "マスターAI Docs Bot",
      en: "Master AI Docs Bot"
    },
    committedAt: "2026-03-29T18:42:00+09:00"
  },
  summary:
    "현장 운영팀 요청에 따라 긴급 점검 문서에 붉은색 라벨 규칙을 추가하고 안전 관련 문서 승인 주기를 주 1회에서 24시간 이내 검토로 강화한다.",
  updates: [
    {
      sectionId: "operations",
      subsectionTitle: "4.2 점검 주기와 승인",
      contentAppend:
        "긴급 점검으로 분류된 문서는 제목 앞에 [긴급] 라벨을 표시해야 하며, 안전 경보와 연계된 변경은 등록 후 24시간 이내에 책임 승인을 완료해야 한다.",
      keywordsAdd: ["긴급", "라벨", "24시간 승인"]
    },
    {
      sectionId: "search",
      subsectionTitle: "5.2 변경 반영 FAQ 초안",
      contentAppend:
        "변경 이벤트가 접수되면 FAQ 초안에는 변경 배경, 영향 설비, 현장 조치 기한을 우선 질문으로 추가한다.",
      keywordsAdd: ["변경 배경", "영향 설비", "조치 기한"]
    }
  ],
  faqAdditions: [
    {
      question: "긴급 점검 문서는 어떤 승인 규칙을 따르나요?",
      answer:
        "긴급 점검 라벨이 붙은 문서는 등록 후 24시간 이내에 책임 승인을 완료해야 하며 현장 재배포 여부를 함께 기록한다."
    },
    {
      question: "변경 이벤트 FAQ에는 무엇이 우선 추가되나요?",
      answer:
        "변경 배경, 영향 설비, 현장 조치 기한이 우선 질문으로 추가된다."
    }
  ]
};
