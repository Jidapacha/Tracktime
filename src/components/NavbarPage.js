import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../cssfile/์NavbarPage.css';

function NavbarPage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("เกิดข้อผิดพลาดในการออกจากระบบ:", error);
    } else {
      console.log("ออกจากระบบเรียบร้อยแล้ว");
      navigate('/'); // ไปหน้า login หลังจากออกจากระบบ
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

      // ซ่อนทุกเมนูก่อน
      ['admin-menu-desktop', 'admin-menu-mobile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('d-none');
      });

      // ถ้าเป็น admin ค่อยแสดง
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
          <a className="navbar-brand text-white" href="#">เมนู</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mobileNavbar">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="mobileNavbar">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link text-white" onClick={() => navigate('/home')}>🏠 หน้าหลัก</a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" onClick={() => navigate('/checkin')}>🟢 บันทึกเข้า</a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" onClick={() => navigate('/checkout')}>🔴 บันทึกออก</a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" onClick={() => navigate('/calendar-page')}>📅 ปฏิทินกิจกรรม</a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" onClick={() => navigate('/notifications')}>🔔 แจ้งเตือน</a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" onClick={() => navigate('/payroll')}>💸 สลิปออนไลน์</a>
              </li>
              <li className="nav-item text-white fs-5 mb-2" style={{ pointerEvents: 'none' }}>
                รายการขออนุมัติ
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" onClick={() => navigate('/leave-form')}>📄 เพิ่มบันทึกการลา</a>
              </li>

              <div id="admin-menu-mobile" className="d-none">
                <li className="nav-item text-white fs-5 mb-2" style={{ pointerEvents: 'none' }}>
                  สำหรับผู้ดูแล
                </li>
                <li className="nav-item">
                  <a className="nav-link text-white" onClick={() => navigate('/admin')}>🛠️ จัดการระบบ</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link text-white" onClick={() => navigate('/request')}>⏳ รายการรออนุมัติ</a>
                </li>
              </div>

            </ul>
            <button className="btn btn-light logout-btn" onClick={handleLogout}>ออกจากระบบ</button>
          </div>
        </div>
      </nav>

      <div id="sidebar" className="sidebar-custom d-none d-lg-block">
        <h4 className="mb-4 fs-4 ">เมนู</h4>
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          <li className="nav-item">
            <a className="nav-link text-white" onClick={() => navigate('/home')}>🏠 หน้าหลัก</a>
          </li>
          <li className="nav-item">
            <a className="nav-link text-white" onClick={() => navigate('/checkin')}>🟢 บันทึกเข้า</a>
          </li>
          <li className="nav-item">
            <a className="nav-link text-white" onClick={() => navigate('/checkout')}>🔴 บันทึกออก</a>
          </li>
          <li className="nav-item">
            <a className="nav-link text-white" onClick={() => navigate('/calendar-page')}>📅 ปฏิทินกิจกรรม</a>
          </li>
          <li className="nav-item">
            <a className="nav-link text-white" onClick={() => navigate('/notifications')}>🔔 แจ้งเตือน</a>
          </li>
          <li className="nav-item">
            <a className="nav-link text-white" onClick={() => navigate('/payroll')}>💸 สลิปออนไลน์</a>
          </li>
          <li className="nav-item text-white fs-5 mb-2" style={{ pointerEvents: 'none' }}>
            รายการขออนุมัติ
          </li>
          <li className="nav-item">
            <a className="nav-link text-white" onClick={() => navigate('/leave-form')}>📄 เพิ่มบันทึกการลา</a>
          </li>

          <div id="admin-menu-desktop" className="d-none">
            <li className="nav-item text-white fs-5 mb-2" style={{ pointerEvents: 'none' }}>
              สำหรับผู้ดูแล
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" onClick={() => navigate('/admin')}>🛠️ จัดการระบบ</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" onClick={() => navigate('/request')}>⏳ รายการรออนุมัติ</a>
            </li>
          </div>
        </ul>
        <button className="btn btn-light logout-btn" onClick={handleLogout}>ออกจากระบบ</button>
      </div>
    </div>
  );
}

export default NavbarPage;
