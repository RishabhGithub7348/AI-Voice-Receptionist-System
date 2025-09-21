# 🎙️ Intelligent Voice Receptionist System with Supervisor Self Learning

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue)](https://www.python.org/)
[![LiveKit](https://img.shields.io/badge/LiveKit-Latest-green)](https://livekit.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

A sophisticated AI-powered voice receptionist system with human-in-the-loop supervision, designed for businesses to handle customer calls intelligently with seamless escalation to human supervisors when needed.

![Voice Receptionist Dashboard](./docs/dashboard-preview.png)

## 🌟 Features

### 🎯 Core Capabilities
- **🤖 AI Voice Receptionist** - Natural conversation using Gemini 2.0 with real-time voice processing
- **👥 Human-in-the-Loop** - Automatic escalation to human supervisors for complex queries
- **📚 Dynamic Knowledge Base** - Self-learning system that improves from supervisor resolutions
- **📞 Real-time Voice Calls** - WebRTC-based voice communication via LiveKit
- **🎫 Smart Ticketing** - Automatic ticket creation for unanswered questions
- **📊 Analytics Dashboard** - Track performance, response times, and system metrics
- **🔄 Live Transcription** - Real-time speech-to-text for monitoring conversations

### 💼 Business Features
- **Multi-category Knowledge Management** - Organize information by departments/categories
- **Customer Session Tracking** - Maintain conversation history and customer profiles
- **Priority-based Escalation** - Urgent issues get immediate supervisor attention
- **Supervisor Dashboard** - Comprehensive interface for managing help requests
- **Learning System** - AI learns from supervisor resolutions to handle similar queries

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    INTELLIGENT VOICE RECEPTIONIST SYSTEM                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐                    ┌──────────────────────────────────────────┐
│                 │                    │              Backend Services            │
│  Frontend       │                    │                                          │
│  (Next.js)      │                    │  ┌─────────────────┐                     │
│                 │◄──────────────────►│  │  FastAPI Server │                     │
│  • React UI     │      API Routes    │  │                 │                     │
│  • API Routes   │                    │  │                 │                     │
│                 │                    │  └─────────────────┘                     │
└─────────────────┘                    │           │                              │
                                       │           ▼                              │
┌─────────────────┐                    │  ┌─────────────────┐                     │
│                 │                    │  │   Supabase DB   │                     │
│  AI Agent       │                    │  │                 │                     │
│  (Python)       │◄──────────────────►│  │  • Knowledge    │                     │
│                 │                    │  │  • Users        │                     │
│  • Voice Agent  │                    │  │  • Sessions     │                     │
│  • LiveKit SDK  │                    │  └─────────────────┘                     │
│  • Gemini 2.0   │                    └──────────────────────────────────────────┘
│                 │                             │
└─────────────────┘                             │
         │                                      │
         ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│                 │                    │                 │
│  Infrastructure │                    │  External APIs  │
│                 │                    │                 │
│  • LiveKit      │                    │  • Gemini 2.0   │
│    Server       │                    │    Flash API    │
│  • Redis Cache  │                    │                 │
│                 │                    └─────────────────┘
└─────────────────┘

Data Flow:
1. Frontend ↔ FastAPI Server (API calls)
2. FastAPI Server ↔ Supabase DB (data persistence)
3. AI Agent ↔ FastAPI Server (knowledge queries)
4. AI Agent ↔ LiveKit Server (voice streaming)
5. AI Agent ↔ Gemini 2.0 (AI processing)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.9+
- Docker and Docker Compose (optional)
- LiveKit Cloud account or self-hosted server
- Google Cloud account (for Gemini API)
- Supabase account or self-hosted instance

### Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/voice-receptionist-ai.git
cd voice-receptionist-ai
```

2. **Configure environment variables**

Create `.env.local` in the root directory:
```env
# LiveKit Configuration
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-livekit-url

# Google AI (Gemini)
GOOGLE_API_KEY=your_gemini_api_key

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Backend API
FASTAPI_BASE_URL=http://localhost:8001
```

### 🐳 Docker Deployment (Recommended)

```bash
# Build and start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001
# AI Agent: Connects automatically
```

### Manual Installation

#### Frontend (Next.js)
```bash
cd web
pnpm install
pnpm run dev
```

#### AI Agent (Python)
```bash
cd agent
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py dev
```

#### Backend API (FastAPI)
```bash
cd agent
uvicorn app.main:app --reload --port 8001
```

## 📁 Project Structure

```
voice-receptionist-ai/
├── web/                      # Frontend application
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   ├── components/      # React components
│   │   │   ├── phone-chat.tsx       # Phone interface
│   │   │   ├── supervisor-dashboard.tsx
│   │   │   └── knowledge-base-table.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities
│   │   └── providers/       # Context providers
│   ├── public/              # Static assets
│   └── package.json
│
├── agent/                    # AI Voice Agent
│   ├── app/                 # FastAPI application
│   │   ├── api/            # API endpoints
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── repositories/   # Database operations
│   ├── main.py             # Agent entry point
│   ├── backend_client.py   # Backend communication
│   └── requirements.txt
│
├── docker/                   # Docker configurations
│   ├── frontend.Dockerfile
│   ├── agent.Dockerfile
│   └── backend.Dockerfile
│
├── docs/                     # Documentation
├── scripts/                  # Utility scripts
├── docker-compose.yml       # Docker compose configuration
└── README.md
```

## 🔧 Configuration

### Knowledge Base Setup

1. **Initialize the database**
```bash
# Run the Supabase migrations
psql -U postgres -d your_database -f supabase-schema.sql
```

2. **Add initial knowledge entries**
```sql
INSERT INTO knowledge_base (question, answer, category, source) VALUES
('What are your business hours?', 'We are open Monday-Friday 9 AM to 7 PM, Saturday 9 AM to 5 PM, closed Sundays.', 'hours', 'manual'),
('What services do you offer?', 'We offer haircuts, coloring, styling, manicures, pedicures, and facial treatments.', 'services', 'manual');
```

### Voice Configuration

Configure voice settings in the UI or via environment:
- **Voice Model**: Gemini 2.0 Flash
- **Voice Personas**: Puck, Charon, Kore, Fenrir
- **Temperature**: 0.6-1.2 (conversation style)
- **Response Tokens**: Configurable limit

## 🎯 Usage

### For Businesses

1. **Setup Knowledge Base**: Add your business information, FAQs, and policies
2. **Configure AI Personality**: Choose voice and conversation style
3. **Train Supervisors**: Show them how to resolve tickets
4. **Monitor & Improve**: Review analytics and update knowledge base

### For Developers

1. **Extend Knowledge Categories**: Add custom categories in `models/schemas.py`
2. **Customize UI**: Modify components in `web/src/components/`
3. **Add Integrations**: Connect to CRM, ticketing systems, etc.
4. **Implement Webhooks**: Add notifications for escalations

## 📊 API Documentation

### Core Endpoints

#### Knowledge Base
```http
GET    /api/knowledge-base              # List all entries
POST   /api/knowledge-base              # Add new entry
PUT    /api/knowledge-base/:id          # Update entry
DELETE /api/knowledge-base/:id          # Remove entry
```

#### Help Requests
```http
GET    /api/help-requests               # List pending tickets
POST   /api/help-requests/:id/resolve   # Resolve ticket
GET    /api/help-requests/stats         # Get statistics
```

#### AI Interaction
```http
POST   /ai/query                        # Process customer query
POST   /ai/create-ticket                # Create help ticket
GET    /ai/context                      # Get business context
POST   /ai/learn/:id                    # Learn from resolution
```


## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LiveKit](https://livekit.io/) - Real-time communication infrastructure
- [Google Gemini](https://ai.google.dev/) - AI language model
- [Supabase](https://supabase.io/) - Backend as a Service
- [Next.js](https://nextjs.org/) - React framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework

## 📞 Support

- **Documentation**: [docs.voice-receptionist-ai.com](https://docs.voice-receptionist-ai.com)
- **Discord**: [Join our community](https://discord.gg/voice-receptionist-ai)
- **Email**: support@voice-receptionist-ai.com
- **Issues**: [GitHub Issues](https://github.com/yourusername/voice-receptionist-ai/issues)
