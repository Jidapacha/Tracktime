import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../cssfile/NavbarPage.css';

function NavbarPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      const { data: emp } = await supabase
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
      <nav className="navbar navbar-light navbar-custom d-lg-none w-100">
        <div className="container-fluid">
          <button className="navbar-toggler text-white" type="button" onClick={() => setMobileMenuOpen(true)}>
            <span style={{ fontSize: '1.5rem' }}>☰</span>
          </button>
          <i class="fa-solid fa-circle-user fa-2x" onClick={() => navigate('/profile')}></i>
  
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <span className="navbar-brand text-white fs-3">เมนู</span>
        <button className="close-btn" onClick={() => setMobileMenuOpen(false)}> x</button>
        <ul className="navbar-nav">
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/home')}>
              <i class="fa-solid fa-house"></i>
               หน้าหลัก
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/checkin')}>
              <i class="fa-solid fa-right-to-bracket"></i>
              บันทึกเข้า
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/checkout')}>
              <i class="fa-solid fa-right-from-bracket"></i>
              บันทึกออก
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/calendar-page')}>
              <i class="fa-solid fa-calendar-days"></i>
              ปฏิทินกิจกรรม
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/notifications')}>
              <i class="fa-solid fa-bell"></i>
              แจ้งเตือน
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/payroll')}>
              <i class="fa-solid fa-file-invoice-dollar"></i>
              สลิปออนไลน์
            </button>
          </li>
          <li className="nav-item text-white fs-5 mb-2" style={{ pointerEvents: 'none' }}>
            รายการรออนุมัติ
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/leave-form')}>
              <i class="fa-solid fa-file-lines"></i>
              เพิ่มบันทึกการลา
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/edit-time')}>
              <i class="fa-solid fa-clock"></i>
              แก้ไขเวลางาน
            </button>
          </li>
          <div id="admin-menu-mobile" className="d-none">
            <li className="nav-item text-white fs-5 mb-2" style={{ pointerEvents: 'none' }}>
              สำหรับผู้ดูแล
            </li>
            <li className="nav-item">
              <button className="nav-link btn btn-link" onClick={() => navigate('/admin')}>
                <i class="fa-solid fa-screwdriver-wrench"></i>
                จัดการระบบ
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link btn btn-link" onClick={() => navigate('/request')}>
                <i class="fa-solid fa-hourglass-start"></i>
                รายการรออนุมัติ
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link btn btn-link" onClick={() => navigate('/attendance-log')}>
                <i class="fa-solid fa-chart-simple"></i>
                ประวัติการทำงาน
              </button>
            </li>
          </div>
        </ul>
        <button className="btn btn-light logout-btn" onClick={handleLogout}>ออกจากระบบ</button>
      </div>


      
      {/* Desktop Sidebar */}
      <div id="sidebar" className="sidebar-custom d-none d-lg-block p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fs-3 text-white mb-0">เมนู</span>
          <i class="fa-solid fa-circle-user fa-2x" onClick={() => navigate('/profile')}></i>
        </div>



        <ul className="navbar-nav">
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/home')}>
              <i class="fa-solid fa-house"></i>
               หน้าหลัก
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/checkin')}>
              <i class="fa-solid fa-right-to-bracket"></i>
              บันทึกเข้า
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/checkout')}>
              <i class="fa-solid fa-right-from-bracket"></i>
              บันทึกออก
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/calendar-page')}>
              <i class="fa-solid fa-calendar-days"></i>
              ปฏิทินกิจกรรม
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/notifications')}>
              <i class="fa-solid fa-bell"></i>
              แจ้งเตือน
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/payroll')}>
              <i class="fa-solid fa-file-invoice-dollar"></i>
              สลิปออนไลน์
            </button>
          </li>
          <li className="nav-item text-white fs-5 mb-2" style={{ pointerEvents: 'none' }}>
            รายการรออนุมัติ
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/leave-form')}>
              <i class="fa-solid fa-file-lines"></i>
              เพิ่มบันทึกการลา
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" onClick={() => navigate('/edit-time')}>
              <i class="fa-solid fa-clock"></i>
              แก้ไขเวลางาน
            </button>
          </li>
          <div id="admin-menu-desktop" className="d-none">
            <li className="nav-item text-white fs-5 mb-2" style={{ pointerEvents: 'none' }}>
              สำหรับผู้ดูแล
            </li>
            <li className="nav-item">
              <button className="nav-link btn btn-link" onClick={() => navigate('/admin')}>
                <i class="fa-solid fa-screwdriver-wrench"></i>
                จัดการระบบ
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link btn btn-link" onClick={() => navigate('/request')}>
                <i class="fa-solid fa-hourglass-start"></i>
                รายการรออนุมัติ
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link btn btn-link" onClick={() => navigate('/attendance-log')}>
                <i class="fa-solid fa-chart-simple"></i>
                ประวัติการทำงาน
              </button>
            </li>
          </div>
        </ul>
        <button className="btn btn-light logout-btn" onClick={handleLogout}>ออกจากระบบ</button>
      </div>
    </div>
  );
}

export default NavbarPage;
