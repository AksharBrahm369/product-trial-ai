# Deploy for FREE (Netlify + Render)

Netlify **free** functions stop after **10 seconds**. AI try-on often takes **20–60 seconds**, so the API will fail on Netlify Functions without paying.

**Solution (100% free):**

| Part | Host | Cost |
|------|------|------|
| React website | **Netlify** | Free |
| API + OpenAI | **Render** | Free |

---

## Part 1 — API on Render (free)

1. Push this project to **GitHub**.
2. Go to [render.com](https://render.com) and sign up (free).
3. Click **New +** → **Blueprint** (or **Web Service**).
4. Connect your GitHub repo.
5. If using Blueprint, Render uses `render.yaml` automatically.
   - Otherwise set manually:
     - **Root directory:** `server`
     - **Build command:** `npm install`
     - **Start command:** `npm start`
     - **Plan:** Free
6. Add **Environment variables** on Render:
   - `OPENAI_API_KEY` = your key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - `OPENAI_IMAGE_MODEL` = `gpt-image-1-mini`
7. Click **Create Web Service** and wait until status is **Live**.
8. Copy your API URL, e.g. `https://product-room-api.onrender.com`
9. Test in browser: `https://YOUR-API.onrender.com/api/health`  
   Should show `"hasApiKey": true`.

**Note:** Free Render sleeps after ~15 min idle. The first request after sleep can take **30–60 seconds** to wake up — then try-on works normally.

---

## Part 2 — Website on Netlify (free)

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**.
2. Select the same repo.
3. Build settings (should match `netlify.toml`):
   - **Build command:** `npm install --prefix client && npm run build --prefix client`
   - **Publish directory:** `client/dist`
4. **Important — Environment variables** (Site settings → Environment variables):

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | Your Render URL, e.g. `https://product-room-api.onrender.com` |
   | | **No trailing slash** |

   Do **not** put `OPENAI_API_KEY` on Netlify — it stays on Render only.

5. **Deploy site** (or **Trigger deploy** if you add variables after the first deploy).

6. Open your Netlify URL and try a try-on.

---

## Checklist if something fails

| Problem | Fix |
|---------|-----|
| "API not found" / 404 | Set `VITE_API_URL` on Netlify and **redeploy** (variables are baked in at build time). |
| "OPENAI_API_KEY is missing" | Add key on **Render**, not Netlify. Redeploy Render. |
| Very slow first try | Render free tier waking up — wait 1 minute, try again. |
| CORS error | Redeploy Render with latest `server/index.js` (CORS allows your Netlify domain). |
| Works on localhost, not live | `VITE_API_URL` must match your live Render URL exactly. |

---

## Cost summary

- **Netlify:** free static hosting  
- **Render:** free web service (with sleep + cold starts)  
- **OpenAI:** pay-as-you-go for API usage (may have trial credits for new accounts)

You do **not** need Netlify Pro for this setup.
