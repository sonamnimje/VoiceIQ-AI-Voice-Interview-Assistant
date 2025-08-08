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
- FFmpeg (for audio processing)

### Installation

#### Option 1: Using Batch Scripts (Windows)
1. Download the repository
2. Run the appropriate batch file:
   - `start_localhost.bat` - For local development
   - `start_network.bat` - For network access

#### Option 2: Manual Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sonamnimje/VoiceIQ-AI-Voice-Interview-Assistant.git
   cd VoiceIQ
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the application**
   - In one terminal (backend):
     ```bash
     cd backend
     uvicorn main:app --reload
     ```
   - In another terminal (frontend):
     ```bash
     cd frontend
     npm start
     ```

5. Open your browser and navigate to `http://localhost:3000`

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
Create a `.env` file in the backend directory with the following variables:
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
- OpenAI for their powerful language models
- The open-source community for various libraries and tools
   ```bash
   # Terminal 1 - Backend
   cd backend
   python run_server.py
   
   # Terminal 2 - Frontend
   cd frontend
   npm run start:localhost
   ```

   **For Network Access:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   python start_server.py
   
   # Terminal 2 - Frontend
   cd frontend
   npm run start:network
   ```

5. **Access the Application**
   - **Localhost**: http://localhost:3000 (Frontend) / http://localhost:8000 (Backend)
   - **Network**: http://192.168.29.164:3000 (Frontend) / http://192.168.29.164:8000 (Backend)

```

### API Endpoints
- `GET /api/dashboard/stats/{email}`: Enhanced dashboard statistics
- `GET /api/interview/history/{email}`: Interview history
- `GET /api/profile`: User profile information
- `POST /api/interview/start`: Start new interview session
- `POST /api/feedback/save`: Save interview feedback

## 🎨 UI/UX Features

### Modern Design
- **Glassmorphism**: Translucent card effects with backdrop blur
- **Gradient Backgrounds**: Dynamic color schemes
- **Smooth Animations**: CSS transitions and keyframe animations
- **Responsive Layout**: Adaptive design for all screen sizes

### Interactive Elements
- **Hover Effects**: Enhanced user feedback
- **Loading States**: Smooth loading animations
- **Toast Notifications**: User-friendly feedback messages
- **Modal Dialogs**: Contextual information display

## 📈 Performance Metrics

### Dashboard Analytics
- **Interview Completion Rate**: Percentage of completed sessions
- **Average Score Trends**: Performance over time
- **Skill Breakdown**: Detailed competency analysis
- **Improvement Tracking**: Progress visualization

### Real-time Features
- **Live Updates**: Instant data synchronization
- **WebSocket Communication**: Efficient real-time messaging
- **Voice Processing**: Low-latency audio analysis
- **Responsive UI**: Smooth user interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
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
