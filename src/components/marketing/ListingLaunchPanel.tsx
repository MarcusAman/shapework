/**
 * Listing Launch v1 — additive Ask Nora panel (Feature Lab cut).
 * DROP-IN SKETCH: verify NestOpsHub import paths / create-request API on Mac before merge.
 *
 * Hard rules:
 * - Uses SAME marketing intake spine (Melissa → Eduardo/Maxa). No parallel board.
 * - suppressOutboundEmail / skipPhotoRequestEmail — ZERO outbound mail from this path.
 * - Do NOT flip global OUTBOUND_MASTER_MODE.
 */
import React, { useMemo, useState } from 'react';
import {
  buildListingLaunchIntakePayload,
  type ListingLaunchMinFields,
  type ListingLaunchOffice,
} from '../../lib/listingLaunchSop';

const FOREST = '#01362D';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Existing marketing create path — MUST honor suppressOutboundEmail flags */
  onCreateIntake: (payload: ReturnType<typeof buildListingLaunchIntakePayload>) => Promise<{
    ok: boolean;
    taskId?: string;
    requestId?: string;
    error?: string;
  }>;
  defaultOffice?: ListingLaunchOffice;
};

const empty: ListingLaunchMinFields = {
  propertyAddress: '',
  listingAgentName: '',
  listingAgentEmail: '',
  office: 'Wilmington',
  targetGoLiveDate: '',
  mlsNumber: '',
  notes: '',
};

export function ListingLaunchPanel({
  open,
  onClose,
  onCreateIntake,
  defaultOffice = 'Wilmington',
}: Props) {
  const [fields, setFields] = useState<ListingLaunchMinFields>({
    ...empty,
    office: defaultOffice,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const canSubmit = useMemo(
    () =>
      fields.propertyAddress.trim().length > 3 &&
      fields.listingAgentName.trim().length > 1 &&
      !submitting,
    [fields, submitting],
  );

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setSuccessId(null);
    try {
      const payload = buildListingLaunchIntakePayload({
        ...fields,
        propertyAddress: fields.propertyAddress.trim(),
        listingAgentName: fields.listingAgentName.trim(),
        listingAgentEmail: fields.listingAgentEmail?.trim() || undefined,
        mlsNumber: fields.mlsNumber?.trim() || undefined,
        notes: fields.notes?.trim() || undefined,
        targetGoLiveDate: fields.targetGoLiveDate || undefined,
      });
      // Explicit local gate (belt + suspenders)
      if (!payload.suppressOutboundEmail || !payload.skipPhotoRequestEmail) {
        throw new Error('Listing Launch email gate failed — aborting create');
      }
      const res = await onCreateIntake(payload);
      if (!res.ok) throw new Error(res.error || 'Create failed');
      setSuccessId(res.taskId || res.requestId || 'created');
      setFields({ ...empty, office: defaultOffice });
    } catch (err: any) {
      setError(err?.message || 'Could not start listing launch');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Listing Launch"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(1,54,45,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <form
        onClick={(ev) => ev.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: 'min(520px, 100%)',
          background: '#fff',
          borderRadius: 12,
          border: `1px solid ${FOREST}22`,
          boxShadow: '0 18px 50px rgba(0,0,0,0.18)',
          padding: 20,
          fontFamily: 'system-ui, sans-serif',
          color: FOREST,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Listing Launch</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              Creates a marketing task for Melissa review → Eduardo/Maxa. Draft package only — no
              outbound email.
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={btnGhost}>
            ✕
          </button>
        </div>

        <label style={label}>
          Property address *
          <input
            required
            value={fields.propertyAddress}
            onChange={(e) => setFields((f) => ({ ...f, propertyAddress: e.target.value }))}
            style={input}
            placeholder="123 Main St, Wilmington, NC"
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={label}>
            Listing agent *
            <input
              required
              value={fields.listingAgentName}
              onChange={(e) => setFields((f) => ({ ...f, listingAgentName: e.target.value }))}
              style={input}
            />
          </label>
          <label style={label}>
            Agent email
            <input
              type="email"
              value={fields.listingAgentEmail || ''}
              onChange={(e) => setFields((f) => ({ ...f, listingAgentEmail: e.target.value }))}
              style={input}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <label style={label}>
            Office
            <select
              value={fields.office}
              onChange={(e) =>
                setFields((f) => ({ ...f, office: e.target.value as ListingLaunchOffice }))
              }
              style={input}
            >
              <option value="Wilmington">Wilmington</option>
              <option value="CB">CB</option>
            </select>
          </label>
          <label style={label}>
            Target go-live
            <input
              type="date"
              value={fields.targetGoLiveDate || ''}
              onChange={(e) => setFields((f) => ({ ...f, targetGoLiveDate: e.target.value }))}
              style={input}
            />
          </label>
          <label style={label}>
            MLS #
            <input
              value={fields.mlsNumber || ''}
              onChange={(e) => setFields((f) => ({ ...f, mlsNumber: e.target.value }))}
              style={input}
            />
          </label>
        </div>

        <label style={label}>
          Notes
          <textarea
            value={fields.notes || ''}
            onChange={(e) => setFields((f) => ({ ...f, notes: e.target.value }))}
            style={{ ...input, minHeight: 72 }}
          />
        </label>

        {error && (
          <div style={{ color: '#9b1c1c', fontSize: 13, marginTop: 8 }} role="alert">
            {error}
          </div>
        )}
        {successId && (
          <div style={{ color: FOREST, fontSize: 13, marginTop: 8 }}>
            Listing launch task created ({successId}). Open it from Tasks — no email was sent.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={btnGhost}>
            Cancel
          </button>
          <button type="submit" disabled={!canSubmit} style={btnPrimary}>
            {submitting ? 'Starting…' : 'Start listing'}
          </button>
        </div>
      </form>
    </div>
  );
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  marginTop: 12,
};
const input: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 4,
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
  boxSizing: 'border-box',
};
const btnGhost: React.CSSProperties = {
  border: '1px solid #d1d5db',
  background: '#fff',
  borderRadius: 8,
  padding: '8px 12px',
  cursor: 'pointer',
  color: FOREST,
};
const btnPrimary: React.CSSProperties = {
  border: 'none',
  background: FOREST,
  color: '#fff',
  borderRadius: 8,
  padding: '8px 14px',
  cursor: 'pointer',
  fontWeight: 600,
};

export default ListingLaunchPanel;
