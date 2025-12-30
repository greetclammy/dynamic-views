# Comprehensive Code Audit Report

**Date:** 2025-12-30
**Scope:** All code paths affected by slideshow/image-viewer fixes and stashed changes

---

## Executive Summary

Audited 7 files with 6 parallel code-reviewer agents. Found **31 issues** across severity levels:

- **Critical (12):** Memory leaks, race conditions, logic errors requiring immediate fix
- **Important (11):** Edge cases, inconsistencies, potential issues under specific conditions
- **Optimization (8):** Performance improvements, code cleanup, maintainability

---

## Critical Issues

### 1. slideshow.ts:258 - `isAnimating` flag never reset on recursive navigation failure

**Confidence: 100%**

When image error handler schedules recursive `navigate()` and that call returns early (signal aborted, no elements, or all URLs failed), `isAnimating` remains `true` forever, breaking all future navigation.

```typescript
// Current (broken):
const timeoutId = setTimeout(() => {
  pendingTimeouts.delete(timeoutId);
  if (!signal.aborted) {
    nextImg.style.display = "";
    navigate(direction, honorGestureDirection); // May return early without resetting flag
  }
}, SLIDESHOW_ANIMATION_MS + 50);

// Fix: Reset flag before recursive call
isAnimating = false;
navigate(direction, honorGestureDirection);
```

---

### 2. slideshow.ts:89 - Race condition in `getExternalBlobUrl` deduplication

**Confidence: 95%**

When cleanup happens while pending fetch is in flight, the deduplication path returns the pending promise without checking `isCleanedUp` flag. Caller receives blob URL that gets immediately orphaned.

```typescript
// Current (broken):
if (pendingFetches.has(url)) return pendingFetches.get(url)!;

// Fix:
if (pendingFetches.has(url)) {
  if (isCleanedUp) return url;
  return pendingFetches.get(url)!;
}
```

---

### 3. slideshow.ts:247-249 - Error handler URL comparison races with navigation

**Confidence: 85%**

Between error event firing and handler executing, another navigation could change `nextImg.src`. Handler compares current src with expected URL from closure, causing legitimate errors to be ignored.

```typescript
// Current (broken):
if (nextImg.src !== expectedUrl) return;

// Fix: Use event target instead of element reference
nextImg.addEventListener("error", (e) => {
  if ((e.target as HTMLImageElement).src !== expectedUrl) return;
  // ...
});
```

---

### 4. slideshow.ts:28-35 - Memory leak in `validateBlobUrl`

**Confidence: 90%**

Image object created for validation never cleaned up. Handlers remain attached, src not cleared.

```typescript
// Fix: Clear handlers and src after resolution
const cleanup = (result: boolean) => {
  img.onload = null;
  img.onerror = null;
  img.src = "";
  resolve(result);
};
```

---

### 5. card-renderer.tsx:1970-2048 - ResizeObserver memory leak in side cover

**Confidence: 95%**

Observer created inside `setTimeout` never stored in Map, no cleanup on unmount. Each re-render creates new orphaned observer.

```typescript
// Current (broken):
setTimeout(() => {
  const resizeObserver = new ResizeObserver(...);
  resizeObserver.observe(cardEl);
  // Never stored, never cleaned up
}, 100);

// Fix: Use ref callback + store in cardResizeObservers Map
```

---

### 6. card-renderer.tsx:626-647 - Fragile URL substring check in error handler

**Confidence: 90%**

Uses `includes(...slice(-30))` for URL comparison which fails with shared suffixes or URL changes.

```typescript
// Current (broken):
!firstImg.src.includes(expectedFirstUrl.split("?")[0].slice(-30));

// Fix: Store and compare exact expected URL
const expectedSrc = getCachedBlobUrl(imageArray[0]);
if (firstImg.src !== expectedSrc) return;
```

---

### 7. shared-renderer.ts:1094-1117 - Race condition in backdrop fallback

**Confidence: 95%**

`tryNextBackdropImage` modifies DOM without checking if signal is aborted. Can leave image in inconsistent state.

```typescript
// Fix: Add abort check at start and in loop
const tryNextBackdropImage = () => {
  if (signal.aborted) return;
  // ... rest of logic
};
```

---

### 8. shared-renderer.ts:1453-1494 - Same race condition in `renderImage` fallback

**Confidence: 90%**

Identical pattern to #7 - DOM mutations without abort checks.

---

### 9. image-viewer.ts:783-788 - ResizeObserver leak in error path

**Confidence: 95%**

When gesture setup throws, `resizeObserver` created earlier isn't disconnected in catch block.

```typescript
// Fix: Add to catch block
} catch (error) {
  resizeObserver?.disconnect(); // Add this
  modalObserver.disconnect();
  cloneEl.remove();
  // ...
}
```

---

### 10. image.ts:148 - YouTube ID returns `undefined` for malformed URLs

**Confidence: 95%**

`segments[2]` accessed without existence check, returns `undefined` instead of `null`.

```typescript
// Current (broken):
if (["embed", "shorts", "v"].includes(segments[1])) return segments[2];

// Fix:
if (["embed", "shorts", "v"].includes(segments[1]) && segments[2])
  return segments[2];
```

---

### 11. image.ts:166-176 - Thumbnail validation timeout not cleaned

**Confidence: 90%**

5-second timeout continues running after image loads, wastes resources.

```typescript
// Fix: Store timeout ID and clear on load/error
const timeoutId = setTimeout(() => resolve(false), 5000);
img.onload = () => { clearTimeout(timeoutId); resolve(...); };
img.onerror = () => { clearTimeout(timeoutId); resolve(false); };
```

---

### 12. image.ts:49 - Wikilink fragments not stripped

**Confidence: 82%**

Regex doesn't strip `#heading` or `#^block` fragments from wikilinks, causing resolution failures.

```typescript
// Current:
/^!?\[\[([^\]|]+)(?:\|[^\]]*)?\]\]$/

// Fix: Exclude fragments
/^!?\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]$/
```

---

## Important Issues

### 13. shared-renderer.ts:1034-1060 - ResizeObservers not tied to AbortSignal

**Confidence: 100%**

Observers added to `this.propertyObservers` but not cleaned when signal aborts. Accumulate during rapid re-renders.

---

### 14. shared-renderer.ts:1496-1567 - Thumbnail scrubbing state leak

**Confidence: 85%**

`cachedRect` in closure not cleared when element removed from DOM while hovered.

---

### 15. card-renderer.tsx:564-673 vs shared-renderer.ts - Inconsistent slideshow cleanup

**Confidence: 85%**

JSX stores AbortController on element with cleanup check; shared-renderer doesn't. Causes listener leaks in Bases views.

---

### 16. card-renderer.tsx:1955-1967 - Backdrop missing multi-image fallback in JSX

**Confidence: 80%**

shared-renderer.ts has backdrop multi-image fallback (1094-1129), JSX doesn't. Feature gap.

---

### 17. image-loader.ts:23-31 - Cache never invalidates on file changes

**Confidence: 85%**

Stale RGB values and aspect ratios persist when images are modified until plugin reload.

---

### 18. image-loader.ts:386-434 - Race condition on instant image load

**Confidence: 82%**

If image loads before React attaches onLoad handler, `cover-ready` class never added.

---

### 19. image.ts:476-479 - Content truncation may cut mid-wikilink

**Confidence: 80%**

100KB truncation at arbitrary byte position can split wikilinks, causing non-deterministic behavior.

---

### 20. image.ts:482-487 - Frontmatter stripping fails on Windows newlines

**Confidence: 80%**

Only checks for `---\n`, not `---\r\n`.

---

### 21. slideshow.ts:522 - `setupImagePreload` doesn't skip failed URLs

**Confidence: 80%**

Preloads known-failed internal images, wasting resources.

---

### 22. image-viewer.ts:916 - Redundant cleanup call on new clone

**Confidence: 90%**

`viewerListenerCleanups.get(cloneEl)?.()` called on newly created clone which can't have existing entry.

---

### 23. styles.css:5290,5299 - Possibly unnecessary `!important` on slideshow

**Confidence: 85%**

Comments claim override of "contain mode" rules, but those rules not found. Needs verification.

---

## Optimization Opportunities

### 24. slideshow.ts:248 - Redundant blob URL lookup

Cache `effectiveUrl` in closure instead of calling `getCachedBlobUrl` twice.

### 25. image.ts:38 - Hardcoded regex can drift from extensions array

Generate regex from `VALID_IMAGE_EXTENSIONS` or add sync test.

### 26. image.ts:82 - Redundant extension validation

`hasValidImageExtension` check in `processImagePaths` duplicates post-resolution check.

### 27. image.ts:367 - Inline code regex recreated on each call

Move `INLINE_CODE_REGEX` to module scope.

### 28. card-renderer.tsx:1973 - Uses setTimeout instead of requestAnimationFrame

Imperative renderer uses rAF for dimension calculation; JSX should match.

### 29. card-renderer.tsx:589-592 + slideshow.ts:510-536 - Double preload calls

Both files call `setupImagePreload` with separate `preloaded` flags.

### 30. styles.css:5482-5490 - Mobile slideshow indicator too small for touch

22x22px is below iOS 44x44pt minimum touch target guideline.

### 31. styles.css:5403-5406 - Hover styles apply to mobile needlessly

Add `@media (hover: hover)` to exclude touch devices.

---

## Test Coverage Gaps

1. **slideshow.ts** - No tests for:
   - Error recovery and auto-advance
   - `isAnimating` flag state machine
   - Rapid navigation race conditions
   - AbortSignal cleanup

2. **image-viewer.ts** - No tests for:
   - Clone cleanup on error
   - ResizeObserver lifecycle
   - Slideshow image removal from clone

3. **image.ts** - Missing edge cases:
   - YouTube URLs without video ID
   - Wikilinks with fragments
   - Windows-style newlines in frontmatter

---

## Recommended Priority

### Phase 1 - Critical Memory Leaks (Immediate)

- #1: `isAnimating` flag reset
- #4: `validateBlobUrl` cleanup
- #5: Side cover ResizeObserver
- #9: image-viewer error path cleanup

### Phase 2 - Race Conditions (High)

- #2: `getExternalBlobUrl` deduplication
- #3: Error handler URL comparison
- #6: Fragile URL substring check
- #7, #8: Backdrop/cover fallback abort checks

### Phase 3 - Edge Cases (Medium)

- #10-12: image.ts URL/wikilink parsing
- #13-14: shared-renderer cleanup issues
- #17-20: image-loader/extraction edge cases

### Phase 4 - Consistency & Optimization (Low)

- #15-16: JSX/imperative feature parity
- #24-31: Performance and code quality

---

## Files Requiring Changes

| File               | Issues                                 | Severity           |
| ------------------ | -------------------------------------- | ------------------ |
| slideshow.ts       | #1, #2, #3, #4, #21, #24               | Critical           |
| card-renderer.tsx  | #5, #6, #15, #16, #28, #29             | Critical           |
| shared-renderer.ts | #7, #8, #13, #14                       | Critical           |
| image-viewer.ts    | #9, #22                                | Critical           |
| image.ts           | #10, #11, #12, #19, #20, #25, #26, #27 | Critical/Important |
| image-loader.ts    | #17, #18                               | Important          |
| styles.css         | #23, #30, #31                          | Low                |
