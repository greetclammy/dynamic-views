/**
 * Shared masonry layout logic for both Bases and Datacore views
 * Pure positioning calculations - no DOM manipulation
 */

export interface MasonryPosition {
    left: number;
    top: number;
    visualRow: number;
}

export interface MasonryLayoutParams {
    cards: HTMLElement[];
    containerWidth: number;
    cardSize: number; // Represents minimum width; actual width may be larger to fill space
    minColumns: number;
    gap: number;
}

export interface MasonryLayoutResult {
    positions: MasonryPosition[];
    columnHeights: number[];
    containerHeight: number;
    cardWidth: number;
    columns: number;
}

/**
 * Calculate masonry layout positions for cards
 * Pure function - no side effects
 */
export function calculateMasonryLayout(params: MasonryLayoutParams): MasonryLayoutResult {
    const { cards, containerWidth, cardSize, minColumns, gap } = params;

    // Calculate number of columns
    const columns = Math.max(
        minColumns,
        Math.floor((containerWidth + gap) / (cardSize + gap))
    );

    // Calculate card width based on columns
    const cardWidth = (containerWidth - (gap * (columns - 1))) / columns;

    // Initialize column heights
    const columnHeights: number[] = new Array(columns).fill(0) as number[];
    const positions: MasonryPosition[] = [];

    // Calculate positions for each card (without visualRow initially)
    const tempPositions: Array<{ left: number; top: number }> = [];

    cards.forEach((card) => {
        // Find shortest column
        const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));

        // Calculate position
        const left = shortestColumn * (cardWidth + gap);
        const top = columnHeights[shortestColumn];

        tempPositions.push({ left, top });

        // Update column height using card's current height
        const cardHeight = card.offsetHeight;
        columnHeights[shortestColumn] += cardHeight + gap;
    });

    // Determine visual rows by grouping cards with similar top positions
    const rowTolerance = 20; // Cards within 20px vertically are considered same row
    const sortedByTop = tempPositions
        .map((pos, index) => ({ ...pos, index }))
        .sort((a, b) => a.top - b.top);

    let currentRow = 0;
    let lastTopValue = -Infinity;
    const visualRowMap: number[] = new Array(tempPositions.length).fill(0) as number[];

    sortedByTop.forEach(({ top, index }) => {
        if (top - lastTopValue > rowTolerance) {
            currentRow++;
            lastTopValue = top;
        }
        visualRowMap[index] = currentRow;
    });

    // Create final positions array with visualRow
    tempPositions.forEach((pos, index) => {
        positions.push({
            left: pos.left,
            top: pos.top,
            visualRow: visualRowMap[index]
        });
    });

    // Calculate container height
    const containerHeight = Math.max(...columnHeights);

    return {
        positions,
        columnHeights,
        containerHeight,
        cardWidth,
        columns
    };
}

/**
 * Apply masonry layout directly to DOM elements
 * Used when bypassing React for performance
 */
export function applyMasonryLayout(
    container: HTMLElement,
    cards: HTMLElement[],
    result: MasonryLayoutResult
): void {
    // Set container properties
    container.style.position = 'relative';
    container.style.height = `${result.containerHeight}px`;

    // Position each card
    cards.forEach((card, index) => {
        const pos = result.positions[index];
        card.style.position = 'absolute';
        card.style.width = `${result.cardWidth}px`;
        card.style.left = `${pos.left}px`;
        card.style.top = `${pos.top}px`;
        card.style.transition = 'box-shadow var(--anim-duration-fast) ease-in-out, border-color 0.2s';

        // Add data attribute for row-based styling (odd/even)
        const rowParity = pos.visualRow % 2 === 1 ? 'odd' : 'even';
        card.setAttribute('data-masonry-row', rowParity);
    });
}
