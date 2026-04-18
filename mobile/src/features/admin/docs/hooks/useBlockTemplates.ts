import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DocBlock } from '../types/types';
import { newId } from '../utils/idUtils';

const STORAGE_KEY = 'docs_block_templates';

export interface BlockTemplate {
  id: string;
  name: string;
  blocks: DocBlock[];   // one or more blocks
  createdAt: string;
}

// ── Persistence helpers ───────────────────────────────────────────────────────

async function loadTemplates(): Promise<BlockTemplate[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveTemplates(templates: BlockTemplate[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {}
}

// ── Deep clone blocks with fresh IDs ─────────────────────────────────────────
function cloneBlocks(blocks: DocBlock[]): DocBlock[] {
  return blocks.map((b) => {
    const clone = JSON.parse(JSON.stringify(b)) as DocBlock;
    clone.id = newId();
    if (clone.type === 'tabs')          (clone as any).tabs   = (clone as any).tabs?.map((t: any)   => ({ ...t, id: newId() }));
    if (clone.type === 'videoCarousel') (clone as any).videos = (clone as any).videos?.map((v: any) => ({ ...v, id: newId() }));
    if (clone.type === 'imageCarousel') (clone as any).images = (clone as any).images?.map((i: any) => ({ ...i, id: newId() }));
    return clone;
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBlockTemplates() {
  const [templates, setTemplates] = useState<BlockTemplate[]>([]);

  useEffect(() => {
    loadTemplates().then(setTemplates);
  }, []);

  /** Save a block (or group of blocks) as a named template */
  const saveTemplate = useCallback(async (name: string, blocks: DocBlock[]) => {
    const template: BlockTemplate = {
      id:        newId(),
      name:      name.trim() || 'Untitled template',
      blocks:    cloneBlocks(blocks),
      createdAt: new Date().toISOString(),
    };
    const updated = [template, ...templates];
    setTemplates(updated);
    await saveTemplates(updated);
    return template;
  }, [templates]);

  /** Delete a template by id */
  const deleteTemplate = useCallback(async (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    await saveTemplates(updated);
  }, [templates]);

  /** Return a deep-cloned copy of a template's blocks (fresh IDs) */
  const instantiateTemplate = useCallback((template: BlockTemplate): DocBlock[] => {
    return cloneBlocks(template.blocks);
  }, []);

  return { templates, saveTemplate, deleteTemplate, instantiateTemplate };
}
