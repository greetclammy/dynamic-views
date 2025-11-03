import { CardView } from './card-view';
import type { Settings } from '../types';

interface MasonryViewProps {
    results: any[];
    displayedCount: number;
    settings: Settings;
    sortMethod: string;
    isShuffled: boolean;
    snippets: Record<string, string>;
    images: Record<string, string | string[]>;
    staticGifs: Record<string, string | string[]>;
    multiImagesLoaded: Record<string, boolean>;
    hasMultipleImages: Record<string, boolean>;
    hasImageAvailable: Record<string, boolean>;
    focusableCardIndex: number;
    containerRef: any;
    updateLayoutRef: any;
    app: any;
    dc: any;
    onCardClick?: (path: string, newLeaf: boolean) => void;
    onFocusChange?: (index: number) => void;
    onExtractMultipleImages?: (path: string) => void;
}

/**
 * MasonryView is a wrapper around CardView with viewMode set to 'masonry'.
 * The masonry layout is achieved through CSS and the CardView component handles
 * both card and masonry rendering with appropriate className switching.
 */
export function MasonryView(props: MasonryViewProps) {
    return <CardView {...props} viewMode="masonry" />;
}
