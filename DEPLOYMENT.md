# Deploying VoiceIQ

## Backend (Render)
1. Push the repository to GitHub (or connect your repo).
2. In Render, create a new Web Service -> Connect Repo -> select the backend folder (or root if single repo).
3. If using render.yaml, you can import from it when creating the service, or create the service manually:
   - Environment: Python
   - Build command: pip install -r requirements.txt
   - Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
4. Add environment variables in the Render dashboard (e.g., OPENAI_API_KEY, DATABASE_URL).
5. Deploy. Note the service URL (e.g., https://voiceiq-backend.onrender.com).

## Frontend (Vercel)
1. Push the frontend code to GitHub (can be same repo or a monorepo).
2. In Vercel, import the project and select the correct root directory (e.g., frontend).
3. Ensure the build command and output directory match your framework (update vercel.json if using a different setup).
4. Set environment variables in Vercel (e.g., REACT_APP_API_URL or NEXT_PUBLIC_API_URL pointing to your Render backend URL).
5. Deploy.

## Notes
- If your FastAPI application is not `main:app`, update Procfile and render.yaml startCommand accordingly.
- Prefer storing secrets (OPENAI_API_KEY, DB passwords) in Render/Vercel dashboard, not in repo.
- For CORS: ensure your backend allows requests from the Vercel frontend origin or use appropriate CORS middleware in FastAPI.
