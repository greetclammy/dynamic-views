import { Plugin, TFile } from "obsidian";
import {
  PluginData,
  Settings,
  UIState,
  DefaultViewSettings,
  TemplateSnapshot,
} from "./types";
import {
  DEFAULT_SETTINGS,
  DEFAULT_UI_STATE,
  DEFAULT_VIEW_SETTINGS,
  DEFAULT_TEMPLATE_VIEWS,
} from "./constants";
import { sanitizeObject, sanitizeString } from "./utils/sanitize";

export class PersistenceManager {
  private plugin: Plugin;
  private data: PluginData;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.data = {
      globalSettings: { ...DEFAULT_SETTINGS },
      defaultViewSettings: { ...DEFAULT_VIEW_SETTINGS },
      queryStates: {},
      viewSettings: {},
      defaultTemplateViews: { ...DEFAULT_TEMPLATE_VIEWS },
    };
  }

  async load(): Promise<void> {
    const loadedData =
      (await this.plugin.loadData()) as Partial<PluginData> | null;
    if (loadedData) {
      // Migrate old ctime-based references to null
      let defaultTemplateViews = loadedData.defaultTemplateViews || {
        ...DEFAULT_TEMPLATE_VIEWS,
      };

      // Check if any values are numbers (old format) and reset
      if (
        typeof defaultTemplateViews.grid === "number" ||
        typeof defaultTemplateViews.masonry === "number" ||
        typeof defaultTemplateViews.list === "number"
      ) {
        console.log(
          "Migrating template storage format - clearing old references",
        );
        defaultTemplateViews = { grid: null, masonry: null, list: null };
      }

      this.data = {
        globalSettings: {
          ...DEFAULT_SETTINGS,
          ...(loadedData.globalSettings || {}),
        },
        defaultViewSettings: {
          ...DEFAULT_VIEW_SETTINGS,
          ...(loadedData.defaultViewSettings || {}),
        },
        queryStates: loadedData.queryStates || {},
        viewSettings: loadedData.viewSettings || {},
        defaultTemplateViews,
      };
    }
  }

  async save(): Promise<void> {
    await this.plugin.saveData(this.data);
  }

  /**
   * Extract storage key (ctime) from TFile
   * @private
   */
  private getFileKey(file: TFile | null): string | null {
    if (!file?.stat?.ctime) return null;
    return file.stat.ctime.toString();
  }

  getGlobalSettings(): Settings {
    return { ...this.data.globalSettings };
  }

  async setGlobalSettings(settings: Partial<Settings>): Promise<void> {
    const sanitized = sanitizeObject(settings);
    this.data.globalSettings = { ...this.data.globalSettings, ...sanitized };
    await this.save();
  }

  getDefaultViewSettings(): DefaultViewSettings {
    return { ...this.data.defaultViewSettings };
  }

  async setDefaultViewSettings(
    settings: Partial<DefaultViewSettings>,
  ): Promise<void> {
    const sanitized = sanitizeObject(settings);
    this.data.defaultViewSettings = {
      ...this.data.defaultViewSettings,
      ...sanitized,
    };
    await this.save();
  }

  getUIState(file: TFile | null): UIState {
    const key = this.getFileKey(file);
    if (!key) return { ...DEFAULT_UI_STATE };
    const state = this.data.queryStates[key];
    return state ? { ...state } : { ...DEFAULT_UI_STATE };
  }

  async setUIState(file: TFile | null, state: Partial<UIState>): Promise<void> {
    const key = this.getFileKey(file);
    if (!key) return;

    const current = this.data.queryStates[key] || { ...DEFAULT_UI_STATE };

    // Sanitize and truncate searchQuery
    const sanitized: Partial<UIState> = {};
    for (const [k, v] of Object.entries(state)) {
      const key = k as keyof UIState;
      if (k === "searchQuery" && typeof v === "string") {
        (sanitized as Record<string, string>)[key] = sanitizeString(
          v.slice(0, 500),
        );
      } else if (typeof v === "string") {
        (sanitized as Record<string, string>)[key] = sanitizeString(v);
      } else {
        (sanitized as Record<string, unknown>)[key] = v;
      }
    }

    this.data.queryStates[key] = { ...current, ...sanitized };
    await this.save();
  }

  async clearUIState(file: TFile | null): Promise<void> {
    const key = this.getFileKey(file);
    if (!key) return;
    delete this.data.queryStates[key];
    await this.save();
  }

  getViewSettings(file: TFile | null): Partial<DefaultViewSettings> {
    const key = this.getFileKey(file);
    if (!key) return {};
    const settings = this.data.viewSettings[key];
    return settings ? { ...settings } : {};
  }

  async setViewSettings(
    file: TFile | null,
    settings: Partial<DefaultViewSettings>,
  ): Promise<void> {
    const key = this.getFileKey(file);
    if (!key) return;

    const current = this.data.viewSettings[key] || {};

    // Sanitize settings
    const sanitized = sanitizeObject(settings);

    this.data.viewSettings[key] = { ...current, ...sanitized };
    await this.save();
  }

  async clearViewSettings(file: TFile | null): Promise<void> {
    const key = this.getFileKey(file);
    if (!key) return;
    delete this.data.viewSettings[key];
    await this.save();
  }

  /**
   * Get the template snapshot for a specific view type
   * Handles migration from old format (plain settings) to new format (with timestamp)
   */
  getTemplateSnapshot(
    viewType: "grid" | "masonry" | "list",
  ): TemplateSnapshot | null {
    const snapshot = this.data.defaultTemplateViews[viewType];

    if (!snapshot) {
      console.log(
        `[PersistenceManager] getTemplateSnapshot(${viewType}): null`,
      );
      return null;
    }

    // Migration: Old format (plain settings object) → New format (TemplateSnapshot)
    if (!("setAt" in snapshot)) {
      console.log(
        `[PersistenceManager] Migrating ${viewType} snapshot to new format with timestamp`,
      );
      // Wrap in TemplateSnapshot structure with current timestamp
      const migrated: TemplateSnapshot = {
        settings: snapshot as Partial<DefaultViewSettings>,
        setAt: Date.now(),
      };
      // Save migrated format
      this.data.defaultTemplateViews[viewType] = migrated;
      void this.save();
      return migrated;
    }

    console.log(
      `[PersistenceManager] getTemplateSnapshot(${viewType}): exists (timestamp: ${snapshot.setAt})`,
    );
    return snapshot;
  }

  /**
   * Set the template snapshot for a specific view type
   * @param snapshot - Full snapshot with timestamp, or null to clear template
   */
  async setTemplateSnapshot(
    viewType: "grid" | "masonry" | "list",
    snapshot: TemplateSnapshot | null,
  ): Promise<void> {
    console.log(
      `[PersistenceManager] setTemplateSnapshot(${viewType}):`,
      snapshot ? `saving snapshot (timestamp: ${snapshot.setAt})` : "clearing",
    );
    this.data.defaultTemplateViews[viewType] = snapshot;
    await this.save();
  }

  /**
   * Check if a file is the template view for a specific view type
   * @deprecated Template system now uses snapshots, not file references
   * @returns Always returns false (kept for UI compatibility)
   */
  isTemplateView(
    _file: TFile | null,
    _viewType: "grid" | "masonry" | "list",
  ): boolean {
    return false;
  }
}
