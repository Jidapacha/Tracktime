import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { supabase } from '../supabaseClient';
import NavbarPage from './NavbarPage';
import '../cssfile/attendance.css'

function AttendancePage() {
    const [checkType, setCheckType] = useState('check-in'); 
    const [attendanceList, setAttendanceList] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [workSummary, setWorkSummary] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    function isLate(timestamp) {
        const checkinDate = new Date(timestamp);
        const lateThreshold = new Date(timestamp);
        lateThreshold.setHours(10, 0, 0, 0);
        return checkinDate > lateThreshold;
    }

    useEffect(() => {
        const fetchEmployees = async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('employee_id, name, username');
            if (!error) setEmployeeOptions(data);
        };
        fetchEmployees();
    }, []);

    useEffect(() => {
        const fetchAttendance = async () => {
            const { data, error } = await supabase
                .from('attendance_log')
                .select(`timestamp, check_type, employee_id, employees:employee_id (name, username, role)`) 
                .order('timestamp', { ascending: false });

            if (!error) {
                setAttendanceList(
                    data.filter(
                        item => item.check_type === checkType &&
                            item.timestamp.startsWith(selectedDate)
                    ).sort((a, b) => {
                        const aLate = isLate(a.timestamp);
                        const bLate = isLate(b.timestamp);
                        if (aLate && !bLate) return -1;
                        if (!aLate && bLate) return 1;
                        return new Date(b.timestamp) - new Date(a.timestamp);
                    })
                );
                calculateWorkHours(data);
            } else console.error('โหลดข้อมูลล้มเหลว:', error.message);
        };
        fetchAttendance();
    }, [selectedDate, checkType, selectedMonth, selectedEmployee]);

    const calculateWorkHours = (data) => {
        if (selectedEmployee === 'all') {
            setWorkSummary(null);
            return;
        }

        const start = new Date(`${selectedMonth}-01T00:00:00+07:00`);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);

        const filteredLogs = data.filter(log => {
            const logTime = new Date(log.timestamp);
            return (
                log.employee_id === parseInt(selectedEmployee) &&
                logTime >= start && logTime < end
            );
        });

        const logsByDate = {};

        filteredLogs.forEach(log => {
            const dateKey = log.timestamp.slice(0, 10);
            if (!logsByDate[dateKey]) {
                logsByDate[dateKey] = [];
            }
            logsByDate[dateKey].push(log);
        });

        let totalMs = 0;

        Object.values(logsByDate).forEach(dayLogs => {
            const checkin = dayLogs.find(log => log.check_type === 'check-in');
            const checkout = dayLogs.find(log => log.check_type === 'check-out');

            if (checkin && checkout) {
                const inTime = new Date(checkin.timestamp);
                const outTime = new Date(checkout.timestamp);
                totalMs += outTime - inTime;
            }
        });

        const totalHrs = totalMs / 1000 / 60 / 60;
        setWorkSummary(totalHrs > 0 ? totalHrs.toFixed(2) : null);
    };

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

                    <div className="mb-3 d-flex align-items-center gap-2 flex-wrap">
                        <div className="select-wrapper">
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
                        </div>
                        <div className="select-wrapper">
                            <label className="mb-0">ประจำวันที่:</label>
                            <input
                                id="selectedDate"
                                type="date"
                                value={selectedDate}
                                className="form-control form-control-sm"
                                style={{ maxWidth: '160px' }}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="table-container">
                        <table className="table table-hover mt-3">
                            <thead>
                                <tr>
                                    <th>เวลา</th>
                                    <th>ชื่อพนักงาน</th>
                                    <th>ตำแหน่ง</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceList.length === 0 && (
                                    <tr><td colSpan="3" className="text-center">ไม่มีข้อมูลสำหรับวันนี้</td></tr>
                                )}
                                {attendanceList.map((entry, index) => (
                                    <tr key={index}>
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

                    <div className="mt-5">
                        <h4>📊 สรุปการทำงาน</h4>
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="summary-filter-wrapper">
                                <div className="employee-filter">
                                    <label>เลือกพนักงาน:</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={selectedEmployee}
                                        onChange={(e) => setSelectedEmployee(e.target.value)}
                                    >
                                    <option value="all">-- กรุณาเลือก --</option>
                                    {employeeOptions.map((emp) => (
                                        <option key={emp.employee_id} value={emp.employee_id}>
                                            {emp.name} ({emp.username})
                                        </option>
                                    ))}
                                    </select>
                                </div>

                                <div className="month-filter">
                                    <label>เดือน:</label>
                                    <input
                                        type="month"
                                        value={selectedMonth}
                                        className="form-control form-control-sm"
                                        style={{ maxWidth: '160px' }}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            {selectedEmployee === 'all' ? (
                                <p>กรุณาเลือกพนักงานเพื่อดูเวลารวมในการทำงาน</p>
                                ) : (
                                <>
                                    <p>
                                    รวมเวลาทำงานทั้งหมดในเดือนนี้:{" "}
                                    <span className="fw-bold">
                                        {workSummary ? `${workSummary} ชั่วโมง` : 'ยังไม่มีข้อมูลสำหรับคำนวณ'}
                                    </span>
                                    </p>
                                    <ul className="mt-2 mb-3">
                                        <li>LL</li>
                                        <li>Meta</li>
                                        <li>Med</li>
                                        <li>IRE</li>
                                        <li>EDTech</li>
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AttendancePage;
