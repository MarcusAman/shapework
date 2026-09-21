/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * useFitBoardLayout — Responsive "Fit Board" Layout Engine for Tasks and Workspace
 * 
 * Automatically calculates column widths and distributes available container space:
 * 1. Measures the actual board container (accounting for sidebar, gutters, and page padding).
 * 2. When all columns fit at readable width (>=200px), expands all columns (~220–250px target).
 * 3. When space is constrained, auto-defaults empty columns (0 tasks) to compact 44px rails,
 *    keeping populated columns expanded.
 * 4. Remembers user's manual expand/collapse preferences in localStorage per user/workspace.
 * 5. If expanded columns exceed available space, provides contained horizontal scrolling without hiding stages.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

export interface ColumnMeta {
  id: string;
  taskCount: number;
}

export interface UseFitBoardLayoutOptions {
  columns: ColumnMeta[];
  context: 'tasks' | 'workspace';
  userId?: string;
  workspaceId?: string;
  minColWidth?: number; // default 200px
  targetColWidth?: number; // default 230px
  railWidth?: number; // default 44px
  gap?: number; // default 8px
}

export function useFitBoardLayout({
  columns,
  context,
  userId = 'usr_default',
  workspaceId = 'ws_wilmington',
  minColWidth = 200,
  targetColWidth = 230,
  railWidth = 44,
  gap = 8
}: UseFitBoardLayoutOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Storage key for user-specific, workspace-specific manual collapse overrides
  const storageKey = useMemo(() => {
    return `nest_kanban_manual_overrides_${context}_${workspaceId}_${userId}`;
  }, [context, workspaceId, userId]);

  // Track explicit user overrides (true = collapsed, false = expanded)
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      if (window.localStorage && typeof window.localStorage.getItem === 'function') {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return {};
  });

  // Save manual overrides on change
  const saveOverrides = useCallback((overrides: Record<string, boolean>) => {
    setManualOverrides(overrides);
    if (typeof window !== 'undefined') {
      try {
        if (window.localStorage && typeof window.localStorage.setItem === 'function') {
          window.localStorage.setItem(storageKey, JSON.stringify(overrides));
        }
      } catch {}
    }
  }, [storageKey]);

  // ResizeObserver to measure actual available board width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) {
        setContainerWidth(width);
      }
    };

    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          if (width > 0) {
            setContainerWidth(width);
          }
        }
      });
      observer.observe(el);
      return () => observer.disconnect();
    } else {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
  }, []);

  // Compute collapsed state for each column
  const collapsedColumns = useMemo<Record<string, boolean>>(() => {
    const totalCols = columns.length;
    if (totalCols === 0) return {};

    // Total width if every column was expanded at minColWidth (200px)
    const allExpandedWidthNeeded = totalCols * minColWidth + (totalCols - 1) * gap;
    const canFitAllExpanded = containerWidth > 0 && containerWidth >= allExpandedWidthNeeded;

    const state: Record<string, boolean> = {};

    columns.forEach((col) => {
      // If user has an explicit manual override, honor it unconditionally
      if (manualOverrides[col.id] !== undefined) {
        state[col.id] = manualOverrides[col.id];
        return;
      }

      // If all columns fit at readable width, keep all expanded
      if (canFitAllExpanded) {
        state[col.id] = false;
        return;
      }

      // If space is constrained and column is empty, auto-default to collapsed rail
      if (col.taskCount === 0) {
        state[col.id] = true;
      } else {
        state[col.id] = false;
      }
    });

    return state;
  }, [columns, containerWidth, manualOverrides, minColWidth, gap]);

  // Toggle single column collapse
  const toggleColumnCollapse = useCallback((colId: string) => {
    const currentlyCollapsed = Boolean(collapsedColumns[colId]);
    const nextOverrides = {
      ...manualOverrides,
      [colId]: !currentlyCollapsed
    };
    saveOverrides(nextOverrides);
  }, [collapsedColumns, manualOverrides, saveOverrides]);

  // Compute distributed column width for expanded columns
  const { colWidth, isOverflowing } = useMemo(() => {
    const totalCols = columns.length;
    if (totalCols === 0 || containerWidth <= 0) {
      return { colWidth: targetColWidth, isOverflowing: false };
    }

    const expandedCols = columns.filter(c => !collapsedColumns[c.id]);
    const collapsedCols = columns.filter(c => collapsedColumns[c.id]);

    const numExpanded = expandedCols.length;
    const numCollapsed = collapsedCols.length;

    if (numExpanded === 0) {
      return { colWidth: targetColWidth, isOverflowing: false };
    }

    const totalRailSpace = numCollapsed * railWidth;
    const totalGapSpace = (totalCols - 1) * gap;
    const availableForExpanded = containerWidth - totalRailSpace - totalGapSpace;

    // Distribute remaining width equally among expanded columns
    const distributed = Math.floor(availableForExpanded / numExpanded);

    if (distributed < minColWidth) {
      // Need horizontal scrolling at minimum readable width
      return { colWidth: minColWidth, isOverflowing: true };
    }

    return { colWidth: distributed, isOverflowing: false };
  }, [columns, collapsedColumns, containerWidth, railWidth, gap, minColWidth, targetColWidth]);

  const columnWidthStyle = useMemo<React.CSSProperties>(() => ({
    width: `${colWidth}px`,
    minWidth: `${minColWidth}px`,
    flexShrink: 0
  }), [colWidth, minColWidth]);

  const railWidthStyle = useMemo<React.CSSProperties>(() => ({
    width: `${railWidth}px`,
    flexShrink: 0
  }), [railWidth]);

  return {
    containerRef,
    containerWidth,
    collapsedColumns,
    toggleColumnCollapse,
    colWidth,
    columnWidthStyle,
    railWidthStyle,
    railWidthClass: 'w-11 shrink-0',
    gapClass: 'gap-2',
    isOverflowing
  };
}
