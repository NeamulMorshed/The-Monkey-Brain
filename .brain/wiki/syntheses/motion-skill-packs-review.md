---
title: "Review — Motion & video skill packs (0.35.0)"
type: synthesis
status: active
tags: [review, skill-packs, router, animation, video]
created: 2026-11-09
updated: 2026-11-09
sources: ["[[motion-skill-packs]]", "[[motion-and-video-skills]]"]
related: ["[[trigger-router]]", "[[skill-packs]]"]
---

# Review — Motion & video skill packs (0.35.0)

Builder Sonnet (`80a0023..bd8a900`), reviewer Fable, fixes Sonnet in `95e47f7`, red first (30 failing → selftest 698).
Real installs were run in temp dirs outside the repo; router probed against a scratch brain.

## P1 (all fixed)
1. **Video rule fired on ordinary video features** ("build a video call feature", "video upload endpoint", "video player page"). Now needs a production cue (promo, explainer, trailer, composition…) or "remotion", and excludes call/chat/player/upload/stream/thumbnail/codec.
2. **`review-animations`, `prototype`, `pick-ui-library` are `disable-model-invocation` upstream**, so AC-8's "run it as a reviewer" could not work. Manifest `user_invoked` list; router and context cost skip them; `/brain:review` asks the curator to run `/review-animations` or has a reviewer subagent apply its SKILL.md/STANDARDS.md.
3. **`improve-animations` only writes `plans/`** — clashed with "plans are specs". §9: let it write `plans/`, file the audit to `wiki/research/` and each plan as a spec citing `plans/NNN`, then delete or ignore `plans/`.
4. **The gsap install died** (cloning all of `github/awesome-copilot`). Separate `install_steps`; fallback a blobless sparse clone of the one directory (~4 s); `degit` also timed out.
5. **The not-installed offer repeated on every motion prompt.** Once per session per pack; `.brain/memory/skill-packs-declined.md` silences a declined pack.

## P2 (all fixed)
Router false positives (easing, animated GIF, CI animation, "google sheets"); context cost restated from measured upstream descriptions (video ~250, web-motion ~1.4k, mobile ~130 tokens) and measured live from installed skills; `mobile-native` and `gestures` are mobile *web* → moved to web-motion, mobile-motion = `animate-expo`; `--seed-instincts` skips `pruned/` and requires a brain; `--json` stays valid JSON on a bad manifest; badge alt text; partial packs say "partly installed"; Remotion licence: free up to 3 employees, citing its LICENSE.md; this brain's `reference.md` regenerated; ordering assertion added, vacuous grep dropped.

## AC verdicts after fixes
All 12 met — AC-1 and AC-8 reworded to match (`install_steps`; curator-run or subagent-applied review-animations). Pushed CI checked at close.
