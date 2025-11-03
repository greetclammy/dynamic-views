import { App, TFile } from 'obsidian';

/**
 * Get the creation timestamp (ctime) of a file
 * @param file - TFile object
 * @returns Creation timestamp in milliseconds, or null if unavailable
 */
export function getFileCtime(file: TFile | null): number | null {
    if (!file?.stat?.ctime) return null;
    return file.stat.ctime;
}

/**
 * Get the currently active file
 * @param app - Obsidian App instance
 * @returns Active TFile or null
 */
export function getCurrentFile(app: App): TFile | null {
    return app.workspace.getActiveFile();
}
