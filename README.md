# CV Skill Extractor

A minimal Next.js app that extracts skill tags from a PDF CV entirely in the browser.

The PDF is read with `pdfjs-dist` on the client. No API route is used and the file is not uploaded.
PDF.js is bundled with the app so dropping a CV does not fetch parser code or worker assets.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Build the static app with:

```bash
npm run build
```

The production output is written to `out/`.

## How It Works

- `src/app/page.tsx` handles drag/drop, PDF text extraction, and rendering.
- `src/lib/skill-extraction.ts` matches known skills and reads skill-like entries from CV skill sections.
- `next.config.ts` uses `output: "export"` so the app can be hosted as static files.
