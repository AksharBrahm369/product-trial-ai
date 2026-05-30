# Deploy on Netlify (one site, everything included)

Repo: [product-trial-ai](https://github.com/AksharBrahm369/product-trial-ai)

## 1. Connect Netlify to GitHub

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Choose **GitHub** → select **AksharBrahm369/product-trial-ai**
3. Netlify reads `netlify.toml` automatically — do not change build settings unless needed

## 2. Add environment variables (required)

**Site configuration → Environment variables → Add a variable**

| Variable | Value |
|----------|--------|
| `OPENAI_API_KEY` | Your key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `OPENAI_IMAGE_MODEL` | `gpt-image-1-mini` |

You do **not** need `VITE_API_URL` when using Netlify functions (API runs on the same domain).

## 3. Deploy

Click **Deploy site**. Wait until the build is **Published**.

## 4. Test

1. Open your site: `https://YOUR-SITE.netlify.app`
2. Health check: `https://YOUR-SITE.netlify.app/api/health`  
   - Expect: `"hasApiKey": true`
3. Upload photos and click **Try on with AI**  
   - Production uses **background processing** (can take 1–3 minutes — keep the page open)

## How it works on Netlify

| URL | Purpose |
|-----|---------|
| `/` | React app |
| `/api/try-on-start` | Starts AI job (returns `jobId`) |
| `/api/try-on-status?jobId=...` | Poll until image is ready |
| `/api/health` | Check API key + OpenAI connection |

## If something fails

| Issue | Fix |
|-------|-----|
| API not found (404) | Redeploy; ensure `netlify/functions` is in the repo |
| Missing API key | Add `OPENAI_API_KEY` in Netlify env vars → **Trigger deploy** |
| Stuck on “Generating…” | Wait up to 3 min; use smaller images (under 2MB each) |
| Background never completes | Enable **Netlify Blobs** (included on free tier for linked sites) |
| Still failing | Use Render backend: see `DEPLOY-FREE.md` and set `VITE_API_URL` |

## Update after code changes

```bash
git add .
git commit -m "Update app"
git push
```

Netlify redeploys automatically from GitHub.
