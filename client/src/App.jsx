// App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Landing, { STUDENT_ID_KEY } from "./pages/Landing";
import StudentHome from "./pages/StudentHome";
import Quiz from "./pages/Quiz";
import DiceChallenge from "./pages/DiceChallenge";
import Profile from "./pages/Profile";
import VideoLibrary from "./pages/VideoLibrary";
import AdminLogin from "./pages/AdminLogin";
import TeacherDashboard from "./pages/TeacherDashboard";
import { ChatWidget } from "./components/ChatWidget";

// Every student page reads its identity from localStorage (see
// STUDENT_ID_KEY in Landing.jsx), set by a real login or signup on the
// landing page. This guard is what actually enforces that: without it, a
// student page opened directly (no stored identity yet) would silently
// fall back to the seeded demo student, exactly the "always enters as
// Aarav Sharma" problem the login/signup flow exists to fix. With it, no
// stored identity means straight back to the landing page to log in or
// sign up first.
function RequireStudent({ children }) {
  const hasStudent = !!localStorage.getItem(STUDENT_ID_KEY);
  return hasStudent ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<RequireStudent><StudentHome /></RequireStudent>} />
        <Route path="/quiz/:topicId" element={<RequireStudent><Quiz /></RequireStudent>} />
        <Route path="/dice" element={<RequireStudent><DiceChallenge /></RequireStudent>} />
        <Route path="/profile" element={<RequireStudent><Profile /></RequireStudent>} />
        <Route path="/videos" element={<RequireStudent><VideoLibrary /></RequireStudent>} />
        <Route path="/teacher/login" element={<AdminLogin />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
      </Routes>
      <ChatWidget />
    </>
  );
}
