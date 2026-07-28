#!/usr/bin/env node
/**
 * build-letterhead-docx.js
 * Generates the parish letterhead Word template (.docx).
 *
 * Output: ukc-data/assets/brand/templates/letterhead.docx
 *
 * Run: node scripts/build-letterhead-docx.js
 *
 * Requires: docx (npm install -g docx)
 * If docx is installed globally via Homebrew:
 *   NODE_PATH=/opt/homebrew/lib/node_modules node scripts/build-letterhead-docx.js
 */

"use strict";

const fs   = require("fs");
const path = require("path");

const {
  Document, Packer, Paragraph, TextRun, ImageRun,
  Header, Footer, AlignmentType, BorderStyle, WidthType,
  Table, TableRow, TableCell, ShadingType,
  PageNumber, NumberFormat,
} = require("docx");

// ---- Paths ----------------------------------------------------------------
const VAULT    = path.resolve(__dirname, "../../ukc-data");
const LOGO_PNG = path.join(VAULT, "assets/brand/logos/horizontal/primary-lockup/full-color-primary-lockup-800.png");
const OUT_DIR  = path.join(VAULT, "assets/brand/templates");
const OUT_FILE = path.join(OUT_DIR, "letterhead.docx");

// ---- Brand tokens ---------------------------------------------------------
const GOLD     = "B8945F";
const NAVY     = "2E5E8A";
const CHARCOAL = "333333";
const MIDGRAY  = "666666";

// ---- Logo image: 800×267 px, display at 3.25" wide -----------------------
// 1" = 914400 EMU; docx-js transformation uses screen pixels (96 dpi)
// 3.25" @ 96dpi = 312px wide; height = 312 × (533/1600) ≈ 104px
const LOGO_W_PX = 312;
const LOGO_H_PX = Math.round(LOGO_W_PX * (267 / 800)); // 104

// DXA helpers (1440 DXA = 1 inch)
const IN  = n => Math.round(n * 1440);   // inches → DXA
const PT  = n => Math.round(n * 20);     // points → twips (half-points in docx = pt*20)

// ---- Gold rule paragraph --------------------------------------------------
function goldRule() {
  return new Paragraph({
    spacing: { before: 0, after: PT(6) },
    border: {
      bottom: {
        color: GOLD,
        space: 0,
        size: 6,        // 0.75pt × 8 = 6 (size is in eighths of a point)
        style: BorderStyle.SINGLE,
      },
    },
    children: [],
  });
}

// ---- Helper: plain paragraph ----------------------------------------------
function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: PT(0), after: PT(4), line: 276, lineRule: "auto" },
    children: [
      new TextRun({
        text,
        font: "Book Antiqua",
        size:  PT(11),  // 11pt
        color: CHARCOAL,
        ...opts,
      }),
    ],
  });
}

// ---- Helper: blank line ---------------------------------------------------
function blank(spacingPt = 6) {
  return new Paragraph({
    spacing: { before: 0, after: PT(spacingPt) },
    children: [],
  });
}

// ---- Build document -------------------------------------------------------
const logoData = fs.readFileSync(LOGO_PNG);

const doc = new Document({
  // Default document styles
  styles: {
    default: {
      document: {
        run: { font: "Book Antiqua", size: PT(11), color: CHARCOAL },
        paragraph: { spacing: { line: 276, lineRule: "auto" } },
      },
    },
  },

  sections: [
    {
      properties: {
        page: {
          size:   { width: IN(8.5), height: IN(11) },
          margin: { top: IN(0.75), right: IN(1), bottom: IN(0.625), left: IN(1) },
        },
      },

      // ---- HEADER ----------------------------------------------------------
      headers: {
        default: new Header({
          children: [
            // Logo centered
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing:   { before: 0, after: PT(12) },
              children: [
                new ImageRun({
                  type: "png",
                  data: logoData,
                  transformation: { width: LOGO_W_PX, height: LOGO_H_PX },
                  altText: {
                    title:       "Parish lockup",
                    description: "St. John the Baptist & Immaculate Conception · Catholic Parishes of Upper Kittitas County",
                    name:        "parish-lockup",
                  },
                }),
              ],
            }),
            // Gold rule
            goldRule(),
          ],
        }),
      },

      // ---- FOOTER ----------------------------------------------------------
      footers: {
        default: new Footer({
          children: [
            // Gold rule above footer text
            new Paragraph({
              spacing: { before: 0, after: PT(4) },
              border: {
                top: {
                  color: GOLD,
                  space: 0,
                  size:  6,
                  style: BorderStyle.SINGLE,
                },
              },
              children: [],
            }),
            // Contact line
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing:   { before: 0, after: PT(2) },
              children: [
                new TextRun({
                  text: "303 W. 2nd Street \u00b7 Cle Elum, WA 98922 \u00b7 (509) 674-2531 \u00b7 parish@ukccatholic.org \u00b7 ukccatholic.org",
                  font:  "Calibri",
                  size:  PT(8),
                  color: MIDGRAY,
                }),
              ],
            }),
            // Tagline
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing:   { before: 0, after: 0 },
              children: [
                new TextRun({
                  text:   "Two places. One faith. One future in Christ.",
                  font:   "Book Antiqua",
                  italics: true,
                  size:   PT(8),
                  color:  GOLD,
                }),
              ],
            }),
          ],
        }),
      },

      // ---- BODY CONTENT (placeholder) --------------------------------------
      children: [
        // Date
        body("July 27, 2026"),
        blank(12),

        // Recipient block
        body("Recipient Name"),
        body("Organization"),
        body("123 Address Street"),
        body("City, State ZIP"),
        blank(12),

        // Salutation
        body("Dear [Name],"),
        blank(6),

        // Body paragraph
        body(""),  // blank — user types here
        blank(6),
        body(""),
        blank(12),

        // Closing
        body("Sincerely,"),
        blank(36),  // space for handwritten signature (~0.5 inch)

        // Signature block
        body("Your Name", { bold: true }),
        body("Your Title"),
      ],
    },
  ],
});

// ---- Write output ---------------------------------------------------------
fs.mkdirSync(OUT_DIR, { recursive: true });

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUT_FILE, buffer);
  console.log("Written:", OUT_FILE);
}).catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
