export const newProductSource = {
  productName: "New Product",
  documentName: "신규 프로덕트 사용자 매뉴얼",
  owner: "AI 매뉴얼 Service Ops",
  localizedMeta: {
    ko: {
      productName: "신규 프로덕트",
      documentName: "신규 프로덕트 사용자 매뉴얼",
      serviceName: "AI 매뉴얼",
      owner: "AI 매뉴얼 Service Ops"
    },
    ja: {
      productName: "新規プロダクト",
      documentName: "新規プロダクトユーザーマニュアル",
      serviceName: "AIマニュアル",
      owner: "AIマニュアル Service Ops"
    },
    en: {
      productName: "New Product",
      documentName: "New Product User Manual",
      serviceName: "AI Manual",
      owner: "AI Manual Service Ops"
    }
  },
  upstreamRepository: "new-product-docs",
  upstreamSystems: [
    {
      id: "source-repo",
      label: "Source repository",
      kind: "git",
      repository: "new-product-docs",
      version: "0.1.0",
      status: "preparing",
      detail: "추후 업데이트 예정"
    }
  ],
  version: "0.1.0",
  releaseDate: "2026-04-01",
  sourceLanguage: "ko",
  supportedOutputLanguages: ["ko", "ja", "en"],
  audience: "추후 업데이트 예정",
  productSummary:
    "신규 프로덕트는 현재 문서 온보딩 준비 중인 신규 시스템입니다. 상세 내용은 추후 업데이트 예정입니다.",
  structuredFacts: [
    "본 문서는 추후 업데이트 예정입니다.",
    "실제 제품 데이터는 온보딩 완료 후 반영될 예정입니다."
  ],
  sections: [
    {
      id: "overview",
      sectionTitle: "1. 서비스 개요",
      subsectionTitle: "1.1 제품 목적",
      intent: "도입 목적과 핵심 가치 설명",
      content:
        "신규 프로덕트는 현재 문서 온보딩 준비 중입니다. 제품 목적, 핵심 기능, 운영 범위에 대한 상세 내용은 추후 업데이트 예정입니다. 온보딩 완료 시 전체 매뉴얼이 자동으로 생성되어 배포됩니다.",
      keywords: ["개요", "목적", "추후 업데이트 예정", "온보딩"],
      translations: {
        ja: { sectionTitle: "1. サービス概要", subsectionTitle: "1.1 製品目的" },
        en: { sectionTitle: "1. Service Overview", subsectionTitle: "1.1 Product Purpose" }
      },
      sampleOutputs: {
        ja: "新規プロダクトは現在、文書オンボーディングの準備中です。製品目的・主要機能・運用範囲の詳細は追って更新予定です。オンボーディング完了後、完全なマニュアルが自動生成・配布されます。",
        en: "New Product is currently being onboarded. Detailed information on the product purpose, core features, and operating scope is coming soon. Once onboarding is complete, the full manual will be automatically generated and distributed."
      }
    },
    {
      id: "setup",
      sectionTitle: "2. 시작하기",
      subsectionTitle: "2.1 초기 설정 절차",
      intent: "초기 환경 구성 안내",
      content:
        "신규 프로덕트의 초기 설정 절차는 추후 업데이트 예정입니다. 시스템 요구사항, 환경 설정, 권한 구성 방법은 온보딩 완료 후 본 섹션에 반영됩니다.",
      keywords: ["초기 설정", "추후 업데이트 예정", "온보딩"],
      translations: {
        ja: { sectionTitle: "2. はじめに", subsectionTitle: "2.1 初期設定手順" },
        en: { sectionTitle: "2. Getting Started", subsectionTitle: "2.1 Initial Setup Procedure" }
      },
      sampleOutputs: {
        ja: "新規プロダクトの初期設定手順は追って更新予定です。システム要件・環境設定・権限構成の方法は、オンボーディング完了後にこのセクションに反映されます。",
        en: "The initial setup procedure for New Product is coming soon. System requirements, environment configuration, and permission setup will be reflected in this section once onboarding is complete."
      }
    },
    {
      id: "generation",
      sectionTitle: "3. 매뉴얼 생성",
      subsectionTitle: "3.1 문서 생성 규칙",
      intent: "매뉴얼 생성 규칙 설명",
      content:
        "신규 프로덕트의 문서 생성 규칙은 추후 업데이트 예정입니다. 구조화 데이터 스키마, 섹션 구성, 언어별 출력 방식은 온보딩 완료 후 정의됩니다.",
      keywords: ["생성", "문서", "추후 업데이트 예정"],
      translations: {
        ja: { sectionTitle: "3. マニュアル生成", subsectionTitle: "3.1 文書生成ルール" },
        en: { sectionTitle: "3. Manual Generation", subsectionTitle: "3.1 Document Generation Rules" }
      },
      sampleOutputs: {
        ja: "新規プロダクトの文書生成ルールは追って更新予定です。構造化データスキーマ・セクション構成・言語別出力方式はオンボーディング完了後に定義されます。",
        en: "Document generation rules for New Product are coming soon. The structured data schema, section layout, and language output formats will be defined once onboarding is complete."
      }
    },
    {
      id: "operations",
      sectionTitle: "4. 운영 규칙",
      subsectionTitle: "4.1 운영 정책",
      intent: "운영 정책 및 승인 체계",
      content:
        "신규 프로덕트의 운영 규칙 및 승인 체계는 추후 업데이트 예정입니다. 점검 주기, 에스컬레이션 정책, 배포 규칙은 온보딩 완료 후 본 섹션에 등록됩니다.",
      keywords: ["운영 규칙", "추후 업데이트 예정", "승인"],
      translations: {
        ja: { sectionTitle: "4. 運用ルール", subsectionTitle: "4.1 運用ポリシー" },
        en: { sectionTitle: "4. Operations Rules", subsectionTitle: "4.1 Operations Policy" }
      },
      sampleOutputs: {
        ja: "新規プロダクトの運用ルールおよび承認体系は追って更新予定です。点検サイクル・エスカレーションポリシー・配布ルールはオンボーディング完了後に登録されます。",
        en: "Operations rules and approval processes for New Product are coming soon. Inspection cycles, escalation policies, and distribution rules will be registered in this section once onboarding is complete."
      }
    },
    {
      id: "search",
      sectionTitle: "5. 검색 및 FAQ",
      subsectionTitle: "5.1 대화형 검색 응답",
      intent: "질의응답 및 FAQ 초안 생성",
      content:
        "신규 프로덕트의 FAQ 및 검색 기능은 추후 업데이트 예정입니다. 자주 묻는 질문, 출처 표시 방식, AI 검색 연동 방법은 온보딩 완료 후 자동 생성됩니다.",
      keywords: ["검색", "FAQ", "추후 업데이트 예정"],
      translations: {
        ja: { sectionTitle: "5. 検索とFAQ", subsectionTitle: "5.1 対話型検索応答" },
        en: { sectionTitle: "5. Search & FAQ", subsectionTitle: "5.1 Conversational Search Response" }
      },
      sampleOutputs: {
        ja: "新規プロダクトのFAQと検索機能は追って更新予定です。よくある質問・出典表示方法・AI検索連動方法はオンボーディング完了後に自動生成されます。",
        en: "FAQ and search features for New Product are coming soon. Frequently asked questions, citation display methods, and AI search integration details will be automatically generated once onboarding is complete."
      }
    }
  ],
  faqSeeds: [
    {
      question: "신규 프로덕트 문서는 언제 제공되나요?",
      answer:
        "신규 프로덕트 문서는 현재 온보딩 준비 중이며 추후 업데이트 예정입니다. 온보딩 완료 시 전체 매뉴얼이 자동으로 생성되어 배포됩니다."
    },
    {
      question: "신규 프로덕트의 주요 기능은 무엇인가요?",
      answer:
        "신규 프로덕트의 주요 기능 및 상세 사양은 추후 업데이트 예정입니다. 온보딩 담당자에게 문의해 주세요."
    },
    {
      question: "신규 프로덕트 매뉴얼을 다운로드할 수 있나요?",
      answer:
        "다운로드 기능은 온보딩 완료 후 활성화될 예정입니다. 현재는 플레이스홀더 문서만 제공됩니다."
    },
    {
      question: "신규 프로덕트의 접근 권한은 어떻게 설정하나요?",
      answer:
        "접근 권한 설정 방법은 추후 업데이트 예정입니다. 온보딩 완료 후 역할 기반 접근 제어(RBAC) 정책이 등록됩니다."
    },
    {
      question: "신규 프로덕트 온보딩 담당자는 누구인가요?",
      answer:
        "온보딩 담당자 정보는 추후 업데이트 예정입니다. AI 매뉴얼 서비스 운영팀에 문의해 주세요."
    }
  ]
};
