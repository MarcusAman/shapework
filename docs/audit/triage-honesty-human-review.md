# Triage Honesty and Human Review Audit Report

## 1. Scope & Audited Files
* [`server/headless/aiTriage.ts`](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/aiTriage.ts)

---

## 2. Findings and Verification

### A. Labeling Honesty
* **Service Classification**: Verified. The system classifies incoming text signals using keyword-matching heuristics (`triageMethod: 'heuristic_rules'`).
* **AI Claims Avoidance**: The backend code and user interface explicitly characterize classification results as recommendations rather than definitive decisions. The system alerts developers that local LLM libraries are not utilized in standard triage.

### B. Confidence Scoring & Human Intervention
* **High Confidence Rules**: Matches legal words (e.g. `lawsuit`, `dispute`) at 96% confidence or disclosures at 91% confidence.
* **Low Confidence Default**: If no keyword matches, it returns a 45% confidence score, marks `requiresHumanReview: true`, and assigns the item to the triage queue.
* **Human-in-the-loop Gate**: Work items flagged with `requiresHumanReview` require manual queue assignment and validation before any notifications are sent or webhooks dispatched.

---

## 3. Remaining Risks
* Spammers might write long messages that bypass keyword matches. However, the default fallback is always safe-to-human review, preventing misrouting.
