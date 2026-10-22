"use client";

import { useEffect, useMemo, useState } from "react";

type Submission = {
  id: string;
  project?: string;
  contractor?: string;
  status?: string;
  outcome?: string;
  score?: number;
  reviewer?: string;
  date?: string;
  updatedAt?: string;
  review?: string;
  reviewText?: string;
  findings?: {
    ref?: string;
    category?: string;
    finding?: string;
    severity?: string;
    status?: string;
    action?: string;
    closedOn?: string;
    closedReason?: string;
    evidenceUsed?: string;
  }[];
  uploadedDocuments?: string[];
  uploadedSupportingDocuments?: string[];
  [key: string]: unknown;
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("rams_ai_submissions") || "[]",
      );
      // Hydrate browser-only storage after mount to preserve the server-rendered initial state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubmissions(Array.isArray(stored) ? stored : []);
    } catch {
      setSubmissions([]);
    }
  }, []);

  const clearSubmissions = () => {
    localStorage.removeItem("rams_ai_submissions");
    localStorage.removeItem("rams_ai_active_review");
    setSubmissions([]);
  };

  const openReview = (submission: Submission) => {
    if (!submission?.id) return;

    localStorage.setItem("rams_ai_active_review", JSON.stringify(submission));
    window.location.assign(`/review?submissionId=${encodeURIComponent(
      submission.id,
    )}`);
  };

  const exportValidationDataset = () => {
    const raw = localStorage.getItem("rams_ai_submissions") || "[]";
    let parsed: Submission[] = [];

    try {
      const value = JSON.parse(raw);
      parsed = Array.isArray(value) ? value : [];
    } catch {
      parsed = [];
    }

    const exportPayload = {
      exportName: "RAMS.AI Validation Dataset",
      exportedAt: new Date().toISOString(),
      source: "browser-local-storage",
      storageKey: "rams_ai_submissions",
      reviewCount: parsed.length,
      submissions: parsed,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);

    link.href = url;
    link.download = `rams_ai_validation_dataset_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const submissionStats = useMemo(() => {
    const total = submissions.length;
    const openFindings = submissions.reduce((count, submission) => {
      const findings = Array.isArray(submission.findings)
        ? submission.findings
        : [];
      return (
        count +
        findings.filter(
          (finding) => String(finding.status || "Open").toLowerCase() !== "closed",
        ).length
      );
    }, 0);
    const closedFindings = submissions.reduce((count, submission) => {
      const findings = Array.isArray(submission.findings)
        ? submission.findings
        : [];
      return (
        count +
        findings.filter(
          (finding) => String(finding.status || "").toLowerCase() === "closed",
        ).length
      );
    }, 0);

    return { total, openFindings, closedFindings };
  }, [submissions]);

  return (
    <main className="min-h-screen bg-[#F6F8F7] text-[#111827]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 bg-[#0B3D2E] text-white xl:block">
          <div className="flex h-full flex-col p-6">
            <div className="mb-8">
              <div className="text-2xl font-black">RAMS.AI</div>
              <div className="mt-1 text-sm text-white/70">Review Platform</div>
            </div>

            <nav className="space-y-2 text-sm">
              <a
                href="/review"
                className="block rounded-xl px-4 py-3 font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                Dashboard
              </a>
              <a
                href="/submissions"
                className="block rounded-xl bg-[#1F6B50] px-4 py-3 font-semibold text-white shadow-lg"
              >
                Submissions
              </a>
            </nav>
          </div>
        </aside>

        <section className="flex-1 p-6 lg:p-8">
          <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#111827]">
                Submissions
              </h1>
              <p className="mt-2 text-sm text-[#4B5563]">
                Stored locally from completed RAMS.AI reviews. Select any review
                to reopen the full dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {submissions.length > 0 && (
                <button
                  onClick={exportValidationDataset}
                  className="rounded-xl bg-[#0B3D2E] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#145A41]"
                >
                  Export Validation Dataset
                </button>
              )}

              {submissions.length > 0 && (
                <button
                  onClick={clearSubmissions}
                  className="rounded-xl border border-[#D6E2DA] bg-white px-5 py-3 text-sm font-black text-[#0B3D2E] shadow-sm transition hover:bg-[#EAF4EE]"
                >
                  Clear Local List
                </button>
              )}
            </div>
          </header>

          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <div className="text-xs font-black uppercase text-[#6B7280]">
                Stored Reviews
              </div>
              <div className="mt-2 text-3xl font-black text-[#0B3D2E]">
                {submissionStats.total}
              </div>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <div className="text-xs font-black uppercase text-[#6B7280]">
                Open Findings
              </div>
              <div className="mt-2 text-3xl font-black text-orange-600">
                {submissionStats.openFindings}
              </div>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <div className="text-xs font-black uppercase text-[#6B7280]">
                Closed Findings
              </div>
              <div className="mt-2 text-3xl font-black text-green-700">
                {submissionStats.closedFindings}
              </div>
            </div>
          </div>

          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-sm font-black uppercase text-[#111827]">
              Previous Reviews
            </h2>

            {submissions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#D6E2DA] bg-[#F6F8F7] p-8 text-center text-sm text-[#4B5563]">
                No submissions stored yet. Run a review from the dashboard and it
                will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((item) => {
                  const findings = Array.isArray(item.findings)
                    ? item.findings
                    : [];
                  const open = findings.filter(
                    (finding) =>
                      String(finding.status || "Open").toLowerCase() !== "closed",
                  ).length;
                  const closed = findings.filter(
                    (finding) =>
                      String(finding.status || "").toLowerCase() === "closed",
                  ).length;

                  return (
                    <button
                      key={item.id}
                      onClick={() => openReview(item)}
                      className="w-full rounded-xl border border-[#E5E7EB] bg-white p-5 text-left transition hover:border-[#145A41]/50 hover:bg-[#EAF4EE]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="text-lg font-black text-[#111827]">
                            {item.project || "Unnamed submission"}
                          </div>
                          <div className="mt-1 text-sm text-[#6B7280]">
                            {item.contractor || "Contractor not identified"}
                          </div>
                          <div className="mt-2 text-xs text-[#6B7280]">
                            {item.id || "No ID"} · {item.date || item.updatedAt || "No date"}
                          </div>
                        </div>

                        <div className="grid min-w-[360px] gap-3 text-right sm:grid-cols-4">
                          <div>
                            <div className="text-xs font-black uppercase text-[#6B7280]">
                              Status
                            </div>
                            <div className="mt-1 text-sm font-black text-orange-600">
                              {item.status || item.outcome || "Review Stored"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-black uppercase text-[#6B7280]">
                              Score
                            </div>
                            <div className="mt-1 text-sm font-black text-[#111827]">
                              {typeof item.score === "number"
                                ? `${item.score}%`
                                : "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-black uppercase text-[#6B7280]">
                              Open
                            </div>
                            <div className="mt-1 text-sm font-black text-orange-600">
                              {open}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-black uppercase text-[#6B7280]">
                              Closed
                            </div>
                            <div className="mt-1 text-sm font-black text-green-700">
                              {closed}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
