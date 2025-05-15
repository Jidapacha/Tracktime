import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import CheckInPage from './components/CheckInPage';
import CheckOutPage from './components/CheckOutPage';
import CalendarPage from './components/CalendarPage';
import NotiPage from './components/NotiPage';
import PayrollPage from './components/PayrollPage';
import AdminPage from './components/AdminPage';
import LeavePage from './components/LeavePage';
import RequestPage from './components/RequestPage';
import AttendancePage from './components/AttendancePage';
import EditTimePage from './components/EditTimePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/checkin" element={<CheckInPage />} />
        <Route path="/checkout" element={<CheckOutPage />} />
        <Route path="/calendar-page" element={<CalendarPage />} />
        <Route path="/notifications" element={<NotiPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/leave-form" element={<LeavePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/request" element={<RequestPage />} />
        <Route path="/attendance-log" element={<AttendancePage />} />
        <Route path="/edit-time" element={<EditTimePage />} />
      </Routes>
    </Router>
  );
}


export default App;
