# SynapseX Client

The official web frontend for the **SynapseX** Digital Evidence Intelligence Platform.

## Technology Stack

- **Framework**: [React 19](https://react.dev/)
- **Bundler & Dev Server**: [Vite 8](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Styling**: Vanilla CSS design system with CSS custom properties

## Architecture & Integration

The Client is decoupled from all backend business and AI processing logic:
- **API Requests**: Routed through the NestJS API gateway at `http://localhost:3001/api`.
- **Real-Time Communication**: Connects to the NestJS Socket.IO gateway at `http://localhost:3001` for real-time investigation updates, notifications, and AI pipeline progress.
- **Evidence Viewers**: Renders rich UI for Case Management, Evidence Vault, Interactive Timeline, Knowledge Graph visualizations, AI Findings, and Chain of Custody.

## Directory Structure

```
client/
├── public/                 # Static public assets
├── src/
│   ├── assets/             # Images and design assets
│   ├── components/         # Reusable UI components (Navbar, Sidebar, Modals, Cards)
│   ├── context/            # React context providers (Auth, Theme, Socket)
│   ├── data/               # Static reference datasets
│   ├── pages/              # Primary route views (Dashboard, Evidence, Timeline, etc.)
│   ├── services/           # HTTP and WebSocket client communication layer
│   ├── styles/             # Modular CSS stylesheets
│   ├── App.jsx             # Main application component & routes
│   └── main.jsx            # React root mount point
├── .env.example            # Environment variables template
├── Dockerfile              # Containerization for dev & prod
├── package.json            # Node.js dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.js          # Vite bundler configuration
```

## Environment Variables

Copy `.env.example` to `.env` before starting the application:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base HTTP endpoint of the NestJS API | `http://localhost:3001/api` |
| `VITE_WS_BASE_URL` | WebSocket / Socket.IO endpoint | `http://localhost:3001` |

## Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Start Vite dev server with hot module replacement (HMR)
npm run dev
```

The application will be accessible at: `http://localhost:3000` (or `http://localhost:5173` depending on port availability).

### Production Build

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

### Docker Execution

```bash
# Build and run via Docker
docker build -t synapsex-client .
docker run -p 3000:3000 synapsex-client
```
