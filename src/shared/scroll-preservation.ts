/**
 * Scroll preservation for Bases views
 * Simple scroll save/restore - no visibility manipulation (matches fork behavior)
 */

import type { App, EventRef } from "obsidian";

// Shared scroll positions across all views (keyed by leafId)
const scrollPositions = new Map<string, number>();

/** Runtime-only properties on WorkspaceLeaf not exposed in public types */
interface LeafRuntimeProps {
  id?: string;
  parent?: unknown;
}

/** Safely access runtime-only leaf properties */
function getLeafProps(leaf: unknown): LeafRuntimeProps {
  return (leaf ?? {}) as LeafRuntimeProps;
}

export interface ScrollPreservationConfig {
  leafId: string;
  scrollEl: HTMLElement;
  registerEvent: (event: EventRef) => void;
  register: (cleanup: () => void) => void;
  app: App;
}

export class ScrollPreservation {
  private leafId: string;
  private scrollEl: HTMLElement;
  private app: App;
  private scrollHandler: (() => void) | null = null;

  constructor(config: ScrollPreservationConfig) {
    if (!config.leafId) {
      throw new Error("ScrollPreservation: leafId cannot be empty");
    }
    this.leafId = config.leafId;
    this.scrollEl = config.scrollEl;
    this.app = config.app;

    // Setup active-leaf-change handler
    config.registerEvent(
      config.app.workspace.on("active-leaf-change", (leaf) => {
        const leafId = getLeafProps(leaf).id;
        if (leafId === this.leafId) {
          this.handleSwitchTo();
        } else {
          this.handleSwitchAway(leaf);
        }
      }),
    );

    // Setup scroll tracking
    this.scrollHandler = this.createScrollHandler();
    this.scrollEl.addEventListener("scroll", this.scrollHandler, {
      passive: true,
    });
    config.register(() => {
      if (this.scrollHandler) {
        this.scrollEl.removeEventListener("scroll", this.scrollHandler);
      }
    });
  }

  private handleSwitchTo(): void {
    if (!this.scrollEl.isConnected) return;
    const saved = scrollPositions.get(this.leafId) ?? 0;
    if (saved > 0) {
      this.scrollEl.scrollTop = saved;
    }
  }

  private handleSwitchAway(newLeaf: unknown): void {
    if (!this.scrollEl.isConnected) return;

    // Compare parent containers to detect same-pane tab switches
    const thisLeaf = this.app.workspace.getLeafById(this.leafId);
    const thisParent = getLeafProps(thisLeaf).parent;
    const newParent = getLeafProps(newLeaf).parent;

    // Only save for same-pane switches
    if (thisParent !== newParent) return;

    const currentScroll = this.scrollEl.scrollTop;
    if (currentScroll > 0) {
      scrollPositions.set(this.leafId, currentScroll);
    }
  }

  private createScrollHandler(): () => void {
    let scheduled = false;
    return () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        if (!this.scrollEl.isConnected) return;

        // Don't save when container collapsed
        if (this.scrollEl.scrollHeight <= this.scrollEl.clientHeight) {
          return;
        }

        scrollPositions.set(this.leafId, this.scrollEl.scrollTop);
      });
    };
  }

  /** Restore scroll position after render */
  restoreAfterRender(): void {
    if (!this.scrollEl.isConnected) return;
    const saved = scrollPositions.get(this.leafId) ?? 0;
    if (saved > 0) {
      this.scrollEl.scrollTop = saved;
    }
  }

  /** Clean up on view unload */
  cleanup(): void {
    scrollPositions.delete(this.leafId);
  }
}
