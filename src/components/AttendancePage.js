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
    const [companyHours, setCompanyHours] = useState({});

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
                .select(`timestamp, check_type, employee_id, company, employees:employee_id (name, username, role)`) 
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
        setCompanyHours({});
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

    const companyTotals = {};
    let totalMs = 0;

    const logsByCompany = {};
    filteredLogs.forEach(log => {
        const comp = log.company || 'ไม่ระบุ';
        if (!logsByCompany[comp]) logsByCompany[comp] = [];
        logsByCompany[comp].push(log);
    });

    Object.entries(logsByCompany).forEach(([company, logs]) => {
        const sortedLogs = logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        for (let i = 0; i < sortedLogs.length - 1; i++) {
            const log1 = sortedLogs[i];
            const log2 = sortedLogs[i + 1];
            if (log1.check_type === 'check-in' && log2.check_type === 'check-out') {
                const inTime = new Date(log1.timestamp);
                const outTime = new Date(log2.timestamp);
                const duration = outTime - inTime;
                totalMs += duration;
                companyTotals[company] = (companyTotals[company] || 0) + duration;
                i++; // ข้าม log ถัดไปที่จับคู่แล้ว
            }
        }
    });

    setWorkSummary((totalMs / 1000 / 60 / 60).toFixed(2));

    const formatted = {};
    Object.entries(companyTotals).forEach(([comp, ms]) => {
        formatted[comp] = (ms / 1000 / 60 / 60).toFixed(2);
    });
    setCompanyHours(formatted);
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
                    <h1 className="fw-bold"><i class="fa-solid fa-chart-simple"></i> ประวัติการทำงาน</h1><hr />

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
                                    <th>บริษัท</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceList.length === 0 && (
                                    <tr><td colSpan="4" className="text-center">ไม่มีข้อมูลสำหรับวันนี้</td></tr>
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
                                        <td>{entry.company || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="attendance-summary mb-2 mt-3">
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
                                    รวมเวลาทั้งหมดในเดือนนี้: {" "}
                                    <span className="fw-bold">
                                        {workSummary ? `${workSummary} ชั่วโมง` : 'ยังไม่มีข้อมูลสำหรับคำนวณ'}
                                    </span>
                                    </p>
                                    <ul className="attendance-summary">
                                        {['LL', 'Meta', 'Med', 'IRE', 'EDTech'].map((comp) => (
                                            <li key={comp}>
                                            <span className="company-name">{comp}</span>
                                            <span className="company-hours">
                                                <span className="num">{companyHours[comp] || '0'}</span>
                                                <span className="unit"> ชั่วโมง</span>
                                            </span>
                                            </li>
                                        ))}
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