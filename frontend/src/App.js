import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AnalysisProvider } from "./context/AnalysisContext"
import QuizScreen from "./pages/QuizScreen"
import UploadScreen from "./pages/UploadScreen"
import Dashboard from "./pages/Dashboard"

function App() {
  return (
    <AnalysisProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<QuizScreen />} />
          <Route path="/upload" element={<UploadScreen />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AnalysisProvider>
  )
}

export default App
