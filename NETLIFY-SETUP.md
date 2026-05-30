# Deploy to Netlify in 5 minutes

## Option A — One-click (easiest)

1. Open this link while logged into Netlify:  
   **https://app.netlify.com/start/deploy?repository=https://github.com/AksharBrahm369/product-trial-ai**

2. When asked for environment variables, add:
   - `OPENAI_API_KEY` = your key from https://platform.openai.com/api-keys
   - `OPENAI_IMAGE_MODEL` = `gpt-image-1-mini`

3. Click **Deploy product-trial-ai**

4. Wait for **Published** (green). Open your site URL.

5. Test: `https://YOUR-SITE.netlify.app/api/health`  
   Should show `"hasApiKey": true`.

---

## Option B — Import in dashboard

1. Go to https://app.netlify.com → **Add new site** → **Import an existing project**
2. **GitHub** → choose **product-trial-ai**
3. Settings (from `netlify.toml` — do not change unless wrong):

   | Field | Value |
   |-------|--------|
   | Branch | `main` |
   | Base directory | *(leave empty)* |
   | Build command | `npm install && npm install --prefix client && npm run build --prefix client` |
   | Publish directory | `client/dist` |
   | Functions directory | `netlify/functions` |

4. **Environment variables** → Add `OPENAI_API_KEY` and `OPENAI_IMAGE_MODEL`
5. **Deploy site**

---

## After deploy

- Try-on can take **1–3 minutes** on the live site (background AI).
- Use smaller images if it fails.
- To update: push to GitHub → Netlify redeploys automatically.
