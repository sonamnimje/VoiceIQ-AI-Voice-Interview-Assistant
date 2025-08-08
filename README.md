# AI Voice Interview Assistant

A comprehensive AI-powered interview preparation platform that provides real-time voice interaction, intelligent feedback, and personalized coaching to help users excel in their interviews.

## 🚀 Features

### Enhanced Dashboard
- **Real-time Statistics**: Live dashboard with interview completion stats, average scores, and improvement trends
- **Dynamic Recent Activity**: Shows actual interview history with timestamps and performance metrics
- **Performance Insights**: Detailed breakdown of communication, technical, problem-solving, and confidence scores
- **Achievement System**: Gamified progress tracking with unlockable achievements
- **Interactive Elements**: Hover effects, animations, and modern UI components
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Core Features
- **Voice-Enabled Interviews**: Real-time voice interaction with AI interviewer
- **AI-Powered Feedback**: Comprehensive analysis of responses with actionable insights
- **Multiple Interview Modes**: Technical, behavioral, and custom interview scenarios
- **Resume Integration**: Upload and analyze resumes for personalized questions
- **Progress Tracking**: Detailed analytics and performance metrics
- **Practice Sessions**: Dedicated practice mode for skill improvement

## 🛠️ Technology Stack

### Frontend
- **React.js**: Modern UI framework with hooks and functional components
- **React Router**: Client-side routing for seamless navigation
- **Socket.IO**: Real-time communication for voice processing
- **CSS3**: Advanced styling with gradients, animations, and responsive design
- **React Icons**: Comprehensive icon library for enhanced UX

### Backend
- **FastAPI**: High-performance Python web framework
- **SQLite**: Lightweight database for data persistence
- **Socket.IO**: Real-time bidirectional communication
- **OpenAI API**: Advanced language model integration
- **Speech Recognition**: Voice-to-text processing capabilities

## 📊 Dashboard Features

### Statistics Overview
- **Interview Count**: Total and completed interviews
- **Average Scores**: Overall performance metrics
- **Last Interview**: Recent activity tracking
- **Improvement Trends**: Performance progression over time

### Recent Activity Feed
- **Real-time Updates**: Live interview history
- **Performance Metrics**: Score tracking for each session
- **Time Stamps**: Relative time display (e.g., "2 hours ago")
- **Status Indicators**: Visual cues for different activity types

### Performance Insights
- **Communication Skills**: Clarity and articulation metrics
- **Technical Knowledge**: Domain-specific expertise scoring
- **Problem Solving**: Analytical thinking assessment
- **Confidence Level**: Self-assurance and presentation skills

### Achievement System
- **Progressive Unlocking**: Achievements based on milestones
- **Visual Feedback**: Color-coded unlocked/locked states
- **Progress Tracking**: Achievement completion percentages
- **Motivational Elements**: Encouraging user engagement

## 🎯 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- FFmpeg (for audio processing)

### Quick Start Options

#### Option 1: Windows Batch Scripts (Easiest)
- **Localhost Development**: Double-click `start_localhost.bat`
- **Network Access**: Double-click `start_network.bat`

#### Option 2: Manual Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-voice-interview-assistant
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Start Servers**

   **For Localhost Development:**
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

📖 **For detailed instructions, see [STARTUP_GUIDE.md](STARTUP_GUIDE.md)**

## 📱 Usage

### Dashboard Navigation
1. **Login/Register**: Create an account or sign in
2. **View Statistics**: Check your interview performance metrics
3. **Start Interview**: Begin a new interview session
4. **Review Activity**: Monitor recent interview history
5. **Track Progress**: View achievements and improvement trends

### Interview Process
1. **Select Mode**: Choose interview type (technical, behavioral, etc.)
2. **Voice Interaction**: Speak naturally with the AI interviewer
3. **Real-time Feedback**: Receive instant performance analysis
4. **Review Results**: Access detailed feedback and suggestions
5. **Practice Improvement**: Use insights to enhance skills

## 🔧 Configuration

### Environment Variables
```bash
# Backend (.env)
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=sqlite:///database.db
PORT=8000

# Frontend (.env)
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SOCKET_URL=http://localhost:8000
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
