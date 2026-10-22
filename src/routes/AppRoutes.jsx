
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Layout from "../components/Layout";

import StudentDashboard from "../pages/student/StudentDashboard";
import StudentProfile from "../pages/student/StudentProfile";
import Companies from "../pages/student/Companies";
import Drives from "../pages/student/Drives";
import MyApplications from "../pages/student/MyApplications";

// Admin / TPO Portal Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminDrives from "../pages/admin/AdminDrives";
import AdminStudents from "../pages/admin/AdminStudents";

function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Portal Layout */}
        <Route element={<Layout />}>
          {/* Student Routes */}
          <Route
            path="/student"
            element={<Navigate to="/student/dashboard" replace />}
          />
          <Route
            path="/student/dashboard"
            element={<StudentDashboard />}
          />
          <Route
            path="/student/profile"
            element={<StudentProfile />}
          />
          <Route
            path="/student/companies"
            element={<Companies />}
          />
          <Route
            path="/student/drives"
            element={<Drives />}
          />
          <Route
            path="/student/applications"
            element={<MyApplications />}
          />

          {/* Admin / TPO Routes */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />
          <Route
            path="/admin/drives"
            element={<AdminDrives />}
          />
          <Route
            path="/admin/students"
            element={<AdminStudents />}
          />
          <Route
            path="/admin/companies"
            element={<Companies />}
          />
        </Route>

        {/* Redirect Unknown Routes to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default AppRoutes;
