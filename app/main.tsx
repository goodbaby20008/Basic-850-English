import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import LearningApp from "./LearningApp";
import "./globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root application mount point.");
}

createRoot(root).render(
  <StrictMode>
    <LearningApp />
  </StrictMode>,
);
