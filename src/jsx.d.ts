// JSX type definitions for datacorejsx context (non-React)
// Note: JSX namespace requires broad types for compatibility with Datacore's Preact runtime
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }
  type Element = unknown;
  interface ElementClass {
    render: () => Element;
  }
  interface ElementAttributesProperty {
    props: object;
  }
  interface ElementChildrenAttribute {
    children: object;
  }
}

// Fragment component type for JSX <>...</> syntax
type FragmentComponent = (props: { children?: unknown }) => JSX.Element;

// Declare global h and Fragment functions (Datacore's Preact runtime)
declare function h(
  type: unknown,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): JSX.Element;
declare const Fragment: FragmentComponent;
