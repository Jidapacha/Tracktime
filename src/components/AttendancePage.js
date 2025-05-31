import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { supabase } from '../supabaseClient';
import NavbarPage from './NavbarPage';
import '../cssfile/attendance.css'
import Select from 'react-select';


function AttendancePage() {
    const [checkType, setCheckType] = useState('check-in'); 
    const [attendanceList, setAttendanceList] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [workSummary, setWorkSummary] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [companyHours, setCompanyHours] = useState({});
    const [employeeHours, setEmployeeHours] = useState([]);
    const [overallTotal, setOverallTotal] = useState(0);
    const [allAttendanceData, setAllAttendanceData] = useState([]);



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
                .select(`timestamp, check_type, employee_id, company, location, employees:employee_id (name, username, role)`) 
                .order('timestamp', { ascending: false });

            if (!error) {
                setAllAttendanceData(data);
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
                    i++; 
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

        const selectOptions = employeeOptions
        .filter(emp => emp.name && emp.username)
        .map(emp => ({
            value: emp.employee_id,
            label: `${emp.name} (${emp.username})`
    }));


    useEffect(() => {
        if (selectedEmployee === 'all') {
            calculateAllEmployeesSummary();
        }
    }, [selectedMonth, selectedEmployee, allAttendanceData]);

    const calculateAllEmployeesSummary = async () => {
        const start = new Date(`${selectedMonth}-01T00:00:00+07:00`);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);

        const { data: allEmployees } = await supabase
            .from('employees')
            .select('employee_id, name, username');

        const { data: logs } = await supabase
            .from('attendance_log')
            .select('timestamp, check_type, employee_id, company')
            .gte('timestamp', start.toISOString())
            .lt('timestamp', end.toISOString());

        const logsByEmp = {};
        logs.forEach(log => {
            const empId = log.employee_id;
            if (!logsByEmp[empId]) logsByEmp[empId] = [];
            logsByEmp[empId].push(log);
        });

        const result = [];
        let totalSum = 0;

        for (const emp of allEmployees) {
            const empLogs = logsByEmp[emp.employee_id] || [];

            const logsByCompany = {};
            empLogs.forEach(log => {
            const comp = log.company || 'ไม่ระบุ';
            if (!logsByCompany[comp]) logsByCompany[comp] = [];
            logsByCompany[comp].push(log);
            });

            const empRecord = { name: emp.name, username: emp.username };
            let empTotal = 0;

            Object.entries(logsByCompany).forEach(([company, logs]) => {
            const sorted = logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            for (let i = 0; i < sorted.length - 1; i++) {
                if (sorted[i].check_type === 'check-in' && sorted[i+1].check_type === 'check-out') {
                const diff = new Date(sorted[i+1].timestamp) - new Date(sorted[i].timestamp);
                const hrs = diff / 1000 / 60 / 60;
                empRecord[company] = (empRecord[company] || 0) + hrs;
                empTotal += hrs;
                i++;
                }
            }
            });

            empRecord.total = empTotal;
            result.push(empRecord);
            totalSum += empTotal;
        }

        // ✅ เรียงตาม username
        result.sort((a, b) => a.username.localeCompare(b.username));
        setEmployeeHours(result);
        setOverallTotal(totalSum.toFixed(1));
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
                                    <th>สาขา</th>
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
                                        <td>{entry.location || '-'}</td>
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
                                    
                                    <Select 
                                    isClearable
                                    isSearchable
                                    className="basic-single employee-select"
                                    classNamePrefix="select"
                                    placeholder="-- กรุณาเลือก --"
                                    value={
                                        selectedEmployee === 'all'
                                        ? null
                                        : selectOptions.find(opt => opt.value === parseInt(selectedEmployee))
                                    }
                                    onChange={(selected) =>
                                        setSelectedEmployee(selected ? selected.value : 'all')
                                    }
                                    options={selectOptions}
                                    />


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
                                        {['LL', 'Meta', 'Med', 'W2D', 'EDTech'].map((comp) => (
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
                        <div className="table-responsive mt-4">
                            <h5>📋 ตารางรวมเวลาทำงานของพนักงานทั้งหมด</h5>
                            <table className="table table-bordered table-striped summary-table">
                                <thead className="table-light">
                                <tr>
                                    <th>ชื่อ</th>
                                    <th>Username</th>
                                    <th>LL</th>
                                    <th>Meta</th>
                                    <th>Med</th>
                                    <th>W2D</th>
                                    <th>EDTech</th>
                                    <th>รวม</th>
                                </tr>
                                </thead>
                                <tbody>
                                {employeeHours.map((emp, index) => (
                                    <tr key={index}>
                                        <td>{emp.name}</td>
                                        <td>{emp.username}</td>
                                        <td>{parseFloat(emp.LL || 0).toFixed(1)}</td>
                                        <td>{parseFloat(emp.Meta || 0).toFixed(1)}</td>
                                        <td>{parseFloat(emp.Med || 0).toFixed(1)}</td>
                                        <td>{parseFloat(emp.W2D || 0).toFixed(1)}</td>
                                        <td>{parseFloat(emp.EDTech || 0).toFixed(1)}</td>
                                        <td className="fw-bold">{parseFloat(emp.total || 0).toFixed(1)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AttendancePage;