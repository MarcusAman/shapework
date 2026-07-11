# .shapework. Multimodal UI Specifications
*Last Updated: June 2026*

## Drag-and-Drop & Pasted Inputs
Real estate operations thrive on unstructured inputs: forwarded email threads, smartphone camera photos of appraisal notices, and scanned PDF packages. `.shapework.` processes these through an elegant, high-fidelity multimodal engine.

---

## File Upload Visual Lifecycle

### 1. Idle & Hover States
* **Visual Presentation**: Soft dashed border using `--color-border-strong` on canvas. 
* **Interaction**: Hovering a file over the region triggers an accent background overlay (`--color-brand-green-soft`) and morphs the cursor state into a drop pointer.

### 2. Sourcing & Processing Progress
Avoid vague "Thinking..." copy. The upload loader shows real progress and identifies the active analytical model:
* **Upload Stage**: "Uploading appraisal document (4.2 MB)..." with a real percentage bar.
* **Extraction Stage**: "Extracting contract details & signature fields using Document-Model-V2..."
* **Association Stage**: "Matching this document with 102 Pine Street Escrow file..."

### 3. Verification & Corrections
Once processed, show extracted metadata inside a correction interface side-by-side with a small preview of the document.
* Extracted field boxes allow the user to click, edit, and confirm.
* Highlight low-confidence extractions using `--color-status-attention` outlines.
