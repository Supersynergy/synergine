# Animation & Motion Libraries for Web/React/Vue — March 2026 Deep Dive

**Research Date:** March 17, 2026
**Methodology:** 13 targeted web searches + current GitHub/npm data

---

## Executive Summary

| Library | Bundle | Version | React 19 | Use Case | Status | Recommendation |
|---------|--------|---------|----------|----------|--------|-----------------|
| **Motion for React** | 17 KB | 12.36.0 | ✅ Full | Production UI, layouts | Mature | **USE** (new default) |
| **GSAP 3** | 18 KB | 3.13.0+ | ✅ | Complex animations, SVG | Mature | **USE** (complex work) |
| **Motion One** | 3.8 KB | Latest | ✅ | Lightweight animations | Active | **USE** (minimal bundle) |
| **Lottie** | — | Current | ✅ | After Effects → Web | Mature | **USE** (design-heavy) |
| **Rive** | 200 KB (runtime) | Current | ✅ | Interactive, state machines | Growing | **USE** (interactivity) |
| **AutoAnimate** | 1.9 KB | Latest | ✅ | DOM mutations auto-animate | Active | **USE** (zero-config) |
| **React Spring** | 29K+ | v9+ | ✅ | Physics-based, natural feel | Mature | **SELECTIVE** (large) |
| **anime.js** | 6.2 KB | Latest | ✅ | Lightweight, general purpose | Mature | **USE** (small bundles) |
| **Theatre.js** | — | 0.5 | ⚠️ | Motion design + Three.js | **STALLED** | **AVOID** (v1.0 delayed) |
| **Popmotion** | <5 KB | Latest | ✅ | Low-level, functional | Active | **USE** (control needed) |
| **View Transitions API** | 0 KB | Native | ✅ | MPA/SPA page transitions | ✅ Shipping | **USE** (native) |
| **Tailwind animate** | Built-in | v4 | ✅ | Basic animations, CSS-first | Active | **USE** (Tailwind projects) |
| **CSS scroll-driven** | 0 KB | Native | ✅ | Scroll-triggered animations | ✅ Shipping | **USE** (compositor) |

---

## 1. Motion for React (formerly Framer Motion)

### Current Status (March 2026)
- **Version:** 12.36.0 (released 3 days ago)
- **GitHub Stars:** 20K+
- **NPM Downloads:** 1M+ weekly
- **Bundle Size:** ~17 KB
- **React 19 Support:** ✅ Full support with React Compiler

### Key Features
- **AnimateView:** New view animations for route transitions
- **useScroll:** Hardware-accelerated scroll tracking
- **transition.inherit:** Inherit transition values from parent
- **Layout Animations:** Object-preserving layout animations
- **React Compiler:** Auto-memoization in React 19+

### API Stability
- Stable, mature API with incremental improvements
- Renamed from "Framer Motion" to "Motion for React"
- No breaking changes in v12; backwards compatible

### Best Use Cases
- Production UI components requiring polish
- Layout shift animations
- Cross-browser compatibility critical
- Complex interactive animations

### Cons
- Larger bundle than Motion One or AutoAnimate
- Opinionated API (not minimal)

### Verdict
**USE** — Best all-around choice for production React applications. The rebranding to "Motion for React" reflects it as the go-to React animation library in 2026.

---

## 2. GSAP 3 (GreenSock Animation Platform)

### Current Status (March 2026)
- **Version:** 3.13.0+
- **License Model:** 100% FREE (including all plugins)
- **GitHub Stars:** 20K+
- **Bundle Size:** 18 KB (core)
- **Announcement:** Webflow partnership made all plugins free

### Major Plugins (Now ALL Free)
- **ScrollTrigger:** 🎯 Industry standard for scroll animations
- **SplitText:** Major 2026 overhaul — smaller bundle, more features, accessibility improvements
- **MorphSVG:** SVG path morphing
- **DrawSVG:** SVG drawing animations
- **TextPlugin:** Text content animation

### Pricing Change (Game-Changer)
Previously: SplitText, MorphSVG, DrawSVG = Club GSAP (paid)
**Now (2026):** ALL plugins free for everyone, commercial use included

### Strengths
- **Most powerful for complex animations:** Canvas, SVG, complex timelines
- **Timeline control:** Unmatched timeline API
- **Performance:** Highly optimized
- **Plugin ecosystem:** 20+ plugins, all now free

### Best Use Cases
- Complex multi-element sequences
- SVG animations and morphing
- Scroll-triggered animations (ScrollTrigger)
- Character/text animations (SplitText)
- Premium landing pages, motion design

### Cons
- Larger bundle than lightweight alternatives
- Steeper learning curve
- Overkill for simple animations

### Verdict
**USE** — Essential for complex animations, scroll work, and premium motion design. The free pricing makes it a no-brainer for serious animation work.

---

## 3. Motion One

### Current Status (March 2026)
- **Version:** Latest stable
- **GitHub Stars:** Growing
- **Bundle Size:** 3.8 KB (smallest)
- **Core Principle:** Web Animations API wrapper

### Bundle Comparison
- Motion One: **3.8 KB**
- anime.js: 6.2 KB
- Framer Motion: 17 KB
- GSAP: 18 KB
- Popmotion: <5 KB

### Features
- Built on native Web Animations API
- Hardware-accelerated animations
- Fully tree-shakable
- animate() function is core strength

### Strengths
- Smallest bundle of any animation library
- Direct WAAPI access
- Great for performance-critical projects
- Modern, clean API

### Use Cases
- Minimal-footprint web apps
- Lightweight SPA/MPA animations
- Performance-first projects
- Mobile-optimized sites

### Cons
- Smaller plugin ecosystem than GSAP
- Less powerful than Framer Motion for complex UI

### Verdict
**USE** — Choose for projects where bundle size is critical or animations are simple/moderate. Perfect for Astro, Next.js edge functions, or performance-constrained environments.

---

## 4. Lottie / lottie-react

### Current Status (March 2026)
- **Format Support:** JSON (.json) and dotLottie (.lottie)
- **After Effects Export:** Native plugin for Adobe CC
- **React Integration:** dotLottie-react component

### File Format Comparison
| Format | Size Reduction | Features |
|--------|---|---|
| Lottie JSON (.json) | Baseline | Standard, widely supported |
| **dotLottie (.lottie)** | **80% smaller** | Multiple animations, images, compression |

### Key Innovation: dotLottie Format
- Binary, compressed format replacing JSON
- Can bundle multiple animations in one file
- Built-in image support (no separate assets)
- Lower CPU/memory footprint
- Example: 24.37 KB (Lottie) → 2 KB (Rive equivalent)

### Workflow
1. Design animation in Adobe After Effects
2. Export using LottieFiles plugin
3. Drop into React via `dotLottie-react` component
4. Control playback, speed, direction via props

### Best Use Cases
- UI illustrations and micro-animations
- Loading states, success/error indicators
- Complex animated icons
- Design-system animations from designers

### Cons
- Requires After Effects (external tool)
- File size still larger than CSS animations
- Limited interactivity (basic control only)
- Designer-developer handoff required

### Verdict
**USE** — Excellent for design-heavy projects with animations from design tools. The dotLottie format is now competitive with Rive for file size.

---

## 5. Rive

### Current Status (March 2026)
- **Runtime (WASM + JS):** ~200 KB gzipped (one-time load)
- **Individual File Size:** 2-10 KB per animation
- **Key Feature:** State machines for interactivity
- **React Integration:** rive-react (Canvas, WebGL, lite variants)

### Rive vs. Lottie Comparison
| Aspect | Rive | Lottie |
|--------|------|--------|
| **File Size** | 2 KB | 24 KB (same animation) |
| **State Machines** | ✅ Native | ❌ No |
| **Interactivity** | ✅ High | ⚠️ Limited |
| **Designer App** | ✅ Professional | ⚠️ Basic |
| **Runtime Cost** | 200 KB (shared) | Embedded in file |

### State Machines
Define interactive animations with visual editor:
- Transitions triggered by inputs (boolean, double, trigger)
- Complex animation logic without code
- Example: Idle → Hover → Click states

### Strengths
- **4x faster production** than Lottie workflow
- State machines enable true interactivity
- Excellent for UI component animations
- Professional design app
- File sizes up to **90% smaller** than CSS/Lottie

### Best Use Cases
- Interactive button states, toggles
- Microinteractions with logic (success/error flows)
- Character animations with state machines
- Complex motion UI

### Cons
- 200 KB runtime (one-time, shared)
- Another design tool to learn
- Smaller ecosystem vs. GSAP/Framer Motion

### Verdict
**USE** — Choose when interactivity + file size matter. Best for SaaS dashboards, interactive components, and modern design systems.

---

## 6. AutoAnimate

### Current Status (March 2026)
- **Bundle Size:** 1.9 KB (smallest)
- **Framework Support:** React, Vue, Svelte, vanilla JS
- **Core Concept:** Zero-config, FLIP algorithm

### How It Works
```javascript
// React example
const parent = useRef(null);
useAutoAnimate(parent);  // That's it!
```

Automatically detects:
- DOM additions
- DOM removals
- DOM reordering

### FLIP Technique
- **F** First: Store initial positions
- **L** Last: Detect final positions
- **I** Invert: Calculate offset
- **P** Play: Animate the difference

### Strengths
- Literally one line of code
- Zero configuration
- Tiny bundle (1.9 KB)
- Works with any framework
- Perfect for list animations

### Best Use Cases
- List item add/remove/reorder
- Tab switching
- Modal show/hide
- Shopping cart items

### Cons
- Limited to DOM mutations
- Can't customize animation duration/easing (hard constraints)
- Not suitable for complex orchestrated animations

### Verdict
**USE** — Essential for any React/Vue app with lists, tabs, modals. The bundle savings alone justify inclusion. Free polish for zero effort.

---

## 7. React Spring

### Current Status (March 2026)
- **Version:** v9+
- **GitHub Stars:** 29K+
- **NPM Downloads:** 788K weekly
- **Bundle Size:** Large (~20-30 KB)
- **Core Philosophy:** Physics-based (spring) animations

### Animation Philosophy
Instead of: `duration: 300ms`
Use: `tension: 170, friction: 26` (feels natural)

### Features
- Cross-platform: react-dom, react-native, react-three-fiber, react-konva
- useSpring, useTrail, useChain, useTransition hooks
- Interpolation support
- Concurrent mode compatible

### Strengths
- Natural, physical feel to animations
- Excellent for complex orchestrations
- Wide platform support
- Large, active community

### Bundle Size Optimization
Use modular imports:
```javascript
import { useSpring } from '@react-spring/web';  // Smaller
// vs.
import { useSpring } from 'react-spring';  // Full bundle
```

### Best Use Cases
- Natural, organic animations
- Complex multi-step sequences
- Apps prioritizing animation feel
- Dashboard transitions

### Cons
- Larger bundle than Motion One, AutoAnimate, anime.js
- Physics constraints can be limiting for precise control
- Steeper learning curve
- Overkill for simple animations

### Verdict
**SELECTIVE USE** — Use only if:
1. You need physics-based feel AND
2. Bundle size trade-off is acceptable OR
3. You're already using react-three-fiber/react-native

For most projects, Framer Motion + AutoAnimate is lighter and more practical.

---

## 8. anime.js

### Current Status (March 2026)
- **Bundle Size:** 6.2 KB (minified)
- **Lightweight Version:** 3 KB (Web Animations API only)
- **Modular Imports:** Supported
- **Status:** Mature, stable

### Features
- Keyframes with chaining
- Timeline methods
- Playback controls
- SVG paths/morphing
- 30+ easing functions
- Works with CSS, DOM, SVG, Objects

### Strengths
- Lightweight with modular imports
- Simple, powerful API
- Good documentation
- Widely used and tested

### Best Use Cases
- General-purpose animations
- Projects needing fine control without Framer Motion overhead
- Lightweight bundles with good feature set
- SVG animations

### Cons
- Less powerful than GSAP for complex work
- Smaller ecosystem
- Not designed for React-specific features (hooks, etc.)

### Verdict
**USE** — Solid middle ground between Motion One (minimal) and GSAP (powerful). Good choice for vanilla JS or projects not using React heavily.

---

## 9. Theatre.js

### Current Status (March 2026)
- **Status:** ⚠️ STALLED (last update: August 2024)
- **v1.0 Status:** "Around the corner" (2024 claim, unmet)
- **Development:** Moved to private repo for faster iteration
- **Public Status:** Inactive

### Use Case
Motion design editor for Three.js + browser animations

### Verdict
**AVOID** — Development stalled. v1.0 promised but not delivered. Too risky for production use in 2026. Consider **Rive** or **Framer Motion** instead.

---

## 10. Popmotion

### Current Status (March 2026)
- **Bundle Size:** <5 KB
- **Status:** Actively maintained
- **Creator Note:** Powers Framer Motion animations
- **Test Coverage:** 95%+

### Key Concept
Low-level, functional animation library. Popmotion powers Framer Motion's internal animation engine.

### Features
- Keyframes, spring, inertia animations
- Numbers, colors, complex strings
- Fully importable utilities
- TypeScript with excellent typing

### Strengths
- Extremely lightweight
- Composable, functional approach
- Powers Framer Motion (proven)
- Great for custom animation logic

### Best Use Cases
- Custom animation engines
- Low-level control needed
- Lightweight projects
- Building animation abstractions

### Cons
- Lower-level (requires more code)
- Smaller community than Framer Motion
- Less documentation

### Verdict
**USE** — Choose when you need fine control and want a smaller bundle than Framer Motion. Great as a building block for custom animation systems.

---

## 11. View Transitions API (Native Browser)

### Current Status (March 2026)
- **SPA Support:** Chrome 111+ (stable since 2023)
- **MPA Support:** Chrome 126+ (fully shipped 2026)
- **Browser Coverage:** ~83-85% globally
- **Bundle Size:** 0 KB (native)

### What Changed in 2026
- **Cross-document transitions:** Now work across full-page navigations
- **@view-transition at-rule:** No JavaScript required
- **Progressive enhancement:** Works in modern browsers, graceful fallback

### SPA Example
```javascript
document.startViewTransition(() => {
  // Update DOM
});
```

### MPA Example (No JavaScript!)
```css
@view-transition {
  navigation: auto;  // Animate between pages
}
```

### Browser Support by Year
| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 126+ | ✅ Full MPA |
| Edge | 126+ | ✅ Full MPA |
| Safari | 18+ | ✅ Full (18.1+) |
| Firefox | — | ⚠️ Behind flag |

### Performance
- Runs on compositor thread
- No main-thread blocking
- Maintains 60 FPS even during heavy JS
- No layout recalculations

### Best Use Cases
- **MPA page transitions** (Astro, Next.js with page routes)
- **SPA navigation** (React Router, Next.js app router)
- **Fast, native feel** required
- **Minimal code** preferred

### Cons
- Older browser fallback required
- Customization limited vs. JavaScript libraries
- Browser support still not 100%

### Verdict
**USE** — **Default choice for 2026.** Use View Transitions as primary strategy with progressive enhancement. Pairs perfectly with Astro, Next.js, or any modern web framework.

---

## 12. Tailwind CSS Animation Utilities

### Current Status (March 2026)
- **Tailwind v4:** CSS-first architecture
- **Core Animations:** animate-spin, animate-ping, animate-pulse, animate-bounce
- **Plugins:** tailwindcss-animate (legacy) | tw-animate-css (v4 native)

### Plugin Evolution
| Version | Approach | Status |
|---------|----------|--------|
| v3 | Plugin + JS | tailwindcss-animate |
| **v4** | **CSS-first** | **tw-animate-css** (native) |

### v4 Native Animations
```css
@theme {
  --animate-* definitions
}

@keyframes custom {
  /* Define animation */
}

/* Use utility: animate-custom */
```

### Strengths
- Zero JavaScript overhead
- Built into Tailwind projects
- v4 is pure CSS (no plugin system)
- Great for simple animations
- Performance: compiled to CSS

### Best Use Cases
- Loading spinners, pulses, bounces
- Basic UI animations in Tailwind projects
- Zero-JavaScript preference
- Design system animations

### Cons
- Limited to simple animations
- Not suitable for complex interactions
- Tailwind-dependent (lock-in)

### Verdict
**USE** — Default for Tailwind projects. Combine with other libraries (Motion One, AutoAnimate) for more complex needs.

---

## 13. CSS Scroll-Driven Animations (Native)

### Current Status (March 2026)
- **Browser Support:** Chrome 115+, Edge 115+, Safari 18+
- **Firefox:** Partial, behind flag
- **Global Coverage:** ~83-85%
- **Bundle Size:** 0 KB (native)
- **Spec Status:** Shipping 2026

### Two CSS Features
1. **Scroll-timeline (existing):** Animations tied to scroll position
2. **Scroll-triggered (new 2026):** Time-based animations triggered at scroll offset

### Performance
- Compositor thread (no main-thread blocking)
- 60 FPS even during heavy JS
- No layout recalculations
- **Best performance:** Animate only transform + opacity

### Example (Scroll Percentage)
```css
animation-timeline: scroll();
animation: slide linear;

@keyframes slide {
  from { transform: translateX(0); }
  to { transform: translateX(100px); }
}
```

### Strengths
- Zero JavaScript
- Perfect performance (compositor thread)
- Modern, native solution
- No dependencies

### Best Use Cases
- Parallax effects
- Animated progress bars
- Reveal animations on scroll
- Image animations tied to scroll position

### Cons
- Browser support still <100% (needs fallback)
- Limited customization vs. JS libraries
- Can't trigger complex logic

### Verdict
**USE** — Perfect for scroll-based animations. Combine with GSAP ScrollTrigger for older browser support or more complex logic.

---

## Decision Matrix: Which Library to Use?

```
START: What's your primary need?

├─ "Animations work with page transitions"
│  └─→ View Transitions API (native, 0 KB)
│
├─ "I need the absolute smallest bundle"
│  └─→ Motion One (3.8 KB)
│
├─ "Add motion to DOM mutations (lists, tabs, modals)"
│  └─→ AutoAnimate (1.9 KB)
│
├─ "Scroll-triggered animations"
│  ├─ "Just CSS, no JS"
│  │  └─→ CSS scroll-driven (native, 0 KB)
│  └─ "Complex work, timeline control"
│     └─→ GSAP ScrollTrigger (18 KB)
│
├─ "Design animations from After Effects"
│  ├─ "Small files, design tool"
│  │  └─→ Lottie + dotLottie (format, 2-10 KB per file)
│  └─ "Interactive, state machines"
│     └─→ Rive (200 KB runtime + 2-10 KB per animation)
│
├─ "Complex, multi-element sequences"
│  ├─ "Need timeline control, SVG work"
│  │  └─→ GSAP (18 KB)
│  └─ "Physics-based feel preferred"
│     └─→ React Spring (20-30 KB)
│
├─ "Production React UI animations"
│  ├─ "General purpose, best-in-class"
│  │  └─→ Motion for React (17 KB, v12.36.0)
│  └─ "Fine control, custom logic"
│     └─→ Popmotion (<5 KB)
│
├─ "Tailwind-based project"
│  └─→ Tailwind v4 native animations (0 KB) + Motion One/AutoAnimate
│
└─ "General-purpose, broad support"
   └─→ anime.js (6.2 KB)
```

---

## 2026 Stack Recommendations by Project Type

### Lightweight Marketing/Content Site (Astro)
```
Primary: View Transitions API (native page transitions)
Secondary: CSS scroll-driven animations (parallax, reveals)
Fallback: GSAP ScrollTrigger (older browsers)
Bundle: ~0 KB (native-first)
```

### Modern SPA (React/Vue)
```
Primary: Motion for React (UI polish) + AutoAnimate (lists)
Secondary: Motion One (if bundle critical)
Bonus: View Transitions API (page-like transitions)
Bundle: 17-21 KB
```

### Premium Motion Design / Landing Page
```
Primary: GSAP 3 (complex sequences, SVG)
Secondary: Lottie/Rive (design animations)
Tertiary: Motion for React (UI animations)
Bundle: 18 KB (GSAP) + design files
```

### Interactive Component Library / Design System
```
Primary: Rive (state machines, interactivity)
Secondary: Motion for React (general UI)
Tertiary: Tailwind v4 animations (simple effects)
Bundle: 200 KB (Rive runtime, shared) + files
```

### Physics-Focused (Natural Feel, Complex Orchestration)
```
Primary: React Spring (physics-based)
Secondary: Popmotion (fine control)
Tertiary: Motion for React (fallback for simple items)
Bundle: 20-30 KB
```

### Minimal Bundle (Edge Functions, Mobile-First)
```
Primary: Motion One (3.8 KB)
Secondary: AutoAnimate (1.9 KB)
Tertiary: CSS scroll-driven (0 KB)
Bundle: <6 KB total
```

---

## Bundle Size Comparison Chart

```
Library                Bundle Size     Bundle + Runtime    Use Case
─────────────────────────────────────────────────────────────────
CSS (native)           0 KB            0 KB                Scroll, page transitions
Motion One             3.8 KB          3.8 KB              Lightweight animations
AutoAnimate            1.9 KB          1.9 KB              DOM mutations
anime.js               6.2 KB          6.2 KB              General purpose
Popmotion              <5 KB           <5 KB               Fine control
Tailwind v4 animations 0 KB            0 KB                Tailwind projects
Motion for React       17 KB           17 KB               React production
GSAP 3                 18 KB           18 KB               Complex work
React Spring           20-30 KB        20-30 KB            Physics-based
Rive (runtime)         200 KB (shared) 2-10 KB per file    Interactive, state machines
Lottie (dotLottie)     —               2-10 KB per file    Design animations
Theatre.js             —               ❌ AVOID (stalled)  Motion design
─────────────────────────────────────────────────────────────────
```

---

## Key Takeaways

### ✅ **USE in 2026**
1. **View Transitions API** — Default for page transitions (0 KB, native)
2. **Motion for React** — Standard React animation library (17 KB, mature)
3. **GSAP 3** — Complex animations, scroll work (18 KB, now fully free)
4. **Motion One** — Lightweight alternative (3.8 KB, minimal)
5. **AutoAnimate** — DOM mutation animations (1.9 KB, zero-config)
6. **Rive** — Interactive, state machine animations (200 KB runtime, competitive files)
7. **Lottie/dotLottie** — Design tool integration (2-10 KB per file)
8. **CSS scroll-driven** — Scroll animations (0 KB, native, 85% support)

### ⚠️ **SELECTIVE USE**
- **React Spring** — Only if physics-based feel is critical AND bundle trade-off acceptable
- **Tailwind animations** — Default for Tailwind projects; combine with other libs for complexity
- **Popmotion** — Advanced use cases needing fine control

### ❌ **AVOID**
- **Theatre.js** — Stalled development (v1.0 promised but not delivered since 2024)

### 🎯 **2026 Philosophy**
- **Start native:** View Transitions API + CSS scroll-driven (0 KB)
- **Add strategically:** Motion One or AutoAnimate for specific needs
- **Upgrade carefully:** Full Framer Motion/GSAP only when complexity demands it
- **Design tools:** Lottie + dotLottie OR Rive for design-to-web workflows
- **Bundle first:** Measure impact; 3-4 KB (Motion One) vs. 20+ KB (React Spring) is huge on mobile

---

## Sources

- [Motion for React (formerly Framer Motion) - npm](https://www.npmjs.com/package/framer-motion)
- [Motion for React Upgrade Guide & Docs](https://motion.dev/docs/react-upgrade-guide)
- [GSAP 3 - npm](https://www.npmjs.com/package/gsap)
- [GSAP GitHub](https://github.com/greensock/GSAP)
- [Lottie Web - GitHub](https://github.com/airbnb/lottie-web)
- [dotLottie React Documentation](https://developers.lottiefiles.com/docs/dotlottie-player/dotlottie-react/)
- [AutoAnimate GitHub](https://github.com/formkit/auto-animate)
- [React Spring GitHub](https://github.com/pmndrs/react-spring)
- [Rive Animation Platform](https://rive.app/)
- [Theatre.js - Motion Design Editor](https://www.theatrejs.com/)
- [anime.js - JavaScript Animation Engine](https://animejs.com/)
- [View Transitions API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Motion One - Web Animations API Wrapper](https://motion.dev/)
- [Popmotion - Animation Toolkit](https://popmotion.io/)
- [Tailwind CSS Animation Docs](https://tailwindcss.com/docs/animation)
- [CSS Scroll-Driven Animations - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)
- [CSS Scroll-Driven Animations - WebKit Blog](https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/)
