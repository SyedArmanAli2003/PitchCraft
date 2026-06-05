import { BrowserRouter, Routes, Route } from "react-router-dom";
import { IdeaProvider } from "./context/IdeaContext";
import LandingPage      from "./pages/LandingPage";
import GeneratePage     from "./pages/GeneratePage";
import PlanPage         from "./pages/PlanPage";
import HowItWorksPage   from "./pages/HowItWorksPage";
import ExamplesPage     from "./pages/ExamplesPage";
import DocsPage         from "./pages/DocsPage";
import AboutPage        from "./pages/AboutPage";

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
      </IdeaProvider>
    </BrowserRouter>
  );
}
