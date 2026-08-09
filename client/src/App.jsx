// App.jsx
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import StudentHome from "./pages/StudentHome";
import Quiz from "./pages/Quiz";
import DiceChallenge from "./pages/DiceChallenge";
import Profile from "./pages/Profile";
import VideoLibrary from "./pages/VideoLibrary";
import AdminLogin from "./pages/AdminLogin";
import TeacherDashboard from "./pages/TeacherDashboard";
import { ChatWidget } from "./components/ChatWidget";

// Demo note: student auth is a single hardcoded student (stu_1) throughout
// the client (see STUDENT_ID constants in each page) rather than a full
// Firebase Auth login screen, since that's the piece that genuinely needs
// a real browser + Firebase project to verify, and the brief's confirmed
// priority is Tier 1 logic being demo-solid over every screen having live
// auth. Swapping in real Firebase Auth here is a contained change: read
// the signed-in uid instead of the STUDENT_ID constant.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<StudentHome />} />
        <Route path="/quiz/:topicId" element={<Quiz />} />
        <Route path="/dice" element={<DiceChallenge />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/videos" element={<VideoLibrary />} />
        <Route path="/teacher/login" element={<AdminLogin />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
      </Routes>
      <ChatWidget />
    </>
  );
}
