# UI Stack 2026 — Components, Animation, 3D, DataViz

> Synthesized: 2026-03-17 | 3 parallel Haiku agents | Sources: Builder.io, Better Stack, MDN, GitHub

## Component Libraries

### Copy-Paste (shadcn model)
| Library | Stars | Best For | Status |
|---------|-------|----------|--------|
| **shadcn/ui** | 94K | De-facto standard, Radix+Tailwind | Active, CLI v4 |
| **Magic UI** | 15K+ | Animated landing page components | Active 2026 |
| **Aceternity UI** | 10K+ | Premium animated components | Active 2026 |
| **Origin UI** | New | Beautiful prebuilt blocks | Growing |
| **Park UI** | 3K+ | Ark UI + Tailwind/Panda CSS | Active |

### Headless (unstyled primitives)
| Library | Stars | Best For | Status |
|---------|-------|----------|--------|
| **Radix UI** | 16K+ | Industry standard, shadcn foundation | Active |
| **Ark UI** | 4K+ | Chakra team, multi-framework (React+Vue+Solid) | Active |
| **Bits UI** | 2K+ | Svelte-native headless | Active |
| **React Aria** | Adobe | Accessibility-first, enterprise | Active |

### Full Component Libraries
| Library | Stars | Downloads/wk | Best For | Status |
|---------|-------|-------------|----------|--------|
| **MUI (Material UI)** | 97K | 6.7M | Largest ecosystem, enterprise | Active but dated design |
| **Ant Design** | 92K | — | Enterprise, Asia dominance | Active |
| **Mantine** | 27K+ | — | Best DX, 100+ hooks | Active, modern |
| **HeroUI** (ex-NextUI) | 22K+ | — | Beautiful defaults, Tailwind | Rebranded Jan 2025 |
| **Chakra UI** | 38K | — | Accessibility-first | Active |

### Micro-Interaction Primitives
| Library | Purpose | Stars |
|---------|---------|-------|
| **Sonner** | Toast notifications | 9K+ |
| **Vaul** | Drawer/sheet component | 6K+ |
| **cmdk** | Command palette (⌘K) | 9K+ |
| **React Email** | Email templates in React | 14K+ |

## Animation & Motion

### Top Tier (USE)
| Library | Bundle | Stars | Best For |
|---------|--------|-------|----------|
| **Motion** (ex-Framer Motion) | 17 KB | 25K+ | Standard React animations, layout, gestures |
| **GSAP 3** | 18 KB | 20K+ | Complex timelines, ScrollTrigger — **ALL PLUGINS NOW FREE** (Webflow deal) |
| **View Transitions API** | 0 KB | Native | Page transitions MPA+SPA, progressive enhancement |
| **CSS scroll-driven** | 0 KB | Native | Scroll animations, 83-85% browser support |
| **Motion One** | 3.8 KB | 4K+ | Lightweight, Web Animations API |
| **AutoAnimate** | 1.9 KB | 13K+ | Zero-config DOM mutation animations |

### Specialized
| Library | Bundle | Best For |
|---------|--------|----------|
| **Rive** | 200 KB | Interactive animations + state machines, 90% smaller than CSS |
| **Lottie + dotLottie** | 50 KB | After Effects → web, dotLottie 80% smaller files |
| **React Spring** | 20-30 KB | Physics-based spring animations |
| **anime.js** | 17 KB | Lightweight JS animation engine |

### Avoid
- **Theatre.js** — stalled (v1.0 promised 2024, never shipped)
- **Popmotion** — superseded by Motion

### Decision: Which Animation Library?
```
Page transitions?     → View Transitions API (0 KB, native)
Scroll animations?    → CSS scroll-driven (native) or GSAP ScrollTrigger
React layout/gestures → Motion (17 KB, standard)
Complex timelines     → GSAP 3 (all plugins free!)
Lightweight project   → Motion One (3.8 KB) or AutoAnimate (1.9 KB)
Interactive/stateful  → Rive (designer+dev workflow)
Design tool export    → Lottie/dotLottie
Physics-based feel    → React Spring
```

## 3D & WebGL

| Tool | Stars | Downloads/wk | Best For | Status |
|------|-------|-------------|----------|--------|
| **Three.js + R3F** | 100K+ | 2.7M | Dominant 3D engine, WebGPU ready | Active |
| **Babylon.js** | 22K | — | Enterprise 3D, built-in physics/UI | Active |
| **Spline** | SaaS | — | No-code 3D design, AI text-to-3D | Growing fast |
| **Pixi.js** | 43K+ | — | Fastest 2D WebGL renderer | Active |
| **p5.js** | 21K+ | — | Creative coding, generative art | Active |
| **Theatre.js** | 11K+ | — | Animation editor for 3D (stalled v1) | Risky |

### WebGPU Status (March 2026)
- **Chrome/Edge**: v113+ ✅
- **Firefox**: v141+ Windows, v145 macOS ✅
- **Safari**: macOS Tahoe 26, iOS 26 ✅
- **Coverage**: ~70%+ globally
- **Strategy**: Ship WebGPU with WebGL 2 fallback (Three.js does this automatically)
- **Performance**: 15x gains in some scenarios

## Data Visualization

| Use Case | Pick | Bundle | Why |
|----------|------|--------|-----|
| **Simple Dashboard** | Tremor | 40 KB | Tailwind, Vercel-backed (acquired Jan 2026) |
| **React Charts** | Recharts | 50-70 KB | Declarative, beautiful defaults |
| **Many Chart Types** | Nivo | 80-100 KB | D3-powered, widest selection |
| **Millions of Points** | Apache ECharts | 200-250 KB | GPU-accelerated Canvas+WebGL |
| **Quick Exploration** | Observable Plot | 30-40 KB | D3-simple, 1-line histograms |
| **Custom Primitives** | Visx (Airbnb) | 15 KB | Modular, build-your-own, 2.2M DL/wk |
| **Bespoke/Custom** | D3.js v7 | 50 KB | Max control, declining for routine |

### Geospatial & Maps
| Tool | Best For | Cost |
|------|----------|------|
| **Deck.gl** | 100K+ data points, WebGL | Free (OpenJS) |
| **MapLibre GL** | Free open-source maps | Free (self-hosted tiles) |
| **Mapbox GL** | Advanced features, enterprise | Paid (token required) |

## Stack Recommendations by Project Type

### Landing Page / Marketing
```
shadcn/ui + Tailwind v4 + Motion + GSAP ScrollTrigger + View Transitions
Optional: Spline (3D hero), Lottie (micro-animations), Magic UI (animated components)
```

### SaaS Dashboard
```
shadcn/ui + Tremor + Recharts + Sonner + cmdk + Vaul
Heavy data: swap Recharts → ECharts or Nivo
```

### E-Commerce Storefront
```
shadcn/ui + Motion + AutoAnimate + Recharts (analytics)
3D product viewer: Three.js + R3F
```

### Creative / Portfolio
```
GSAP 3 (all free!) + Three.js/R3F + Spline + Motion + Rive
```

### Mobile (React Native)
```
NativeWind v4 (zero-runtime CSS) + Tamagui or Gluestack v3
Animation: React Native Reanimated
```

## What's OBSOLETE
- **Styled Components / Emotion** → Tailwind v4 + shadcn
- **Material UI design language** → Still works but looks dated
- **jQuery animations** → GSAP or Motion
- **Popmotion** → Superseded by Motion
- **Theatre.js v1** → Never shipped, stalled
- **react-spring for simple animations** → Motion is simpler + smaller
- **SVG charts at scale** → Canvas/WebGL (ECharts, Deck.gl)
