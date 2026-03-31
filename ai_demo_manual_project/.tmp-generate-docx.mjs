import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import fs from "node:fs/promises";

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ text: "New Product Operations Manual", heading: HeadingLevel.TITLE }),
      new Paragraph("This document describes onboarding, operations, and quality checkpoints for the new product."),
      new Paragraph({ text: "1. Onboarding Overview", heading: HeadingLevel.HEADING_1 }),
      new Paragraph("Register the product line, assign operators, and verify source templates before release."),
      new Paragraph({ text: "2. Operations Rules", heading: HeadingLevel.HEADING_1 }),
      new Paragraph("Review uploaded procedures weekly and approve urgent changes within 24 hours."),
      new Paragraph({ text: "3. Quality Check", heading: HeadingLevel.HEADING_1 }),
      new Paragraph("Validate output packages, FAQ drafts, and download artifacts before sharing externally.")
    ]
  }]
});

const buffer = await Packer.toBuffer(doc);
await fs.writeFile(".tmp-upload-source.docx", buffer);
console.log("created");
