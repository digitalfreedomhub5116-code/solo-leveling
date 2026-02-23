
// Removed missing vite/client reference
// /// <reference types="vite/client" />

export {};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      group: any;
      ambientLight: any;
      pointLight: any;
      primitive: any;
      spotLight: any;
      directionalLight: any;
      hemisphereLight: any;
      [elemName: string]: any;
    }
  }
}
