import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
