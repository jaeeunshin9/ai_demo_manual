export const manualSource = {
  productName: "명장 AI",
  documentName: "명장 AI 사용자 매뉴얼",
  owner: "AI 매뉴얼 Service Ops",
  localizedMeta: {
    ko: {
      productName: "명장 AI",
      documentName: "명장 AI 사용자 매뉴얼",
      serviceName: "AI 매뉴얼",
      owner: "AI 매뉴얼 Service Ops"
    },
    ja: {
      productName: "マスターAI",
      documentName: "マスターAIユーザーマニュアル",
      serviceName: "AIマニュアル",
      owner: "AIマニュアル Service Ops"
    },
    en: {
      productName: "Master AI",
      documentName: "Master AI User Manual",
      serviceName: "AI Manual",
      owner: "AI Manual Service Ops"
    }
  },
  upstreamRepository: "myeongjangai-dummy",
  upstreamSystems: [
    {
      id: "source-repo",
      label: "Source repository",
      kind: "git",
      repository: "myeongjangai-dummy",
      version: "1.8.0",
      status: "synced",
      detail: "운영 문서 원본 저장소"
    },
    {
      id: "faq-pipeline",
      label: "FAQ refresh pipeline",
      kind: "automation",
      repository: "guidium-faq-refresh",
      version: "2026.03",
      status: "synced",
      detail: "FAQ 초안 재생성 파이프라인"
    },
    {
      id: "search-index",
      label: "Citation search index",
      kind: "search",
      repository: "guidium-search-index",
      version: "ko-ja-en",
      status: "synced",
      detail: "출처 포함 검색용 인덱스"
    }
  ],
  version: "1.8.0",
  releaseDate: "2026-03-10",
  sourceLanguage: "ko",
  supportedOutputLanguages: ["ko", "ja", "en"],
  audience: "명장 AI 문서 운영자, QA 담당자, 현장 관리자",
  productSummary:
    "명장 AI는 제조 현장의 작업 기준서, 점검 기록, 이상 탐지 로그를 통합 관리하고 운영 문서를 자동 보조하는 AI 문서 서비스입니다.",
  structuredFacts: [
    "문서 검색 응답은 출처 문서명, 섹션, 하위 섹션, 언어 정보를 함께 표시한다.",
    "민감한 생산 수치는 데모 데이터이며 실제 공정 데이터와 연결되지 않는다.",
    "FAQ 초안은 운영팀 검토 전 단계의 자동 생성 결과물로 간주한다."
  ],
  sections: [
    {
      id: "overview",
      sectionTitle: "1. 서비스 개요",
      subsectionTitle: "1.1 제품 목적",
      intent: "도입 목적과 핵심 가치 설명",
      content:
        "명장 AI는 제조 현장에서 작업 기준서, 점검 기록, 이상 탐지 로그가 여러 시스템에 분산되어 관리되는 문제를 해결하기 위해 개발되었습니다. 작업자와 운영자는 필요한 기준서를 실시간으로 검색하고, 최신 변경 사항이 자동으로 반영된 문서를 언제든지 확인할 수 있습니다. AI 매뉴얼은 문서 생성, 변경 반영, 질의응답 흐름을 하나의 서비스 경험으로 연결하며, 별도의 IT 전문 지식 없이도 현장 담당자가 직접 운영할 수 있도록 설계되었습니다. 핵심 가치는 세 가지입니다: 정확한 문서 접근성, 변경 이력 추적 가능성, 그리고 다국어 지원을 통한 글로벌 현장 적용 가능성입니다.",
      keywords: ["개요", "목적", "도입", "검색", "변경 반영", "다국어"],
      translations: {
        ja: { sectionTitle: "1. サービス概要", subsectionTitle: "1.1 製品目的" },
        en: { sectionTitle: "1. Service Overview", subsectionTitle: "1.1 Product Purpose" }
      },
      sampleOutputs: {
        ja: "マスターAIは、製造現場の作業基準書・点検記録・異常検知ログが複数のシステムに分散している課題を解決するために開発されました。作業者と運用担当者は必要な基準書をリアルタイムで検索でき、最新の変更が自動反映された文書をいつでも確認できます。AIマニュアルは、文書生成・変更反映・Q&Aフローを一つのサービス体験として統合し、IT専門知識がなくても現場担当者が自ら運用できるよう設計されています。",
        en: "Master AI was developed to solve the problem of operating documents — work standards, inspection records, and anomaly logs — being scattered across multiple systems on the factory floor. Workers and operators can search for the documents they need in real time and always access the latest version with changes automatically applied. AI Manual integrates document generation, change propagation, and Q&A into a single service experience, designed so that on-site staff can operate it directly without IT expertise."
      }
    },
    {
      id: "setup",
      sectionTitle: "2. 시작하기",
      subsectionTitle: "2.1 초기 설정 절차",
      intent: "초기 환경 구성 안내",
      content:
        "시스템 관리자는 작업장, 라인, 설비 코드를 등록한 뒤 문서 소스 유형을 선택합니다. 기본 소스 유형은 작업표준서(SOP), 점검 체크리스트, 장애 대응 가이드 세 가지이며, 각 유형마다 필수 입력 필드와 버전 규칙이 다르게 적용됩니다. 문서 업로드 후에는 3단계 검증 규칙이 자동으로 실행됩니다: (1) 구조화 필드 완성도 확인, (2) 버전 충돌 검사, (3) 키워드 인덱스 생성. 검증 실패 시 담당자에게 자동 알림이 발송되며, 문서는 '검토 대기' 상태로 분류됩니다. 초기 설정이 완료된 후에는 시스템 관리자 외에도 운영 담당자가 추가로 등록되어 역할 기반 권한을 부여받을 수 있습니다.",
      keywords: ["초기 설정", "작업장", "라인", "설비", "업로드", "검증", "SOP", "권한"],
      translations: {
        ja: { sectionTitle: "2. はじめに", subsectionTitle: "2.1 初期設定手順" },
        en: { sectionTitle: "2. Getting Started", subsectionTitle: "2.1 Initial Setup Procedure" }
      },
      sampleOutputs: {
        ja: "システム管理者は、作業場・ライン・設備コードを登録し、文書ソース種別を選択します。基本ソース種別はSOP・点検チェックリスト・障害対応ガイドの3種類で、種別ごとに必須入力フィールドとバージョンルールが異なります。アップロード後は3段階の検証ルールが自動実行され、検証失敗時は担当者に自動通知が送信されます。",
        en: "System administrators register site, line, and equipment codes, then choose document source types. The three default source types are SOP, inspection checklist, and failure response guide — each with different required fields and version rules. After upload, three validation steps run automatically: completeness check, version conflict check, and keyword index generation. If validation fails, the responsible person receives an automatic notification and the document is flagged as 'Pending Review'."
      }
    },
    {
      id: "generation",
      sectionTitle: "3. 매뉴얼 생성",
      subsectionTitle: "3.1 구조화 데이터 기반 생성",
      intent: "초기 매뉴얼 생성 규칙 설명",
      content:
        "AI 매뉴얼의 생성 단계는 구조화된 원천 데이터에서 문서 제목, 버전, 운영 범위, 핵심 절차, 주의 사항, 언어별 샘플 출력을 조합해 초안 매뉴얼을 만듭니다. 생성 결과에는 섹션별 추적 키와 참조 메타데이터가 포함되어 이후 변경 이벤트가 발생할 때 자동으로 영향 범위를 계산할 수 있습니다. 매뉴얼은 한국어 전체 문서와 일본어·영어 요약 샘플의 두 형태로 동시에 생성됩니다. 전체 문서는 현장 배포용이며, 요약 샘플은 글로벌 협업 파트너 공유 목적으로 활용됩니다. 생성 후 운영자는 각 섹션의 승인 상태를 개별 설정할 수 있으며, 미승인 섹션은 배포 시 자동으로 제외됩니다.",
      keywords: ["생성", "구조화 데이터", "초안", "메타데이터", "언어별 출력", "승인 상태"],
      translations: {
        ja: { sectionTitle: "3. マニュアル生成", subsectionTitle: "3.1 構造化データに基づく生成" },
        en: { sectionTitle: "3. Manual Generation", subsectionTitle: "3.1 Structured Data-Based Generation" }
      },
      sampleOutputs: {
        ja: "生成段階では、構造化データから文書タイトル・バージョン・運用範囲・主要手順・注意事項・言語別サンプル出力を組み合わせて初期マニュアルを作成します。生成結果にはセクション別の追跡キーと参照メタデータが含まれ、変更イベント発生時に影響範囲を自動計算できます。マニュアルは韓国語の完全版と日本語・英語の要約サンプルとして同時に生成されます。",
        en: "The generation step assembles title, version, operating scope, key procedures, cautions, and localized samples into an initial manual draft from structured source data. The output includes per-section tracking keys and reference metadata so that when a change event occurs, the impact scope can be calculated automatically. The manual is generated simultaneously as a full Korean document and Japanese/English summary samples."
      }
    },
    {
      id: "operations",
      sectionTitle: "4. 운영 규칙",
      subsectionTitle: "4.2 점검 주기와 승인",
      intent: "운영 정책 및 승인 체계",
      content:
        "운영자는 주간 단위로 변경 이벤트를 검토하고 영향을 받는 문서 섹션의 승인 상태를 갱신해야 합니다. 기본 점검 주기는 매주 월요일 오전이며, 생산 안전과 직결된 문서는 변경 후 24시간 이내 재배포가 권장됩니다. 긴급 점검으로 분류된 문서는 제목 앞에 [긴급] 라벨을 표시해야 하며, 안전 경보와 연계된 변경은 등록 후 24시간 이내에 책임 승인을 완료해야 합니다. 미승인 문서가 72시간을 초과하면 팀장에게 자동 에스컬레이션이 발생합니다. 승인 완료된 문서는 즉시 현장 배포 큐에 등록되며, 다음 정기 배포 시 일괄 반영됩니다.",
      keywords: ["운영 규칙", "점검 주기", "승인", "재배포", "안전", "긴급", "에스컬레이션"],
      translations: {
        ja: { sectionTitle: "4. 運用ルール", subsectionTitle: "4.2 点検サイクルと承認" },
        en: { sectionTitle: "4. Operations Rules", subsectionTitle: "4.2 Inspection Cycle and Approval" }
      },
      sampleOutputs: {
        ja: "運用担当者は週次で変更イベントを確認し、影響を受けた文書セクションの承認状態を更新する必要があります。基本点検サイクルは毎週月曜日の午前中で、生産安全に直結する文書は変更後24時間以内の再配布が推奨されます。緊急点検に分類された文書は[緊急]ラベルを表示する必要があり、安全警報に関連する変更は登録後24時間以内に責任承認を完了する必要があります。",
        en: "Operators must review change events weekly and update the approval status of affected document sections. The default review cycle is Monday morning each week; documents directly related to production safety are recommended to be redistributed within 24 hours of a change. Documents classified as urgent inspections must display an [URGENT] label, and changes linked to safety alerts must have responsible sign-off completed within 24 hours of submission."
      }
    },
    {
      id: "search",
      sectionTitle: "5. 검색 및 FAQ",
      subsectionTitle: "5.1 대화형 검색 응답",
      intent: "질의응답 및 FAQ 초안 생성",
      content:
        "사용자가 질문을 입력하면 AI 매뉴얼은 관련 섹션을 우선 검색하고 한국어 답변을 구성한 뒤 출처 위치를 함께 표시합니다. 검색 엔진은 키워드 매칭과 의미 기반 유사도를 결합하여 가장 관련성 높은 섹션 3개를 신뢰도 점수와 함께 반환합니다. 출처는 문서명, 섹션 번호, 하위 섹션, 언어 정보 형식으로 표시됩니다. FAQ 초안은 자주 조회되는 질문과 최근 변경 이벤트를 결합해 자동으로 작성되며, 운영팀 검토 후 승인 시 공식 FAQ로 등록됩니다. AI 어시스턴트 기능을 통해 자연어 질문을 입력하면 문서 전체를 기반으로 즉각적인 답변이 제공됩니다.",
      keywords: ["검색", "FAQ", "질문", "출처", "대화형 검색", "신뢰도", "AI 어시스턴트"],
      translations: {
        ja: { sectionTitle: "5. 検索とFAQ", subsectionTitle: "5.1 対話型検索応答" },
        en: { sectionTitle: "5. Search & FAQ", subsectionTitle: "5.1 Conversational Search Response" }
      },
      sampleOutputs: {
        ja: "ユーザーが質問を入力すると、AIマニュアルは関連セクションを優先検索し、回答を構成して出典位置をあわせて表示します。検索エンジンはキーワードマッチングと意味的類似度を組み合わせ、最も関連性の高い3つのセクションを信頼度スコアとともに返します。FAQ草案は、頻繁に照会される質問と最新の変更イベントを組み合わせて自動作成されます。",
        en: "When a user enters a question, AI Manual searches the most relevant sections first and composes an answer with the source location displayed alongside. The search engine combines keyword matching with semantic similarity to return the top three most relevant sections along with confidence scores. FAQ drafts are automatically generated by combining frequently asked questions with recent change events, and become official FAQs after operations team review and approval."
      }
    },
    {
      id: "localization",
      sectionTitle: "6. 다국어 지원",
      subsectionTitle: "6.1 언어별 출력 규칙",
      intent: "다국어 문서 생성 및 배포 규칙",
      content:
        "명장 AI는 한국어 원문을 기준으로 일본어와 영어 요약 샘플을 자동 생성합니다. 한국어 전체 문서는 현장 배포 및 규정 준수 목적에 사용되며, 일본어와 영어는 협력사 공유 및 감사 대응용 요약본으로 제공됩니다. 번역 품질 검증은 운영팀이 섹션별로 승인하는 방식으로 진행되며, 미승인 번역 섹션은 이전 승인 버전이 유지됩니다. 다국어 문서는 Word(.docx) 형식으로 다운로드 가능하며, 각 언어 파일에는 버전 번호, 배포일, 언어 코드가 파일명에 포함됩니다. 현재 지원 언어는 한국어(KO), 일본어(JA), 영어(EN)이며, 추가 언어 확장은 별도 요청으로 처리됩니다.",
      keywords: ["다국어", "번역", "일본어", "영어", "한국어", "다운로드", "Word", "docx"],
      translations: {
        ja: { sectionTitle: "6. 多言語対応", subsectionTitle: "6.1 言語別出力ルール" },
        en: { sectionTitle: "6. Multilingual Support", subsectionTitle: "6.1 Language Output Rules" }
      },
      sampleOutputs: {
        ja: "マスターAIは韓国語の原文を基準に、日本語と英語の要約サンプルを自動生成します。韓国語の完全版は現場配布・規制遵守に使用され、日本語と英語はパートナー共有・監査対応向けの要約版として提供されます。翻訳品質の検証は運用チームがセクション別に承認する方式で行われ、未承認の翻訳セクションは以前の承認バージョンが維持されます。",
        en: "Master AI automatically generates Japanese and English summary samples based on the Korean original. The full Korean document is used for on-site distribution and compliance purposes, while Japanese and English versions are provided as summary versions for partner sharing and audit response. Translation quality is validated through per-section approval by the operations team, and unapproved translation sections retain the previously approved version."
      }
    },
    {
      id: "security",
      sectionTitle: "7. 보안 및 접근 권한",
      subsectionTitle: "7.1 역할 기반 접근 제어",
      intent: "보안 정책 및 사용자 권한 체계",
      content:
        "명장 AI는 역할 기반 접근 제어(RBAC)를 적용하여 사용자별로 문서 조회, 편집, 승인, 배포 권한을 독립적으로 설정합니다. 기본 역할은 시스템 관리자(Admin), 운영 담당자(Operator), 현장 열람자(Viewer) 세 가지로 구성됩니다. Admin은 시스템 설정과 사용자 관리를 담당하며, Operator는 문서 생성·승인·변경 이벤트 처리 권한을 갖습니다. Viewer는 승인 완료된 문서의 조회와 검색만 허용됩니다. 모든 접근 이력은 감사 로그에 기록되며 90일간 보관됩니다. 퇴직자 계정은 HR 연동을 통해 자동으로 비활성화됩니다.",
      keywords: ["보안", "RBAC", "접근 권한", "관리자", "운영 담당자", "감사 로그"],
      translations: {
        ja: { sectionTitle: "7. セキュリティとアクセス権限", subsectionTitle: "7.1 ロールベースアクセス制御" },
        en: { sectionTitle: "7. Security & Access Control", subsectionTitle: "7.1 Role-Based Access Control" }
      },
      sampleOutputs: {
        ja: "マスターAIはRBACを適用し、ユーザーごとに文書の閲覧・編集・承認・配布権限を個別に設定します。基本ロールはシステム管理者(Admin)・運用担当者(Operator)・現場閲覧者(Viewer)の3種類です。すべてのアクセス履歴は監査ログに記録され、90日間保管されます。",
        en: "Master AI applies Role-Based Access Control (RBAC) to set document view, edit, approval, and distribution permissions independently per user. The three default roles are System Administrator (Admin), Operations Operator, and Field Viewer. All access history is recorded in audit logs and retained for 90 days. Accounts for departing employees are automatically deactivated through HR integration."
      }
    }
  ],
  faqSeeds: [
    {
      question: "긴급 점검 문서 승인 규칙이 어떻게 되나요?",
      answer:
        "긴급 점검 라벨이 붙은 문서는 등록 후 24시간 이내에 책임 승인을 완료해야 하며 현장 재배포 여부를 함께 기록합니다. 미승인 시 72시간 후 팀장에게 자동 에스컬레이션됩니다."
    },
    {
      question: "매뉴얼 생성 결과는 어떤 언어로 확인할 수 있나요?",
      answer:
        "기본 결과는 한국어 전체 문서이며, 일본어(JA)와 영어(EN) 요약 샘플이 함께 생성됩니다. 각 언어 버전은 Word(.docx) 파일로 다운로드 가능합니다."
    },
    {
      question: "변경 이벤트가 반영되면 무엇이 업데이트되나요?",
      answer:
        "영향받는 매뉴얼 섹션, 변경 요약, FAQ 초안, 승인 필요 항목이 함께 갱신됩니다. 변경 후 주간 점검 주기에 따라 운영자가 승인 상태를 갱신해야 합니다."
    },
    {
      question: "검색 응답에서 출처는 어떻게 표시되나요?",
      answer:
        "문서명, 섹션, 하위 섹션, 신뢰도(high/medium) 정보가 citation 형태로 함께 제공됩니다. 출처는 응답 하단에 카드 형식으로 표시됩니다."
    },
    {
      question: "문서 다운로드 시 언어를 어떻게 선택하나요?",
      answer:
        "문서 패키지 페이지에서 KO(한국어), JA(일본어), EN(영어) 버튼 중 하나를 선택한 뒤 다운로드 버튼을 클릭합니다. 파일명에 언어 코드가 자동으로 포함됩니다."
    },
    {
      question: "사용자 계정 권한은 어떻게 설정하나요?",
      answer:
        "시스템 관리자(Admin)가 사용자 관리 메뉴에서 역할(Admin/Operator/Viewer)을 지정합니다. 퇴직자 계정은 HR 연동을 통해 자동 비활성화됩니다."
    }
  ]
};
