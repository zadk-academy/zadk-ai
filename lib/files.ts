import mammoth from "mammoth";
import ExcelJS from "exceljs";
import type Anthropic from "@anthropic-ai/sdk";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const PDF = "application/pdf";
export const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const MAX_TEXT = 12000;

/** Turns an uploaded recipe file into content blocks Claude can read. */
export async function fileToBlocks(f: { mediaType: string; data: string; name: string }): Promise<Anthropic.ContentBlockParam[]> {
  if ((IMAGE_TYPES as readonly string[]).includes(f.mediaType)) {
    return [{ type: "image", source: { type: "base64", media_type: f.mediaType as (typeof IMAGE_TYPES)[number], data: f.data } }];
  }
  if (f.mediaType === PDF) {
    return [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data } }];
  }
  const buf = Buffer.from(f.data, "base64");
  if (f.mediaType === DOCX) {
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return [{ type: "text", text: `Recipe file "${f.name}" (Word):\n${value.slice(0, MAX_TEXT)}` }];
  }
  if (f.mediaType === XLSX) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const lines: string[] = [];
    wb.eachSheet((ws) => {
      lines.push(`# Sheet: ${ws.name}`);
      ws.eachRow({ includeEmpty: false }, (row) => {
        const cells = (row.values as unknown[]).slice(1).map((v) => {
          if (v == null) return "";
          if (typeof v === "object") {
            const o = v as { result?: unknown; text?: unknown; richText?: { text: string }[] };
            if (o.richText) return o.richText.map((r) => r.text).join("");
            return String(o.result ?? o.text ?? "");
          }
          return String(v);
        });
        if (cells.some((c) => c.trim())) lines.push(cells.join(" | "));
      });
    });
    return [{ type: "text", text: `Recipe file "${f.name}" (Excel):\n${lines.join("\n").slice(0, MAX_TEXT)}` }];
  }
  throw new Error("unsupported file type");
}
