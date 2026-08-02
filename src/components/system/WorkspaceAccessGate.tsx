import React from 'react';

interface WorkspaceAccessGateProps {
  children: React.ReactNode;
}

export default function WorkspaceAccessGate({ children }: WorkspaceAccessGateProps) {
  // Private access code gate removed per user directive to eliminate route & page screen flashing
  return <>{children}</>;
}
