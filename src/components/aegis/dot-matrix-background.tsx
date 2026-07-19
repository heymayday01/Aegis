'use client';

/**
 * DotMatrixBackground — a WebGL dot-matrix field driven by animated Perlin noise.
 *
 * Each cell renders a dot whose radius + color is proportional to flowing
 * simplex noise. Tuned for Aegis: midnight base + jade/mint palette so the
 * flowing dots read as "data streams" in the product's visual language.
 *
 * Performance: IntersectionObserver pauses the render loop when the element
 * is off-screen. 30fps cap. DPR capped at 2.
 *
 * Adapted from Originkit's Dot Matrix component (ogl + GLSL).
 */

import { useEffect, useRef, type CSSProperties } from 'react';
import {
  Renderer,
  Camera,
  Mesh,
  Plane,
  Program,
  RenderTarget as OglRenderTarget,
  Texture,
} from 'ogl';

const INTRINSIC_WIDTH = 600;
const INTRINSIC_HEIGHT = 400;
const DEFAULT_GLYPH_PADDING_PX = 2;
const DEFAULT_CHARACTERS = '●○•·';

const perlinVertexShader = `#version 300 es
in vec2 uv;
in vec2 position;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0., 1.);
}`;

const perlinFragmentShader = `#version 300 es
precision mediump float;
uniform float uFrequency;
uniform float uTime;
uniform float uSpeed;
uniform float uValue;
uniform vec2 uResolution;
in vec2 vUv;
out vec4 fragColor;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  uv = (uv - 0.5) * vec2(aspect, 1.0) + 0.5;
  float hue = abs(snoise(vec3(uv * uFrequency, uTime * uSpeed)));
  vec3 rainbowColor = hsv2rgb(vec3(hue, 1.0, uValue));
  fragColor = vec4(rainbowColor, 1.0);
}`;

const dotVertexShader = `#version 300 es
in vec2 uv;
in vec2 position;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0., 1.);
}`;

const dotFragmentShader = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform sampler2D uTexture;
uniform int uPaletteCount;
uniform vec3 uPalette[10];
uniform float uPaletteA[10];
uniform float uCellSize;
uniform float uGamma;
uniform float uPaletteBias;
uniform int uUseGlyphAtlas;
uniform sampler2D uGlyphAtlas;
uniform ivec2 uGlyphGrid;
uniform int uCharCount;
out vec4 fragColor;

void main() {
  vec2 pix = gl_FragCoord.xy;
  float cell = max(uCellSize, 1.0);

  vec2 cellIdx = floor(pix / cell);
  vec2 cellCenter = (cellIdx + 0.5) * cell;
  vec3 col = texture(uTexture, cellCenter / uResolution.xy).rgb;
  float gray = 0.3 * col.r + 0.59 * col.g + 0.11 * col.b;
  gray = pow(clamp(gray, 0.0001, 1.0), uGamma);

  float mark = 0.0;
  if (uUseGlyphAtlas == 1 && uCharCount > 0 && uGlyphGrid.x > 0 && uGlyphGrid.y > 0) {
    float g = clamp(gray + uPaletteBias, 0.0, 1.0);
    int idx = int(clamp(floor(g * float(uCharCount - 1) + 0.5), 0.0, float(uCharCount - 1)));
    vec2 cellUV = fract(pix / cell);
    vec2 grid = vec2(uGlyphGrid);
    vec2 tileSize = 1.0 / grid;
    float colIdx = float(idx % uGlyphGrid.x);
    float rowIdx = floor(float(idx) / float(uGlyphGrid.x));
    vec2 atlasUV = (vec2(colIdx, rowIdx) + cellUV) * tileSize;
    vec3 glyphSample = texture(uGlyphAtlas, atlasUV).rgb;
    mark = dot(glyphSample, vec3(0.299, 0.587, 0.114));
  } else {
    vec2 cellUV = fract(pix / cell) - 0.5;
    float dist = length(cellUV);
    float radius = clamp(gray + uPaletteBias, 0.0, 1.0) * 0.5;
    float aa = fwidth(dist) + 1e-4;
    mark = 1.0 - smoothstep(radius - aa, radius + aa, dist);
  }

  float g2 = clamp(gray + uPaletteBias, 0.0, 1.0);
  int cnt = max(uPaletteCount, 1);
  vec3 dotCol;
  float dotOpacity;
  if (cnt <= 1) {
    dotCol = uPalette[0];
    dotOpacity = uPaletteA[0];
  } else {
    float scaled = g2 * float(cnt - 1);
    int i0 = int(floor(scaled));
    i0 = clamp(i0, 0, cnt - 2);
    float f = scaled - float(i0);
    dotCol = mix(uPalette[i0], uPalette[i0 + 1], f);
    dotOpacity = mix(uPaletteA[i0], uPaletteA[i0 + 1], f);
  }
  fragColor = vec4(dotCol, mark * dotOpacity);
}`;

type Rgba = { r: number; g: number; b: number; a: number };

function parseColorToRgba(input: string): Rgba {
  if (!input) return { r: 0, g: 0, b: 0, a: 1 };
  const str = input.trim();
  const rgbaMatch = str.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/i,
  );
  if (rgbaMatch) {
    const r = Math.max(0, Math.min(255, parseFloat(rgbaMatch[1]))) / 255;
    const g = Math.max(0, Math.min(255, parseFloat(rgbaMatch[2]))) / 255;
    const b = Math.max(0, Math.min(255, parseFloat(rgbaMatch[3]))) / 255;
    const a = rgbaMatch[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(rgbaMatch[4]))) : 1;
    return { r, g, b, a };
  }
  const hex = str.replace(/^#/, '');
  if (hex.length === 8) {
    return { r: parseInt(hex.slice(0, 2), 16) / 255, g: parseInt(hex.slice(2, 4), 16) / 255, b: parseInt(hex.slice(4, 6), 16) / 255, a: parseInt(hex.slice(6, 8), 16) / 255 };
  }
  if (hex.length === 6) {
    return { r: parseInt(hex.slice(0, 2), 16) / 255, g: parseInt(hex.slice(2, 4), 16) / 255, b: parseInt(hex.slice(4, 6), 16) / 255, a: 1 };
  }
  if (hex.length === 4) {
    return { r: parseInt(hex[0] + hex[0], 16) / 255, g: parseInt(hex[1] + hex[1], 16) / 255, b: parseInt(hex[2] + hex[2], 16) / 255, a: parseInt(hex[3] + hex[3], 16) / 255 };
  }
  if (hex.length === 3) {
    return { r: parseInt(hex[0] + hex[0], 16) / 255, g: parseInt(hex[1] + hex[1], 16) / 255, b: parseInt(hex[2] + hex[2], 16) / 255, a: 1 };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

function colorStringToVec4(input: string): [number, number, number, number] {
  const { r, g, b, a } = parseColorToRgba(input);
  return [r, g, b, a];
}

function mapLinear(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

function mapFrequencyUiToShader(ui: number): number { return mapLinear(ui, 1, 10, 0.3, 6); }
function mapSpeedUiToShader(ui: number): number { return ui * 0.05; }
function mapCellSizeUiToShader(ui: number): number { return mapLinear(ui, 1, 100, 6, 60); }
function mapGammaUiToShader(ui: number): number { return mapLinear(ui, 1, 20, 0.5, 8); }
function mapPaletteBiasUiToShader(ui: number): number { return ui * 0.05; }

type FontSettings = { family: string; weight: string | number; sizePx: number };
function deriveFontSettings(family: string, weight: string | number, sizePx: number): FontSettings {
  return { family, weight, sizePx };
}

function buildGlyphAtlas(gl: any, characters: string, fontFamily: string, fontWeight: string | number, fontSizePx: number, paddingPx: number) {
  const count = Math.max(1, characters.length);
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellPx = Math.max(8, fontSizePx + paddingPx * 2);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.width = cols * cellPx * dpr;
  canvas.height = rows * cellPx * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
  for (let i = 0; i < count; i++) {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    const x = cx * cellPx + cellPx / 2;
    const y = cy * cellPx + cellPx / 2;
    ctx.fillText(characters[i], x, y);
  }
  const texture = new Texture(gl, {
    image: canvas,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
    generateMipmaps: false,
    flipY: true,
  });
  return { texture, cols, rows, cellPx, count };
}

const MAX_COLORS = 10;

interface DotMatrixBackgroundProps {
  frequency?: number;
  speed?: number;
  bgColor?: string;
  colors?: string[];
  cellSize?: number;
  gamma?: number;
  paletteBias?: number;
  style?: CSSProperties;
  useGlyphAtlas?: boolean;
  characters?: string;
  fontFamily?: string;
  fontWeight?: string | number;
  fontSizePx?: number;
  className?: string;
}

export default function DotMatrixBackground({
  frequency = 2,
  speed = 4,
  bgColor = 'transparent',
  colors = ['#0a0f14', '#0f2e22', '#5eead4'],
  cellSize = 16,
  gamma = 5,
  paletteBias = 8,
  style,
  useGlyphAtlas = false,
  characters = DEFAULT_CHARACTERS,
  fontFamily = 'monospace',
  fontWeight = 400,
  fontSizePx = 42,
  className,
}: DotMatrixBackgroundProps) {
  const useGlyphAtlasFlag = useGlyphAtlas === true;
  const paletteColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#0a0f14', '#0f2e22', '#5eead4'];
  const effPaletteCount = Math.min(MAX_COLORS, Math.max(1, paletteColors.length));

  const paletteRgb: [number, number, number][] = [];
  const paletteAlpha: number[] = [];
  for (let i = 0; i < MAX_COLORS; i++) {
    const src = paletteColors[i];
    if (src != null) {
      const [r, g, b, a] = colorStringToVec4(src);
      paletteRgb.push([r, g, b]);
      paletteAlpha.push(a);
    } else {
      paletteRgb.push([0, 0, 0]);
      paletteAlpha.push(0);
    }
  }

  const effectiveCharacters = (() => {
    const raw = typeof characters === 'string' ? characters : '';
    const sanitized = Array.from(raw).filter((ch) => !/\s/.test(ch)).join('');
    return sanitized.length > 0 ? sanitized : DEFAULT_CHARACTERS;
  })();

  const containerRef = useRef<HTMLDivElement>(null);
  const perlinProgramRef = useRef<any>(null);
  const dotProgramRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const perlinMeshRef = useRef<any>(null);
  const dotMeshRef = useRef<any>(null);
  const renderTargetRef = useRef<any>(null);
  const glRef = useRef<any>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const isPlayingRef = useRef(true);
  const glyphTextureRef = useRef<any>(null);
  const dummyGlyphTextureRef = useRef<any>(null);
  const isVisibleRef = useRef(true);

  const renderOnce = () => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const perlinMesh = perlinMeshRef.current;
    const dotMesh = dotMeshRef.current;
    const renderTarget = renderTargetRef.current;
    const gl = glRef.current;
    const dotProgram = dotProgramRef.current;
    if (!renderer || !camera || !perlinMesh || !dotMesh || !renderTarget || !gl || !dotProgram) return;
    renderer.render({ scene: perlinMesh, camera, target: renderTarget });
    dotProgram.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    renderer.render({ scene: dotMesh, camera });
  };

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      alpha: true,
      premultipliedAlpha: false,
    });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);
    rendererRef.current = renderer;
    glRef.current = gl;

    const camera = new Camera(gl, { near: 0.1, far: 100 });
    camera.position.set(0, 0, 3);
    cameraRef.current = camera;

    const doResize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
      if (renderTargetRef.current && renderTargetRef.current.setSize) {
        renderTargetRef.current.setSize(gl.canvas.width, gl.canvas.height);
      }
      if (perlinProgramRef.current) {
        perlinProgramRef.current.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
      }
    };

    let resizePending = false;
    const scheduleResize = () => {
      if (resizePending) return;
      resizePending = true;
      requestAnimationFrame(() => {
        resizePending = false;
        doResize();
        if (!isPlayingRef.current) renderOnce();
      });
    };
    window.addEventListener('resize', scheduleResize);
    if (typeof window.ResizeObserver !== 'undefined') {
      resizeObserver = new window.ResizeObserver(scheduleResize);
      resizeObserver.observe(container);
    }
    scheduleResize();

    const perlinProgram = new Program(gl, {
      vertex: perlinVertexShader,
      fragment: perlinFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uFrequency: { value: mapFrequencyUiToShader(frequency) },
        uSpeed: { value: mapSpeedUiToShader(speed) },
        uValue: { value: 1 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
      },
    });
    perlinProgramRef.current = perlinProgram;
    const perlinMesh = new Mesh(gl, { geometry: new Plane(gl, { width: 2, height: 2 }), program: perlinProgram });
    perlinMeshRef.current = perlinMesh;

    const renderTarget = new OglRenderTarget(gl);
    renderTargetRef.current = renderTarget;

    const dummyGlyphTexture = new Texture(gl, { width: 1, height: 1, generateMipmaps: false, flipY: false });
    dummyGlyphTextureRef.current = dummyGlyphTexture;

    const dotProgram = new Program(gl, {
      vertex: dotVertexShader,
      fragment: dotFragmentShader,
      uniforms: {
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
        uTexture: { value: renderTarget.texture },
        uPaletteCount: { value: effPaletteCount },
        uPalette: { value: paletteRgb },
        uPaletteA: { value: paletteAlpha },
        uCellSize: { value: mapCellSizeUiToShader(cellSize) },
        uGamma: { value: mapGammaUiToShader(gamma) },
        uPaletteBias: { value: mapPaletteBiasUiToShader(paletteBias) },
        uUseGlyphAtlas: { value: useGlyphAtlasFlag ? 1 : 0 },
        uGlyphAtlas: { value: dummyGlyphTexture },
        uGlyphGrid: { value: [0, 0] },
        uCharCount: { value: 0 },
      },
    });
    dotProgramRef.current = dotProgram;
    const dotMesh = new Mesh(gl, { geometry: new Plane(gl, { width: 2, height: 2 }), program: dotProgram });
    dotMeshRef.current = dotMesh;

    if (useGlyphAtlasFlag) {
      const f = deriveFontSettings(fontFamily, fontWeight, fontSizePx);
      const fontCSS = `${f.weight} ${f.sizePx}px ${f.family}`;
      if (document.fonts && document.fonts.load) document.fonts.load(fontCSS).catch(() => {});
      const atlas = buildGlyphAtlas(gl, effectiveCharacters, f.family, f.weight, f.sizePx, DEFAULT_GLYPH_PADDING_PX);
      glyphTextureRef.current = atlas.texture;
      dotProgram.uniforms.uGlyphAtlas.value = atlas.texture;
      dotProgram.uniforms.uGlyphGrid.value = [atlas.cols, atlas.rows];
      dotProgram.uniforms.uCharCount.value = atlas.count;
      dotProgram.uniforms.uUseGlyphAtlas.value = 1;
    }

    // Pause when off-screen — big perf win.
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisibleRef.current = entry.isIntersecting;
          if (entry.isIntersecting && isPlayingRef.current && rafIdRef.current == null) {
            lastTimeRef.current = 0;
            rafIdRef.current = requestAnimationFrame(update);
          }
        }
      },
      { threshold: 0 },
    );
    visibilityObserver.observe(container);

    const frameInterval = 1e3 / 30;
    const update = (time: number) => {
      if (!isPlayingRef.current || !isVisibleRef.current) {
        rafIdRef.current = null;
        return;
      }
      const last = lastTimeRef.current;
      if (time - last < frameInterval) {
        rafIdRef.current = requestAnimationFrame(update);
        return;
      }
      lastTimeRef.current = time;
      const perlin = perlinProgramRef.current;
      const dot = dotProgramRef.current;
      const renderer2 = rendererRef.current;
      const camera2 = cameraRef.current;
      const perlinMesh2 = perlinMeshRef.current;
      const dotMesh2 = dotMeshRef.current;
      const renderTarget2 = renderTargetRef.current;
      const gl2 = glRef.current;
      if (!perlin || !dot || !renderer2 || !camera2 || !perlinMesh2 || !dotMesh2 || !renderTarget2 || !gl2) {
        rafIdRef.current = null;
        return;
      }
      perlin.uniforms.uTime.value = time * 0.001;
      renderer2.render({ scene: perlinMesh2, camera: camera2, target: renderTarget2 });
      dot.uniforms.uResolution.value = [gl2.canvas.width, gl2.canvas.height];
      renderer2.render({ scene: dotMesh2, camera: camera2 });
      rafIdRef.current = requestAnimationFrame(update);
    };

    renderOnce();
    isPlayingRef.current = true;
    if (rafIdRef.current == null) {
      lastTimeRef.current = 0;
      rafIdRef.current = requestAnimationFrame(update);
    }

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('resize', scheduleResize);
      if (resizeObserver) { try { resizeObserver.disconnect(); } catch {} resizeObserver = null; }
      visibilityObserver.disconnect();
      if (glyphTextureRef.current) {
        try {
          if (typeof glyphTextureRef.current.destroy === 'function') glyphTextureRef.current.destroy();
          else if (typeof glyphTextureRef.current.delete === 'function') glyphTextureRef.current.delete();
        } catch {}
        glyphTextureRef.current = null;
      }
      if (dummyGlyphTextureRef.current) {
        try {
          if (typeof dummyGlyphTextureRef.current.destroy === 'function') dummyGlyphTextureRef.current.destroy();
          else if (typeof dummyGlyphTextureRef.current.delete === 'function') dummyGlyphTextureRef.current.delete();
        } catch {}
        dummyGlyphTextureRef.current = null;
      }
      if (gl && gl.canvas && gl.canvas.parentElement === container) container.removeChild(gl.canvas);
      perlinProgramRef.current = null;
      dotProgramRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      perlinMeshRef.current = null;
      dotMeshRef.current = null;
      renderTargetRef.current = null;
      glRef.current = null;
      rafIdRef.current = null;
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: bgColor,
        lineHeight: 0,
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          width: `${INTRINSIC_WIDTH}px`,
          height: `${INTRINSIC_HEIGHT}px`,
          minWidth: `${INTRINSIC_WIDTH}px`,
          minHeight: `${INTRINSIC_HEIGHT}px`,
          visibility: 'hidden',
          position: 'absolute',
          pointerEvents: 'none',
        }}
      />
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
