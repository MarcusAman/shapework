/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface RoleProfilePdfData {
  person: {
    id: string;
    displayName: string;
    initials?: string;
    title?: string;
    department?: string;
    status?: string;
  };
  generatedAt: string;
  reportsTo?: {
    positionName?: string;
    personName?: string;
  };
  backupOwner?: {
    positionName?: string;
    personName?: string;
  };
  calculatedBackup?: {
    positionName?: string;
    personName?: string;
  };
  rolesAndResponsibilities: Array<{
    id?: string;
    title: string;
    description?: string;
  }>;
  sopsAndKnowledge: Array<{
    id?: string;
    title: string;
    type?: 'sop' | 'knowledge';
    summary?: string;
    trigger?: string;
    version?: string;
  }>;
  backupCoverage: Array<{
    type: 'seat' | 'request' | 'responsibility' | 'other' | string;
    label: string;
  }>;
}

interface RoleProfilePdfDocumentProps {
  data: RoleProfilePdfData;
}

export const RoleProfilePdfDocument: React.FC<RoleProfilePdfDocumentProps> = ({ data }) => {
  const {
    person,
    generatedAt,
    reportsTo,
    backupOwner,
    calculatedBackup,
    rolesAndResponsibilities = [],
    sopsAndKnowledge = [],
    backupCoverage = []
  } = data;

  // Format Helper for Person Names/Titles
  const formatPosPerson = (item?: { positionName?: string; personName?: string }) => {
    if (!item) return 'None';
    if (item.personName && item.positionName) {
      return `${item.personName} — ${item.positionName}`;
    }
    return item.personName || item.positionName || 'None';
  };

  // Split Backup Coverage into two balanced columns for compact 1-page layout
  const midIndex = Math.ceil(backupCoverage.length / 2);
  const leftCoverage = backupCoverage.slice(0, midIndex);
  const rightCoverage = backupCoverage.slice(midIndex);

  return (
    <div
      className="role-profile-pdf-document"
      style={{
        width: '8.5in',
        minHeight: '11in',
        padding: '0.45in 0.5in',
        backgroundColor: '#ffffff',
        color: '#1f2926',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        boxSizing: 'border-box',
        lineHeight: 1.4,
        fontSize: '9.5pt'
      }}
    >
      {/* HEADER SECTION */}
      <div
        style={{
          borderBottom: '2px solid #012822',
          paddingBottom: '12px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}
      >
        <div>
          <div
            style={{
              fontSize: '8pt',
              fontWeight: 700,
              color: '#00635C',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '4px'
            }}
          >
            Role Profile & Operations Summary
          </div>
          <h1
            style={{
              fontSize: '22pt',
              fontWeight: 800,
              color: '#012822',
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: '-0.02em'
            }}
          >
            {person.displayName || 'Unnamed Position'}
          </h1>
          <div
            style={{
              fontSize: '10pt',
              fontWeight: 600,
              color: '#475569',
              marginTop: '4px'
            }}
          >
            {person.department || 'Brokerage'} {person.title ? `· ${person.title}` : ''}
          </div>
        </div>

        <div
          style={{
            textAlign: 'right',
            fontSize: '8.5pt',
            color: '#64748b'
          }}
        >
          <div style={{ marginBottom: '3px' }}>
            <strong style={{ color: '#1e293b' }}>Status:</strong>{' '}
            <span
              style={{
                textTransform: 'capitalize',
                fontWeight: 600,
                color: person.status === 'active' ? '#047857' : '#012822'
              }}
            >
              {person.status || 'Active'}
            </span>
          </div>
          <div>
            <strong style={{ color: '#1e293b' }}>Generated:</strong> {generatedAt}
          </div>
          <div style={{ fontSize: '7.5pt', color: '#94a3b8', marginTop: '4px' }}>
            Nest Realty · Shapework OS
          </div>
        </div>
      </div>

      {/* REPORTING AND COVERAGE SUMMARY TABLE */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '10px 14px',
          marginBottom: '16px'
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '9pt'
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  width: '24%',
                  padding: '3px 0',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  fontSize: '8pt',
                  letterSpacing: '0.04em'
                }}
              >
                Reports to
              </td>
              <td
                style={{
                  padding: '3px 0',
                  fontWeight: 600,
                  color: '#0f172a',
                  wordBreak: 'break-word'
                }}
              >
                {formatPosPerson(reportsTo)}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '3px 0',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  fontSize: '8pt',
                  letterSpacing: '0.04em'
                }}
              >
                Backup owner
              </td>
              <td
                style={{
                  padding: '3px 0',
                  fontWeight: 600,
                  color: '#0f172a',
                  wordBreak: 'break-word'
                }}
              >
                {formatPosPerson(backupOwner)}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '3px 0',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  fontSize: '8pt',
                  letterSpacing: '0.04em'
                }}
              >
                Calculated backup
              </td>
              <td
                style={{
                  padding: '3px 0',
                  fontWeight: 600,
                  color: '#0f172a',
                  wordBreak: 'break-word'
                }}
              >
                {formatPosPerson(calculatedBackup)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* COMPACT PROFILE TOTALS */}
      <div
        style={{
          borderTop: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          padding: '6px 0',
          marginBottom: '16px',
          textAlign: 'center',
          fontSize: '8.5pt',
          fontWeight: 600,
          color: '#00635C',
          letterSpacing: '0.03em'
        }}
      >
        {rolesAndResponsibilities.length} {rolesAndResponsibilities.length === 1 ? 'Responsibility' : 'Responsibilities'}
        {'   ·   '}
        {sopsAndKnowledge.length} {sopsAndKnowledge.length === 1 ? 'SOP / Knowledge item' : 'SOPs / Knowledge items'}
        {'   ·   '}
        {backupCoverage.length} Backup coverage {backupCoverage.length === 1 ? 'assignment' : 'assignments'}
      </div>

      {/* ROLES AND RESPONSIBILITIES SECTION */}
      <div style={{ marginBottom: '18px' }}>
        <h2
          style={{
            fontSize: '10.5pt',
            fontWeight: 800,
            color: '#012822',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            margin: '0 0 8px 0',
            borderBottom: '1.5px solid #cbd5e1',
            paddingBottom: '4px'
          }}
        >
          Roles & Responsibilities
        </h2>

        {rolesAndResponsibilities.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: '#64748b', margin: '4px 0', fontSize: '9pt' }}>
            No responsibilities assigned.
          </p>
        ) : (
          <ol
            style={{
              margin: 0,
              paddingLeft: '18px',
              fontSize: '9pt'
            }}
          >
            {rolesAndResponsibilities.map((item, idx) => (
              <li
                key={item.id || idx}
                style={{
                  marginBottom: idx === rolesAndResponsibilities.length - 1 ? '0' : '8px',
                  color: '#0f172a'
                }}
              >
                <strong style={{ color: '#012822', fontWeight: 700 }}>{item.title}</strong>
                {item.description && (
                  <span style={{ color: '#334155', marginLeft: '6px' }}>
                    — {item.description}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* SOPS AND KNOWLEDGE SECTION */}
      <div style={{ marginBottom: '18px' }}>
        <h2
          style={{
            fontSize: '10.5pt',
            fontWeight: 800,
            color: '#012822',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            margin: '0 0 8px 0',
            borderBottom: '1.5px solid #cbd5e1',
            paddingBottom: '4px'
          }}
        >
          SOPs & Knowledge Bases
        </h2>

        {sopsAndKnowledge.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: '#64748b', margin: '4px 0', fontSize: '9pt' }}>
            No SOPs or Knowledge assigned.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sopsAndKnowledge.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#f8fafc',
                  borderLeft: '3px solid #00635C',
                  borderRadius: '0 4px 4px 0',
                  fontSize: '8.5pt'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ color: '#012822', fontSize: '9pt', fontWeight: 700 }}>
                    {item.title}
                  </strong>
                  <span
                    style={{
                      fontSize: '7.5pt',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#475569',
                      backgroundColor: '#e2e8f0',
                      padding: '1px 6px',
                      borderRadius: '3px'
                    }}
                  >
                    {item.type === 'knowledge' ? 'Knowledge' : 'SOP'}
                  </span>
                </div>
                {item.trigger && (
                  <div style={{ color: '#475569', marginTop: '3px' }}>
                    <strong style={{ color: '#1e293b' }}>Trigger:</strong> {item.trigger}
                  </div>
                )}
                {item.summary && (
                  <div style={{ color: '#334155', marginTop: '3px' }}>
                    {item.summary}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BACKUP COVERAGE SECTION (2 COMPACT COLUMNS) */}
      <div style={{ marginBottom: '16px' }}>
        <h2
          style={{
            fontSize: '10.5pt',
            fontWeight: 800,
            color: '#012822',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            margin: '0 0 8px 0',
            borderBottom: '1.5px solid #cbd5e1',
            paddingBottom: '4px'
          }}
        >
          Backup Coverage ({backupCoverage.length})
        </h2>

        {backupCoverage.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: '#64748b', margin: '4px 0', fontSize: '9pt' }}>
            No backup coverage configured.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Left Column */}
            <div style={{ flex: 1 }}>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '8.5pt' }}>
                {leftCoverage.map((item, idx) => (
                  <li key={`left_${idx}`} style={{ marginBottom: '4px', color: '#1e293b' }}>
                    <strong style={{ color: '#00635C', textTransform: 'capitalize' }}>
                      {item.type}:
                    </strong>{' '}
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Column */}
            <div style={{ flex: 1 }}>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '8.5pt' }}>
                {rightCoverage.map((item, idx) => (
                  <li key={`right_${idx}`} style={{ marginBottom: '4px', color: '#1e293b' }}>
                    <strong style={{ color: '#00635C', textTransform: 'capitalize' }}>
                      {item.type}:
                    </strong>{' '}
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '12px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          fontSize: '7.5pt',
          color: '#94a3b8'
        }}
      >
        <div>Shapework OS · Real Estate Brokerage Operations</div>
        <div>Page 1 of 1 · Confirmed Role Profile Document</div>
      </div>
    </div>
  );
};

export default RoleProfilePdfDocument;
