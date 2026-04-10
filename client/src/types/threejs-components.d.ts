// Type declarations for CDN-loaded modules (dynamic imports from URLs)
declare module 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js' {
  interface TubesCursorInstance {
    tubes: {
      setColors: (colors: string[]) => void;
      setLightsColors: (colors: string[]) => void;
    };
    dispose?: () => void;
  }

  const TubesCursorFactory: (
    canvas: HTMLCanvasElement,
    options: Record<string, unknown>
  ) => TubesCursorInstance;

  export default TubesCursorFactory;
}
