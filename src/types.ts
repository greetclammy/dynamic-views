export interface Settings {
    titleProperty: string;
    descriptionProperty: string;
    imageProperty: string;
    alwaysOmitFirstLine: boolean;
    showTextPreview: boolean;
    showThumbnails: boolean;
    cardBottomDisplay: string;
    listMarker: string;
    showTimestamp: boolean;
    showTimestampIcon: boolean;
    minMasonryColumns: number;
    randomizeAction: string;
    thumbnailCacheSize: string;
    queryHeight: number;
    openFileAction: string;
    addCardBackground: boolean;
}

export interface UIState {
    sortMethod: string;
    viewMode: string;
    searchQuery: string;
    resultLimit: string;
    widthMode: string;
}

export interface PluginData {
    globalSettings: Settings;
    queryStates: Record<string, UIState>;
}

export type ViewMode = 'card' | 'masonry' | 'list';
export type WidthMode = 'normal' | 'wide' | 'max';
export type SortMethod = 'mtime-desc' | 'mtime-asc' | 'ctime-desc' | 'ctime-asc' | 'title' | 'size' | 'random';
