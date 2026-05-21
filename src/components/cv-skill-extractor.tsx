"use client";

import { ChangeEvent, DragEvent, useCallback, useRef, useState } from "react";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { extractSkills, type SkillTag } from "@/lib/skill-extraction";

type Status = "idle" | "reading" | "done" | "error";

export default function CvSkillExtractor() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [skills, setSkills] = useState<SkillTag[]>([]);
  const [error, setError] = useState("");

  const handleFile = useCallback(async (file?: File) => {
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      setStatus("error");
      return;
    }

    setFileName(file.name);
    setStatus("reading");
    setError("");
    setSkills([]);

    try {
      const text = await readPdfText(file);
      const extracted = extractSkills(text);
      setSkills(extracted);
      setStatus("done");
    } catch (caught) {
      console.error(caught);
      setError("I could not read text from this PDF. A scanned CV may need OCR first.");
      setStatus("error");
    }
  }, []);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }

  function reset() {
    setFileName("");
    setStatus("idle");
    setSkills([]);
    setError("");
  }

  const hasResult = status === "done";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f7f5ef] px-5 py-8 text-zinc-950">
      <section className="w-full max-w-3xl">
        <div className="mb-7 flex flex-col gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <FileText aria-hidden="true" size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">CV Skill Extractor</h1>
            <p className="mt-2 max-w-xl text-base leading-7 text-zinc-700">
              Drop a PDF CV and get a clean set of skill tags. The file is read in your browser and
              is not uploaded.
            </p>
          </div>
        </div>

        <label
          className={[
            "flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white p-8 text-center shadow-sm transition",
            isDragging
              ? "border-emerald-600 bg-emerald-50"
              : "border-zinc-300 hover:border-emerald-500 hover:bg-zinc-50",
          ].join(" ")}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleInputChange}
          />

          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-950 text-white">
            {status === "reading" ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={25} />
            ) : (
              <UploadCloud aria-hidden="true" size={25} />
            )}
          </div>

          <p className="text-xl font-medium">
            {status === "reading" ? "Extracting skills" : fileName || "Drop your CV here"}
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            {fileName && status !== "reading" ? "Choose another PDF or clear the result." : "PDF only"}
          </p>
        </label>

        {(fileName || error || hasResult) && (
          <div className="mt-5 flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-950">{fileName || "No file"}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {status === "reading"
                    ? "Parsing PDF text locally"
                    : hasResult
                      ? `${skills.length} skill${skills.length === 1 ? "" : "s"} found`
                      : "Ready"}
                </p>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950"
                type="button"
                onClick={reset}
                aria-label="Clear"
                title="Clear"
              >
                <X aria-hidden="true" size={17} />
              </button>
            </div>

            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            )}

            {hasResult && (
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <span
                      key={`${skill.category}-${skill.name}`}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-950"
                      title={skill.category}
                    >
                      {skill.name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-zinc-600">
                    No obvious skills found. Try a text-based PDF.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

async function readPdfText(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({
    data: bytes,
    disableFontFace: true,
    useSystemFonts: true,
    useWorkerFetch: false,
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = content.items
      .flatMap((item) => {
        if (!("str" in item) || typeof item.str !== "string" || item.str.trim().length === 0) {
          return [];
        }

        const transform = Array.isArray(item.transform) ? item.transform : [];

        return [
          {
            text: item.str,
            x: transform[4] ?? 0,
            y: Math.round(transform[5] ?? 0),
          },
        ];
      })
      .sort((a, b) => b.y - a.y || a.x - b.x);
    const lines: string[] = [];
    let currentY: number | null = null;

    for (const row of rows) {
      const lastLine = lines.at(-1);

      if (!lastLine || currentY === null || Math.abs(currentY - row.y) > 2) {
        lines.push(row.text);
        currentY = row.y;
      } else {
        lines[lines.length - 1] = `${lastLine} ${row.text}`;
      }
    }

    pages.push(lines.join("\n"));
  }

  return pages.join("\n");
}
