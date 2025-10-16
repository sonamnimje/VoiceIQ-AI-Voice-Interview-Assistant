# 🎙️ VoiceIQ - AI Voice Interview Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 14+](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)

VoiceIQ is an advanced AI-powered interview preparation platform that provides real-time voice interaction, intelligent feedback, and personalized coaching to help users excel in their interviews. Whether you're preparing for technical, behavioral, or case interviews, VoiceIQ offers a realistic practice environment with detailed analytics to track your progress.

## ✨ Key Features

### 🎤 Real-time Voice Interaction
- Natural conversation flow with AI interviewer
- Voice-to-text transcription with high accuracy
- Support for multiple languages and accents

### 📊 Comprehensive Analytics
- Detailed performance metrics across multiple dimensions
- Progress tracking and trend analysis
- Personalized feedback and improvement suggestions

### 🎯 Interview Modes
- **Technical Interviews**: Coding challenges and system design
- **Behavioral Interviews**: STAR method and situational questions
- **Custom Interviews**: Tailor questions to specific roles or companies

### 🛠️ Technical Features
- **Resume Parser**: Extract skills and experience for personalized questions
- **Practice Mode**: Repeat questions and refine your answers
- **Session Recording**: Review your performance anytime
- **Mobile Responsive**: Practice on any device

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- FFmpeg (for audio processing) — install via package manager:
  - macOS: brew install ffmpeg
  - Ubuntu/Debian: sudo apt install ffmpeg
  - Windows: download from https://ffmpeg.org/download.html and add to PATH

### Installation (monorepo: root contains frontend/ and backend/)
1. Clone the repository
   ```bash
   git clone https://github.com/sonamnimje/VoiceIQ-AI-Voice-Interview-Assistant.git
   cd VoiceIQ-AI-Voice-Interview-Assistant
   ```

2. Set up the backend (Unix/macOS)
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
   Windows (PowerShell)
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

3. Set up the frontend
   ```bash
   cd ../frontend
   npm install
   ```

4. Start locally
   - Backend (dev, reload enabled)
     ```bash
     cd backend
     uvicorn main:app --reload --host 127.0.0.0 --port 8000
     ```
   - Frontend (typical CRA/React)
     ```bash
     cd frontend
     npm start
     ```
   Open your browser at http://localhost:3000 (frontend) and ensure API requests point to http://localhost:8000 or use a proxy.

## 🛠️ Technology Stack

### Frontend
- **React.js** - Modern UI with functional components and hooks
- **Redux** - State management
- **Socket.IO** - Real-time communication
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Comprehensive icon library

### Backend
- **FastAPI** - High-performance Python web framework
- **SQLAlchemy** - ORM for database operations
- **WebSockets** - Real-time bidirectional communication
- **OpenAI API** - Natural language processing
- **FFmpeg** - Audio processing

## 📚 Documentation

### API Reference
Detailed API documentation is available at `/docs` when running the backend server.

### Environment Variables
Create a `.env` file in the backend directory (do NOT commit this file) with the following variables:
```
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=sqlite:///./voiceiq.db
SECRET_KEY=your_secret_key
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing advanced language model capabilities
- React community for excellent documentation and tools
- FastAPI for high-performance web framework
- All contributors and users of this project

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation and troubleshooting guides

---

**Note**: This application requires an OpenAI API key for full functionality. Please ensure you have valid API credentials configured before use.

## 🚢 Deployment

This repository uses GitHub Actions to build the frontend and deploy to Vercel, and Render to host the Python backend.

- Frontend: built from `frontend/` and deployed to Vercel. A working `vercel.json` file in the repo root configures the build and rewrites `/api/*` to the Render backend.
- Backend: hosted on Render and expected at `https://voiceiq-backend.onrender.com` in production.

Before enabling automatic deploys, make sure the following are configured:

1. GitHub Actions secret `VERCEL_TOKEN` is set (create a Vercel Personal Token in your Vercel account and add it under repo Settings → Secrets)
2. The `vercel.json` at repo root is not overridden by project settings in the Vercel dashboard (check Routes/Build settings)

CI notes:

- The GitHub Actions workflow at `.github/workflows/deploy-frontend-vercel.yml` builds the `frontend` folder and deploys via the Vercel CLI using `${{ secrets.VERCEL_TOKEN }}`.
- The workflow sets build-time envs `REACT_APP_BACKEND_URL` and `REACT_APP_SOCKET_URL` to `https://voiceiq-backend.onrender.com`.

If you prefer to let Vercel build the frontend directly, remove `frontend/build/` from git and let the workflow or Vercel perform the build. This repo previously contained built artifacts; we've moved to a CI-built approach to reduce merge conflicts and keep a single source of truth for builds.
