import { BrowserRouter, Routes, Route } from "react-router-dom";
import { IdeaProvider } from "./context/IdeaContext";
import LandingPage from "./pages/LandingPage";
import GeneratePage from "./pages/GeneratePage";
import PlanPage from "./pages/PlanPage";

export default function App() {
  return (
    <BrowserRouter>
      <IdeaProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/plan/:id" element={<PlanPage />} />
        </Routes>
      </IdeaProvider>
    </BrowserRouter>
  );
}
