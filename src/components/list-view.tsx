import type { Settings } from '../types';

interface ListViewProps {
    results: any[];
    displayedCount: number;
    settings: Settings;
    containerRef: any;
    app: any;
    dc: any;
    onLinkClick?: (path: string, newLeaf: boolean) => void;
}

export function ListView({
    results,
    displayedCount,
    settings,
    containerRef,
    app,
    dc,
    onLinkClick
}: ListViewProps) {
    return (
        <ul
            ref={containerRef}
            className={`list-view marker-${settings.listMarker}`}
            style={settings.queryHeight > 0 ? { maxHeight: `${settings.queryHeight}px`, overflowY: 'auto' } : {}}
        >
            {results.slice(0, displayedCount).filter(p => p.$path).map((p, index) => {
                // Get title from property or fallback to filename - coerce to string to handle Literal objects
                let rawTitle = p.value(settings.titleProperty);
                if (Array.isArray(rawTitle)) rawTitle = rawTitle[0];
                const titleValue = dc.coerce.string(rawTitle || p.$name);
                // Get folder path
                const folderPath = (p.$path || '').split('/').slice(0, -1).join('/');

                return (
                    <li key={p.$path} className="list-item">
                        <a
                            href={p.$path}
                            className="internal-link list-link"
                            onClick={(e: MouseEvent) => {
                                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && p.$path) {
                                    e.preventDefault();
                                    if (onLinkClick) {
                                        onLinkClick(p.$path, false);
                                    } else {
                                        app.workspace.openLinkText(p.$path, "", false);
                                    }
                                }
                            }}
                            onMouseEnter={(e: MouseEvent) => {
                                if (p.$path) {
                                    app.workspace.trigger('hover-link', {
                                        event: e,
                                        source: 'dynamic-views',
                                        hoverParent: e.currentTarget,
                                        targetEl: e.currentTarget,
                                        linktext: p.$path,
                                        sourcePath: p.$path
                                    });
                                }
                            }}
                        >
                            {titleValue}
                        </a>
                        {settings.cardBottomDisplay === 'tags' && p.$tags && p.$tags.length > 0 ? (
                            <span className="list-meta">
                                {p.$tags.map((tag: string) => (
                                    <a
                                        key={tag}
                                        href="#"
                                        className="tag"
                                        onClick={(e: MouseEvent) => {
                                            e.preventDefault();
                                            const searchPlugin = app.internalPlugins.plugins["global-search"];
                                            if (searchPlugin && searchPlugin.instance) {
                                                const searchView = searchPlugin.instance;
                                                searchView.openGlobalSearch("tag:" + tag);
                                            }
                                        }}
                                    >
                                        {tag.replace(/^#/, '')}
                                    </a>
                                ))}
                            </span>
                        ) : settings.cardBottomDisplay === 'path' && folderPath ? (
                            <span className="list-meta list-path">{folderPath}</span>
                        ) : null}
                    </li>
                );
            })}
        </ul>
    );
}
