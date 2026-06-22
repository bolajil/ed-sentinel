---
name: project-setup
description: Key deployment and architecture facts about ed-sentinel that aren't obvious from the code
metadata:
  type: project
---

Vercel Root Directory must be set to `ed-sentinel` (the inner subfolder) in Vercel project settings. The git repo root is one level up. Without this, Vercel builds in 1 second and serves nothing.

**Why:** Repo structure is `ed-sentinel/` (git root) → `ed-sentinel/ed-sentinel/` (React app). Vercel deploys from git root by default.

**How to apply:** If the Vercel deployment ever starts failing in 1s with 404, check that Root Directory is still set to `ed-sentinel` in Settings → Build and Deployment.

---

Push pattern: local branch is `master`, Vercel watches `main`. Always use:
```
git push origin master:main
```

---

`DISABLE_ESLINT_PLUGIN=true` is set in `ed-sentinel/.env` to prevent ESLint warnings from blocking CI builds (react-scripts sets `CI=true` which makes warnings errors).
