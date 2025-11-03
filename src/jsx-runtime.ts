// JSX Runtime Proxy for Datacore Integration
// This module provides h() and Fragment() that delegate to Datacore's bundled Preact
// All JSX compiled by esbuild will use these functions

// Store reference to Datacore's Preact h and Fragment
let datacoreH: any = null;
let datacoreFragment: any = null;

/**
 * Initialize the JSX runtime with Datacore's Preact implementation.
 * Must be called before any components render.
 */
export function setDatacorePreact(preact: any) {
    datacoreH = preact.h;
    datacoreFragment = preact.Fragment;
}

/**
 * Proxy h function that delegates to Datacore's Preact.
 * This is called by all esbuild-compiled JSX: <div> becomes h('div', ...)
 */
export function h(type: any, props: any, ...children: any[]) {
    if (!datacoreH) {
        throw new Error(
            'Datacore Preact not initialized. ' +
            'Call setDatacorePreact(dc.preact) before rendering components.'
        );
    }
    // Delegate directly to Datacore's h - it handles VNode creation with all internal properties
    return datacoreH(type, props, ...children);
}

/**
 * Proxy Fragment that delegates to Datacore's Preact Fragment.
 * Used for JSX fragments: <>...</>
 */
export function Fragment(props: any) {
    if (!datacoreFragment) {
        throw new Error('Datacore Preact not initialized.');
    }
    return datacoreFragment(props);
}

// Make h and Fragment globally available for esbuild-compiled JSX
if (typeof globalThis !== 'undefined') {
    (globalThis as any).h = h;
    (globalThis as any).Fragment = Fragment;
}
