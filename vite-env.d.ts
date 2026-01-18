import 'vite/client';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      group: any;
      ambientLight: any;
      pointLight: any;
      primitive: any;
    }
  }
}
