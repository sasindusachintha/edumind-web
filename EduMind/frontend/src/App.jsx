import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/layout/Layout.jsx';

import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';

import AdminOverview from './pages/admin/Overview.jsx';
import AdminStudents from './pages/admin/Students.jsx';
import AdminFaculty from './pages/admin/Faculty.jsx';
import AdminBranches from './pages/admin/Branches.jsx';
import AdminSubjects from './pages/admin/Subjects.jsx';
import AdminNotices from './pages/admin/Notices.jsx';
import AdminExams from './pages/admin/Exams.jsx';
import AdminReports from './pages/admin/Reports.jsx';
import AdminLogs from './pages/admin/Logs.jsx';

import FacultyOverview from './pages/faculty/Overview.jsx';
import FacultySubjects from './pages/faculty/Subjects.jsx';
import FacultyStudents from './pages/faculty/Students.jsx';
import FacultyAttendance from './pages/faculty/Attendance.jsx';
import FacultyMarks from './pages/faculty/Marks.jsx';
import FacultyMaterials from './pages/faculty/Materials.jsx';
import FacultyNotes from './pages/faculty/Notes.jsx';
import FacultyProfile from './pages/faculty/Profile.jsx';

import StudentOverview from './pages/student/Overview.jsx';
import StudentSchedule from './pages/student/Schedule.jsx';
import StudentAttendance from './pages/student/Attendance.jsx';
import StudentMarks from './pages/student/Marks.jsx';
import StudentMaterials from './pages/student/Materials.jsx';
import StudentNotices from './pages/student/Notices.jsx';
import StudentNotifications from './pages/student/Notifications.jsx';
import StudentNotes from './pages/student/Notes.jsx';
import StudentProfile from './pages/student/Profile.jsx';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={<ProtectedRoute role="admin"><Layout role="admin" /></ProtectedRoute>}>
          <Route index element={<AdminOverview />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="faculty" element={<AdminFaculty />} />
          <Route path="branches" element={<AdminBranches />} />
          <Route path="subjects" element={<AdminSubjects />} />
          <Route path="notices" element={<AdminNotices />} />
          <Route path="exams" element={<AdminExams />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>

        <Route path="/faculty" element={<ProtectedRoute role="faculty"><Layout role="faculty" /></ProtectedRoute>}>
          <Route index element={<FacultyOverview />} />
          <Route path="subjects" element={<FacultySubjects />} />
          <Route path="students" element={<FacultyStudents />} />
          <Route path="attendance" element={<FacultyAttendance />} />
          <Route path="marks" element={<FacultyMarks />} />
          <Route path="materials" element={<FacultyMaterials />} />
          <Route path="notes" element={<FacultyNotes />} />
          <Route path="profile" element={<FacultyProfile />} />
        </Route>

        <Route path="/student" element={<ProtectedRoute role="student"><Layout role="student" /></ProtectedRoute>}>
          <Route index element={<StudentOverview />} />
          <Route path="schedule" element={<StudentSchedule />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="marks" element={<StudentMarks />} />
          <Route path="materials" element={<StudentMaterials />} />
          <Route path="notices" element={<StudentNotices />} />
          <Route path="notifications" element={<StudentNotifications />} />
          <Route path="notes" element={<StudentNotes />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ToastProvider>
  );
}
