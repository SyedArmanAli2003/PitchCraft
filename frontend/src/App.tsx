import { BrowserRouter, Routes, Route } from "react-router-dom";
import { IdeaProvider } from "./context/IdeaContext";
import { useHealthCheck } from "./hooks/useHealthCheck";
import LandingPage      from "./pages/LandingPage";
import GeneratePage     from "./pages/GeneratePage";
import PlanPage         from "./pages/PlanPage";
import HowItWorksPage   from "./pages/HowItWorksPage";
import ExamplesPage     from "./pages/ExamplesPage";
import DocsPage         from "./pages/DocsPage";
import AboutPage        from "./pages/AboutPage";

function OfflineBanner() {
  const { isOnline, isChecking } = useHealthCheck();

  if (!import.meta.env.DEV || isChecking || isOnline) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(120, 53, 15, 0.8)",
        color: "rgb(253, 230, 138)",
        fontSize: "0.75rem",
        padding: "0.5rem 1rem",
        width: "100%",
        textAlign: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      ⚠️ Backend offline — start the FastAPI server
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <IdeaProvider>
        <Routes>
          <Route path="/"             element={<LandingPage />} />
          <Route path="/generate"     element={<GeneratePage />} />
          <Route path="/plan/:id"     element={<PlanPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/examples"     element={<ExamplesPage />} />
          <Route path="/docs"         element={<DocsPage />} />
          <Route path="/about"        element={<AboutPage />} />
        </Routes>
        <OfflineBanner />
      </IdeaProvider>
    </BrowserRouter>
  );
}
