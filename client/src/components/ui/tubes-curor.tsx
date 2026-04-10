import React, { useEffect, useRef, useCallback } from 'react';

// Type for the TubesCursor instance returned by the library
interface TubesCursorInstance {
  tubes: {
    setColors: (colors: string[]) => void;
    setLightsColors: (colors: string[]) => void;
  };
  dispose?: () => void;
}

/**
 * Generates an array of random hex color strings.
 * @param count - The number of random colors to generate.
 * @returns An array of color strings.
 */
const randomColors = (count: number): string[] => {
  return new Array(count)
    .fill(0)
    .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
};

/**
 * TubesCursorBackground — Background-only variant.
 * Renders a full-screen interactive canvas behind all page content.
 * The tubes follow the cursor and colors randomize on click.
 * The canvas is interactive (pointer-events enabled) so the 3D cursor
 * tracking works everywhere, including behind UI elements.
 */
export function TubesCursorBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<TubesCursorInstance | null>(null);
  const autoAnimRef = useRef<number | null>(null);
  const isTouchingRef = useRef(false);

  // Detect touch device
  const isTouchDevice = typeof window !== 'undefined' && (
    'ontouchstart' in window || navigator.maxTouchPoints > 0
  );

  // Handle resize to keep canvas pixel-perfect on all devices
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }, []);

  // Dispatch a synthetic mousemove on the canvas so the Three.js library picks it up
  const dispatchMouseMove = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const event = new MouseEvent('mousemove', {
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
    });
    canvas.dispatchEvent(event);
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    const initTimer = setTimeout(() => {
      import(
        /* @vite-ignore */
        'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js'
      )
        .then((module: { default: (canvas: HTMLCanvasElement, options: Record<string, unknown>) => TubesCursorInstance }) => {
          const TubesCursorFactory = module.default;
          if (canvasRef.current) {
            const app = TubesCursorFactory(canvasRef.current, {
              tubes: {
                colors: ["#5e72e4", "#8965e0", "#f5365c"],
                lights: {
                  intensity: 200,
                  colors: ["#21d4fd", "#b721ff", "#f4d03f", "#11cdef"]
                }
              }
            });
            appRef.current = app;

            // Start auto-animation on touch devices
            if (isTouchDevice) {
              startAutoAnimation();
            }
          }
        })
        .catch((err: Error) => console.error("Failed to load TubesCursor module:", err));
    }, 100);

    // Forward touch events → synthetic mousemove so tubes follow finger
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        isTouchingRef.current = true;
        // Stop auto-animation while user is touching
        if (autoAnimRef.current) {
          cancelAnimationFrame(autoAnimRef.current);
          autoAnimRef.current = null;
        }
        dispatchMouseMove(touch.clientX, touch.clientY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      isTouchingRef.current = true;
      if (autoAnimRef.current) {
        cancelAnimationFrame(autoAnimRef.current);
        autoAnimRef.current = null;
      }
      const touch = e.touches[0];
      if (touch) {
        dispatchMouseMove(touch.clientX, touch.clientY);
      }
      // Color change on tap
      if (appRef.current) {
        appRef.current.tubes.setColors(randomColors(3));
        appRef.current.tubes.setLightsColors(randomColors(4));
      }
    };

    const handleTouchEnd = () => {
      isTouchingRef.current = false;
      // Restart auto-animation after touch ends (with a small delay)
      setTimeout(() => {
        if (!isTouchingRef.current && isTouchDevice) {
          startAutoAnimation();
        }
      }, 2000);
    };

    // Randomize colors on click (desktop)
    const handleClick = () => {
      if (appRef.current) {
        appRef.current.tubes.setColors(randomColors(3));
        appRef.current.tubes.setLightsColors(randomColors(4));
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('click', handleClick);

    return () => {
      clearTimeout(initTimer);
      if (autoAnimRef.current) cancelAnimationFrame(autoAnimRef.current);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      if (appRef.current && typeof appRef.current.dispose === 'function') {
        appRef.current.dispose();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleResize, dispatchMouseMove]);

  // Auto-animation: gently move the virtual cursor in a figure-8/lissajous pattern
  // so the tubes are always moving on mobile, even without touch
  const startAutoAnimation = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    let startTime = Date.now();

    const animate = () => {
      if (isTouchingRef.current) return; // Stop if user is touching
      const t = (Date.now() - startTime) * 0.0004; // Slow speed
      // Lissajous curve for organic movement
      const x = w * 0.5 + Math.sin(t * 1.3) * w * 0.3;
      const y = h * 0.5 + Math.sin(t * 0.9) * h * 0.25;
      dispatchMouseMove(x, y);
      autoAnimRef.current = requestAnimationFrame(animate);
    };
    autoAnimRef.current = requestAnimationFrame(animate);
  }, [dispatchMouseMove]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

/**
 * TubesCursor — Standalone full-screen demo component.
 * Includes the animation canvas with hero text overlay.
 */
export default function TubesCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<TubesCursorInstance | null>(null);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      import(
        /* @vite-ignore */
        'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js'
      )
        .then((module: { default: (canvas: HTMLCanvasElement, options: Record<string, unknown>) => TubesCursorInstance }) => {
          const TubesCursorFactory = module.default;
          if (canvasRef.current) {
            const app = TubesCursorFactory(canvasRef.current, {
              tubes: {
                colors: ["#5e72e4", "#8965e0", "#f5365c"],
                lights: {
                  intensity: 200,
                  colors: ["#21d4fd", "#b721ff", "#f4d03f", "#11cdef"]
                }
              }
            });
            appRef.current = app;
          }
        })
        .catch((err: Error) => console.error("Failed to load TubesCursor module:", err));
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (appRef.current && typeof appRef.current.dispose === 'function') {
        appRef.current.dispose();
      }
    };
  }, []);

  const handleClick = () => {
    if (appRef.current) {
      appRef.current.tubes.setColors(randomColors(3));
      appRef.current.tubes.setLightsColors(randomColors(4));
    }
  };

  return (
    <div
      onClick={handleClick}
      className="h-screen w-screen bg-black font-['Montserrat',_sans-serif] overflow-hidden cursor-pointer"
    >
      <canvas ref={canvasRef} className="fixed inset-0 z-0" />
      <div className="relative h-full flex flex-col items-center justify-center gap-2.5 z-10">
        <h1 className="m-0 p-0 text-white text-[80px] font-bold uppercase leading-none select-none [text-shadow:0_0_20px_rgba(0,0,0,1)]">
          Tubes
        </h1>
        <h2 className="m-0 p-0 text-white text-[60px] font-medium uppercase leading-none select-none [text-shadow:0_0_20px_rgba(0,0,0,1)]">
          Cursor
        </h2>
        <p className="m-0 p-0 text-white text-xl leading-none select-none [text-shadow:0_0_20px_rgba(0,0,0,1)]">
          Click to change colors
        </p>
      </div>
    </div>
  );
}
