export class AIContextBuilder {
  static buildWorkspaceContext(dbState: any, wsId: string) {
    // Filter by workspace if applicable
    const positions = (dbState.organization?.positions || [])
      .map((p: any) => ({ id: p.id, title: p.title, department: p.department }));
    
    const people = (dbState.directoryPeople || [])
      .filter((p: any) => p.workspaceId === wsId)
      .map((p: any) => ({ id: p.id, name: p.name, email: p.email, role: p.role }));

    const activeSops = (dbState.opsSops || [])
      .filter((s: any) => s.workspaceId === wsId && s.status === 'published')
      .map((s: any) => ({ id: s.sopId, title: s.title, trigger: s.trigger, ownerRole: s.ownerRole }));

    const responsibilities = (dbState.responsibilities || [])
      .filter((r: any) => r.workspaceId === wsId)
      .map((r: any) => ({ role: r.role, area: r.area, description: r.description }));

    return {
      positions,
      people,
      activeSops,
      responsibilities,
      workspaceId: wsId,
    };
  }
}
