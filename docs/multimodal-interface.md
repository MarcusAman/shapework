# shapework. Multimodal Interface Specification

## Overview
shapework. supports robust multimodal inputs to accommodate the dynamic, on-the-go nature of real estate operations. Users can submit text commands, record voice dictations, upload PDFs, and submit screenshots or images of contracts or dashboards.

---

## Processing States & Language
To maintain trust, the application never uses vague terms like "Working magic..." or "Thinking...". Instead, we display explicit, operational language for each stage of multimodal ingestion:

### Ingestion Stages
1. **Uploading**: Large files (e.g., contract PDFs or audio recordings) are streamed.
2. **Processing**: Demarcating segments, running OCR, or splitting audio tracks.
3. **Matching**: Linking the uploaded asset to a known Agent, Coordinator, or active Transaction.
4. **Classifying**: Discerning the exact intent (e.g., "This is an Appraisal Waiver").
5. **Extracting**: Pulling dates, price agreements, or required signatures.
6. **Awaiting Review**: Presenting the matched elements to the operator for human-in-the-loop validation.

---

## Multi-input Controls
* **Voice Note Waveform**: Animated visual indicator during speech capture with instant transcription previews.
* **Dropzones**: Elegant drag-and-drop file regions on desktop supporting quick uploads of PDF, JPEG, and PNG files.
* **Camera Capture**: Integrated mobile layouts prompting quick uploads of scanned paperwork directly from active deal checklists.
