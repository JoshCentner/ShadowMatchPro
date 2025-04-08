import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global styles for custom status badges
const style = document.createElement('style');
style.innerHTML = `
  .status-open {
    background-color: rgba(16, 185, 129, 0.1);
    color: rgb(16, 185, 129);
  }
  .status-closed {
    background-color: rgba(107, 114, 128, 0.1);
    color: rgb(107, 114, 128);
  }
  .status-filled {
    background-color: rgba(59, 130, 246, 0.1);
    color: rgb(59, 130, 246);
  }
`;

document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);
