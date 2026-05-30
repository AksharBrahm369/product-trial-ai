# Product Room — Virtual Try-On

React app that lets users upload their photo plus a clothing image, then uses **OpenAI’s image edit API** to generate a virtual try-on.

## Features

- Upload your photo and one or more clothing items (up to 5, JPEG/PNG/WebP)
- Progress bar while AI generates the try-on
- Recent try-ons saved in browser history (click to view again)
- Download the result
- API key stored securely in `.env` (server-side only)

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [OpenAI API key](https://platform.openai.com/api-keys)

### About “free” OpenAI API

The **OpenAI API is not permanently free** — it is pay-as-you-go. New accounts may receive **trial credits**. For lower cost per image, use `gpt-image-1-mini` in `.env`. ChatGPT’s free image limits apply only inside the ChatGPT app, not to the API.

## Setup

1. **Install dependencies**

   ```bash
   npm run install:all
   ```

2. **Configure API key**

   Copy the example env file and add your key:

   ```bash
   copy .env.example .env
   ```

   Edit `.env`:

   ```env
   OPENAI_API_KEY=sk-your-actual-key
   OPENAI_IMAGE_MODEL=gpt-image-1-mini
   PORT=3001
   ```

3. **Run the app**

   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:5173  
   - Backend API: http://localhost:3001  

4. Open http://localhost:5173, upload both images, and click **Try on with AI**.

## Production build (local server)

```bash
npm run build
npm start
```

Serves the React build from the Express server on port 3001.

## Deploy to Vercel (recommended)

Vercel works well for this app: static React site + serverless API routes in `/api`.

### Steps

1. Push the project to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo.
3. Vercel reads `vercel.json` automatically (build: `client/dist`, API: `/api/*`).
4. **Environment variables** (Project Settings → Environment Variables):
   - `OPENAI_API_KEY` = your `sk-...` key
   - `OPENAI_IMAGE_MODEL` = `gpt-image-1-mini` (optional)
5. Deploy.

Test: `https://YOUR-PROJECT.vercel.app/api/health` → `"hasApiKey": true`.

### Vercel vs Netlify for this app

| | Vercel | Netlify |
|---|--------|---------|
| API routes | `/api` folder (included) | `netlify/functions` (included) |
| Max function time (Pro) | up to **60s** | up to **26s** |
| Free tier timeout | **10s** (may timeout on slow AI) | **10s** |

AI image generation often takes **15–60 seconds**. On the **free** plan, both platforms may timeout. **Vercel Pro** allows 60s, which is better for this use case.

---

## Deploy on Netlify (all-in-one)

See **[NETLIFY-DEPLOY.md](./NETLIFY-DEPLOY.md)** — connect GitHub, add `OPENAI_API_KEY`, deploy.

---

## Deploy for FREE (Netlify + Render) — if Netlify AI times out

Netlify **free** cannot run this AI API reliably (10 second limit). Use:

- **Netlify** — free static site  
- **Render** — free API backend  

Full guide: **[DEPLOY-FREE.md](./DEPLOY-FREE.md)**

Quick summary:
1. Deploy `server/` on [Render](https://render.com) with `OPENAI_API_KEY`.
2. Deploy site on [Netlify](https://netlify.com) with `VITE_API_URL=https://your-app.onrender.com`.
3. Redeploy Netlify after setting `VITE_API_URL`.

---

## Deploy to Netlify (functions — often needs Pro)

Netlify only hosts the **React site** unless you add **serverless functions**. Free functions timeout at **10s**; AI try-on usually needs longer.

### 1. Push to GitHub

Commit and push the whole `product room` folder (including `netlify.toml` and `netlify/functions/`).

### 2. Create a Netlify site

- [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
- Build settings are read from `netlify.toml` automatically:
  - **Publish directory:** `client/dist`
  - **Functions:** `netlify/functions`

### 3. Add environment variables (required)

In **Site settings → Environment variables**, add:

| Variable | Value |
|----------|--------|
| `OPENAI_API_KEY` | Your OpenAI key (`sk-...`) |
| `OPENAI_IMAGE_MODEL` | `gpt-image-1-mini` (optional) |

`.env` on your PC is **not** uploaded to Netlify — you must set variables in the Netlify dashboard.

### 4. Deploy

Click **Deploy site**. After deploy, open:

`https://YOUR-SITE.netlify.app/api/health`

You should see `"hasApiKey": true` and `"canReachOpenAI": true`.

### Netlify notes

- **Function timeout:** AI image generation can take 15–60 seconds. Free Netlify functions timeout at **10s**; you may need **Netlify Pro** (26s timeout) or host the API on [Render](https://render.com) / [Railway](https://railway.app) and set `VITE_API_URL` to that backend URL.
- **Request size:** Keep uploaded images under ~4MB each so the total request stays under Netlify’s limit.

## Project structure

```
product room/
├── .env                 # Your OpenAI key (not committed)
├── client/              # React (Vite) frontend
└── server/              # Express API → OpenAI images.edit
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `OPENAI_API_KEY is missing` | Create `.env` from `.env.example` and set your key, then restart `npm run dev` |
| `500` / `Connection error` / `ENOTFOUND` | Your PC cannot reach `api.openai.com`. Check internet, disable blocking VPN/firewall, or change DNS to **8.8.8.8** or **1.1.1.1** in Windows network settings |
| OpenAI blocked in your country | Use a VPN that allows access to OpenAI, then retry |
| `401 Invalid API key` | Regenerate key at platform.openai.com |
| `429` / quota errors | Add billing or wait; API needs credits |
| Model not available | Try `gpt-image-1` or `gpt-image-2` in `.env` |

Open **http://localhost:5173/api/health** in the browser to see if the server can reach OpenAI (`canReachOpenAI: true`).
