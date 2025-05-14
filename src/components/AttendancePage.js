import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import * as bootstrap from 'bootstrap';
import { supabase } from '../supabaseClient';
import NavbarPage from './NavbarPage';
import '../cssfile/attendance.css'

function AttendancePage() {
    const [checkType, setCheckType] = useState('check-in'); 
    const [attendanceList, setAttendanceList] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10)); // yyyy-mm-dd

    // function isLate(timestamp) {
    //     const checkinDate = new Date(timestamp);
    //     const lateThreshold = new Date(timestamp);
    //     lateThreshold.setHours(10, 0, 0, 0);  //     // 10:00:00 สามารถแก้เวลาเข้าสายได้ตรงนี้ !!
    //     return checkinDate > lateThreshold;
    // }

    useEffect(() => {
        const fetchAttendance = async () => {
            const { data, error } = await supabase
            .from('attendance_log')
            .select(`
                timestamp,
                employees:employee_id (
                name, username, role
                )
            `)
            .eq('check_type', checkType)
            .gte('timestamp', `${selectedDate}T00:00:00+07:00`)
            .lte('timestamp', `${selectedDate}T23:59:59+07:00`)
            .order('timestamp', { ascending: false });

            if (!error) {
            setAttendanceList(data);
            } else {
            console.error('โหลดข้อมูลล้มเหลว:', error.message);
            }
        };

        fetchAttendance();
        }, [selectedDate, checkType]);



    const showSection = (id) => {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => section.classList.remove('active'));
        const target = document.getElementById(id);
        if (target) target.classList.add('active');
    };

    return (
        <div>
            <NavbarPage showSection={showSection} />
            <div className="main-content">
                <div id="attendence-log" className="section">
                    <h2>📜 ประวัติทำงานของพนักงาน</h2>

                    <div className="mb-3 d-flex align-items-center gap-2">
                        <label className="mb-0">ตาราง</label>
                        <select
                            className="form-select form-select-sm"
                            style={{ maxWidth: '120px' }}
                            value={checkType}
                            onChange={(e) => setCheckType(e.target.value)}
                        >
                            <option value="check-in">เข้างาน</option>
                            <option value="check-out">เลิกงาน</option>
                        </select>
                        <label className="mb-0">ประจำวันที่:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            className="form-control form-control-sm"
                            style={{ maxWidth: '160px' }}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>


                    <table className="table table-hover mt-3">
                        <thead>
                            <tr>
                                <th>เวลาเข้างาน</th>
                                <th>ชื่อพนักงาน</th>
                                <th>ตำแหน่ง</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceList.length === 0 && (
                                <tr><td colSpan="4" className="text-center">ไม่มีข้อมูลสำหรับวันนี้</td></tr>
                            )}
                            {attendanceList.map((entry, index) => (
                                <tr key={index}>
                                    {/* <td className={`fw-bold ${isLate(entry.timestamp) && checkType === 'check-in' ? 'text-danger' : ''}`}> */}
                                    <td className={`fw-bold`}>
                                        {new Date(entry.timestamp).toLocaleTimeString('th-TH', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                        })}
                                    </td>
                                    <td>
                                    {entry.employees?.name || '-'}
                                    {entry.employees?.username ? ` (${entry.employees.username})` : ''}
                                    </td>
                                    <td>{entry.employees?.role || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default AttendancePage;