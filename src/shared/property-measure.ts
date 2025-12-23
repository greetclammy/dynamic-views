/**
 * Shared utility for measuring side-by-side property field widths
 */

import { updateScrollGradient } from "./scroll-gradient";

/** Field selector for odd fields (left side) */
const ODD_FIELD_SELECTOR =
  ".property-field-1, .property-field-3, .property-field-5, .property-field-7, .property-field-9, .property-field-11, .property-field-13";

/** Field selector for even fields (right side) */
const EVEN_FIELD_SELECTOR =
  ".property-field-2, .property-field-4, .property-field-6, .property-field-8, .property-field-10, .property-field-12, .property-field-14";

/**
 * Measures and applies optimal widths for a side-by-side property row
 */
export function measureSideBySideRow(row: HTMLElement): void {
  try {
    const card = row.closest(".card") as HTMLElement;
    const cardProperties = row.closest(".card-properties");
    if (!card || !cardProperties) return;

    // Skip if already measured
    if (row.classList.contains("property-measured")) return;

    // Skip in compact mode - CSS overrides measurement with 100% width
    if (card.classList.contains("compact-mode")) return;

    // Query fields fresh each time (avoids stale references)
    const field1 = row.querySelector(ODD_FIELD_SELECTOR) as HTMLElement;
    const field2 = row.querySelector(EVEN_FIELD_SELECTOR) as HTMLElement;
    if (!field1 || !field2) return;

    // Enter measuring state to remove constraints
    row.classList.add("property-measuring");

    // Force reflow
    void row.offsetWidth;

    // Get wrapper references for scroll reset later
    const wrapper1 = field1.querySelector(
      ".property-content-wrapper",
    ) as HTMLElement;
    const wrapper2 = field2.querySelector(
      ".property-content-wrapper",
    ) as HTMLElement;

    // Measure property-content (actual content, not wrapper which may be flex-grown)
    const content1 = field1.querySelector(".property-content") as HTMLElement;
    const content2 = field2.querySelector(".property-content") as HTMLElement;

    // Check if either field is truly empty (no content element)
    const field1Empty = !content1;
    const field2Empty = !content2;

    // Use cardProperties.clientWidth directly - it already accounts for
    // card padding and side cover constraints
    const containerWidth = cardProperties.clientWidth;

    // Guard against negative or zero width
    if (containerWidth <= 0) return;

    // Calculate optimal widths
    let field1Width: string;
    let field2Width: string;

    if (field1Empty) {
      // Only field2 has content: field2 gets full width (no gap needed)
      field1Width = "0px";
      field2Width = `${containerWidth}px`;
    } else if (field2Empty) {
      // Only field1 has content: field1 gets full width (no gap needed)
      field1Width = `${containerWidth}px`;
      field2Width = "0px";
    } else {
      // Both fields have content - measure and allocate

      // Measure inline labels if present
      const inlineLabel1 = field1.querySelector(
        ".property-label-inline",
      ) as HTMLElement;
      const inlineLabel2 = field2.querySelector(
        ".property-label-inline",
      ) as HTMLElement;

      // Measure above labels if present (need max of label vs content width)
      const aboveLabel1 = field1.querySelector(
        ".property-label",
      ) as HTMLElement;
      const aboveLabel2 = field2.querySelector(
        ".property-label",
      ) as HTMLElement;

      // Total width = content width + inline label width + gap (if inline label exists)
      let width1 = content1.scrollWidth;
      let width2 = content2.scrollWidth;

      // Account for above labels - field must fit the wider of label or content
      if (aboveLabel1) {
        width1 = Math.max(width1, aboveLabel1.scrollWidth);
      }
      if (aboveLabel2) {
        width2 = Math.max(width2, aboveLabel2.scrollWidth);
      }

      // Add inline label width + gap
      const inlineLabelGap = parseFloat(getComputedStyle(field1).gap) || 4;
      if (inlineLabel1) {
        width1 += inlineLabel1.scrollWidth + inlineLabelGap;
      }
      if (inlineLabel2) {
        width2 += inlineLabel2.scrollWidth + inlineLabelGap;
      }

      // Read field gap from CSS variable (var(--size-4-2))
      const fieldGap = parseFloat(getComputedStyle(row).gap) || 8;
      const availableWidth = containerWidth - fieldGap;

      // Guard against zero/negative available width
      if (availableWidth <= 0) return;

      const percent1 = (width1 / availableWidth) * 100;
      const percent2 = (width2 / availableWidth) * 100;

      if (percent1 <= 50) {
        // Field1 fits: field1 exact, field2 fills remainder
        field1Width = `${width1}px`;
        field2Width = `${availableWidth - width1}px`;
      } else if (percent2 <= 50) {
        // Field2 fits: field2 exact, field1 fills remainder
        field1Width = `${availableWidth - width2}px`;
        field2Width = `${width2}px`;
      } else {
        // Both > 50%: split 50-50
        const half = availableWidth / 2;
        field1Width = `${half}px`;
        field2Width = `${half}px`;
      }
    }

    // Apply calculated values
    row.style.setProperty("--field1-width", field1Width);
    row.style.setProperty("--field2-width", field2Width);
    row.classList.add("property-measured");

    // Reset scroll position to 0 for both wrappers
    if (wrapper1) wrapper1.scrollLeft = 0;
    if (wrapper2) wrapper2.scrollLeft = 0;

    // Update scroll gradients after layout settles (single RAF sufficient
    // since CSS variables apply synchronously after style.setProperty)
    requestAnimationFrame(() => {
      if (!field1Empty) updateScrollGradient(field1);
      if (!field2Empty) updateScrollGradient(field2);
    });
  } finally {
    // Always exit measuring state, even if error occurs
    row.classList.remove("property-measuring");
  }
}

/**
 * Resets measurement state and re-measures all side-by-side rows in a container
 * Call this when property label mode changes
 */
export function remeasurePropertyFields(container: HTMLElement): void {
  if (document.body.classList.contains("dynamic-views-property-width-50-50")) {
    return;
  }

  const rows = container.querySelectorAll(".property-row-sidebyside");
  rows.forEach((row) => {
    const rowEl = row as HTMLElement;
    // Clear measured state to allow re-measurement
    rowEl.classList.remove("property-measured");
    rowEl.style.removeProperty("--field1-width");
    rowEl.style.removeProperty("--field2-width");

    requestAnimationFrame(() => {
      measureSideBySideRow(rowEl);
    });
  });
}

/**
 * Measures all side-by-side property rows in a card element.
 * Uses a single ResizeObserver per card for efficiency.
 * Returns observer for cleanup.
 */
export function measurePropertyFields(cardEl: HTMLElement): ResizeObserver[] {
  // Skip measurement if 50-50 mode - default CSS is already 50-50
  if (document.body.classList.contains("dynamic-views-property-width-50-50")) {
    return [];
  }

  const rows = cardEl.querySelectorAll(".property-row-sidebyside");
  if (rows.length === 0) return [];

  // Card-properties container is inside the card
  const cardProps = cardEl.querySelector(".card-properties") as HTMLElement;
  if (!cardProps) return [];

  // Single ResizeObserver handles both size changes and visibility
  // (fires when element transitions from hidden/0-size to visible)
  let rafPending = false;
  const observer = new ResizeObserver(() => {
    // Skip if RAF already queued (debounce rapid resize events)
    if (rafPending) return;
    // Skip in compact mode or if container has no width
    if (cardEl.classList.contains("compact-mode")) return;
    if (cardProps.clientWidth <= 0) return;

    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      rows.forEach((row) => {
        const rowEl = row as HTMLElement;
        rowEl.classList.remove("property-measured");
        measureSideBySideRow(rowEl);
      });
    });
  });
  observer.observe(cardEl);

  return [observer];
}
