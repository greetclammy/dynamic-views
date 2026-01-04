# Audit Report: Cover Border Radius and Hover Zoom Settings

## Changes Made This Session

### 1. Cover Border Radius Slider (Style Settings)

- **Max value**: Changed from 32 → 400 → 48px
- **Location**: `styles.css:312`

### 2. Round Covers Toggle (New Feature)

- **Setting ID**: `dynamic-views-cover-circular`
- **Body class**: `dynamic-views-cover-circular`
- **Effect**: Applies `border-radius: 50%` to covers
- **Location**: `styles.css:316-319` (definition), `styles.css:4457-4471` (CSS rules)

### 3. Hover Zoom Dropdown (Refactored from Toggle)

- **Setting ID**: `dynamic-views-cover-hover-zoom`
- **Type**: Changed from `class-toggle` to `class-select`
- **Options**:
  - `dynamic-views-cover-hover-zoom-cover` - zoom on cover hover
  - `dynamic-views-cover-hover-zoom-card` - zoom on card hover
  - `dynamic-views-cover-hover-zoom-off` - disabled (default)
- **Location**: `styles.css:331-346` (definition), `styles.css:4509-4545` (CSS rules)

---

## Issues Found

### Critical - BUG: Transition Property Override

**Location**: `styles.css:4524`

**Problem**: When hover zoom is enabled, the transition declaration overrides the base opacity transition, breaking the cover image fade-in animation.

**Base rule** (line 4502):

```css
.dynamic-views .card.image-format-cover .card-cover img {
  transition: opacity var(--anim-duration-moderate, 300ms) ease;
}
```

**Hover zoom rule** (line 4524):

```css
body.dynamic-views-cover-hover-zoom-cover
  .dynamic-views
  .card.image-format-cover
  .card-cover
  .dynamic-views-image-embed
  img {
  transition: transform var(--anim-duration-fast, 140ms) ease;
}
```

Both selectors match the same `<img>` element. The hover zoom selector has higher specificity (body class prefix), so it completely replaces the opacity transition instead of adding to it.

**Impact**: When hover zoom is enabled, cover images appear instantly instead of fading in smoothly.

**Fix**: Include both transitions in the hover zoom rule:

```css
transition:
  transform var(--anim-duration-fast, 140ms) ease,
  opacity var(--anim-duration-moderate, 300ms) ease;
```

---

## No Issues Found

### 1. Round Covers Toggle - Correct Implementation

- Applies to all three elements: `.card-cover-wrapper`, `.card-cover`, `.card-cover-placeholder`
- Correctly overrides the border-radius slider value when enabled
- Works with all cover positions (top, bottom, left, right)
- Note: Non-square covers will be elliptical, not circular - this is expected behavior

### 2. Hover Zoom Dropdown - Correct class-select Syntax

- Uses full class names as values (not short suffixes)
- Includes `allowEmpty: false` for consistency with other class-selects
- Default value `dynamic-views-cover-hover-zoom-off` doesn't add any CSS rules (correct)

### 3. No Orphaned Code

- No references to old toggle class name `dynamic-views-cover-hover-zoom` (without suffix)
- No JS/TS code references any of these CSS classes - they're pure Style Settings features

### 4. Border Radius Max Values Consistent

- Cover: 48px
- Thumbnail: 48px
- Card: Separate slider, not changed

### 5. @media (hover: hover) Correct

- Hover zoom only activates on devices with hover capability
- Touch devices won't trigger the effect (prevents sticky hover states)

---

## Code Quality Observations

### Good Patterns

- CSS-only implementation - no JS changes needed for pure visual settings
- Consistent selector structure with other Style Settings rules
- Proper use of `@media (hover: hover)` for desktop-only effects

### Minor Observations (Non-blocking)

- The circular cover toggle could be extended to thumbnails for parity, but this wasn't requested
- Description "Make cover corners perfectly rounded" is accurate and user-friendly

---

## Test Coverage

### Not Applicable

- These are pure CSS features controlled by Style Settings
- No JS logic to unit test
- Visual testing should verify:
  1. Cover border radius slider works (0-48px)
  2. Round covers toggle overrides slider
  3. Hover zoom on cover only zooms when hovering cover element
  4. Hover zoom on card zooms when hovering anywhere on card
  5. Disabled option shows no hover effect
  6. Fade-in animation still works with hover zoom enabled (after fix)

---

## Recommendations

### Must Fix

1. **Transition override bug** - Add opacity transition to hover zoom rules

### Consider Later

- Add "Round thumbnails" toggle for parity with covers
- Add "Hover zoom" for thumbnails (if requested)

---

## Summary

| Item                           | Status                       |
| ------------------------------ | ---------------------------- |
| Cover border radius max (48px) | ✅ Correct                   |
| Round covers toggle            | ✅ Correct                   |
| Hover zoom dropdown            | ⚠️ Bug - transition override |
| No orphaned code               | ✅ Verified                  |
| No dead code                   | ✅ Verified                  |

**Action Required**: Fix transition override bug in hover zoom CSS rules.
