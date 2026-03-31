import { createDocumentationHubState, answerQuestion, formatLocalizedSamplesMarkdown } from "./src/core/guidium-pilot.mjs";
import { manualSource } from "./src/data/manual-source.mjs";
import { changeEvent } from "./src/data/change-event.mjs";

const hub = createDocumentationHubState(manualSource, changeEvent);
const ja = answerQuestion(hub, "緊急点検文書の承認ルールはどうなっていますか。", { locale: "ja" });
const en = answerQuestion(hub, "What are the approval rules for urgent inspection documents?", { locale: "en" });

console.log("JA markdown length:", formatLocalizedSamplesMarkdown(hub.manual, "ja").length);
console.log("JA mode:", ja.answerMode);
console.log("JA answer:", ja.answer);
console.log("EN mode:", en.answerMode);
console.log("EN answer:", en.answer);
