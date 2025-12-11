/**
 * Image viewer zoom/pan gestures using panzoom library
 */

import Panzoom, { PanzoomObject } from "@panzoom/panzoom";
import {
  getZoomSensitivity,
  getZoomSensitivityMobile,
} from "../utils/style-settings";

/** Double-tap detection threshold in ms */
const DOUBLE_TAP_THRESHOLD = 300;

/** Wheel event listener options (stored for proper cleanup) */
const WHEEL_OPTIONS: AddEventListenerOptions = { passive: false };

/**
 * Setup zoom and pan gestures for an image in the viewer
 * @param imgEl - The image element
 * @param container - The container element (overlay or embed)
 * @returns Cleanup function
 */
export function setupImageViewerGestures(
  imgEl: HTMLImageElement,
  container: HTMLElement,
): () => void {
  let panzoomInstance: PanzoomObject | null = null;
  let clickHandler: ((e: MouseEvent) => void) | null = null;
  let dblclickHandler: ((e: MouseEvent) => void) | null = null;
  let contextmenuHandler: ((e: MouseEvent) => void) | null = null;
  let loadHandler: (() => void) | null = null;
  let errorHandler: (() => void) | null = null;
  let touchendHandler: ((e: TouchEvent) => void) | null = null;
  let resizeHandler: (() => void) | null = null;
  let lastTapTime = 0;

  // Cache viewport dimensions (updated on resize)
  let cachedViewportWidth = window.innerWidth;
  let cachedViewportHeight = window.innerHeight;

  function attachPanzoom(): void {
    const isMobile = document.body.classList.contains("is-mobile");
    const zoomSensitivity = isMobile
      ? getZoomSensitivityMobile()
      : getZoomSensitivity();

    // Setup resize handler for mobile to update cached viewport dimensions
    if (isMobile) {
      resizeHandler = () => {
        cachedViewportWidth = window.innerWidth;
        cachedViewportHeight = window.innerHeight;
      };
      window.addEventListener("resize", resizeHandler);
    }

    // Mobile: custom transform with pan clamping (IIFE to encapsulate state)
    const mobileSetTransform = isMobile
      ? (() => {
          let panX = 0;
          let panY = 0;
          let lastScale = 1;
          let cachedImgWidth = 0;
          let cachedImgHeight = 0;

          return (
            elem: HTMLElement,
            { scale, x, y }: { scale: number; x: number; y: number },
          ) => {
            // Cache image dimensions on first call or scale change (avoid reflow on every transform)
            if (cachedImgWidth === 0 || scale !== lastScale) {
              cachedImgWidth = elem.offsetWidth;
              cachedImgHeight = elem.offsetHeight;
            }

            // Scaled dimensions
            const scaledWidth = cachedImgWidth * scale;
            const scaledHeight = cachedImgHeight * scale;

            // Max pan in pre-scale coordinates
            // Horizontal: image edges stay at viewport edges (no empty space)
            const maxPanX = Math.max(
              0,
              (scaledWidth - cachedViewportWidth) / 2 / scale,
            );
            // Vertical: ~26% viewport visible at pan limit (dividing by 3.85 ≈ 26%)
            // This matches native Obsidian mobile image viewer behavior
            const maxPanY = Math.max(
              0,
              (scaledHeight - cachedViewportHeight / 3.85) / 2 / scale,
            );

            // On scale change, clamp pan to new bounds (intentional: prevents image going offscreen)
            if (scale !== lastScale) {
              panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
              panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
              lastScale = scale;
            }

            // Calculate delta from panzoom's accumulated values
            // We track our own pan to avoid focal point offset issues
            const extElem = elem as HTMLElement & {
              __lastX?: number;
              __lastY?: number;
            };
            const deltaX = x - (extElem.__lastX ?? x);
            const deltaY = y - (extElem.__lastY ?? y);
            extElem.__lastX = x;
            extElem.__lastY = y;

            // Apply delta to our tracked pan, then clamp
            panX = Math.max(-maxPanX, Math.min(maxPanX, panX + deltaX));
            panY = Math.max(-maxPanY, Math.min(maxPanY, panY + deltaY));

            elem.style.transform = `scale(${scale}) translate(${panX}px, ${panY}px)`;
          };
        })()
      : undefined;

    panzoomInstance = Panzoom(imgEl, {
      maxScale: isMobile ? 9 : 4,
      minScale: 1,
      startScale: 1,
      step: zoomSensitivity,
      canvas: false,
      cursor: isMobile ? "default" : "move",
      ...(mobileSetTransform && { setTransform: mobileSetTransform }),
    });

    // Enable wheel zoom on container
    // If scroll zoom disabled, only allow pinch (browser sets ctrlKey for trackpad pinch)
    // Desktop: only zoom when cursor is over the image (not the overlay)
    const isScrollZoomDisabled = document.body.classList.contains(
      "dynamic-views-scroll-zoom-disabled",
    );
    const wheelHandler = (e: WheelEvent) => {
      // Desktop: ignore wheel events on overlay (only zoom when cursor over image)
      if (!isMobile && e.target !== imgEl) return;
      if (isScrollZoomDisabled && !e.ctrlKey) return;
      panzoomInstance!.zoomWithWheel(e);
    };
    container.addEventListener("wheel", wheelHandler, WHEEL_OPTIONS);
    (
      container as HTMLElement & { __wheelHandler?: typeof wheelHandler }
    ).__wheelHandler = wheelHandler;

    // Prevent clicks on image from bubbling to close handlers
    clickHandler = (e: MouseEvent) => {
      e.stopPropagation();
    };
    imgEl.addEventListener("click", clickHandler);

    // Double-click to reset to original position
    dblclickHandler = (e: MouseEvent) => {
      e.stopPropagation();
      panzoomInstance?.reset();
    };
    imgEl.addEventListener("dblclick", dblclickHandler);

    // Right-click resets to initial size
    contextmenuHandler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      panzoomInstance?.reset();
    };
    imgEl.addEventListener("contextmenu", contextmenuHandler);

    // Mobile double-tap to reset (dblclick doesn't fire reliably on touch)
    if (isMobile) {
      touchendHandler = (e: TouchEvent) => {
        // Only trigger on single-finger lift (exactly 1 finger released, none remaining)
        // This prevents pinch gestures from accidentally triggering reset
        if (e.changedTouches.length !== 1 || e.touches.length > 0) return;
        const now = Date.now();
        if (now - lastTapTime < DOUBLE_TAP_THRESHOLD) {
          e.preventDefault();
          panzoomInstance?.reset();
          lastTapTime = 0; // Reset to avoid triple-tap triggering
        } else {
          lastTapTime = now;
        }
      };
      imgEl.addEventListener("touchend", touchendHandler);
    }
  }

  // Check if image already loaded
  if (imgEl.complete && imgEl.naturalWidth > 0) {
    attachPanzoom();
  } else {
    loadHandler = () => {
      attachPanzoom();
    };
    imgEl.addEventListener("load", loadHandler, { once: true });

    // Handle image load errors
    errorHandler = () => {
      console.warn("Image failed to load, viewer gestures not attached");
    };
    imgEl.addEventListener("error", errorHandler, { once: true });
  }

  // Return cleanup function
  return () => {
    if (panzoomInstance) {
      const extContainer = container as HTMLElement & {
        __pinchHandler?: (e: WheelEvent) => void;
      };
      if (extContainer.__pinchHandler) {
        container.removeEventListener(
          "wheel",
          extContainer.__pinchHandler,
          WHEEL_OPTIONS,
        );
        delete extContainer.__pinchHandler;
      } else {
        container.removeEventListener(
          "wheel",
          panzoomInstance.zoomWithWheel,
          WHEEL_OPTIONS,
        );
      }
      panzoomInstance.destroy();
    }
    // Clean up extended properties used for delta tracking
    delete (imgEl as HTMLElement & { __lastX?: number; __lastY?: number })
      .__lastX;
    delete (imgEl as HTMLElement & { __lastX?: number; __lastY?: number })
      .__lastY;
    if (clickHandler) {
      imgEl.removeEventListener("click", clickHandler);
    }
    if (dblclickHandler) {
      imgEl.removeEventListener("dblclick", dblclickHandler);
    }
    if (contextmenuHandler) {
      imgEl.removeEventListener("contextmenu", contextmenuHandler);
    }
    if (touchendHandler) {
      imgEl.removeEventListener("touchend", touchendHandler);
    }
    if (loadHandler) {
      imgEl.removeEventListener("load", loadHandler);
    }
    if (errorHandler) {
      imgEl.removeEventListener("error", errorHandler);
    }
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
    }
  };
}
