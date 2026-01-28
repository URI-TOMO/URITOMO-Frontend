# Uri-Tomo Meeting

Uri-Tomo Meeting is a modern, Electron-based video conferencing application built with React and LiveKit. It provides real-time audio and video communication capabilities, seamless integration with a backend server, and a polished user interface.

## 🚀 Key Features

*   **Real-time Communication:** High-quality video and audio calls powered by [LiveKit](https://livekit.io/).
*   **Authentication:**
    *   **Guest Login:** Quick access for users without an account.
    *   **Developer Shortcut:** Instant login mechanism for testing purposes.
    *   **Social Login:** UI placeholders for Google and Line integration.
*   **Room Management:**
    *   Create and join meeting rooms.
    *   In-room settings for managing the session.
    *   Backend synchronization for live sessions.
*   **System Settings:**
    *   Language selection with instant feedback.
    *   Responsive and fixed-layout design optimization.
*   **Cross-Platform Desktop App:** Built with Electron to run natively on Windows, macOS, and Linux.

## 🛠️ Tech Stack

*   **Framework:** [Electron](https://www.electronjs.org/), [Vite](https://vitejs.dev/)
*   **Frontend Library:** [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [TailwindCSS](https://tailwindcss.com/)
*   **UI Components:** [Radix UI](https://www.radix-ui.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/)
*   **Real-time Infrastructure:** [LiveKit Client SDK](https://docs.livekit.io/client-sdk-js/)
*   **State Management & Utilities:** `axios`, `sonner`, `react-hook-form`, `zod` (implied by hook-form usage), `framer-motion`.

## 📦 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/uri-tomo-meeting.git
    cd uri-tomo-meeting
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Configuration

Create a `.env` file in the root directory to configure your environment variables. You can use the following variables:

```env
# URL of your backend server
VITE_API_URL=http://localhost:8000
# OR
VITE_BACKEND_URL=http://localhost:8000
```

> **Note:** If no environment variable is set, the development server defaults to proxying requests to `http://192.168.1.33:8000` as configured in `vite.config.ts`.

### Running the Application

To start the application in development mode:

```bash
npm run dev
```

This command will start the Vite development server and launch the Electron application.

## 🏗️ Building for Production

To build the application for production (creation of an installer/executable):

```bash
npm run build
```

This script runs the following steps:
1.  Compiles TypeScript code (`tsc -b`).
2.  Builds the Vite frontend (`vite build`).
3.  Packages the Electron app using `electron-builder`.

The output files (installers, executables) will be located in the `release` directory.

## 📂 Project Structure

```
├── electron/          # Electron main and preload scripts
├── src/
│   ├── app/           # Main application logic
│   │   ├── api/       # API clients and types
│   │   ├── components/# Reusable React components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── pages/     # Application pages (Login, Meeting, etc.)
│   │   └── meeting/   # LiveKit integration and meeting logic
│   ├── assets/        # Static assets
│   └── ...
├── dist/              # Built frontend assets
├── dist-electron/     # Compiled Electron scripts
└── release/           # Packaged application output
```

## 📝 License

This project is licensed under the terms found in the [LICENSE](LICENSE) file.
