# CLAUDE.md

> **Single source of truth. Read this FIRST every session.** Inspect other files only if info here is missing. **Reuse existing code — never duplicate** (check the Reusable Code registry below). **Keep this file updated** whenever architecture, folders, APIs, dependencies, or features change. Full planning detail: [SOP.md](SOP.md).

## Project overview
Personal portfolio for **Vishesh Jain — AI-Native Engineer (fresher)**. Goal: award-caliber site that makes him stand out to recruiters. Concept **"Systems that think"** — dark, one molten-amber signal, editorial serif + mono, hybrid DOM+WebGL, a cursor-reactive *agentic-graph* hero that proves he builds intelligent systems. **Status: planning (P0) — no app code yet.**

## Tech stack
- **Next.js (App Router) + TypeScript** — SSR, crawlable content
- **React Three Fiber + drei + GLSL** — 3D (quarantined in `webgl/`)
- **GSAP + ScrollTrigger + Lenis** — motion & smooth scroll
- **CSS + custom-property tokens** — no UI kit
- *Dependency rule:* a new dep must beat native CSS / Web Animations / existing GSAP before it's added.

## Architecture
**Hybrid, not all-WebGL.** All content in accessible/SSR DOM; WebGL layered in only at the hero + one or two accent moments. Separation of concerns: routing (`app/`) · presentation (`components/`) · data/copy (`content/`) · 3D (`webgl/`) · design tokens (`styles/`).

## Folder structure
```
src/
├─ app/          # routes only — pages & layouts
├─ components/   # ui/ (primitives) · layout/ (Nav,Footer,Shell) · sections/ (Hero,Work,About,Process,Contact)
├─ webgl/        # scenes/ + shaders/ (.glsl) — 3D isolated here
├─ hooks/        # reusable hooks (useX)
├─ animations/   # shared GSAP timelines & reveal primitives
├─ lib/          # framework-agnostic utils & config
├─ content/      # project data & copy (projects.ts, bio.ts) — NOT hardcoded in components
└─ styles/       # tokens.css (design system) + globals.css
public/ → fonts/ images/ models/   ·   docs/ → planning refs   ·   SOP.md → full plan
```
Assemble sections from primitives; never hand-roll the same thing twice. Annotated version: SOP §5.1.

## Coding conventions
- `PascalCase` components · `camelCase` fns/vars · `kebab-case` non-component files · `useX` hooks · `SCREAMING_SNAKE` consts
- One component per file; shared primitives live in `components/ui`
- All copy/data in `content/`; design values via tokens in `styles/`, never magic numbers
- Typed, linted, no dead code, no `console` noise
- `prefers-reduced-motion` + a11y (semantic HTML, focus states, alt text) required on every motion/interactive piece

## Git workflow
- `main` = always deployable, protected (+ optional `develop` if git-flow — **confirm model with user**)
- One short-lived branch per unit: `feature/*` `fix/*` `chore/*` `perf/*`, mapped to roadmap (`feature/p2-preloader`, `feature/p4-hero-webgl`)
- **Conventional Commits** (`feat:` `fix:` `refactor:` `perf:` `docs:` `chore:`); PR per feature; squash-merge; no direct commits to `main`
- ⚠️ **Do NOT init git or commit until the user explicitly approves.**

## Reusable code (registry — UPDATE as built; check here before writing anything new)
- `components/ui`: **Magnetic** (pointer-lean wrapper) · **Cursor** (dot+ring, fine-pointer only; **`data-cursor-view="Label"` morphs the ring into a filled amber disc with a label — the "VIEW" state**) · **Preloader** (Lusion loader *mechanic*, our brand: pure-#000 screen, bare bottom-left % counter counting 0→100 in uneven decelerating steps, asset-gated; at 100 → counter fades → centered "VJ" pops → flies/scales to the nav wordmark's measured `[data-brand]` rect → black clears; `signalSiteReady()` at exit start un-pauses the canvas Gates; session-gated once/visit; reduced-motion straight cut; hidden-tab failsafe) · **RollText** (dual-layer char-roll hover label; triggered by any ancestor with `data-roll-trigger`; amber under-layer, staggered; reduced-motion → color swap; trigger must carry aria-label)
- `components/layout`: **SmoothScroll** (Lenis+GSAP ticker, locked until site-ready) · **Nav** (scroll-choreographed bar: amber scroll-progress hairline, capsule morph past 40px, direction-aware hide/reveal past 320px, pointer spotlight, RollText links + active-section amber dots via ScrollTrigger, scramble-decode brand on hover; ≤640px collapses to Menu button [rolling Menu⇄Close label] + full-screen overlay — clip-path wipe, skewed stagger links, scanline, ghost VJ watermark, contact foot, Esc-close, scroll-locked, `inert` when closed; overlay z-index sits BELOW the bar so brand/Close stay clickable) · **Footer** (sticky-reveal: fixed to viewport bottom, measures its height into `--footer-h`; `main` sits on opaque ground + reserves that height, so content lifts to uncover it; static in flow under reduced-motion)
- `hooks`: **useReducedMotion** · **useSiteReady** (React view of the site-ready bus — both canvas Gates read it to stay `frameloop="never"` behind the loader and resume only at its exit)
- `animations`: **gsap.ts** (single register point — import gsap ONLY from here; exposes `window.__gsap` debug handle) · **reveals.ts** (revealLines / revealUp / drawHairline — all scroll reveals go through these) · **warp-cut.ts** (signature nav transition: `warpTo(href, opts)` singleton timeline — impact/shock+FX-spike → kinetic-type blow-up → turbulent liquid wipe w/ immediate Lenis snap under cover → landing/slam+pill-morph; kill-safe restart, reduced-motion crossfade path, gates shader FX on `warpFX.gpuTier`; locks scroll via `lenis.stop()` ONLY — never overflow toggles)
- `lib`: **site-ready.ts** (signalSiteReady/onSiteReady bus — preloader→intro orchestration) · **lenis-store.ts** (get/setLenis — shared Lenis handle) · **warp-fx.ts** (warpFX bus: `spike` 0–1 read+decayed by HeroScene's WarpFXDriver to surge CA/grain; `gpuTier` published by HeroSceneGate)
- `webgl/work`: **DistortedImagePlane** (per-project WebGL ripple plane, shared geometry, DOM-rect-synced every frame) · **ImageShaderMaterial** (`image-shader.ts`, drei `shaderMaterial`, gaussian-falloff ripple) · **usePointerUniforms** (event→ref target; fine-pointer hover-follow, coarse-pointer one-shot tap-decay) · **useDomRectSync** (per-frame `getBoundingClientRect`, no listeners) · **WorkThumbsScene** (orthographic, 1 world unit = 1 CSS px) · **WorkThumbsGate** (Option B: dedicated 2nd canvas, mirrors Hero's pause/never-unmount/ResumeKick pattern, NO composer attached; broken texture → ErrorBoundary → null → DOM `<img>` fallback underneath shows)
- `webgl`: **HeroScene** (R3F: MeshDistortMaterial molten core + wireframe shell, instanced agent nodes + arcs + signal pulses, drei Sparkles atmosphere, **postprocessing: Bloom + ChromaticAberration + Noise film-grain + Vignette**; **scroll-driven camera dolly/lift + field tilt/spread**; cursor parallax; mobile tier pulls camera back so the core doesn't swamp copy; `paused`→frameloop none; `bloom` toggle; context lost/restored callbacks; **ClearGuard** restores gl.autoClear when the composer drops — prevents frame-accumulation "smudge"; **ResumeKick** invalidates on unpause) · **HeroSceneGate** (mode select static/mobile/full; **canvas mounts ONCE & pauses off-screen — never unmounts (avoids context-pool exhaustion)**; static glow always layered behind; on loss→drop bloom, on restore→remount via key, →static only after 3 losses; **paused = !siteReady || !inView** — never renders behind the black loader, resumes at loader exit)
- `components/ui`: **Icon** (the ONLY icon set — inline SVG: mail/github/linkedin/instagram/phone/resume/arrow; currentColor, sized 1em — add new glyphs here) · **VJMark** (interlocked V·J monogram SVG, currentColor — used by preloader portal + `app/icon.svg` favicon) · **ErrorBoundary** (generic render-error catch → fallback UI) · **WarpCut** (transition overlay: shared `#warp-turb` SVG turbulence/displacement filter, oversized liquid-wipe panel, shock ring, kinetic-type layer, reduced-motion fade layer; registers elements into warp-cut.ts; z 70 — nav raises to 75 via `[data-warp]` while warping)
- CSS: `.line-mask>.line-inner` · `.eyebrow` · `.mono-label` · `.display` · `.shell` · `.section` · `.link-underline` · `.hairline` (globals.css)

## APIs
_None_ (static site). Document any added endpoint here (route · method · purpose).

## Environment variables
_None yet._ When added: document as `NAME — purpose`, provide `.env.example`, never commit secrets.

## Current features
Full single-page site, working at `npm run dev` (launch.json name: `portfolio`).
Section order (`app/page.tsx`): Hero → Manifesto → **About** → Proof → Work → **Experience** → Process → **Tech Stack** → Contact → Footer.
preloader (Lusion-mechanic: pure-black + bare bottom-left % counter, uneven count → **"VJ" flies to nav wordmark** as black clears; canvases stay paused behind it via site-ready gate; **session-gated, once per visit**) · choreographed hero intro · real WebGL hero (icosahedron + agent nodes + bloom + cursor parallax) · custom cursor · magnetic nav/CTA · Lenis smooth scroll · Manifesto scroll-scrub word illumination · **About** (serif heading + amber fact chips + portrait slot + bio) · **Proof** stat band (04/948/4×/0) · Work rows (4 projects, stretched-link, confidential badges) · **Experience** vertical timeline (amber nodes, tags) · Process grid · **Tech Stack** (4 categorized columns + scroll-animated depth bars, no loud %) + slim marquee · **Contact** (CTA + mailto-powered message form) + Footer · skip-link, reduced-motion paths, no-JS escape, no-overflow @1280.

## Current development status
**P1–P4 BUILT (2026-07-16); P5–P7 audit in progress.** Verified: valid HTML (nested-anchor bug fixed via stretched-link), console clean, no server errors, no mobile overflow, hidden-tab preloader failsafe. Pending: visual pass on user's screen (pane was closed during audit → animations paused), real content from INTAKE §A–F (TODOs in `src/content/`), R3F hero upgrade decision (P4.5, awaits reference video), git init (still gated on user approval), deploy (Vercel, INTAKE §H).

## Decision log (recent — full log SOP §8)
- Subject = AI-Native Engineer fresher; win = beat other freshers for a first role
- Direction = "Systems that think" (dark + amber, serif+mono, hybrid DOM+WebGL, agentic hero)
- Stack = Next.js + R3F + GSAP + Lenis; architecture = hybrid (not all-WebGL)
- Standards = modular structure, reuse-first, feature-branch git + Conventional Commits
- No git init/commit until user approves

## Technical debt
_None (no code yet)._

## Development rules
1. **Read this file first**; inspect other files only if needed info is missing.
2. **Reuse/extend** existing code — check the Reusable Code registry before writing new.
3. **Keep this file current** when architecture/folders/APIs/deps/features change.
4. Follow the folder structure, naming, and git workflow above.
5. **Plan-first** — no large code generation without approved direction.
6. Don't clone the reference studios (Lusion/Active Theory/Igloo) — borrow principles only.
7. Craft serves substance; **accessibility + performance are non-negotiable**.
8. **Never init/commit git until the user says so.**

## Key references
- **SOP.md** — full plan: design system, motion, section-by-section, roadmap, decisions
- **docs/01-design-intelligence-report.html** — reference analysis · **docs/02-direction-concept.html** — look & feel
- **~/.claude/projects/…/memory/** — persistent cross-session memory
