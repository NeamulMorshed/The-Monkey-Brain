---
title: "Research — Motion & video skills as brain capability packs"
type: research
status: active
tags: [capability-plugins, skills, animation, video, routing]
created: 2026-11-09
updated: 2026-11-09
sources: []
related: ["[[trigger-router]]", "[[develop-lifecycle-stages]]", "[[doctor-health-checks]]", "[[model-routing]]"]
---

# Motion & video skills as brain capability packs — research

> **Question:** how do three external skill sets — a GSAP/Framer scroll-animation skill, Remotion's
> skills and Emil Kowalski's design-engineering skills — fit the brain's rules (craft layer, lifecycle,
> gates, filing) instead of running beside them? · **For:** [[motion-skill-packs]] (spec, to draft)

## Findings

**1. gsap-framer-scroll-animation** — <https://github.com/github/awesome-copilot/tree/main/skills/gsap-framer-scroll-animation> (MIT)
- One skill + `references/gsap.md`, `references/framer.md`: library selector (GSAP for vanilla/pinning/
  horizontal/timelines, Framer Motion for React declarative/`whileInView`), ScrollTrigger and Motion v12 recipes.
- Pure implementation ("the how"). Written for Copilot; says always pair with a `premium-frontend-ui`
  skill that we don't ship — `frontend-design` is our equivalent.

**2. Remotion** — <https://github.com/remotion-dev/remotion> (custom licence, not MIT)
- `packages/skills/skills/`: **13 public skills** behind a router `remotion-best-practices` (create, markup,
  captions, maps, multimedia, render, studio, upgrade, saas, interactivity, docs, license). Same set under
  `packages/codex-plugin/skills/`.
- `.agents/skills/`: **68 internal skills** for maintaining Remotion itself — out of scope.
- Video-as-React. Companies past a size threshold need a paid Remotion licence (`remotion-license` skill).
- Its router opens with "preserve user changes" — compatible with the brain's never-overwrite stance.

**3. emilkowalski/skills** — <https://github.com/emilkowalski/skills> (MIT; installs via `npx skills add`, not a Claude plugin)
- **18 skills**. Taste: `emil-design-eng`, `apple-design`, `animation-vocabulary`. Make: `animate`,
  `choreograph`, `gestures`, `prototype`. Audit: `review-animations` (`disable-model-invocation: true`,
  "default to flagging"), `improve-animations` (read-only audit → self-contained plans for cheaper
  agents), `animation-performance`, `find-animation-opportunities`, `remove-animations`, `break-ui`.
  Platform: `animate-expo`, `mobile-native`, `write-swift`, `ask-sonner`, `pick-ui-library`.
- Each opens with a scripted "Initial Response" — clashes with terse mode's no-preamble rule.

**4. Brain fit** (reference.md §9–§10, manual §4–§5)
- §9 already states the contract: *plugins do the craft; the brain records the knowledge*, with a
  precedence chain (deterministic trigger > domain pack > domain skill > craft plugin > general model)
  and a curated-offer pattern (`recommended-mcp-servers.json` offered by `/brain:init`).
- Outputs map cleanly onto existing homes:

| Skill output | Brain home | Rule that already exists |
| --- | --- | --- |
| `improve-animations` audit + plans | audit → `wiki/research/`; each plan → a spec with ACs | research → plan → build (build on sonnet) |
| `review-animations` / `break-ui` / `animation-performance` | `wiki/syntheses/<x>-review` with P0–P2 | open P0 gates `/brain:wrap`; reviewer on another family |
| library / easing / approach choices, `pick-ui-library` | `decisions/` ADR | same path as frontend-design |
| Emil's "agents get this wrong" rules | `instincts/pending/` | curator promotes to `active/` |
| Remotion videos | a video pipeline like `/brain:game` (brief → storyboard spec → composition → render → review) | domain pipelines (§10) |
| `prototype` variants | labelled throwaway spike; chosen variant gets a spec | spike rule |

- **Context cost:** every installed skill's description loads each turn. 32 skills at once would eat
  the session budget doctor #9 watches — install as packs, per project.
- **TDD gate:** motion code is hard to unit-test; motion specs need a visual/performance test plan
  (or `tdd: false` + a review gate).
- **Vendoring vs offering:** vendoring freezes upstream and bloats the plugin; Remotion's licence makes
  vendoring its skills a non-starter.

## Recommendation
Add **capability packs**, offered not vendored — a `recommended-skills.json` beside
`recommended-mcp-servers.json`, offered by `/brain:init` per project and installed into the project's
`.claude/skills/` only on the curator's yes:
- **web-motion**: gsap-framer-scroll-animation + emil-design-eng, animate, choreograph,
  review-animations, improve-animations, animation-performance.
- **video**: Remotion's 13 public skills (licence note shown on offer).
- **mobile-motion**: animate-expo, mobile-native, gestures.

Then wire them into the brain: router rules (scroll/parallax/animate → web-motion; "make a video" →
video pipeline) below the brain's own workflows; §9 filing rules for each output (table above);
a motion test-plan section in the spec template; `/brain:video` as a thin domain pipeline; terse-mode
override of scripted greetings; `frontend-design` named as gsap's design companion. Feature tier;
the video pipeline may be its own spec.

## Filed
Feeds: [[motion-skill-packs]] (spec, next: `/brain:plan`) · Related: [[trigger-router]], [[develop-lifecycle-stages]]
