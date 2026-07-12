import { LayoutDashboard, Users, GraduationCap, Building2, BookOpen, Megaphone, CalendarClock,
  ScrollText, BarChart3, UserCircle, ClipboardCheck, PencilLine, FolderUp, StickyNote,
  CalendarDays, FileText, Bell, QrCode, History } from 'lucide-react';

export const ROLE_THEME = {
  admin: {
    label: 'Admin',
    accent: '#3949AB',
    accentDark: '#2A3585',
    accentSoft: '#E8EAF8',
    textClass: 'text-admin',
    bgClass: 'bg-admin',
    softBgClass: 'bg-admin-soft',
    borderClass: 'border-admin',
    btnClass: 'btn-primary-admin',
    nav: [
      { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/admin/students', label: 'Students', icon: GraduationCap },
      { to: '/admin/faculty', label: 'Faculty', icon: Users },
      { to: '/admin/branches', label: 'Branches', icon: Building2 },
      { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
      { to: '/admin/users', label: 'User Approvals', icon: UserCircle },
      { to: '/admin/notices', label: 'Notices', icon: Megaphone },
      { to: '/admin/exams', label: 'Exams', icon: CalendarClock },
      { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
      { to: '/admin/logs', label: 'Activity Logs', icon: ScrollText }
    ]
  },
  faculty: {
    label: 'Faculty',
    accent: '#00897B',
    accentDark: '#00695C',
    accentSoft: '#DFF3F0',
    textClass: 'text-faculty',
    bgClass: 'bg-faculty',
    softBgClass: 'bg-faculty-soft',
    borderClass: 'border-faculty',
    btnClass: 'btn-primary-faculty',
    nav: [
      { to: '/faculty', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/faculty/subjects', label: 'My Subjects', icon: BookOpen },
      { to: '/faculty/students', label: 'Students', icon: GraduationCap },
      { to: '/faculty/attendance', label: 'Attendance', icon: ClipboardCheck },
      { to: '/faculty/attendance-report', label: 'Attendance Report', icon: History },
      { to: '/faculty/marks', label: 'Marks', icon: PencilLine },
      { to: '/faculty/materials', label: 'Materials', icon: FolderUp },
      { to: '/faculty/notes', label: 'Notes', icon: StickyNote },
      { to: '/faculty/profile', label: 'Profile', icon: UserCircle }
    ]
  },
  student: {
    label: 'Student',
    accent: '#C97F00',
    accentDark: '#A66700',
    accentSoft: '#FCEFD9',
    textClass: 'text-student',
    bgClass: 'bg-student',
    softBgClass: 'bg-student-soft',
    borderClass: 'border-student',
    btnClass: 'btn-primary-student',
    nav: [
      { to: '/student', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/student/schedule', label: 'Schedule', icon: CalendarDays },
      { to: '/student/attendance', label: 'Attendance', icon: ClipboardCheck },
      { to: '/student/scan-attendance', label: 'Scan Attendance QR', icon: QrCode },
      { to: '/student/marks', label: 'Marks', icon: PencilLine },
      { to: '/student/materials', label: 'Materials', icon: FileText },
      { to: '/student/notices', label: 'Notices', icon: Megaphone },
      { to: '/student/notifications', label: 'Notifications', icon: Bell },
      { to: '/student/notes', label: 'Notes', icon: StickyNote },
      { to: '/student/profile', label: 'Profile', icon: UserCircle }
    ]
  }
};
