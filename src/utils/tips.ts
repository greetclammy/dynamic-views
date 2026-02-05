/**
 * One-time tip notifications
 * Module-level reference to PersistenceManager avoids threading plugin through call chains.
 */

import { Notice } from "obsidian";
import type { PersistenceManager } from "../persistence";
import type { Flags } from "../types";

let pm: PersistenceManager | null = null;

/** Store reference at plugin load. */
export function initTips(persistenceManager: PersistenceManager): void {
  pm = persistenceManager;
}

/** Clear reference at plugin unload. */
export function cleanupTips(): void {
  pm = null;
}

/** Show a tip once. Persists the flag so it never shows again. */
export function showTipOnce(key: keyof Flags, message: string): void {
  if (!pm || pm.hasFlag(key)) return;
  new Notice(message, 8000);
  void pm.setFlag(key);
}
