import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme before first paint to avoid flash
try {
  const raw = localStorage.getItem('financeiro_data');
  if (raw) {
    const parsed = JSON.parse(raw) as { settings?: { theme?: string } };
    if (parsed?.settings?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }
} catch {
  // Ignore parse errors — theme will fall back to light
}

// Register PWA Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Service worker registration failed, app will still work offline from cache
      console.log("Service Worker registration failed, app may not work offline");
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
