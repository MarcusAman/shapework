/**
 * Nest listing-launch form field maps (metadata only).
 * Mirrors server LicensedFormRegistry codes for Form 101 / 140 / WWREA.
 * ZERO copyrighted form body text or PDF content.
 */

export type NestFormFieldSchema = {
  key: string;
  label: string;
  nestSource?: string;
};

export type NestListingFormCode =
  | 'NC_REALTORS_FORM_101'
  | 'NC_REALTORS_FORM_140'
  | 'NCREC_WWREA';

export type NestListingFormDraft = {
  canonicalFormCode: NestListingFormCode;
  formName: string;
  displayName: string;
  nestRole: string;
  /** key → value; empty string = human / Dotloop still required */
  fieldMap: Record<string, string>;
  fieldMapSchema: NestFormFieldSchema[];
};

export const NEST_LISTING_FORM_CODES: NestListingFormCode[] = [
  'NC_REALTORS_FORM_101',
  'NC_REALTORS_FORM_140',
  'NCREC_WWREA',
];

const FORM_101_SCHEMA: NestFormFieldSchema[] = [
  { key: 'propertyAddress', label: 'Listed property address', nestSource: 'minFields.propertyAddress' },
  { key: 'sellerNames', label: 'Seller name(s)', nestSource: 'notes / Dotloop (human)' },
  { key: 'listingAgent', label: 'Listing agent', nestSource: 'minFields.listingAgentName' },
  { key: 'listingAgentEmail', label: 'Listing agent email', nestSource: 'minFields.listingAgentEmail' },
  { key: 'office', label: 'Nest listing office', nestSource: 'minFields.office' },
  { key: 'listPrice', label: 'List price', nestSource: 'notes / Dotloop (human)' },
  { key: 'listingTermStart', label: 'Listing term start', nestSource: 'human / Dotloop' },
  { key: 'listingTermEnd', label: 'Listing term end', nestSource: 'human / Dotloop' },
  { key: 'compensationNote', label: 'Compensation / coop note', nestSource: 'human / Nest SOP' },
  { key: 'mlsNumber', label: 'MLS# (when assigned)', nestSource: 'minFields.mlsNumber' },
];

const FORM_140_SCHEMA: NestFormFieldSchema[] = [
  { key: 'propertyAddress', label: 'Property address', nestSource: 'minFields.propertyAddress' },
  { key: 'sellerNames', label: 'Owner / seller name(s)', nestSource: 'notes / Dotloop (human)' },
  { key: 'hoaName', label: 'Owners association name', nestSource: 'human / disclosure packet' },
  { key: 'hoaFees', label: 'Association fees (if any)', nestSource: 'human / disclosure packet' },
  { key: 'knownDefectsNote', label: 'Known defects / issues note', nestSource: 'human / seller disclosure' },
  { key: 'listingAgent', label: 'Listing agent receiving disclosure', nestSource: 'minFields.listingAgentName' },
  { key: 'office', label: 'Nest office', nestSource: 'minFields.office' },
];

const WWREA_SCHEMA: NestFormFieldSchema[] = [
  { key: 'clientNames', label: 'Client / consumer name(s)', nestSource: 'seller names (human)' },
  { key: 'agentName', label: 'Nest agent presenting WWREA', nestSource: 'minFields.listingAgentName' },
  { key: 'agentEmail', label: 'Agent email', nestSource: 'minFields.listingAgentEmail' },
  { key: 'office', label: 'Nest office', nestSource: 'minFields.office' },
  { key: 'representationSide', label: 'Representation side', nestSource: 'listing_launch → seller' },
  { key: 'acknowledgmentDate', label: 'Acknowledgment date', nestSource: 'human / Dotloop' },
  { key: 'propertyAddress', label: 'Related property (if known)', nestSource: 'minFields.propertyAddress' },
];

const FORM_META: Record<
  NestListingFormCode,
  { formName: string; displayName: string; nestRole: string; schema: NestFormFieldSchema[] }
> = {
  NC_REALTORS_FORM_101: {
    formName: 'Form 101',
    displayName: 'Exclusive Right to Sell Listing Agreement (Form 101)',
    nestRole: 'Exclusive Right to Sell',
    schema: FORM_101_SCHEMA,
  },
  NC_REALTORS_FORM_140: {
    formName: 'Form 140',
    displayName: 'RPOADS / Residential Property & Owners Association Disclosure (Form 140)',
    nestRole: 'RPOADS seller disclosure',
    schema: FORM_140_SCHEMA,
  },
  NCREC_WWREA: {
    formName: 'WWREA',
    displayName: 'Working With Real Estate Agents acknowledgment',
    nestRole: 'WWREA acknowledgment',
    schema: WWREA_SCHEMA,
  },
};

function fillFromSchema(
  schema: NestFormFieldSchema[],
  nestValues: Record<string, string | undefined | null>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of schema) {
    const raw = nestValues[field.key];
    out[field.key] = raw == null ? '' : String(raw);
  }
  return out;
}

export type ListingFormMapInput = {
  propertyAddress: string;
  listingAgentName: string;
  listingAgentEmail?: string;
  office: string;
  mlsNumber?: string;
  notes?: string;
};

/**
 * Build metadata-only form drafts for listing launch (101 / 140 / WWREA).
 * Prefills Nest-known fields; leaves human/Dotloop fields blank.
 */
export function buildListingLaunchFormsPackage(fields: ListingFormMapInput): NestListingFormDraft[] {
  const shared = {
    propertyAddress: fields.propertyAddress,
    listingAgent: fields.listingAgentName,
    listingAgentEmail: fields.listingAgentEmail || '',
    agentName: fields.listingAgentName,
    agentEmail: fields.listingAgentEmail || '',
    office: fields.office,
    mlsNumber: fields.mlsNumber || '',
    representationSide: 'seller',
    // seller / client names remain human until Dotloop / notes capture
    sellerNames: '',
    clientNames: '',
    listPrice: '',
    listingTermStart: '',
    listingTermEnd: '',
    compensationNote: '',
    hoaName: '',
    hoaFees: '',
    knownDefectsNote: '',
    acknowledgmentDate: '',
  };

  return NEST_LISTING_FORM_CODES.map((code) => {
    const meta = FORM_META[code];
    return {
      canonicalFormCode: code,
      formName: meta.formName,
      displayName: meta.displayName,
      nestRole: meta.nestRole,
      fieldMapSchema: meta.schema,
      fieldMap: fillFromSchema(meta.schema, shared),
    };
  });
}

export function listingFormsPackageSummary(forms: NestListingFormDraft[]): {
  formCount: number;
  filledFieldCount: number;
  blankFieldCount: number;
  codes: NestListingFormCode[];
} {
  let filled = 0;
  let blank = 0;
  for (const form of forms) {
    for (const v of Object.values(form.fieldMap)) {
      if (String(v || '').trim()) filled += 1;
      else blank += 1;
    }
  }
  return {
    formCount: forms.length,
    filledFieldCount: filled,
    blankFieldCount: blank,
    codes: forms.map((f) => f.canonicalFormCode),
  };
}
