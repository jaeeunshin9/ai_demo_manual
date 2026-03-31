import fs from "node:fs/promises";

const bytes = await fs.readFile(".tmp-upload-source.docx");
const fileContentBase64 = bytes.toString("base64");

const uploadResponse = await fetch("http://127.0.0.1:4180/api/new-product/upload", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fileName: "new-product-manual.docx",
    fileSize: bytes.byteLength,
    fileContentBase64
  })
});

const uploadPayload = await uploadResponse.json();
console.log("upload status", uploadResponse.status, uploadPayload.available, uploadPayload.uploadMeta?.sectionCount);

const stateResponse = await fetch("http://127.0.0.1:4180/api/new-product/state");
const statePayload = await stateResponse.json();
console.log("state status", stateResponse.status, statePayload.available, statePayload.hubState?.manual?.documentName);
