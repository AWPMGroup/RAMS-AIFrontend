export type Severity = "Critical" | "Major" | "Minor" | "Observation";
export type ReassessmentFinding = {
  ref: string;
  category: string;
  finding: string;
  severity: Severity;
  status: "Open" | "Closed";
  action: string;
  sourceRefs?: string[];
  originalSeverity?: Severity;
  dateRaised?: string;
  dateClosed?: string;
  createdReview?: string;
  closedReview?: string;
  evidenceUsed?: string;
  aiReasoning?: string;
};

export type ReviewSnapshot = {
  reviewNumber: number;
  recordedAt: string;
  projectName: string;
  contractorName: string;
  reviewText: string;
  score: number;
  band: string;
  decision: string;
  riskExposure: string;
  residualRisk: string;
  controlEffectiveness: number;
  ratings: Record<string, string>;
  findings: ReassessmentFinding[];
  uploadedDocuments: string[];
  uploadedSupportingDocuments: string[];
  reviewerComments: string;
  scoringMethod: string;
};

type StructuredReassessment = {
  schema_version: 1;
  scoring_method: "reassessment-v1";
  review_text: string;
  score: number;
  band: string;
  decision: string;
  risk_exposure: string;
  residual_risk: string;
  control_effectiveness: number;
  findings: ReassessmentFinding[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEnum(value: unknown, allowed: readonly string[]): value is string {
  return typeof value === "string" && allowed.includes(value);
}

function isFinding(value: unknown): value is ReassessmentFinding {
  if (!isRecord(value)) return false;
  if (!["ref", "category", "finding", "action"].every((key) => typeof value[key] === "string" && value[key].trim())) return false;
  if (!isEnum(value.severity, ["Critical", "Major", "Minor", "Observation"])) return false;
  if (value.status !== "Open" && value.status !== "Closed") return false;
  if (value.sourceRefs !== undefined && (!Array.isArray(value.sourceRefs) || !value.sourceRefs.every((ref) => typeof ref === "string"))) return false;
  return ["dateRaised", "dateClosed", "createdReview", "closedReview", "evidenceUsed", "aiReasoning"].every((key) => value[key] === undefined || typeof value[key] === "string");
}

export function parseReassessment(value: unknown, previousFindings: ReassessmentFinding[]): StructuredReassessment {
  const invalid = () => new Error("The reassessment response is incomplete. Your previous review has been preserved; retry the reassessment.");
  if (!isRecord(value) || value.schema_version !== 1 || value.scoring_method !== "reassessment-v1") throw invalid();
  if (typeof value.review_text !== "string" || !value.review_text.trim()) throw invalid();
  if (typeof value.score !== "number" || !Number.isInteger(value.score) || value.score < 20 || value.score > 96) throw invalid();
  if (value.control_effectiveness !== value.score) throw invalid();
  if (!isEnum(value.band, ["Excellent", "Good", "Fair", "Poor", "Critical"])) throw invalid();
  if (!isEnum(value.decision, ["Ready for Approver Review", "Minor Amendments Required", "Further Amendments Required"])) throw invalid();
  if (!isEnum(value.risk_exposure, ["HIGH", "MEDIUM", "LOW"]) || !isEnum(value.residual_risk, ["HIGH", "MEDIUM", "LOW"])) throw invalid();
  if (!Array.isArray(value.findings) || !value.findings.every(isFinding)) throw invalid();
  const refs = value.findings.map((finding) => finding.ref);
  if (new Set(refs).size !== refs.length) throw invalid();
  for (const previous of previousFindings) {
    const covering = value.findings.filter((finding) => finding.ref === previous.ref || finding.sourceRefs?.includes(previous.ref));
    if (covering.length !== 1) throw invalid();
  }
  return value as StructuredReassessment;
}
