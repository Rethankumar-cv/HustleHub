<div align="center">

# 🚀 HustleHub

### The AI-Powered Campus Micro-Gig Marketplace

**Connect. Collaborate. Earn. Grow.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-hustle--hub--eight.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://hustle-hub-eight.vercel.app/)
[![Built with React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

<br />

> HustleHub is a campus-exclusive micro-gig platform that empowers students to post tasks, accept gigs, build a verifiable proof-of-work portfolio, and climb the leaderboard — all powered by Google Gemini AI.

</div>

---

## 🌐 Live Application

**🔗 [https://hustle-hub-eight.vercel.app/](https://hustle-hub-eight.vercel.app/)**

---

## 📸 Overview

HustleHub turns every student's skill into an opportunity. Whether you need someone to design a poster, fix a bug, write content, or tutor a peer — HustleHub is the platform that makes it happen on campus. Every completed gig is verified by AI and added to a permanent proof-of-work portfolio.

---

## ✨ Key Features

### 🤖 AI-Powered Core (Google Gemini)
| Feature | Description |
|---|---|
| **Semantic Gig Search** | Finds relevant gigs using vector embeddings — understands intent, not just keywords |
| **AI Gig Enhancement** | Auto-improves gig titles, descriptions, and required skills using Gemini LLM |
| **Proof-of-Work Generation** | Validates gig completion with AI-generated summaries based on deliverable context |

### 📋 Gig Marketplace
- **Post Gigs** — Structured gig forms with skill tags, timeline, scope, and budget context
- **Browse & Accept** — Smart feed with category filters, skill filters, and status tabs
- **Real-Time Status** — Live updates on gig progress (Open → In Progress → Completed)
- **Review System** — Rate and review peers after gig completion with star ratings

### 🎮 Gamified Dashboard
- **XP & Levelling System** — Earn XP for every completed gig, referral, and platform activity
- **Hustle Score** — A composite score ranking students by gigs, XP, and referrals
- **Weekly Leaderboard** — Top 5 campus hustlers displayed publicly on the landing page
- **Referral Program** — Refer peers and earn bonus XP and climb the leaderboard

### 💬 Real-Time Chat
- **Gig-Specific Chat** — Each accepted gig has a dedicated real-time chat thread
- **Messages Overview** — Unified inbox to track all active gig conversations
- **Supabase Realtime** — Instant message delivery with no polling

### 👤 Profile & Identity
- **Public Profile** — Instagram-inspired profile with stats, skills, activity, and gigs
- **Proof-of-Work Portfolio** — Verifiable AI-generated summaries of completed work
- **Skill Tags** — Display your top skills prominently on your profile
- **Avatar Upload** — Custom profile photos via Supabase Storage

### 🛡️ Admin Panel
- **Platform Metrics** — Track total users, gigs, completion rate, and active hustlers
- **User Management** — View and manage all registered students
- **Gig Oversight** — Browse and moderate all platform gigs
- **MLOps Dashboard** — AI model performance insights and platform health indicators

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Role |
|---|---|---|
| **React** | 19 | UI framework |
| **Vite** | 7 | Build tool & dev server |
| **React Router DOM** | 7 | Client-side routing |
| **Lucide React** | Latest | Icon library |
| **Vanilla CSS** | — | Styling (no frameworks) |

### Backend & Database
| Technology | Role |
|---|---|
| **Supabase** | PostgreSQL database, Auth, Realtime, Storage |
| **Supabase Auth** | Email/password authentication with session management |
| **Supabase RLS** | Row-Level Security for data privacy and user isolation |
| **Supabase Edge Functions** | Serverless TypeScript functions for AI workloads |
| **Supabase Realtime** | Live chat subscriptions |
| **Supabase Storage** | Profile photo uploads |

### AI & ML
| Model | Used For |
|---|---|
| **Google Gemini 1.5 Flash** | Gig enhancement, proof-of-work generation |
| **text-embedding-004** | Semantic vector embeddings for gig search |
| **pgvector** | PostgreSQL vector similarity search |

### Infrastructure
| Tool | Role |
|---|---|
| **Vercel** | Frontend deployment & hosting |
| **Supabase Edge Functions** | AI serverless backend |

---

## 🗂️ Project Structure

```
HustleHub/
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── Navbar.jsx/css        # Fixed top navigation bar
│   │   ├── Hero.jsx/css          # Landing page hero with live stats
│   │   ├── HowItWorks.jsx/css    # 3-step process section
│   │   ├── FeatureGrid.jsx/css   # Feature highlights grid
│   │   ├── Leaderboard.jsx/css   # Live top-5 hustlers table
│   │   ├── Vision.jsx/css        # Mission & metrics section
│   │   ├── CTA.jsx/css           # Call-to-action section
│   │   ├── Footer.jsx/css        # Site footer
│   │   ├── PowModal.jsx/css      # AI Proof-of-Work modal
│   │   ├── ReviewModal.jsx/css   # Peer review submission modal
│   │   ├── ViewReviewsModal.jsx  # Reviews display modal
│   │   ├── AppLayout.jsx/css     # Authenticated app shell + sidebar
│   │   └── ProtectedRoute.jsx    # Auth guard wrapper
│   │
│   ├── pages/                    # Route-level page components
│   │   ├── LandingPage.jsx       # Public marketing landing page
│   │   ├── JoinPage.jsx          # Registration page
│   │   ├── LoginPage.jsx         # Sign-in page
│   │   ├── DashboardPage.jsx     # XP, stats, gigs overview
│   │   ├── GigFeedPage.jsx       # Browse & manage gigs
│   │   ├── GigPostPage.jsx       # Create new gig with AI assist
│   │   ├── ChatPage.jsx          # Real-time gig chat
│   │   ├── MessagesPage.jsx      # All conversations overview
│   │   ├── ProfilePage.jsx       # Public/own profile view
│   │   └── AdminPage.jsx         # Admin dashboard
│   │
│   ├── context/
│   │   └── AuthContext.jsx       # Global auth & profile state
│   │
│   ├── lib/
│   │   └── supabase.js           # Supabase client initialization
│   │
│   └── main.jsx                  # App entry point & router
│
├── supabase/
│   └── functions/
│       ├── kai-enhance/          # Gemini gig enhancement edge function
│       ├── kai-generate-pow/     # Gemini proof-of-work generation
│       └── kai-vectorize/        # Embedding generation & semantic search
│
├── vercel.json                   # Vercel SPA rewrite rules
├── vite.config.js                # Vite build configuration
└── package.json                  # Dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **npm** v9+
- A **Supabase** project ([supabase.com](https://supabase.com))
- A **Google Gemini API key** ([ai.google.dev](https://ai.google.dev))

### 1. Clone the Repository
```bash
git clone https://github.com/Rethankumar-cv/HustleHub.git
cd HustleHub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Supabase

You'll need the following tables in your Supabase project:

| Table | Key Columns |
|---|---|
| `users` | `id`, `full_name`, `email`, `role`, `xp`, `level`, `hustle_score`, `gigs_completed_count`, `referral_count`, `activated`, `skills`, `avatar_url` |
| `gigs` | `id`, `title`, `description`, `posted_by`, `accepted_by`, `status`, `tags`, `embedding` |
| `messages` | `id`, `gig_id`, `sender_id`, `content`, `created_at` |
| `reviews` | `id`, `gig_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment` |

Enable **pgvector** extension in Supabase for semantic search.

### 5. Deploy Supabase Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Deploy functions
supabase functions deploy kai-enhance
supabase functions deploy kai-generate-pow
supabase functions deploy kai-vectorize
```

Set the following **Edge Function secrets** in your Supabase dashboard:
```
GEMINI_API_KEY=your_google_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 6. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Available Scripts

```bash
npm run dev        # Start development server (Vite HMR)
npm run build      # Build for production
npm run preview    # Preview production build locally
npm run lint       # Run ESLint checks
```

---

## 🤖 AI Features Deep Dive

### 1. `kai-enhance` — Gig Enhancement
When a student posts a gig, Gemini AI polishes the title and description for clarity and professionalism. It also suggests relevant skill tags automatically.

### 2. `kai-generate-pow` — Proof-of-Work Generation
After a gig is marked complete, both parties can trigger AI-generated proof-of-work. Gemini creates a concise, professional summary of what was delivered — building a verifiable portfolio entry.

### 3. `kai-vectorize` — Semantic Gig Search
When gigs are posted, their descriptions are converted into vector embeddings using Google's `text-embedding-004` model. These vectors are stored in PostgreSQL via **pgvector**. When a student searches, their query is also vectorized and matched using cosine similarity — finding semantically relevant gigs even if keywords don't match exactly.

---

## 🔐 Authentication & Security

- **Email/Password Auth** via Supabase Auth
- **Row-Level Security (RLS)** enforced on all tables
- **Protected Routes** — All app pages require authentication
- **Role-based Access** — Admin panel restricted to users with `role = 'admin'`
- **Environment Variables** — API keys never exposed to the client

---

## 🚢 Deployment

### Vercel (Recommended)
1. Fork/clone this repository
2. Connect to [Vercel](https://vercel.com/) and import the repo
3. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Vite and builds correctly

The `vercel.json` includes SPA rewrite rules to handle React Router navigation.

---

## 🗺️ Roadmap

- [ ] Email notifications for gig updates
- [ ] Mobile app (React Native)
- [ ] Campus-level admin dashboards
- [ ] AI-powered skill recommendations
- [ ] Stripe integration for paid gig tiers
- [ ] Public portfolio sharing (external link)
- [ ] Multi-college support with isolated campus feeds

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

Please make sure your code follows the existing patterns and doesn't break any existing functionality.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Rethan Kumar CV**

- GitHub: [@Rethankumar-cv](https://github.com/Rethankumar-cv)
- Live App: [hustle-hub-eight.vercel.app](https://hustle-hub-eight.vercel.app/)

---

<div align="center">

**Built for students, by students. 🎓**

⭐ Star this repo if you find it useful!

</div>
