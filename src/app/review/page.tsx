"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { parseReassessment, type ReassessmentFinding as Finding, type ReviewSnapshot, type Severity } from "@/lib/reassessment";

type Section = {
  title: string;
  content: string[];
};

type StoredReview = {
  id?: string;
  submissionId?: string;
  reviewerName?: string;
  reviewer?: string;
  country?: string;
  projectType?: string;
  project?: string;
  contractorName?: string;
  contractor?: string;
  reviewerNotes?: string;
  siteOccupied?: string;
  liveElectrical?: string;
  workAtHeight?: string;
  hotWorks?: string;
  liftingOps?: string;
  permitRequired?: string;
  rescuePlanExpected?: string;
  publicInterface?: string;
  reviewerComments?: string;
  reviewText?: string;
  review?: string;
  band?: string;
  scoreBand?: string;
  decision?: string;
  outcome?: string;
  status?: string;
  riskExposure?: string;
  risk_exposure?: string;
  residualRisk?: string;
  residual_risk?: string;
  score?: number;
  controlEffectiveness?: number;
  control_effectiveness?: number;
  ratings?: Record<string, string>;
  uploadedDocuments?: string[];
  uploadedSupportingDocuments?: string[];
  findingsRegister?: Finding[];
  findings?: Finding[];
  reviewHistory?: string[];
  reviewVersions?: ReviewSnapshot[];
  scoringMethod?: string;
};

type ReviewFinding = Partial<Finding> & {
  category_label?: string;
  reason?: string;
  evidence?: string;
};

export default function Review() {
  const [reviewerName, setReviewerName] = useState("");
  const [country, setCountry] = useState("");
  const [projectType, setProjectType] = useState("");
  const [siteOccupied, setSiteOccupied] = useState("Yes");
  const [liveElectrical, setLiveElectrical] = useState("Yes");
  const [workAtHeight, setWorkAtHeight] = useState("Yes");
  const [hotWorks, setHotWorks] = useState("No");
  const [liftingOps, setLiftingOps] = useState("No");
  const [permitRequired, setPermitRequired] = useState("Yes");
  const [rescuePlanExpected, setRescuePlanExpected] = useState("Yes");
  const [publicInterface, setPublicInterface] = useState("No");
  const [reviewerNotes, setReviewerNotes] = useState("");

  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [additionalReviewFiles, setAdditionalReviewFiles] = useState<File[]>(
    [],
  );
  const [additionalSupportingFiles, setAdditionalSupportingFiles] = useState<
    File[]
  >([]);
  const [submissionId, setSubmissionId] = useState("RAMS-2026-0001");
  const [reviewOutput, setReviewOutput] = useState("");
  const [structuredScore, setStructuredScore] = useState<number | null>(null);
  const [structuredBand, setStructuredBand] = useState("");
  const [structuredDecision, setStructuredDecision] = useState("");
  const [structuredRiskExposure, setStructuredRiskExposure] = useState("");
  const [structuredResidualRisk, setStructuredResidualRisk] = useState("");
  const [structuredControlEffectiveness, setStructuredControlEffectiveness] = useState<number | null>(null);
  const [structuredRatings, setStructuredRatings] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState("Idle");

  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [reassessingReview, setReassessingReview] = useState(false);

  const [reviewerCloseoutComments, setReviewerCloseoutComments] = useState("");
  const [contractorEmail, setContractorEmail] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [generatedEmailSubject, setGeneratedEmailSubject] = useState("");
  const [generatedEmailBody, setGeneratedEmailBody] = useState("");
  const [emailCopied, setEmailCopied] = useState(false);
  const [showFullAiReview, setShowFullAiReview] = useState(false);
  const [showClosedFindings, setShowClosedFindings] = useState(false);
  const [findingRegister, setFindingRegister] = useState<Finding[]>([]);
  const [reviewHistory, setReviewHistory] = useState<string[]>([]);
  const [reviewVersions, setReviewVersions] = useState<ReviewSnapshot[]>([]);
  const [scoringMethod, setScoringMethod] = useState("initial-v1");
  const [showLanding, setShowLanding] = useState(true);
  const [uploadedDocumentNames, setUploadedDocumentNames] = useState<string[]>(
    [],
  );
  const [uploadedSupportingNames, setUploadedSupportingNames] = useState<
    string[]
  >([]);

  const jurisdictionProfile = (selectedCountry: string) => {
    const c = (selectedCountry || "").trim().toLowerCase();
    if (["uk", "united kingdom", "great britain", "britain", "england", "scotland", "wales"].includes(c)) {
      return {
        regulator: "Health and Safety Executive (HSE)",
        framework: "UK construction health and safety framework",
        note: "configured regulatory profile applied; not live legal research",
      };
    }
    if (["northern ireland", "ni"].includes(c)) {
      return {
        regulator: "Health and Safety Executive Northern Ireland (HSENI)",
        framework: "Northern Ireland construction health and safety framework",
        note: "configured regulatory profile applied; not live legal research",
      };
    }
    if (["ireland", "republic of ireland", "roi", "eire"].includes(c)) {
      return {
        regulator: "Health and Safety Authority (HSA)",
        framework: "Irish construction health and safety framework",
        note: "configured regulatory profile applied; not live legal research",
      };
    }
    if (["us", "usa", "united states", "united states of america", "america"].includes(c)) {
      return {
        regulator: "Occupational Safety and Health Administration (OSHA)",
        framework: "United States OSHA construction safety framework",
        note: "configured regulatory profile applied; not live legal research",
      };
    }
    if (["canada"].includes(c)) {
      return {
        regulator: "Relevant Canadian federal/provincial occupational health and safety authority",
        framework: "Canadian construction occupational health and safety framework",
        note: "configured regulatory profile applied; province-specific requirements to be checked by the competent reviewer",
      };
    }
    if (["australia", "aus"].includes(c)) {
      return {
        regulator: "Safe Work Australia and the relevant state or territory regulator",
        framework: "Australian construction work health and safety framework",
        note: "configured regulatory profile applied; state/territory requirements to be checked by the competent reviewer",
      };
    }
    if (["new zealand", "nz"].includes(c)) {
      return {
        regulator: "WorkSafe New Zealand",
        framework: "New Zealand construction health and safety framework",
        note: "configured regulatory profile applied; not live legal research",
      };
    }
    return {
      regulator: "Relevant local health and safety regulator for the selected country",
      framework: "local construction health and safety framework",
      note: "configured regulatory profile applied; competent reviewer to verify local legal requirements",
    };
  };

  const isPlaceholderFinding = (value?: string) => {
    const cleaned = (value || "").trim().toLowerCase().replace(/[.]/g, "");
    return ["", "none", "none identified", "n/a", "na", "no finding", "no findings", "not applicable"].includes(cleaned);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSubmissionId = params.get("submissionId");

    if (!requestedSubmissionId) {
      localStorage.removeItem("rams_ai_active_review");
      setShowLanding(true);
      return;
    }

    const active = localStorage.getItem("rams_ai_active_review");

    try {
      let saved: StoredReview | null = active ? JSON.parse(active) : null;
      const savedId = saved?.id || saved?.submissionId;

      if (!saved || savedId !== requestedSubmissionId) {
        const storedSubmissions = localStorage.getItem("rams_ai_submissions");
        const parsedSubmissions: StoredReview[] = storedSubmissions ? JSON.parse(storedSubmissions) : [];
        const matched = Array.isArray(parsedSubmissions)
          ? parsedSubmissions.find((item) => (item.id || item.submissionId) === requestedSubmissionId)
          : null;

        if (!matched) {
          setShowLanding(true);
          return;
        }

        localStorage.setItem("rams_ai_active_review", JSON.stringify(matched));
        saved = matched;
      }

      setShowLanding(false);
      setSubmissionId(saved.id || saved.submissionId || "RAMS-2026-0001");
      setReviewerName(saved.reviewerName || saved.reviewer || "");
      setCountry(saved.country || "");
      setProjectType(saved.projectType || saved.project || "");
      setContractorName(saved.contractorName || saved.contractor || "");
      setReviewerNotes(saved.reviewerNotes || "");
      setSiteOccupied(saved.siteOccupied || "Yes");
      setLiveElectrical(saved.liveElectrical || "Yes");
      setWorkAtHeight(saved.workAtHeight || "Yes");
      setHotWorks(saved.hotWorks || "No");
      setLiftingOps(saved.liftingOps || "No");
      setPermitRequired(saved.permitRequired || "Yes");
      setRescuePlanExpected(saved.rescuePlanExpected || "Yes");
      setPublicInterface(saved.publicInterface || "No");
      setReviewerCloseoutComments(saved.reviewerComments || "");
      setReviewOutput(saved.reviewText || saved.review || "");
      setStructuredScore(typeof saved.score === "number" ? saved.score : null);
      setStructuredBand(saved.band || saved.scoreBand || "");
      setStructuredDecision(saved.decision || saved.outcome || saved.status || "");
      setStructuredRiskExposure(saved.riskExposure || saved.risk_exposure || "");
      setStructuredResidualRisk(saved.residualRisk || saved.residual_risk || "");
      setStructuredControlEffectiveness(typeof saved.controlEffectiveness === "number" ? saved.controlEffectiveness : typeof saved.control_effectiveness === "number" ? saved.control_effectiveness : null);
      setStructuredRatings(saved.ratings || {});
      setUploadedDocumentNames(saved.uploadedDocuments || []);
      setUploadedSupportingNames(saved.uploadedSupportingDocuments || []);
      setFindingRegister(saved.findingsRegister || saved.findings || []);
      setReviewHistory(saved.reviewHistory || []);
      setReviewVersions(saved.reviewVersions || []);
      setScoringMethod(saved.scoringMethod || "initial-v1");
      setStatusMessage("Stored submission loaded");
    } catch {
      localStorage.removeItem("rams_ai_active_review");
    }
  }, []);

  const cleanLine = (line: string) =>
    line
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/^[-•]\s*/, "")
      .trim();

  const isWeakSummary = (value: string) => {
    const text = value.trim().toLowerCase();
    return (
      !text ||
      text.length < 60 ||
      text === "not provided" ||
      text === "n/a" ||
      text.includes("no summary") ||
      text.includes("view full ai review")
    );
  };

  const formatReviewOutput = (value: string) =>
    value
      .replace(/### \*\*__/g, "\n\n")
      .replace(/__\*\*/g, "\n")
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/---/g, "")
      .trim();

  const buildFormData = () => {
    const formData = new FormData();

    formData.append("reviewer_name", reviewerName);
    formData.append("country", country);
    formData.append("project_type", projectType);
    formData.append("site_occupied", siteOccupied);
    formData.append("live_electrical", liveElectrical);
    formData.append("work_at_height", workAtHeight);
    formData.append("hot_works", hotWorks);
    formData.append("lifting_ops", liftingOps);
    formData.append("permit_required", permitRequired);
    formData.append("rescue_plan_expected", rescuePlanExpected);
    formData.append("public_interface", publicInterface);
    formData.append("reviewer_notes", reviewerNotes);

    reviewFiles.forEach((file) => formData.append("review_files", file));
    supportingFiles.forEach((file) =>
      formData.append("supporting_files", file),
    );

    return formData;
  };

  const runReview = async () => {
    setRequestError("");
    if (reviewFiles.length === 0) {
      setRequestError("Upload at least one RAMS / method statement document before running a review.");
      return;
    }
    try {
      setLoading(true);
      setReviewOutput("");
      setReviewHistory([]);
      setReviewVersions([]);
      setScoringMethod("initial-v1");
      setStructuredScore(null);
      setStructuredBand("");
      setStructuredDecision("");
      setStructuredRiskExposure("");
      setStructuredResidualRisk("");
      setStructuredControlEffectiveness(null);
      setStructuredRatings({});
      setGeneratedEmailSubject("");
      setGeneratedEmailBody("");
      setShowFullAiReview(false);
      const nextSubmissionId = `RAMS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      setSubmissionId(nextSubmissionId);
      setAdditionalReviewFiles([]);
      setAdditionalSupportingFiles([]);
      setUploadedDocumentNames(reviewFiles.map((file) => file.name));
      setUploadedSupportingNames(supportingFiles.map((file) => file.name));
      setStatusMessage("Running review...");

      const response = await fetch("http://127.0.0.1:8000/review", {
        method: "POST",
        body: buildFormData(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Review failed");
      }

      const returnedReview = data.review_text || data.review || "No review returned.";
      setReviewOutput(returnedReview);
      setStructuredScore(typeof data.score === "number" ? data.score : null);
      setStructuredBand(data.band || "");
      setStructuredDecision(data.decision || data.outcome || data.status || "");
      setStructuredRiskExposure(data.risk_exposure || data.riskExposure || "");
      setStructuredResidualRisk(data.residual_risk || data.residualRisk || "");
      setStructuredControlEffectiveness(typeof data.control_effectiveness === "number" ? data.control_effectiveness : typeof data.controlEffectiveness === "number" ? data.controlEffectiveness : null);
      setStructuredRatings(data.ratings || {});
      if (Array.isArray(data.findings)) {
        const today = new Date().toLocaleDateString("en-GB");
        setFindingRegister(data.findings.map((item: ReviewFinding, index: number) => ({
          ref: item.ref || String(index + 1).padStart(3, "0"),
          category: item.category || item.category_label || "Process",
          finding: item.finding || item.reason || "Finding requires reviewer confirmation.",
          action: item.action || "Provide close-out evidence for this finding.",
          severity: item.severity || "Minor",
          status: item.status || "Open",
          dateRaised: item.dateRaised || today,
          createdReview: item.createdReview || "Review 1",
          evidenceUsed: item.evidence || item.evidenceUsed || "",
          aiReasoning: item.aiReasoning || item.reason || "",
        })));
      }
      setStatusMessage("Review complete");
    } catch (error) {
      setStatusMessage("Error");
      setRequestError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    setRequestError("");
    try {
      setDownloadingPdf(true);
      setStatusMessage("Generating PDF...");

      const response = await fetch(
        "http://127.0.0.1:8000/review/dashboard-pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            review_text: reviewOutput,
            reviewer_name: reviewerName,
            country,
            project_type:
              projectType || reviewMeta.projectName || "RAMS Review",
            reviewer_comments: reviewerCloseoutComments,
            status: dashboardStatus,
            score: calculatedScore,
            outcome:
              (dashboardStatus === "OK TO PROCEED" || dashboardStatus === "READY FOR APPROVER REVIEW")
                ? "Ready for Approver Review"
                : dashboardStatus === "MINOR AMENDMENTS REQUIRED"
                  ? "Minor Close-Out Required"
                  : reviewMeta.outcome,
            risk_exposure: inherentRiskLevel,
            residual_risk: residualRiskLevel,
            control_effectiveness: controlEffectiveness,
            documents_reviewed: [...new Set([
              ...uploadedDocumentNames,
              ...uploadedSupportingNames,
              ...reviewFiles.map((file) => file.name),
              ...supportingFiles.map((file) => file.name),
            ])],
            review_basis_summary: reviewMeta.summary,
            findings: registerFindings,
            closed_findings: closedFindings,
            open_findings: activeFindings,
            close_out_progress: closeOutProgress,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("PDF generation failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "rams_ai_dashboard_report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      setStatusMessage("PDF downloaded");
    } catch (error) {
      setStatusMessage("PDF failed");
      setRequestError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const generateContractorEmail = async () => {
    setRequestError("");
    try {
      setGeneratingEmail(true);
      setStatusMessage("Generating contractor email...");

      const formData = new FormData();
      formData.append("review_text", reviewOutput);
      formData.append("reviewer_comments", reviewerCloseoutComments);
      formData.append("contractor_email", contractorEmail);
      formData.append("contractor_name", contractorName);

      const response = await fetch("http://127.0.0.1:8000/contractor-email", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Email generation failed");
      }

      setGeneratedEmailSubject(data.subject || "RAMS Review Follow-Up");
      setGeneratedEmailBody(data.body || "");
      setStatusMessage("Contractor email ready");
    } catch (error) {
      setStatusMessage("Email generation failed");
      setRequestError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setGeneratingEmail(false);
    }
  };

  const reassessReview = async () => {
    if (!reviewOutput || reviewOutput.startsWith("Error:")) return;
    setRequestError("");

    try {
      setReassessingReview(true);
      setStatusMessage("Reassessing submission...");
      setGeneratedEmailSubject("");
      setGeneratedEmailBody("");
      setShowFullAiReview(false);
      setShowClosedFindings(false);

      const formData = new FormData();
      formData.append("original_review", reviewOutput);
      formData.append("reviewer_comments", reviewerCloseoutComments);
      formData.append("reviewer_name", reviewerName);
      formData.append("country", country);
      formData.append("project_type", projectType);
      formData.append("site_occupied", siteOccupied);
      formData.append("live_electrical", liveElectrical);
      formData.append("work_at_height", workAtHeight);
      formData.append("hot_works", hotWorks);
      formData.append("lifting_ops", liftingOps);
      formData.append("permit_required", permitRequired);
      formData.append("rescue_plan_expected", rescuePlanExpected);
      formData.append("public_interface", publicInterface);
      formData.append("reviewer_notes", reviewerNotes);

      formData.append("original_findings", JSON.stringify(registerFindings));
      formData.append("risk_exposure", inherentRiskLevel);

      additionalReviewFiles.forEach((file) =>
        formData.append("review_files", file),
      );
      additionalSupportingFiles.forEach((file) =>
        formData.append("supporting_files", file),
      );

      const response = await fetch(
        "http://127.0.0.1:8000/review/reassess-documents",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Submission reassessment failed");
      }

      const result = parseReassessment(data, registerFindings);
      const snapshot: ReviewSnapshot = {
        reviewNumber: reviewHistory.length + 1,
        recordedAt: new Date().toISOString(),
        projectName: reviewMeta.projectName,
        contractorName: reviewMeta.contractor,
        reviewText: reviewOutput,
        score: calculatedScore,
        band: scoreLabel,
        decision: structuredDecision || dashboardStatus,
        riskExposure: inherentRiskLevel,
        residualRisk: residualRiskLevel,
        controlEffectiveness,
        ratings: structuredRatings,
        findings: registerFindings,
        uploadedDocuments: uploadedDocumentNames,
        uploadedSupportingDocuments: uploadedSupportingNames,
        reviewerComments: reviewerCloseoutComments,
        scoringMethod,
      };
      setReviewVersions((current) => [...current, snapshot]);
      setStructuredScore(result.score);
      setStructuredBand(result.band);
      setStructuredDecision(result.decision);
      setStructuredRiskExposure(result.risk_exposure);
      setStructuredResidualRisk(result.residual_risk);
      setStructuredControlEffectiveness(result.control_effectiveness);
      setFindingRegister(result.findings);
      setScoringMethod(result.scoring_method);
      setUploadedDocumentNames((current) => [...new Set([
        ...current, ...additionalReviewFiles.map((file) => file.name),
      ])]);
      setUploadedSupportingNames((current) => [...new Set([
        ...current, ...additionalSupportingFiles.map((file) => file.name),
      ])]);
      setAdditionalReviewFiles([]);
      setAdditionalSupportingFiles([]);
      setReviewHistory((current) => [
        ...current,
        `Review ${current.length + 2} - ${new Date().toLocaleString("en-GB")} - reassessment completed`,
      ]);
      setReviewOutput(result.review_text);
      setStatusMessage("Submission reassessed");
    } catch (error) {
      setStatusMessage("Reassessment failed");
      setRequestError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setReassessingReview(false);
    }
  };

  const copyEmailDraft = async () => {
    const emailText = `Subject: ${generatedEmailSubject}\n\n${generatedEmailBody}`;
    await navigator.clipboard.writeText(emailText);
    setEmailCopied(true);
    setStatusMessage("Email draft copied");
    setTimeout(() => setEmailCopied(false), 2500);
  };

  const parsedSections = useMemo(() => {
    if (!reviewOutput || reviewOutput.startsWith("Error:")) return [];

    return reviewOutput
      .split("### **__")
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const [rawTitle, ...rest] = block.split("__**");
        const title = rawTitle.replace(/\*/g, "").trim();

        const content = rest
          .join("__**")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .filter((line) => line !== "---")
          .filter(
            (line) =>
              !line.toLowerCase().includes("if you require further review"),
          )
          .filter((line) => !line.toLowerCase().includes("please advise"));

        return { title, content };
      });
  }, [reviewOutput]);

  const getSection = (name: string) =>
    parsedSections.find((section) =>
      section.title.toLowerCase().includes(name.toLowerCase()),
    );

  const executiveSection = getSection("Executive Summary");
  const evidenceGapsSection = getSection("Evidence Gaps");
  const contractorActionsSection = getSection("Contractor Actions");
  const reassessmentSection = getSection("Findings Reassessment");
  const genericSection = getSection("Generic");
  const contextSection = getSection("Project Context");

  const severityGroups = (content: string[]) => {
    const groups = {
      Critical: [] as string[],
      Important: [] as string[],
      Minor: [] as string[],
    };

    let active: "Critical" | "Important" | "Minor" | null = null;

    for (const raw of content) {
      const line = cleanLine(raw);
      const lower = line.toLowerCase();

      if (lower === "critical" || lower.startsWith("critical:")) {
        active = "Critical";
        const value = line.replace(/^Critical:?\s*/i, "").trim();
        if (value) groups.Critical.push(value);
        continue;
      }

      if (lower === "important" || lower.startsWith("important:")) {
        active = "Important";
        const value = line.replace(/^Important:?\s*/i, "").trim();
        if (value) groups.Important.push(value);
        continue;
      }

      if (lower === "minor" || lower.startsWith("minor:")) {
        active = "Minor";
        const value = line.replace(/^Minor:?\s*/i, "").trim();
        if (value) groups.Minor.push(value);
        continue;
      }

      if (active && line) {
        groups[active].push(line.replace(/^\d+\.\s*/, ""));
      }
    }

    return groups;
  };

  const actionGroups = useMemo(() => {
    const actionContent = contractorActionsSection?.content || [];
    const gapContent = evidenceGapsSection?.content || [];

    const primary = severityGroups(actionContent);
    const fallback = severityGroups(gapContent);

    return {
      Critical: primary.Critical.length ? primary.Critical : fallback.Critical,
      Important: primary.Important.length
        ? primary.Important
        : fallback.Important,
      Minor: primary.Minor.length ? primary.Minor : fallback.Minor,
    };
  }, [contractorActionsSection, evidenceGapsSection]);

  const parseUpdatedScore = (content: string[]) => {
    const line = content
      .map(cleanLine)
      .find((item) => item.toLowerCase().startsWith("updated score"));
    const value = line?.match(/(\d{1,3})/)?.[1];
    return value ? Math.max(0, Math.min(100, Number(value))) : null;
  };

  const dynamicScoreFromFindings = (items: Finding[]) => {
    const openItems = items.filter((item) => item.status !== "Closed");
    const penalty = openItems.reduce((total, item) => {
      if (item.severity === "Critical") return total + 18;
      if (item.severity === "Major") return total + 10;
      if (item.severity === "Minor") return total + 4;
      return total + 1;
    }, 0);
    return Math.max(20, Math.min(96, 100 - penalty));
  };

  const decisionFromCounts = (
    critical: number,
    major: number,
    minor: number,
  ) => {
    if (critical > 0 || major > 0) return "FURTHER AMENDMENTS REQUIRED";
    if (minor > 0) return "MINOR AMENDMENTS REQUIRED";
    return "READY FOR APPROVER REVIEW";
  };

  const reviewMeta = useMemo(() => {
    const content = executiveSection?.content || [];
    const reassessedContent =
      getSection("Reassessed Executive Summary")?.content || [];
    const cleaned = content.map(cleanLine).filter(Boolean);
    const reassessedCleaned = reassessedContent.map(cleanLine).filter(Boolean);
    const fullText = [...cleaned, ...reassessedCleaned].join(" ").toLowerCase();

    const decisionLine =
      [...reassessedCleaned, ...cleaned].find((line) =>
        line.toLowerCase().startsWith("decision"),
      ) || "";

    const explicitUpdatedPosition =
      reassessedCleaned.find((line) =>
        line.toLowerCase().startsWith("updated position"),
      ) || "";

    const projectName =
      contextSection?.content
        .map(cleanLine)
        .find((line) => line.toLowerCase().startsWith("project name"))
        ?.split(":")
        .slice(1)
        .join(":")
        .trim() || reviewVersions[reviewVersions.length - 1]?.projectName || projectType || "Not clearly identified";

    const contractor =
      contextSection?.content
        .map(cleanLine)
        .find((line) => line.toLowerCase().startsWith("contractor name"))
        ?.split(":")
        .slice(1)
        .join(":")
        .trim() || reviewVersions[reviewVersions.length - 1]?.contractorName || contractorName || "Not clearly identified";

    const updatedScore = parseUpdatedScore(reassessedContent);

    const summaryCandidates = [...reassessedCleaned, ...cleaned]
      .map((line) =>
        line
          .replace(/^Most Serious Reason for Classification:\s*/i, "")
          .replace(/^Short explanation:?\s*/i, "")
          .replace(/^Summary:\s*/i, "")
          .trim(),
      )
      .filter((line) => line.length > 60)
      .filter(
        (line) => !line.toLowerCase().startsWith("rams quality classification"),
      );

    const contractorDocs = uploadedDocumentNames.length
      ? uploadedDocumentNames.join(", ")
      : reviewFiles.length
        ? reviewFiles.map((file) => file.name).join(", ")
        : "the uploaded contractor RAMS documents";

    const supportingDocs = uploadedSupportingNames.length
      ? uploadedSupportingNames.join(", ")
      : supportingFiles.length
        ? supportingFiles.map((file) => file.name).join(", ")
        : "no separate organisational policy, SOP, client standard or site rule was uploaded";

    const commentary =
      summaryCandidates.find((line) =>
        line.toLowerCase().includes("critical"),
      ) ||
      summaryCandidates.find((line) => line.toLowerCase().includes("amend")) ||
      summaryCandidates[0] ||
      "";

    const jurisdiction = jurisdictionProfile(country);
    const summary = `RAMS.AI reviewed ${contractorDocs} against the project context entered by the reviewer and the configured regulatory profile for ${country || "the stated country"}. Governing body / regulator applied: ${jurisdiction.regulator}. Framework applied: ${jurisdiction.framework}. Supporting document basis: ${supportingDocs}. Uploaded policies, SOPs, client standards and site rules are compared against the RAMS where provided, and actions are raised where the RAMS does not align with those requirements. This is a review-support output for competent person consideration only and does not approve, certify or authorise the RAMS for use. Regulatory note: ${jurisdiction.note}.${isWeakSummary(commentary) ? "" : ` Review commentary: ${commentary}`}`;

    const statusText =
      `${decisionLine} ${explicitUpdatedPosition}`.toLowerCase();
    let status = "FURTHER AMENDMENTS REQUIRED";
    if (statusText.includes("ok to proceed") || statusText.includes("ready for approver")) status = "READY FOR APPROVER REVIEW";
    else if (statusText.includes("minor amendments"))
      status = "MINOR AMENDMENTS REQUIRED";
    else if (
      statusText.includes("review stage") ||
      statusText.includes("amend")
    )
      status = "FURTHER AMENDMENTS REQUIRED";

    const outcome =
      (status === "OK TO PROCEED" || status === "READY FOR APPROVER REVIEW")
        ? "Ready for Approver Review"
        : status === "MINOR AMENDMENTS REQUIRED"
          ? "Minor Close-Out Required"
          : "Amendments Required";

    return {
      status,
      outcome,
      score: updatedScore,
      summary,
      projectName,
      contractor,
      fullText,
    };
  }, [
    executiveSection,
    contextSection,
    parsedSections,
    country,
    uploadedDocumentNames,
    uploadedSupportingNames,
    reviewFiles,
    supportingFiles,
    jurisdictionProfile,
    reviewVersions,
    projectType,
    contractorName,
  ]);

  const observationItems = useMemo(() => {
    const lines = genericSection?.content || [];
    return lines
      .map(cleanLine)
      .filter(Boolean)
      .filter((line) => line.length > 20)
      .slice(0, 4);
  }, [genericSection]);

  const normaliseFindingKey = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("rescue") || lower.includes("emergency"))
      return "emergency-rescue";
    if (lower.includes("permit") || lower.includes("hot work"))
      return "permit-hot-works";
    if (
      lower.includes("interface") ||
      lower.includes("segregation") ||
      lower.includes("public")
    )
      return "interface-segregation";
    if (lower.includes("supervision") || lower.includes("fire watch"))
      return "supervision";
    if (lower.includes("competenc") || lower.includes("training"))
      return "competence";
    if (lower.includes("ppe")) return "ppe";
    if (lower.includes("lifting") || lower.includes("crane")) return "lifting";
    return lower.replace(/[^a-z0-9]+/g, "-").slice(0, 50);
  };

  const problemFromAction = (action: string) => {
    const text = action.trim();
    const lower = text.toLowerCase();
    if (lower.includes("rescue") || lower.includes("emergency")) {
      return "Site-specific emergency and rescue arrangements are not sufficiently evidenced for the activities described.";
    }
    if (lower.includes("permit") || lower.includes("hot work")) {
      return "The permit-to-work arrangements are not sufficiently evidenced or defined for the high-risk activities.";
    }
    if (
      lower.includes("interface") ||
      lower.includes("segregation") ||
      lower.includes("public")
    ) {
      return "Site interface, access control and segregation arrangements are not sufficiently detailed.";
    }
    if (lower.includes("supervision") || lower.includes("fire watch")) {
      return "Supervision, monitoring or fire-watch arrangements are not sufficiently evidenced.";
    }
    if (lower.includes("competenc") || lower.includes("training")) {
      return "Task-specific competence or training evidence is not sufficiently evidenced.";
    }
    if (lower.includes("ppe")) {
      return "Task-specific PPE requirements are not sufficiently detailed.";
    }
    return text
      .replace(/^(submit|provide|update|clarify|supply|develop)\s+/i, "")
      .trim();
  };

  const parseFindingStatus = (value: string): Finding["status"] => {
    const lower = value.toLowerCase();
    if (lower.includes("closed")) return "Closed";
    // RAMS.AI uses a simple findings lifecycle: Open or Closed.
    // Downgrades remain Open until the close-out evidence fully resolves the finding.
    return "Open";
  };

  const parseReassessedFindings = (content: string[]) => {
    const rows: Omit<Finding, "ref" | "category">[] = [];
    let current: Partial<Omit<Finding, "ref" | "category">> = {};

    const flush = () => {
      if (current.finding || current.action) {
        rows.push({
          finding: current.finding || "Finding requires reviewer confirmation.",
          action:
            current.status === "Closed"
              ? current.action || "Closed - close-out evidence accepted by the reviewer."
              : current.action || "Confirm remaining close-out action.",
          severity: current.severity || "Minor",
          status: current.status || "Open",
        });
      }
      current = {};
    };

    content.map(cleanLine).forEach((line) => {
      if (!line) return;
      const lower = line.toLowerCase();
      if (
        lower.startsWith("original severity") &&
        (current.finding || current.action)
      )
        flush();
      if (lower.startsWith("updated severity")) {
        const value = line.split(":").slice(1).join(":").trim().toLowerCase();
        current.severity = value.includes("critical")
          ? "Critical"
          : value.includes("major") || value.includes("important")
            ? "Major"
            : value.includes("observation")
              ? "Observation"
              : "Minor";
        return;
      }
      if (lower.startsWith("original severity") && !current.severity) {
        const value = line.split(":").slice(1).join(":").trim().toLowerCase();
        current.severity = value.includes("critical")
          ? "Critical"
          : value.includes("major") || value.includes("important")
            ? "Major"
            : value.includes("observation")
              ? "Observation"
              : "Minor";
        return;
      }
      if (lower.startsWith("status")) {
        current.status = parseFindingStatus(line.split(":").slice(1).join(":"));
        return;
      }
      if (lower.startsWith("finding")) {
        current.finding = line.split(":").slice(1).join(":").trim();
        return;
      }
      if (lower.startsWith("remaining action")) {
        current.action = line.split(":").slice(1).join(":").trim();
        return;
      }
    });
    flush();
    return rows;
  };

  const findings = useMemo(() => {
    const categoryFromText = (text: string) => {
      const lower = text.toLowerCase();
      if (
        lower.includes("rescue") ||
        lower.includes("emergency") ||
        lower.includes("competence")
      )
        return "People";
      if (
        lower.includes("permit") ||
        lower.includes("isolation") ||
        lower.includes("procedure") ||
        lower.includes("supervision")
      )
        return "Process";
      if (
        lower.includes("lifting") ||
        lower.includes("plant") ||
        lower.includes("equipment")
      )
        return "Plant";
      if (
        lower.includes("fire") ||
        lower.includes("hot works") ||
        lower.includes("spill") ||
        lower.includes("waste")
      )
        return "Environment";
      return "Process";
    };

    const reassessedRows = reassessmentSection?.content?.length
      ? parseReassessedFindings(reassessmentSection.content)
      : [];

    const sourceRows: Omit<Finding, "ref" | "category">[] =
      reassessedRows.length
        ? reassessedRows
        : [
            ...actionGroups.Critical.map((action, index) => ({
              finding: problemFromAction(
                severityGroups(evidenceGapsSection?.content || []).Critical[
                  index
                ] || action,
              ),
              severity: "Critical" as Severity,
              status: "Open" as const,
              action,
            })),
            ...actionGroups.Important.map((action, index) => ({
              finding: problemFromAction(
                severityGroups(evidenceGapsSection?.content || []).Important[
                  index
                ] || action,
              ),
              severity: "Major" as Severity,
              status: "Open" as const,
              action,
            })),
            ...actionGroups.Minor.map((action, index) => ({
              finding: problemFromAction(
                severityGroups(evidenceGapsSection?.content || []).Minor[
                  index
                ] || action,
              ),
              severity: "Minor" as Severity,
              status: "Open" as const,
              action,
            })),
            ...observationItems.map((item) => ({
              finding: item,
              severity: "Observation" as Severity,
              status: "Open" as const,
              action: "Review and update wording where required.",
            })),
          ];

    const merged = new Map<string, Omit<Finding, "ref" | "category">>();
    sourceRows
      .filter((row) => !isPlaceholderFinding(row.finding))
      .forEach((row) => {
      const key = normaliseFindingKey(`${row.finding} ${row.action}`);
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, row);
        return;
      }
      const severityRank = {
        Critical: 4,
        Major: 3,
        Minor: 2,
        Observation: 1,
      } as Record<Severity, number>;
      const statusRank = {
        Open: 3,
        Closed: 1,
      } as Record<Finding["status"], number>;
      merged.set(key, {
        finding:
          existing.finding.length <= row.finding.length
            ? existing.finding
            : row.finding,
        action: existing.action.includes(row.action)
          ? existing.action
          : `${existing.action} ${row.action}`.trim(),
        severity:
          severityRank[row.severity] > severityRank[existing.severity]
            ? row.severity
            : existing.severity,
        status:
          statusRank[row.status] > statusRank[existing.status]
            ? row.status
            : existing.status,
      });
    });

    let ref = 1;
    return Array.from(merged.values()).map((item) => ({
      ref: String(ref++).padStart(3, "0"),
      category: categoryFromText(`${item.finding} ${item.action}`),
      ...item,
    }));
  }, [
    actionGroups,
    observationItems,
    reassessmentSection,
    evidenceGapsSection,
    isPlaceholderFinding,
  ]);

  const mergeFindingRegister = (previous: Finding[], current: Finding[]) => {
    const today = new Date().toLocaleDateString("en-GB");
    const byKey = new Map<string, Finding>();
    previous.forEach((item, index) => {
      const key = normaliseFindingKey(`${item.finding} ${item.action}`);
      byKey.set(key, {
        ...item,
        ref: item.ref || String(index + 1).padStart(3, "0"),
        dateRaised: item.dateRaised || today,
        createdReview: item.createdReview || "Review 1",
      });
    });

    current.forEach((item) => {
      const key = normaliseFindingKey(`${item.finding} ${item.action}`);
      const existing = byKey.get(key);
      const nextStatus = item.status;
      const merged: Finding = {
        ...(existing || item),
        ...item,
        ref: existing?.ref || String(byKey.size + 1).padStart(3, "0"),
        dateRaised: existing?.dateRaised || today,
        createdReview: existing?.createdReview || "Review 1",
        dateClosed:
          nextStatus === "Closed"
            ? existing?.dateClosed || today
            : existing?.dateClosed,
        closedReview:
          nextStatus === "Closed"
            ? existing?.closedReview || `Review ${reviewHistory.length + 1}`
            : existing?.closedReview,
        evidenceUsed:
          nextStatus === "Closed"
            ? reviewerCloseoutComments || existing?.evidenceUsed
            : existing?.evidenceUsed,
      };
      byKey.set(key, merged);
    });

    return Array.from(byKey.values()).map((item, index) => ({
      ...item,
      ref: String(index + 1).padStart(3, "0"),
    }));
  };

  useEffect(() => {
    if (!reviewOutput || reviewOutput.startsWith("Error:") || structuredScore !== null || findings.length === 0)
      return;
    setFindingRegister((previous) => mergeFindingRegister(previous, findings));
  }, [reviewOutput, findings.length, reviewerCloseoutComments, structuredScore]);

  const registerFindings = structuredScore !== null ? findingRegister : (findingRegister.length ? findingRegister : findings);
  const activeFindings = registerFindings.filter((f) => f.status !== "Closed");
  const closedFindings = registerFindings.filter((f) => f.status === "Closed");
  const displayedFindings = showClosedFindings ? registerFindings : activeFindings;
  const originalFindingsCount = registerFindings.length;
  const closeOutProgress = originalFindingsCount
    ? Math.round((closedFindings.length / originalFindingsCount) * 100)
    : 0;

  const criticalCount = activeFindings.filter(
    (f) => f.severity === "Critical",
  ).length;
  const majorCount = activeFindings.filter(
    (f) => f.severity === "Major",
  ).length;
  const minorCount = activeFindings.filter(
    (f) => f.severity === "Minor",
  ).length;
  const observationCount = activeFindings.filter(
    (f) => f.severity === "Observation",
  ).length;
  const totalFindings =
    criticalCount + majorCount + minorCount + observationCount;
  const criticalFindings = activeFindings
    .filter((f) => f.severity === "Critical")
    .slice(0, 4);
  const safeTotalFindings = totalFindings || 1;
  const criticalEnd = (criticalCount / safeTotalFindings) * 100;
  const majorEnd = ((criticalCount + majorCount) / safeTotalFindings) * 100;
  const minorEnd =
    ((criticalCount + majorCount + minorCount) / safeTotalFindings) * 100;
  const riskChartBackground =
    totalFindings > 0
      ? `conic-gradient(#EF4444 0 ${criticalEnd}%, #F97316 ${criticalEnd}% ${majorEnd}%, #EAB308 ${majorEnd}% ${minorEnd}%, #3B82F6 ${minorEnd}% 100%)`
      : "conic-gradient(#E5E7EB 0 100%)";

  const riskToneClass = (level: string) =>
    level === "HIGH"
      ? "border-red-300 bg-red-50 text-red-700"
      : level === "MEDIUM"
        ? "border-orange-300 bg-orange-50 text-orange-700"
        : "border-green-300 bg-green-50 text-green-700";

  const riskDotClass = (level: string) =>
    level === "HIGH"
      ? "bg-red-500"
      : level === "MEDIUM"
        ? "bg-orange-500"
        : "bg-green-500";

  const inherentRiskLevel =
    structuredRiskExposure ||
    (liveElectrical === "Yes" ||
    workAtHeight === "Yes" ||
    hotWorks === "Yes" ||
    liftingOps === "Yes" ||
    publicInterface === "Yes"
      ? "HIGH"
      : permitRequired === "Yes" || siteOccupied === "Yes"
        ? "MEDIUM"
        : "LOW");

  const residualRiskLevel =
    structuredResidualRisk ||
    (criticalCount > 1
      ? "HIGH"
      : criticalCount === 1 || majorCount > 0
        ? "MEDIUM"
        : "LOW");

  const parsedCalculatedScore = dynamicScoreFromFindings(registerFindings);
  const calculatedScore = structuredScore !== null ? structuredScore : parsedCalculatedScore;
  const scoreLabel = structuredBand || (calculatedScore >= 90 ? "Excellent" : calculatedScore >= 75 ? "Good" : calculatedScore >= 60 ? "Fair" : calculatedScore >= 40 ? "Poor" : "Critical");
  const calculatedStatus = decisionFromCounts(
    criticalCount,
    majorCount,
    minorCount,
  );
  const normalisedStructuredDecision = (structuredDecision || "").toUpperCase();
  const dashboardStatus =
    normalisedStructuredDecision ||
    (reviewMeta.status === "FURTHER AMENDMENTS REQUIRED"
      ? calculatedStatus
      : reviewMeta.status);
  const controlEffectiveness = structuredControlEffectiveness !== null ? structuredControlEffectiveness : Math.max(20, Math.min(95, calculatedScore));

  const evidenceQualityLabel =
    controlEffectiveness >= 80
      ? "Strong"
      : controlEffectiveness >= 60
        ? "Moderate"
        : "Weak";

  const inherentRiskDescription =
    inherentRiskLevel === "HIGH"
      ? "The activities described indicate high inherent risk before controls are considered. This may include high-consequence work such as live services, work at height, lifting, plant interface or occupied-site conditions."
      : inherentRiskLevel === "MEDIUM"
        ? "The activities described indicate a medium inherent risk profile before controls are considered, requiring clear task sequencing, supervision and evidence of competence."
        : "The activities described indicate a lower inherent risk profile, subject to the RAMS remaining site-specific and proportionate to the works.";

  const residualRiskDescription =
    residualRiskLevel === "HIGH"
      ? "The controls documented within the submitted RAMS do not yet reduce the residual risk to a controlled level. Critical close-out remains required."
      : residualRiskLevel === "MEDIUM"
        ? "The submitted controls reduce the risk, but significant gaps remain. Further clarification and evidence are required before the RAMS can progress."
        : "The submitted controls appear to reduce the residual risk to a controlled level, subject to competent person close-out of the listed actions.";

  const categoryScore = (keywords: string[], base = calculatedScore) => {
    const matching = activeFindings.filter((f) => {
      const haystack = `${f.finding} ${f.action} ${f.category}`.toLowerCase();
      return keywords.some((keyword) => haystack.includes(keyword));
    });
    if (matching.length === 0) return Math.min(100, Math.max(base, 88));
    const penalty = matching.reduce((total, item) => {
      const weight = item.severity === "Critical" ? 28 : item.severity === "Major" ? 18 : item.severity === "Minor" ? 8 : 4;
      return total + weight;
    }, 0);
    return Math.max(20, Math.min(100, 100 - penalty));
  };

  const complianceBreakdown = [
    ["Scope of Works", categoryScore(["scope", "sequence", "method"], calculatedScore)],
    ["Method Statement", categoryScore(["method", "sequence", "procedure"], calculatedScore)],
    ["Risk Assessment", categoryScore(["risk", "hazard", "control"], calculatedScore)],
    ["PPE Requirements", categoryScore(["ppe", "protective"], calculatedScore)],
    ["Emergency Procedures", categoryScore(["rescue", "emergency", "evacuation", "escalation"], calculatedScore)],
    ["Environmental Controls", categoryScore(["environment", "waste", "spill", "dust"], calculatedScore)],
    ["Training & Competence", categoryScore(["competence", "training", "supervision"], calculatedScore)],
    ["Plant & Equipment", categoryScore(["plant", "equipment", "lifting", "crane"], calculatedScore)],
  ];

  const qualityIndicators = [
    {
      label: "Site Specificity",
      value: reviewMeta.fullText.includes("site-specific") ? "68%" : "45%",
      sub: "Moderate",
      tone: "green",
    },
    {
      label: "Generic Content",
      value: genericSection ? "32%" : "Low",
      sub: genericSection ? "High" : "Low",
      tone: genericSection ? "orange" : "green",
    },
    {
      label: "Evidence Quality",
      value: evidenceQualityLabel,
      sub: "Review basis",
      tone: "green",
    },
    {
      label: "Competence Evidence",
      value: reviewMeta.fullText.includes("competent") ? "Partial" : "Weak",
      sub: "Evidence supplied",
      tone: reviewMeta.fullText.includes("competent") ? "orange" : "red",
    },
    {
      label: "Residual Risk Acceptability",
      value: residualRiskLevel,
      sub:
        residualRiskLevel === "HIGH"
          ? "Action required"
          : residualRiskLevel === "MEDIUM"
            ? "Close-out required"
            : "Controlled",
      tone:
        residualRiskLevel === "HIGH"
          ? "red"
          : residualRiskLevel === "MEDIUM"
            ? "orange"
            : "green",
    },
  ];

  const inputClass =
    "w-full rounded-xl border border-[#D6E2DA] bg-white px-4 py-3 text-sm text-[#10241C] outline-none focus:border-[#145A41] focus:ring-2 focus:ring-[#145A41]/10";
  const labelClass = "mb-2 block text-sm font-medium text-[#274239]";
  const darkInputClass =
    "w-full rounded-xl border border-white/10 bg-[#083326] px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10";

  const riskContextItems: {
    label: string;
    value: string;
    setter: Dispatch<SetStateAction<string>>;
  }[] = [
    { label: "Site Occupied", value: siteOccupied, setter: setSiteOccupied },
    {
      label: "Live Electrical Environment",
      value: liveElectrical,
      setter: setLiveElectrical,
    },
    { label: "Work at Height", value: workAtHeight, setter: setWorkAtHeight },
    { label: "Hot Works", value: hotWorks, setter: setHotWorks },
    { label: "Lifting Operations", value: liftingOps, setter: setLiftingOps },
    {
      label: "Permit to Work Required",
      value: permitRequired,
      setter: setPermitRequired,
    },
    {
      label: "Rescue Plan Expected",
      value: rescuePlanExpected,
      setter: setRescuePlanExpected,
    },
    {
      label: "Public / Third-Party Interface",
      value: publicInterface,
      setter: setPublicInterface,
    },
  ];

  useEffect(() => {
    if (!reviewOutput || reviewOutput.startsWith("Error:")) return;

    const record = {
      id: submissionId,
      project: reviewMeta.projectName || projectType || "Unnamed submission",
      contractor:
        reviewMeta.contractor || contractorName || "Contractor not identified",
      status: dashboardStatus,
      decision: structuredDecision || dashboardStatus,
      outcome:
        structuredDecision ||
        ((dashboardStatus === "OK TO PROCEED" || dashboardStatus === "READY FOR APPROVER REVIEW")
          ? "Ready for Approver Review"
          : dashboardStatus === "MINOR AMENDMENTS REQUIRED"
            ? "Minor Close-Out Required"
            : "Amendments Required"),
      score: calculatedScore,
      band: structuredBand || scoreLabel,
      ratings: structuredRatings,
      reviewer: reviewerName || "RAMS.AI",
      reviewerName,
      contractorName,
      country,
      projectType,
      reviewerNotes,
      siteOccupied,
      liveElectrical,
      workAtHeight,
      hotWorks,
      liftingOps,
      permitRequired,
      rescuePlanExpected,
      publicInterface,
      reviewerComments: reviewerCloseoutComments,
      reviewText: reviewOutput,
      review: reviewOutput,
      findings: registerFindings,
      findingsRegister: registerFindings,
      closedFindings,
      openFindings: activeFindings,
      closeOutProgress,
      reviewHistory,
      reviewVersions,
      scoringMethod,
      riskExposure: inherentRiskLevel,
      residualRisk: residualRiskLevel,
      controlEffectiveness,
      uploadedDocuments: uploadedDocumentNames.length
        ? uploadedDocumentNames
        : reviewFiles.map((file) => file.name),
      uploadedSupportingDocuments: uploadedSupportingNames.length
        ? uploadedSupportingNames
        : supportingFiles.map((file) => file.name),
      documents: [
        ...new Set([
          ...(uploadedDocumentNames.length ? uploadedDocumentNames : reviewFiles.map((file) => file.name)),
          ...(uploadedSupportingNames.length ? uploadedSupportingNames : supportingFiles.map((file) => file.name)),
          ...additionalReviewFiles.map((file) => file.name),
          ...additionalSupportingFiles.map((file) => file.name),
        ]),
      ],
      date: new Date().toLocaleDateString("en-GB"),
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("rams_ai_active_review", JSON.stringify(record));
      let existing: { id: string }[] = [];
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem("rams_ai_submissions") || "[]");
        if (Array.isArray(parsed)) existing = parsed.filter((item) => item && typeof item.id === "string");
      } catch {
        // A malformed browser history must not prevent saving the current review.
      }
      const withoutCurrent = existing.filter((item) => item.id !== record.id);
      localStorage.setItem(
        "rams_ai_submissions",
        JSON.stringify([record, ...withoutCurrent].slice(0, 50)),
      );
    } catch {
      setRequestError("The review is still open, but browser storage could not save it. Download the report before leaving this page.");
    }
  }, [
    reviewOutput,
    submissionId,
    reviewMeta.projectName,
    reviewMeta.contractor,
    dashboardStatus,
    calculatedScore,
    reviewerCloseoutComments,
    uploadedDocumentNames,
    uploadedSupportingNames,
    findingRegister,
    closeOutProgress,
    reviewVersions,
    reviewHistory,
    scoringMethod,
    structuredRatings,
    structuredBand,
    structuredDecision,
    structuredRiskExposure,
    structuredResidualRisk,
    structuredControlEffectiveness,
  ]);

  const severityBadge = (severity: Severity) => {
    if (severity === "Critical")
      return "bg-red-100 text-red-700 border-red-200";
    if (severity === "Major")
      return "bg-orange-100 text-orange-700 border-orange-200";
    if (severity === "Minor")
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  if (showLanding) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B3D2E] p-6 text-white">
        <section className="w-full max-w-3xl rounded-[2rem] bg-[#0B3D2E] p-10 text-center">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-3xl font-black text-[#0B3D2E]">
            AI
          </div>
          <h1 className="text-6xl font-black tracking-tight">RAMS.AI</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/75">
            Professional RAMS review support for construction submissions,
            close-out tracking and competent person decision-making.
          </p>
          <button
            onClick={() => setShowLanding(false)}
            className="mt-10 rounded-2xl bg-white px-12 py-4 text-lg font-black text-[#0B3D2E] shadow-xl transition hover:bg-[#EAF4EE]"
          >
            Enter
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F8F7] text-[#111827]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 bg-[#0B3D2E] text-white xl:block">
          <div className="flex h-full flex-col p-6">
            <div className="mb-8">
              <div className="text-2xl font-black">RAMS.AI</div>
              <div className="mt-1 text-sm text-white/70">Review Dashboard</div>
            </div>

            <nav className="space-y-2 text-sm">
              <div className="rounded-xl bg-[#1F6B50] px-4 py-3 font-semibold text-white shadow-lg">
                Dashboard
              </div>
              <a
                href="/submissions"
                className="block rounded-xl px-4 py-3 font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                Submissions
              </a>
            </nav>

            <div className="mt-auto border-t border-white/10 pt-6 text-sm">
              <div className="mb-4 font-black">Review Details</div>
              <div className="space-y-4 text-white/75">
                <div>
                  <div className="text-white/40">Submission ID</div>
                  <div>{submissionId}</div>
                </div>
                <div>
                  <div className="text-white/40">Project</div>
                  <div>{reviewMeta.projectName}</div>
                </div>
                <div>
                  <div className="text-white/40">Contractor</div>
                  <div>{reviewMeta.contractor}</div>
                </div>
                <div>
                  <div className="text-white/40">Reviewed By</div>
                  <div>{reviewerName || "RAMS.AI"}</div>
                </div>
              </div>

              {reviewOutput && !reviewOutput.startsWith("Error:") && (
                <button
                  onClick={downloadPdf}
                  className="mt-8 w-full rounded-xl border border-white/20 px-4 py-3 font-black text-white"
                >
                  Download Report
                </button>
              )}
            </div>
          </div>
        </aside>

        <section className="flex-1 p-6 lg:p-8">
          <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#111827]">
                RAMS Review Summary
              </h1>
              <p className="mt-2 text-sm text-[#4B5563]">
                Submission ID: {submissionId}
              </p>
            </div>
            <div className="text-sm font-semibold text-[#374151]">
              20 May 2026
            </div>
          </header>

          {requestError && (
            <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-white p-6 text-red-700 shadow-sm">
              {requestError}
            </div>
          )}

          {!reviewOutput && (
            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <div className="rounded-2xl border border-[#D6E2DA] bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-black text-[#0B3D2E]">
                  Project Details
                </h2>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Reviewer Name</label>
                    <input
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Country</label>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Detailed Description of Works
                    </label>
                    <input
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <h2 className="mb-6 mt-8 text-xl font-black text-[#0B3D2E]">
                  Risk Context
                </h2>
                <div className="grid gap-5 md:grid-cols-2">
                  {riskContextItems.map((item) => (
                    <div key={item.label}>
                      <label className={labelClass}>{item.label}</label>
                      <div className="flex gap-2">
                        {["Yes", "No"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => item.setter(option)}
                            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                              item.value === option
                                ? "border-[#145A41] bg-[#145A41] text-white"
                                : "border-[#D6E2DA] bg-white text-[#0B3D2E]"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-[#0B3D2E] p-6 text-white shadow-xl">
                <h2 className="mb-6 text-xl font-black">Upload Documents</h2>

                <div className="space-y-4">
                  <label className="block cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-7 text-center">
                    <span className="block font-semibold">
                      Upload RAMS / Method Statements / Plans
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setReviewFiles(files);
                        setUploadedDocumentNames(
                          files.map((file) => file.name),
                        );
                      }}
                    />
                  </label>

                  {reviewFiles.map((file, index) => (
                    <div key={index} className="text-sm text-white/70">
                      - {file.name}
                    </div>
                  ))}

                  <label className="block cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-7 text-center">
                    <span className="block font-semibold">
                      Upload Client / Site Requirements
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setSupportingFiles(files);
                        setUploadedSupportingNames(
                          files.map((file) => file.name),
                        );
                      }}
                    />
                  </label>

                  {supportingFiles.map((file, index) => (
                    <div key={index} className="text-sm text-white/70">
                      - {file.name}
                    </div>
                  ))}

                  <textarea
                    placeholder="Reviewer notes / expectations..."
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    className={`${darkInputClass} min-h-[130px]`}
                  />

                  <button
                    onClick={runReview}
                    disabled={loading}
                    className="w-full rounded-xl bg-[#1F6B50] px-8 py-4 text-lg font-black text-white disabled:opacity-60"
                  >
                    {loading ? "Running review..." : "Run Review"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {reviewOutput && reviewOutput.startsWith("Error:") && (
            <div className="rounded-2xl bg-white p-6 text-red-700 shadow-sm">
              {reviewOutput}
            </div>
          )}

          {reviewOutput && !reviewOutput.startsWith("Error:") && (
            <div className="space-y-5">
              <section className="rounded-2xl border border-orange-300 bg-orange-50 p-6 shadow-sm">
                <div className="grid gap-6 lg:grid-cols-[1fr_0.35fr_0.35fr] lg:items-center">
                  <div className="flex gap-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-5xl font-black text-white">
                      !
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#374151]">
                        Overall Status
                      </p>
                      <h2 className="mt-2 text-3xl font-black text-orange-600">
                        {dashboardStatus}
                      </h2>
                      <p className="mt-1 text-sm text-[#374151]">
                        {dashboardStatus === "READY FOR APPROVER REVIEW"
                          ? "No material findings remain open. Competent approver review is still required."
                          : "Further close-out is required before this submission can progress."}
                      </p>
                    </div>
                  </div>

                  <div className="border-l border-orange-200 pl-6 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#374151]">
                      Overall Score
                    </p>
                    <div className="mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-orange-300 bg-white">
                      <div>
                        <div className="text-2xl font-black text-orange-600">
                          {calculatedScore}%
                        </div>
                        <div className="text-xs text-orange-500">{scoreLabel}</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-l border-orange-200 pl-6">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#374151]">
                      Review Outcome
                    </p>
                    <h3 className="mt-3 text-2xl font-black text-orange-600">
                      {(dashboardStatus === "OK TO PROCEED" || dashboardStatus === "READY FOR APPROVER REVIEW")
                        ? "Ready for Approver Review"
                        : dashboardStatus === "MINOR AMENDMENTS REQUIRED"
                          ? "Minor Close-Out Required"
                          : reviewMeta.outcome}
                    </h3>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                  <div className="text-xs font-black uppercase text-[#6B7280]">Original Findings</div>
                  <div className="mt-2 text-3xl font-black text-[#111827]">{originalFindingsCount}</div>
                </div>
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                  <div className="text-xs font-black uppercase text-[#6B7280]">Closed Findings</div>
                  <div className="mt-2 text-3xl font-black text-green-600">{closedFindings.length}</div>
                </div>
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                  <div className="text-xs font-black uppercase text-[#6B7280]">Open Findings</div>
                  <div className="mt-2 text-3xl font-black text-orange-600">{activeFindings.length}</div>
                </div>
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                  <div className="text-xs font-black uppercase text-[#6B7280]">Close-Out Progress</div>
                  <div className="mt-2 text-3xl font-black text-[#0B3D2E]">{closeOutProgress}%</div>
                </div>
              </section>

              <section className="grid gap-5 xl:grid-cols-[0.95fr_1.25fr]">
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                  <h3 className="mb-5 text-sm font-black uppercase text-[#111827]">
                    Compliance Breakdown
                  </h3>
                  <div className="space-y-4">
                    {complianceBreakdown.map(([label, value]) => (
                      <div key={label as string}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{label}</span>
                          <span className="font-black">{value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200">
                          <div
                            className={`h-2 rounded-full ${
                              Number(value) < 50
                                ? "bg-red-500"
                                : Number(value) < 75
                                  ? "bg-orange-400"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-between border-t pt-4 font-black">
                    <span>Average Compliance</span>
                    <span className="text-orange-600">{calculatedScore}%</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                  <h3 className="mb-5 text-sm font-black uppercase text-[#111827]">
                    Risk Summary
                  </h3>

                  <div className="grid gap-8 md:grid-cols-[0.8fr_1fr] md:items-center">
                    <div className="flex items-center justify-center">
                      <div
                        className="flex h-44 w-44 items-center justify-center rounded-full"
                        style={{ background: riskChartBackground }}
                      >
                        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                          <div className="text-3xl font-black">
                            {totalFindings}
                          </div>
                          <div className="text-xs">Open Findings</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-red-500" />{" "}
                          Critical
                        </span>
                        <b>{criticalCount}</b>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-orange-500" />{" "}
                          Major
                        </span>
                        <b>{majorCount}</b>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-yellow-500" />{" "}
                          Minor
                        </span>
                        <b>{minorCount}</b>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-blue-500" />{" "}
                          Observations
                        </span>
                        <b>{observationCount}</b>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5 border-t pt-5">
                    <div className="grid gap-4 md:grid-cols-[0.38fr_1fr] md:items-center">
                      <div
                        className={`mx-auto flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 text-center font-black ${riskToneClass(inherentRiskLevel)}`}
                      >
                        <span
                          className={`mb-2 h-4 w-4 rounded-full ${riskDotClass(inherentRiskLevel)}`}
                        />
                        <span className="text-lg leading-none">
                          {inherentRiskLevel}
                        </span>
                        <span className="mt-1 text-[10px] uppercase tracking-wide">
                          Exposure
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-black uppercase text-[#111827]">
                          Risk Exposure
                        </div>
                        <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                          Inherent activity risk before contractor controls are
                          considered.
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                          {inherentRiskDescription}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 border-t border-[#E5E7EB] pt-5 md:grid-cols-[0.38fr_1fr] md:items-center">
                      <div
                        className={`mx-auto flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 text-center font-black ${riskToneClass(residualRiskLevel)}`}
                      >
                        <span
                          className={`mb-2 h-4 w-4 rounded-full ${riskDotClass(residualRiskLevel)}`}
                        />
                        <span className="text-lg leading-none">
                          {residualRiskLevel}
                        </span>
                        <span className="mt-1 text-[10px] uppercase tracking-wide">
                          Residual
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-black uppercase text-[#111827]">
                          Residual Risk After Controls
                        </div>
                        <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                          Remaining risk based on the control measures stated in
                          the submitted RAMS.
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                          {residualRiskDescription}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-black uppercase text-[#111827]">
                          Control Effectiveness
                        </span>
                        <span className="text-lg font-black text-[#0B3D2E]">
                          {controlEffectiveness}%
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-gray-200">
                        <div
                          className={`h-3 rounded-full ${
                            controlEffectiveness < 50
                              ? "bg-red-500"
                              : controlEffectiveness < 75
                                ? "bg-orange-400"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${controlEffectiveness}%` }}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#6B7280]">
                          Evidence Quality
                        </span>
                        <span className="font-black text-[#111827]">
                          {evidenceQualityLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                  <h3 className="mb-5 text-sm font-black uppercase">
                    Critical Findings (Requiring Immediate Attention)
                  </h3>
                  <div className="space-y-4">
                    {criticalFindings.length === 0 && (
                      <div className="text-sm text-[#6B7280]">No open critical findings.</div>
                    )}
                    {criticalFindings.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white">
                            !
                          </span>
                          <span className="text-sm">{item.finding}</span>
                        </div>
                        <span className="rounded-md border border-red-300 bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                          Critical
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                  <h3 className="mb-5 text-sm font-black uppercase">
                    AI Review Summary
                  </h3>
                  <p className="text-base leading-7 text-[#374151]">
                    {reviewMeta.summary}
                  </p>
                  <button
                    onClick={() => setShowFullAiReview((current) => !current)}
                    className="mt-6 text-sm font-black text-blue-600"
                  >
                    {showFullAiReview
                      ? "Hide full AI review"
                      : "View full AI review ›"}
                  </button>
                </div>
              </section>

              {showFullAiReview && (
                <section className="rounded-2xl border border-[#D6E2DA] bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase text-[#111827]">
                      Full AI Review Output
                    </h3>
                    <button
                      onClick={() => setShowFullAiReview(false)}
                      className="rounded-lg border border-[#D6E2DA] px-4 py-2 text-sm font-black text-[#0B3D2E]"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-[520px] overflow-y-auto rounded-xl border border-[#E5E7EB] bg-[#F6F8F7] p-5 text-sm leading-7 text-[#111827]">
                    <pre className="whitespace-pre-wrap font-sans">
                      {formatReviewOutput(reviewOutput)}
                    </pre>
                  </div>
                </section>
              )}

              <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-sm font-black uppercase">
                    Detailed Findings
                  </h3>
                  <button
                    onClick={() => setShowClosedFindings((current) => !current)}
                    className="rounded-lg border border-[#D6E2DA] px-4 py-2 text-xs font-black text-[#0B3D2E]"
                  >
                    {showClosedFindings
                      ? "Hide Closed Findings"
                      : "Show Closed Findings"}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[1250px] w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-[#6B7280]">
                      <tr>
                        <th className="p-3">Ref</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Finding</th>
                        <th className="p-3">Severity</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Action Required</th>
                        <th className="p-3">Closed On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedFindings.map((finding) => (
                        <tr key={finding.ref} className="border-t">
                          <td className="p-3">{finding.ref}</td>
                          <td className="p-3">{finding.category}</td>
                          <td className="p-3">{finding.finding}</td>
                          <td className="p-3">
                            <span
                              className={`rounded-md border px-3 py-1 text-xs font-black ${severityBadge(finding.severity)}`}
                            >
                              {finding.severity}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`rounded-md border px-3 py-1 text-xs font-black ${
                                finding.status === "Closed"
                                  ? "border-green-300 bg-green-50 text-green-700"
                                  : "border-blue-300 bg-blue-50 text-blue-700"
                              }`}
                            >
                              {finding.status}
                            </span>
                          </td>
                          <td className="p-3">{finding.action}</td>
                          <td className="p-3">{finding.status === "Closed" ? finding.dateClosed || "Closed" : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="grid gap-5 xl:grid-cols-[1fr_0.6fr_0.5fr]">
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                  <h3 className="mb-5 text-sm font-black uppercase">
                    Evidence & Quality Indicators
                  </h3>
                  <div className="grid gap-4 text-center sm:grid-cols-2 lg:grid-cols-5">
                    {qualityIndicators.map((item) => {
                      const toneClass =
                        item.tone === "red"
                          ? "border-red-300 bg-red-50 text-red-700"
                          : item.tone === "orange"
                            ? "border-orange-300 bg-orange-50 text-orange-700"
                            : "border-green-300 bg-green-50 text-green-700";

                      return (
                        <div
                          key={item.label}
                          className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-4"
                        >
                          <div
                            className={`mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 px-2 text-center text-xs font-black leading-tight ${toneClass}`}
                          >
                            {item.value}
                          </div>
                          <div className="min-h-[32px] text-xs font-black leading-4">
                            {item.label}
                          </div>
                          <div className="mt-1 text-xs text-[#6B7280]">
                            {item.sub}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                  <h3 className="mb-5 text-sm font-black uppercase">
                    Attached Documents
                  </h3>
                  <div className="space-y-3 text-sm">
                    {[...new Set([
                      ...uploadedDocumentNames,
                      ...uploadedSupportingNames,
                      ...reviewFiles.map((file) => file.name),
                      ...supportingFiles.map((file) => file.name),
                      ...additionalReviewFiles.map((file) => file.name),
                      ...additionalSupportingFiles.map((file) => file.name),
                    ])].length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[#D6E2DA] bg-[#F6F8F7] p-4 text-sm text-[#6B7280]">
                        No attached document names recorded for this review.
                      </div>
                    ) : (
                      [...new Set([
                        ...uploadedDocumentNames,
                        ...uploadedSupportingNames,
                        ...reviewFiles.map((file) => file.name),
                        ...supportingFiles.map((file) => file.name),
                        ...additionalReviewFiles.map((file) => file.name),
                        ...additionalSupportingFiles.map((file) => file.name),
                      ])].map((name, index) => (
                        <div key={`${name}-${index}`} className="flex justify-between gap-4">
                          <span className="break-all">📄 {name}</span>
                          <span className="shrink-0 text-[#6B7280]">Recorded</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                  <h3 className="mb-5 text-sm font-black uppercase">
                    Review Timeline
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div>✅ Submission Received</div>
                    <div>✅ AI Analysis Completed</div>
                    {reviewHistory.map((entry) => <div key={entry}>{entry}</div>)}
                    <div className="font-black text-blue-600">● Current review: {calculatedScore}% — {dashboardStatus}</div>
                    {reviewVersions.map((version, index) => (
                      <details key={`${version.recordedAt}-${index}`} className="rounded-xl border border-[#D6E2DA] p-3">
                        <summary className="cursor-pointer font-semibold">
                          Review {version.reviewNumber} — {version.score}% — {version.decision}
                        </summary>
                        <p className="mt-3">Project: {version.projectName} · Contractor: {version.contractorName}</p>
                        <p className="mt-3">Evidence: {[...version.uploadedDocuments, ...version.uploadedSupportingDocuments].join(", ") || "No document names recorded"}</p>
                        <p className="mt-2">Reviewer comments: {version.reviewerComments || "None recorded"}</p>
                        <ul className="mt-2 space-y-1">
                          {version.findings.map((finding) => <li key={finding.ref}>{finding.ref}: {finding.severity} / {finding.status} — {finding.finding}</li>)}
                        </ul>
                        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap font-sans">{formatReviewOutput(version.reviewText)}</pre>
                      </details>
                    ))}
                  </div>
                </div>
              </section>

              <section
                className={`flex items-center justify-between rounded-2xl border p-5 ${(dashboardStatus === "OK TO PROCEED" || dashboardStatus === "READY FOR APPROVER REVIEW") ? "border-green-300 bg-green-50" : dashboardStatus === "MINOR AMENDMENTS REQUIRED" ? "border-yellow-300 bg-yellow-50" : "border-orange-300 bg-orange-50"}`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xl font-black text-white ${(dashboardStatus === "OK TO PROCEED" || dashboardStatus === "READY FOR APPROVER REVIEW") ? "bg-green-500" : dashboardStatus === "MINOR AMENDMENTS REQUIRED" ? "bg-yellow-500" : "bg-orange-500"}`}
                  >
                    {(dashboardStatus === "OK TO PROCEED" || dashboardStatus === "READY FOR APPROVER REVIEW") ? "✓" : "!"}
                  </span>
                  <div>
                    <div
                      className={`text-lg font-black uppercase ${(dashboardStatus === "OK TO PROCEED" || dashboardStatus === "READY FOR APPROVER REVIEW") ? "text-green-700" : dashboardStatus === "MINOR AMENDMENTS REQUIRED" ? "text-yellow-700" : "text-orange-600"}`}
                    >
                      {dashboardStatus}
                    </div>
                    <p className="text-sm text-[#374151]">
                      {(dashboardStatus === "OK TO PROCEED" || dashboardStatus === "READY FOR APPROVER REVIEW")
                        ? "No critical or major findings remain open. Competent person close-out is still required."
                        : dashboardStatus === "MINOR AMENDMENTS REQUIRED"
                          ? "Only minor close-out items remain active."
                          : "Please address the open critical and major findings to progress this submission."}
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-2xl bg-[#0B3D2E] p-6 text-white shadow-xl">
                  <h2 className="mb-4 text-xl font-black">
                    Reviewer Comments / Close-Out
                  </h2>

                  <textarea
                    value={reviewerCloseoutComments}
                    onChange={(e) =>
                      setReviewerCloseoutComments(e.target.value)
                    }
                    placeholder="Add close-out notes, evidence provided, contractor clarifications, closed items, remaining actions, or final reviewer position..."
                    className="min-h-[180px] w-full rounded-xl border border-white/10 bg-[#083326] p-4 text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
                  />

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="block cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm font-semibold">
                      Add revised RAMS / evidence
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) =>
                          setAdditionalReviewFiles(
                            Array.from(e.target.files || []),
                          )
                        }
                      />
                    </label>
                    <label className="block cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm font-semibold">
                      Add SOPs / permits / policies
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) =>
                          setAdditionalSupportingFiles(
                            Array.from(e.target.files || []),
                          )
                        }
                      />
                    </label>
                  </div>

                  {(additionalReviewFiles.length > 0 ||
                    additionalSupportingFiles.length > 0) && (
                    <div className="mt-3 space-y-1 text-xs text-white/70">
                      {[
                        ...additionalReviewFiles,
                        ...additionalSupportingFiles,
                      ].map((file, index) => (
                        <div key={index}>- {file.name}</div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={reassessReview}
                    disabled={
                      reassessingReview ||
                      (!reviewerCloseoutComments.trim() &&
                        additionalReviewFiles.length === 0 &&
                        additionalSupportingFiles.length === 0)
                    }
                    className="mt-4 w-full rounded-xl bg-[#1F6B50] px-8 py-4 font-black text-white transition hover:bg-[#267c5e] disabled:opacity-60"
                  >
                    {reassessingReview
                      ? "Reassessing Submission..."
                      : "Reassess Submission"}
                  </button>

                  <p className="mt-3 text-xs leading-5 text-white/60">
                    Add reviewer comments and/or further contractor evidence.
                    RAMS.AI will reassess open findings, close or downgrade
                    resolved items, recalculate the score, and update the
                    residual risk and outcome.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#0B3D2E] p-6 text-white shadow-xl">
                  <h2 className="mb-4 text-xl font-black">Contractor Email</h2>

                  <div className="space-y-3">
                    <input
                      value={contractorName}
                      onChange={(e) => setContractorName(e.target.value)}
                      placeholder="Contractor name"
                      className="w-full rounded-xl border border-white/10 bg-[#083326] p-4 text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
                    />

                    <input
                      value={contractorEmail}
                      onChange={(e) => setContractorEmail(e.target.value)}
                      placeholder="contractor@example.com"
                      className="w-full rounded-xl border border-white/10 bg-[#083326] p-4 text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
                    />

                    <button
                      onClick={generateContractorEmail}
                      disabled={
                        generatingEmail || !reviewerCloseoutComments.trim()
                      }
                      className="w-full rounded-xl bg-[#1F6B50] px-8 py-4 font-black text-white transition hover:bg-[#267c5e] disabled:opacity-60"
                    >
                      {generatingEmail
                        ? "Generating Email..."
                        : "Generate Contractor Email"}
                    </button>
                  </div>
                </div>
              </section>

              {generatedEmailBody && (
                <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                  <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-black text-[#111827]">
                      Contractor Email Draft
                    </h2>

                    <button
                      onClick={copyEmailDraft}
                      className="rounded-lg bg-[#0B3D2E] px-5 py-3 font-black text-white"
                    >
                      {emailCopied ? "Copied" : "Copy Email Draft"}
                    </button>
                  </div>

                  <div className="mb-4 rounded-xl border border-[#E5E7EB] bg-[#F6F8F7] p-4">
                    <p className="mb-1 text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">
                      Subject
                    </p>
                    <p className="font-semibold text-[#111827]">
                      {generatedEmailSubject}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#E5E7EB] bg-[#F6F8F7] p-4">
                    <p className="mb-1 text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">
                      Body
                    </p>
                    <div className="whitespace-pre-wrap text-sm leading-6 text-[#111827]">
                      {generatedEmailBody}
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </section>
      </div>

      {(loading || downloadingPdf || generatingEmail || reassessingReview) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-[#0B3D2E] px-8 py-6 text-center text-white shadow-xl">
            <p className="text-lg font-black">
              {loading
                ? "Running Review"
                : downloadingPdf
                  ? "Generating PDF"
                  : generatingEmail
                    ? "Generating Contractor Email"
                    : "Reassessing Review"}
            </p>
            <p className="mt-2 text-sm text-white/70">Please wait...</p>
          </div>
        </div>
      )}
    </main>
  );
}