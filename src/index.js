import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Automatic Purge of legacy dummy/mock data from previous versions
(function purgeLegacyMockData() {
  try {
    const legacyKeys = [
      "spms_students_data", 
      "spms_placement_drives", 
      "spms_all_applications", 
      "spms_companies"
    ];
    legacyKeys.forEach(k => {
      const val = localStorage.getItem(k);
      if (val && (val.includes("st_1") || val.includes("drive_tcs") || val.includes("drive_infy") || val.includes("Sumer Raj") || val.includes("Ananya Sharma"))) {
        localStorage.removeItem(k);
      }
    });
  } catch (e) {
    console.warn("Storage sanitizer:", e);
  }
})();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);