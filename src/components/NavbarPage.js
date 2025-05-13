import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../cssfile/์NavbarPage.css';

function NavbarPage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("เกิดข้อผลในการออกจากระบบ:", error);
    } else {
      console.log("ออกจากระบบเรียบร้อยแล้ว");
      navigate('/');
    }
  };

  useEffect(() => {
    const checkAdminMenu = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: emp, error } = await supabase
        .from("employees")
        .select("special_role")
        .eq("email", user.email)
        .single();

      const isAdmin = emp && emp.special_role && emp.special_role.trim().toLowerCase() === 'admin';

      ['admin-menu-desktop', 'admin-menu-mobile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('d-none');
      });

      if (isAdmin) {
        ['admin-menu-desktop', 'admin-menu-mobile'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.remove('d-none');
        });
      }
    };
    checkAdminMenu();
  }, []);

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light navbar-custom d-lg-none w-100">
        <div className="container-fluid">
          <span className="navbar-brand text-white fs-4">เมนู</span>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mobileNavbar">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="mobileNavbar">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <button className="nav-link text-white btn btn-link" onClick={() => navigate('/home')}>🏠 หน้าหลัก</button>
              </li>
              <li className="nav-item">
                <button className="nav-link text-white btn btn-link" onClick={() => navigate('/checkin')}>🟢 บันทึกเข้า</button>
              </li>
              <li className="nav-item">
                <button className="nav-link text-white btn btn-link" onClick={() => navigate('/checkout')}>🔴 บันทึกออก</button>
              </li>
              <li className="nav-item">
                <button className="nav-link text-white btn btn-link" onClick={() => navigate('/calendar-page')}>📅 ปฏิทินกิจกรรม</button>
              </li>
              <li className="nav-item">
                <button className="nav-link text-white btn btn-link" onClick={() => navigate('/notifications')}>🔔 แจ้งเตือน</button>
              </li>
              <li className="nav-item">
                <button className="nav-link text-white btn btn-link" onClick={() => navigate('/payroll')}>💸 สลิปออนไลน์</button>
                <li className="nav-item text-white fs-5 mb-2" style={{ pointerEvents: 'none' }}>
                  รายการรออนุมัติ
                </li>
              </li>
              <li className="nav-item">
                <button className="nav-link text-white btn btn-link" onClick={() => navigate('/leave-form')}>📄 เพิ่มบันทึกการลา</button>
              </li>
              <div id="admin-menu-mobile" className="d-none">
                <li className="nav-item text-white fs-5 mb-2" style={{ pointerEvents: 'none' }}>
                  สำหรับผู้ดูแล
                </li>
                <li className="nav-item">
                  <button className="nav-link text-white btn btn-link" onClick={() => navigate('/admin')}>🛠️ จัดการระบบ</button>
                </li>
                <li className="nav-item">
                  <button className="nav-link text-white btn btn-link" onClick={() => navigate('/request')}>⏳ รายการรออนุมัติ</button>
                </li>
                <li className="nav-item">
                <button className="nav-link text-white btn btn-link" onClick={() => navigate('/attendance-log')}>📜 ประวัติการเข้า/ออกงาน</button>
              </li>
              </div>
            </ul>
            <button className="btn btn-light logout-btn" onClick={handleLogout}>ออกจากระบบ</button>
          </div>
        </div>
      </nav>

      <div id="sidebar" className="sidebar-custom d-none d-lg-block">
        <h4 className="mb-4 fs-4">เมนู</h4>
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          <li className="nav-item">
            <button className="nav-link text-white btn btn-link" onClick={() => navigate('/home')}>🏠 หน้าหลัก</button>
          </li>
          <li className="nav-item">
            <button className="nav-link text-white btn btn-link" onClick={() => navigate('/checkin')}>🟢 บันทึกเข้า</button>
          </li>
          <li className="nav-item">
            <button className="nav-link text-white btn btn-link" onClick={() => navigate('/checkout')}>🔴 บันทึกออก</button>
          </li>
          <li className="nav-item">
            <button className="nav-link text-white btn btn-link" onClick={() => navigate('/calendar-page')}>📅 ปฏิทินกิจกรรม</button>
          </li>
          <li className="nav-item">
            <button className="nav-link text-white btn btn-link" onClick={() => navigate('/notifications')}>🔔 แจ้งเตือน</button>
          </li>
          <li className="nav-item">
            <button className="nav-link text-white btn btn-link" onClick={() => navigate('/payroll')}>💸 สลิปออนไลน์</button>
          </li>
          <li className="nav-item text-white fs-5 mb-2" style={{ pointerEvents: 'none' }}>
            รายการรออนุมัติ
          </li>
          <li className="nav-item">
            <button className="nav-link text-white btn btn-link" onClick={() => navigate('/leave-form')}>📄 เพิ่มบันทึกการลา</button>
          </li>

          <div id="admin-menu-desktop" className="d-none">
            <li className="nav-item text-white fs-5 mb-2" style={{ pointerEvents: 'none' }}>
              สำหรับผู้ดูแล
            </li>
            <li className="nav-item">
              <button className="nav-link text-white btn btn-link" onClick={() => navigate('/admin')}>🛠️ จัดการระบบ</button>
            </li>
            <li className="nav-item">
              <button className="nav-link text-white btn btn-link" onClick={() => navigate('/request')}>⏳ รายการรออนุมัติ</button>
            </li>
            <li className="nav-item">
              <button className="nav-link text-white btn btn-link" onClick={() => navigate('/attendance-log')}>📜 ประวัติการเข้า/ออกงาน</button>
            </li>
          </div>
        </ul>
        <button className="btn btn-light logout-btn" onClick={handleLogout}>ออกจากระบบ</button>
      </div>
    </div>
  );
}

export default NavbarPage;
