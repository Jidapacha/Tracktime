import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../cssfile/HomePage.css';
import NavbarPage from './NavbarPage';
import { supabase } from '../supabaseClient';


const HomePage = () => {
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [error, setError] = useState('');
    const [datetime, setDatetime] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    const [showCheckInQR, setShowCheckInQR] = useState(false);
    const [showCheckOutQR, setShowCheckOutQR] = useState(false);
    const [checkInQRUrl, setCheckInQRUrl] = useState('');
    const [checkOutQRUrl, setCheckOutQRUrl] = useState('');

    useEffect(() => {
      const fetchUser = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          navigate('/'); 
          return;
        }

      const { data, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .eq('email', user.email)
        .single();

      if (fetchError) {
        console.error('Error fetching employee data:', fetchError.message);
        return;
      }

      setEmployee(data);
      setIsAdmin(data.role === 'admin');
    };

    fetchUser();
    }, [navigate]);

    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    async function toggleQRCode(type) {
    const today = new Date().toISOString().split("T")[0];
    const codeData = `qr-code-${type}-${today}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${codeData}`;

    await saveQRCodeToDatabase(codeData, type, today);

    if (type === "check-in") {
      setCheckInQRUrl(qrUrl);
      setShowCheckInQR(prev => !prev);
    } else if (type === "check-out") {
      setCheckOutQRUrl(qrUrl);
      setShowCheckOutQR(prev => !prev);
    }
    }

    async function saveQRCodeToDatabase(codeData, type, dateStr) {
    const { data, error } = await supabase
      .from("daily_qr_codes")
      .upsert([
        {
          date: dateStr,
          qr_code_text: codeData,
          type: type,
        }
      ], { onConflict: ['date', 'type'] });

    if (error) {
      console.error("❌ บันทึก QR ลงฐานข้อมูลไม่สำเร็จ:", error.message);
    } else {
      console.log("✅ บันทึก QR ลงฐานข้อมูลแล้ว");
    }
    }

    const showSection = (id) => {
      const sections = document.querySelectorAll('.section');
      sections.forEach(section => section.classList.remove('active'));
      const target = document.getElementById(id);
      if (target) target.classList.add('active');
    };
  


    return (
      <div>
      <NavbarPage showSection={showSection}/>
      
      <div className="main-content">
        <div className="container py-4" id="main-content">
          {/* หน้าแรก */}
          <div id="home" className="section active">
            <h2>🏠 หน้าหลัก</h2>
            <div id="employee">
              {employee ? (
                <div>
                  <h2>รายละเอียดพนักงาน</h2>
                  <p>ชื่อ: {employee.name}</p>
                  <p>ชื่อเล่น: {employee.username}</p>
                  <p>ตำแหน่ง: {employee.role}</p>
                  <p>อีเมล: {employee.email}</p>
                </div>
              ) : (
                <h2>กำลังโหลดข้อมูลพนักงาน...</h2>
              )}
            </div>
            <div id="datetime" className="mb-3 text-muted"></div>
            <div className="mb-3 d-flex flex-column justify-content-center align-items-center gap-2">
              <button className="btn btn-success w-50" onClick={() => showSection('checkin')}>🟢 บันทึกเข้า</button>
              <button className="btn btn-danger w-50" onClick={() => showSection('checkout')}>🔴 บันทึกออก</button>
            </div>
            <div className="mb-4">
              <h5>🔗 หัวข้อเพิ่ม</h5>
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary" onClick={() => showSection('calendar-page')}>📅 ปฏิทินกิจกรรม</button>
                <button className="btn btn-outline-warning" onClick={() => showSection('notifications')}>🔔 แจ้งเตือน</button>
                <button className="btn btn-outline-info" onClick={() => showSection('payroll')}>💸 สลิปเงินเดือน</button>
              </div>
            </div>

            {/* แสดงปุ่ม QR สำหรับแอดมิน */}
            {isAdmin && (
              <div className="mb-4">
                <h4>📦 QR Code สำหรับวันนี้</h4>
                <button className="btn btn-outline-success" onClick={() => toggleQRCode("check-in")}>
                  🔄 สร้าง QR สำหรับเข้าทำงาน
                </button>
                {showCheckInQR && (
                  <div>
                    <h5>QR Code สำหรับการเข้างาน:</h5>
                    <img src={checkInQRUrl} alt="Check-in QR" />
                  </div>
                )}

                <button className="btn btn-outline-danger" onClick={() => toggleQRCode("check-out")}>
                  🔄 สร้าง QR สำหรับออกงาน
                </button>
                {showCheckOutQR && (
                  <div>
                    <h5>QR Code สำหรับการออกงาน:</h5>
                    <img src={checkOutQRUrl} alt="Check-out QR" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    );
};

export default HomePage;
