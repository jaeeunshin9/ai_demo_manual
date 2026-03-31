import { manualSource } from "./manual-source.mjs";
import { changeEvent } from "./change-event.mjs";
import { newProductSource } from "./new-product-source.mjs";
import { newProductChangeEvent } from "./new-product-change-event.mjs";
import { createDocumentationHubState } from "../core/guidium-pilot.mjs";

const myeongjangHubPreview = createDocumentationHubState(manualSource, changeEvent, {
  syncedAt: "2026-03-30T09:12:00+09:00"
});

const newProductHubPreview = createDocumentationHubState(newProductSource, newProductChangeEvent, {
  syncedAt: "2026-03-31T09:00:00+09:00"
});

export const defaultSystemId = "myeongjang-ai";

export const documentationSystems = [
  {
    id: "myeongjang-ai",
    name: "명장 AI",
    localizedNames: { ko: "명장 AI", en: "Master AI", ja: "マスターAI" },
    shortName: "MYE",
    lifecycle: "active",
    readinessStage: "operational",
    workspaceLabel: "Factory documentation",
    description:
      "현재 운영 중인 제조 문서 시스템입니다. 자동 동기화, 최신 변경 반영, 검색 근거 제시까지 전체 허브 흐름을 검증하는 기준 시스템입니다.",
    owner: manualSource.owner,
    repository: manualSource.upstreamRepository,
    source: manualSource,
    changeEvent,
    hubPreview: {
      currentVersion: myeongjangHubPreview.currentVersion,
      sync: myeongjangHubPreview.sync,
      latestChange: myeongjangHubPreview.latestChange,
      readiness: myeongjangHubPreview.readiness,
      downloads: myeongjangHubPreview.downloads
    }
  },
  {
    id: "new-product",
    name: "신규 프로덕트",
    localizedNames: { ko: "신규 프로덕트", en: "New Product", ja: "新規プロダクト" },
    shortName: "NP",
    lifecycle: "active",
    readinessStage: "onboarding",
    workspaceLabel: "New product documentation",
    description:
      "신규 프로덕트 문서 시스템입니다. 온보딩 준비 중이며 상세 문서 내용은 추후 업데이트 예정입니다.",
    owner: "AI 매뉴얼 Service Ops",
    repository: "new-product-docs",
    source: newProductSource,
    changeEvent: newProductChangeEvent,
    hubPreview: {
      currentVersion: newProductHubPreview.currentVersion,
      sync: newProductHubPreview.sync,
      latestChange: newProductHubPreview.latestChange,
      readiness: newProductHubPreview.readiness,
      downloads: newProductHubPreview.downloads
    }
  }
];

export function getDocumentationSystem(systemId) {
  return documentationSystems.find((system) => system.id === systemId) ?? documentationSystems[0];
}
