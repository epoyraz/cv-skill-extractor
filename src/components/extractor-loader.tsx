"use client";

import dynamic from "next/dynamic";

const CvSkillExtractor = dynamic(() => import("./cv-skill-extractor"), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-dvh items-center justify-center bg-[#f7f5ef] px-5 py-8 text-zinc-950">
      <section className="w-full max-w-3xl">
        <div className="mb-7 flex flex-col gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-600" />
          <div>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">CV Skill Extractor</h1>
            <p className="mt-2 max-w-xl text-base leading-7 text-zinc-700">
              Preparing the local PDF parser.
            </p>
          </div>
        </div>
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm">
          <p className="text-xl font-medium">Loading local parser</p>
          <p className="mt-2 text-sm text-zinc-600">The upload field will appear when it is ready.</p>
        </div>
      </section>
    </main>
  ),
});

export default function ExtractorLoader() {
  return <CvSkillExtractor />;
}
