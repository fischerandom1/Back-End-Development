import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import "assets/vendor/nucleo/css/nucleo.css";
import "assets/vendor/font-awesome/css/font-awesome.min.css";
import "assets/scss/argon-design-system-react.scss?v1.1.0";

import Index from "views/pages/HomePage.js";
import DefectDetection from "views/pages/DefectDetection.js";
import OCR from "views/pages/OcrPage.js";
import History from "views/pages/HistoryPage.js";
import Models from "views/pages/ModelsPage.js";
import ModelDetails from "views/pages/ModelDetails.js";
import AnalyticsPage from "views/pages/AnalyticsPage.js";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" exact element={<Index />} />
      <Route path="/DefectDetection" exact element={<DefectDetection />} />
      <Route path="/Analytics" exact element={<AnalyticsPage />} />
      <Route path="/OCR" exact element={<OCR />} />
      <Route path="/History" exact element={<History />} />
      <Route path="/Models" exact element={<Models />} />
      <Route path="/model/:id" element={<ModelDetails />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
