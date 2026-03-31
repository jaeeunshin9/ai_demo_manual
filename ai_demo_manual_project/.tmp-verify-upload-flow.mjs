import fs from "node:fs/promises";
import { parseUploadedDocx } from "./src/import/docx-upload.mjs";
import { setGeneratedSystemState, buildGeneratedSystemSnapshot } from "./src/data/generated-manual-store.mjs";

const buffer = await fs.readFile(".tmp-upload-source.docx");
const generated = await parseUploadedDocx({
  fileName: "new-product-manual.docx",
  buffer,
  uploadedAt: new Date("2026-03-31T12:00:00Z").toISOString(),
  fileSize: buffer.byteLength
});

setGeneratedSystemState("new-product", generated);
const snapshot = buildGeneratedSystemSnapshot("new-product");
console.log(snapshot.available);
console.log(snapshot.uploadMeta.fileName);
console.log(snapshot.uploadMeta.sectionCount);
console.log(snapshot.hubState.manual.documentName);
console.log(snapshot.hubState.manual.sections[0].section);
