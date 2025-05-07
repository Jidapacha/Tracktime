import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import * as bootstrap from 'bootstrap';
import { supabase } from '../supabaseClient';
import NavbarPage from './NavbarPage';

function AdminPage() {
    const [showAddForm, setShowAddForm] = useState(false);
    const [showOtherBank, setShowOtherBank] = useState(false);

    const toggleAddForm = () => {
        setShowAddForm(prev => !prev);
    };

    const handleBankChange = (e) => {
        setShowOtherBank(e.target.value === 'อื่นๆ');
    };

    const handleAddEmployee = (e) => {
        e.preventDefault();
        // ดึงค่าจาก form โดยใช้ document.getElementById(...) หรือสร้าง state มารองรับ
        console.log("เพิ่มพนักงานใหม่");
    };

    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [logError, setLogError] = useState(null);

    async function viewAttendanceLog() {
        const { data, error } = await supabase.from("attendance_log").select("*").order("timestamp", { ascending: false });
        if (error) {
            setLogError("โหลดข้อมูลไม่สำเร็จ");
            setAttendanceLogs([]);
        } else {
            setLogError(null);
            setAttendanceLogs(data);
        }
    }

    const [showCheckInQR, setShowCheckInQR] = useState(false);
    const [showCheckOutQR, setShowCheckOutQR] = useState(false);
    const [checkInQRUrl, setCheckInQRUrl] = useState('');
    const [checkOutQRUrl, setCheckOutQRUrl] = useState('');

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
            ], { onConflict: ['date', 'type'] }); // ป้องกัน insert ซ้ำ
      
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
                <div id="admin" className="section">
                    <h2>🛠️ จัดการระบบ</h2>
                    <p>ยินดีต้อนรับผู้ดูแลระบบ</p>
                    <div className="mb-4">
                        <h4>👥 จัดการพนักงาน</h4>
                        <button className="btn btn-outline-primary me-2 mb-2" onClick={toggleAddForm}>➕ เพิ่มพนักงาน</button>
                        <button className="btn btn-outline-warning me-2 mb-2">✏️ แก้ไขข้อมูล</button>
                        <button className="btn btn-outline-danger me-2 mb-2">🗑️ ลบพนักงาน</button>

                        {showAddForm && (
                            <form id="add-employee-form" className="row g-2 mb-3" onSubmit={handleAddEmployee}>
                                <div className="col-md-4">
                                    <input type="text" className="form-control" id="name" placeholder="ชื่อจริง" required />
                                </div>
                                <div className="col-md-4">
                                    <input type="text" className="form-control" id="username" placeholder="ชื่อเล่น" required />
                                </div>
                                <div className="col-md-4">
                                    <input type="email" className="form-control" id="email" placeholder="อีเมล" required />
                                </div>
                                <div className="col-md-4">
                                    <input type="text" className="form-control" id="tel" placeholder="เบอร์โทร" required />
                                </div>
                                <div className="col-md-4">
                                    <select id="role" className="form-select" required>
                                        <option value="" disabled selected>เลือกตำแหน่ง</option>
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Internship">Internship</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <select id="bank" className="form-select" required onChange={handleBankChange}>
                                        <option value="" disabled selected>เลือกธนาคาร</option>
                                        <option value="กรุงเทพ">กรุงเทพ</option>
                                        <option value="ไทยพาณิชย์">ไทยพาณิชย์</option>
                                        <option value="กสิกรไทย">กสิกรไทย</option>
                                        <option value="กรุงไทย">กรุงไทย</option>
                                        <option value="กรุงศรี">กรุงศรี</option>
                                        <option value="ออมสิน">ออมสิน</option>
                                        <option value="พร้อมเพย์">พร้อมเพย์</option>
                                        <option value="อื่นๆ">อื่นๆ</option>
                                    </select>
                                </div>
                                {showOtherBank && (
                                    <div className="col-md-4" id="other-bank-container">
                                        <input type="text" className="form-control" id="other-bank" placeholder="กรุณากรอกชื่อธนาคาร" required />
                                    </div>
                                )}
                                <div className="col-md-4">
                                    <input type="text" className="form-control" id="bank_number" placeholder="เลขบัญชี" required />
                                </div>
                                <div className="col-md-4">
                                    <button type="submit" className="btn btn-success">✅ บันทึก</button>
                                </div>
                            </form>
                        )}

                        {logError && <p className="text-danger">{logError}</p>}
                        <ul className="list-group">
                            {attendanceLogs.map((log, index) => (
                                <li key={index} className="list-group-item">
                                🧾 {log.employee_id} - {log.check_type} @ {new Date(log.timestamp).toLocaleString("th-TH")}
                                </li>
                        ))}
                        </ul>
                    </div>

                    <div className="mb-4">
                        <h4>📜 ประวัติเข้างาน/เลิกงาน</h4>
                        <button className="btn btn-outline-secondary" onClick={viewAttendanceLog}>📅 ดูประวัติ</button>
                        <div id="attendance-log"></div>
                    </div>

                    <div className="mb-4">
                        <h4>📦 QR Code สำหรับวันนี้</h4>
                        <button className="btn btn-outline-success me-2 mb-2" onClick={() => toggleQRCode("check-in")}>
                            🔄 สร้าง QR สำหรับเข้าทำงาน
                        </button>
                        {showCheckInQR && (
                            <div className="mt-3">
                            <h5>QR Code สำหรับการเข้างาน:</h5>
                            <img src={checkInQRUrl} alt="Check-in QR" />
                            </div>
                        )}
                        <button className="btn btn-outline-danger mb-2" onClick={() => toggleQRCode("check-out")}>
                            🔄 สร้าง QR สำหรับออกงาน
                        </button>
                        {showCheckOutQR && (
                            <div className="mt-3">
                            <h5>QR Code สำหรับการเลิกงาน:</h5>
                            <img src={checkOutQRUrl} alt="Check-out QR" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}


export default AdminPage;