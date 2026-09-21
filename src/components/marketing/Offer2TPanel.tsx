/**
 * Offer / Form 2-T v1 — additive Ask Nora panel (buyer/offer family).
 * Twin of ListingLaunchPanel. DROP-IN: verify NestOpsHub import paths on Mac.
 *
 * Hard rules:
 * - POST /api/marketing/canonical-requests with domain+category=offer_2t
 * - suppressOutboundEmail — ZERO outbound mail from this path
 * - Do NOT flip global OUTBOUND_MASTER_MODE
 * - Do NOT break Ask Nora chat, marketing/ops Tasks, or Listing Launch
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  buildOffer2TIntakePayload,
  type Offer2TMinFields,
  type Offer2TOffice,
} from '../../lib/offer2tSop';

const FOREST = '#01362D';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Canonical create path — MUST honor suppressOutboundEmail flags */
  onCreateIntake: (payload: ReturnType<typeof buildOffer2TIntakePayload>) => Promise<{
    ok: boolean;
    taskId?: string;
    requestId?: string;
    outboundSkipped?: boolean;
    error?: string;
  }>;
  onCreated?: (
    result: { ok: boolean; taskId?: string; requestId?: string; outboundSkipped?: boolean },
    payload: ReturnType<typeof buildOffer2TIntakePayload>
  ) => void;
  defaultOffice?: Offer2TOffice;
  /** Chat → 2-T prefill (partial). Merged over empty + defaultOffice when panel opens. */
  initialFields?: Partial<Offer2TMinFields> | null;
};

const empty: Offer2TMinFields = {
  propertyAddress: '',
  buyerAgentName: '',
  buyerAgentEmail: '',
  buyerNames: '',
  offerPrice: '',
  office: 'Wilmington',
  earnestMoney: '',
  dueDiligenceDate: '',
  closingDate: '',
  notes: '',
};

export function Offer2TPanel({
  open,
  onClose,
  onCreateIntake,
  onCreated,
  defaultOffice = 'Wilmington',
  initialFields = null,
}: Props) {
  const [fields, setFields] = useState<Offer2TMinFields>({
    ...empty,
    office: defaultOffice,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [outboundSkipped, setOutboundSkipped] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFields({
      ...empty,
      office: defaultOffice,
      ...(initialFields || {}),
      office: (initialFields?.office as Offer2TOffice) || defaultOffice,
    });
    setError(null);
    setSuccessId(null);
    setOutboundSkipped(false);
  }, [open, defaultOffice, initialFields]);

  const canSubmit = useMemo(
    () =>
      fields.propertyAddress.trim().length > 3 &&
      fields.buyerAgentName.trim().length > 1 &&
      fields.buyerNames.trim().length > 1 &&
      fields.offerPrice.trim().length > 0 &&
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
    setOutboundSkipped(false);
    try {
      const payload = buildOffer2TIntakePayload({
        ...fields,
        propertyAddress: fields.propertyAddress.trim(),
        buyerAgentName: fields.buyerAgentName.trim(),
        buyerAgentEmail: fields.buyerAgentEmail?.trim() || undefined,
        buyerNames: fields.buyerNames.trim(),
        offerPrice: fields.offerPrice.trim(),
        earnestMoney: fields.earnestMoney?.trim() || undefined,
        notes: fields.notes?.trim() || undefined,
        dueDiligenceDate: fields.dueDiligenceDate || undefined,
        closingDate: fields.closingDate || undefined,
      });
      if (!payload.suppressOutboundEmail || payload.category !== 'offer_2t') {
        throw new Error('Offer / 2-T email gate failed — aborting create');
      }
      const res = await onCreateIntake(payload);
      if (!res.ok) throw new Error(res.error || 'Create failed');
      setSuccessId(res.taskId || res.requestId || 'created');
      setOutboundSkipped(res.outboundSkipped !== false);
      if (onCreated) {
        onCreated(res, payload);
        setFields({ ...empty, office: defaultOffice });
        return;
      }
      setFields({ ...empty, office: defaultOffice });
    } catch (err: any) {
      setError(err?.message || 'Could not start Offer / Form 2-T draft');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Offer / Form 2-T"
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
          width: 'min(560px, 100%)',
          background: '#fff',
          borderRadius: 12,
          border: `1px solid ${FOREST}22`,
          boxShadow: '0 18px 50px rgba(0,0,0,0.18)',
          padding: 20,
          fontFamily: 'system-ui, sans-serif',
          color: FOREST,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Offer / Form 2-T</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              Creates a buyer-offer parent task with Nest SOP checklist + structured draft fields.
              Human finishes & signs — no outbound email.
            </div>
            {initialFields && (initialFields.propertyAddress || initialFields.buyerNames || initialFields.offerPrice) && (
              <div
                data-testid="offer-2t-chat-prefill-banner"
                style={{ fontSize: 11, marginTop: 8, padding: '6px 8px', borderRadius: 8, background: '#F7F3EC', border: '1px solid #E8DFD0', color: FOREST }}
              >
                Prefilling from Ask Nora chat — verify before create.
              </div>
            )}
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

        <label style={label}>
          Buyer name(s) *
          <input
            required
            value={fields.buyerNames}
            onChange={(e) => setFields((f) => ({ ...f, buyerNames: e.target.value }))}
            style={input}
            placeholder="Jane Buyer; John Buyer"
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={label}>
            Buyer agent *
            <input
              required
              value={fields.buyerAgentName}
              onChange={(e) => setFields((f) => ({ ...f, buyerAgentName: e.target.value }))}
              style={input}
            />
          </label>
          <label style={label}>
            Agent email
            <input
              type="email"
              value={fields.buyerAgentEmail || ''}
              onChange={(e) => setFields((f) => ({ ...f, buyerAgentEmail: e.target.value }))}
              style={input}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <label style={label}>
            Offer price *
            <input
              required
              value={fields.offerPrice}
              onChange={(e) => setFields((f) => ({ ...f, offerPrice: e.target.value }))}
              style={input}
              placeholder="$450,000"
            />
          </label>
          <label style={label}>
            Earnest money
            <input
              value={fields.earnestMoney || ''}
              onChange={(e) => setFields((f) => ({ ...f, earnestMoney: e.target.value }))}
              style={input}
              placeholder="$5,000"
            />
          </label>
          <label style={label}>
            Office
            <select
              value={fields.office || 'Wilmington'}
              onChange={(e) =>
                setFields((f) => ({ ...f, office: e.target.value as Offer2TOffice }))
              }
              style={input}
            >
              <option value="Wilmington">Wilmington</option>
              <option value="CB">CB</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={label}>
            Due diligence date
            <input
              type="date"
              value={fields.dueDiligenceDate || ''}
              onChange={(e) => setFields((f) => ({ ...f, dueDiligenceDate: e.target.value }))}
              style={input}
            />
          </label>
          <label style={label}>
            Closing date
            <input
              type="date"
              value={fields.closingDate || ''}
              onChange={(e) => setFields((f) => ({ ...f, closingDate: e.target.value }))}
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
            Offer / 2-T task created ({successId}). Open it from Tasks
            {outboundSkipped ? ' — no email was sent' : ''}.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={btnGhost}>
            Cancel
          </button>
          <button type="submit" disabled={!canSubmit} style={btnPrimary}>
            {submitting ? 'Starting…' : 'Start Offer / Form 2-T'}
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

export default Offer2TPanel;
