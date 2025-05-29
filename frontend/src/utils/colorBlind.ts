// src/utils/colorBlind.ts

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h /= 360;
    s /= 100;
    l /= 100;
    let r: number, g: number, b: number;
  
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
  
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
  
  export function simulateProtanopia(r: number, g: number, b: number) {
    return {
      r: 0.56667 * r + 0.43333 * g,
      g: 0.55833 * r + 0.44167 * g,
      b: 0.24167 * g + 0.75833 * b
    };
  }
  
  export function simulateDeuteranopia(r: number, g: number, b: number) {
    return {
      r: 0.625 * r + 0.375 * g,
      g: 0.7 * r + 0.3 * g,
      b: 0.3 * g + 0.7 * b
    };
  }
  
  export function simulateTritanopia(r: number, g: number, b: number) {
    return {
      r: 0.95 * r + 0.05 * b,
      g: 0.43333 * g + 0.56667 * b,
      b: 0.475 * g + 0.525 * b
    };
  }
  