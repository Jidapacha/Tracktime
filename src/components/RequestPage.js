import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { supabase } from '../supabaseClient';
import NavbarPage from './NavbarPage';
import '../cssfile/request.css'


function RequestPage() {
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRequests, setTimeRequests] = useState([]);


  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('leave_days')
      .select(`
        leave_id,
        start_date,
        end_date,
        leave_type,
        leave_remarks,
        employee:employee_id (
          name
        )
      `)
      .eq('status', 'pending');

    if (error) {
      console.error('โหลดคำขอลาไม่สำเร็จ:', error);
    } else {
      setRequests(data);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchHistory();
    fetchTimeRequests();
  }, []);

  const handleApprove = async (id) => {
    const { error } = await supabase
      .from('leave_days')
      .update({ status: 'approved' })
      .eq('leave_id', id);

    if (error) {
      console.error('❌ อัปเดตไม่สำเร็จ:', error.message);
      alert('เกิดข้อผิดพลาดขณะอัปเดต');
    } else {
      console.log('✅ อัปเดตสำเร็จ');
      fetchRequests();
      fetchHistory();
    }
  };

  const handleReject = async (id) => {
    const { error } = await supabase
      .from('leave_days')
      .update({ status: 'rejected' })
      .eq('leave_id', id);

    if (error) {
      console.error('❌ ปฏิเสธไม่สำเร็จ:', error.message);
    } else {
      console.log('❌ ปฏิเสธคำขอลาสำเร็จ');
      fetchRequests();
      fetchHistory();
    }
  };

  const leaveTypeMap = {
    sick: 'ลาป่วย',
    personal: 'ลากิจ',
    vacation: 'ลาพักร้อน',
    other: 'อื่นๆ'
  };



  const fetchTimeRequests = async () => {
    const { data, error } = await supabase
      .from('time_correction_requests')
      .select(`
        request_time_id,
        type,
        time,
        reason,
        company,
        employee: employee_id (
          employee_id,
          name
        )

      `)
      .eq('status', 'pending');

    if (error) {
      console.error('โหลดคำขอเวลาไม่สำเร็จ:', error);
    } else {
      setTimeRequests(data);
    }
  };

  const handleApproveTime = async (request) => {
    const { error: insertError } = await supabase.from("attendance_log").insert([
      {
        employee_id: request.employee.employee_id,
        check_type: request.type,
        timestamp: request.time,
        location: "manual-approval",
        company: request.company,
      }
    ]);

    if (insertError) {
      console.error("❌ Insert attendance_log error:", insertError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from('time_correction_requests')
      .update({ status: 'approved' })
      .eq('request_time_id', request.request_time_id);

    if (updateError) {
      console.error("❌ Update status error:", updateError.message);
    } else {
      fetchTimeRequests();
    }
  };


  const handleRejectTime = async (requestId) => {
    const { error } = await supabase
      .from('time_correction_requests')
      .update({ status: 'rejected' })
      .eq('request_time_id', requestId);

    if (error) {
      console.error("❌ Reject error:", error.message);
    } else {
      fetchTimeRequests();
    }
  };



  const fetchHistory = async () => {
    const { data: leaveData, error: leaveError } = await supabase
    .from('leave_days')
    .select(`
      leave_id,
      start_date,
      end_date,
      leave_type,
      leave_remarks,
      status,
      employee:employee_id (
        name
      )
    `)
       .in('status', ['approved', 'rejected']);

  if (leaveError) {
    console.error('❌ โหลดประวัติลางานไม่สำเร็จ:', leaveError);
    return;
  }
  const { data: timeData, error: timeError } = await supabase
    .from('time_correction_requests')
    .select(`
      request_time_id,
      time,
      type,
      reason,
      status,
      company,
      employee:employee_id (
        name
      )
    `)
    .in('status', ['approved', 'rejected']);

  if (timeError) {
    console.error('❌ โหลดประวัติแก้เวลาไม่สำเร็จ:', timeError);
    return;
  }
  const formattedLeave = leaveData.map(item => ({
    type: 'leave',
    ...item,
  }));

  const formattedTime = timeData.map(item => ({
    type: 'time',
    ...item,
  }));

  setHistory(
  [...formattedLeave, ...formattedTime].sort((a, b) => {
    const aTime = a.type === 'leave' ? new Date(a.start_date) : new Date(a.time);
    const bTime = b.type === 'leave' ? new Date(b.start_date) : new Date(b.time);
    return bTime - aTime; // เรียงจากใหม่ → เก่า
  })
);

};



  const showSection = (id) => {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
  };

  const filteredHistory = history.filter(req =>
    req.employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <NavbarPage showSection={showSection} />
      <div className="main-content">
        <div id="request" className="section">
          <h1 className="fw-bold"><i class="fa-solid fa-hourglass-start"></i> รายการรออนุมัติ</h1><hr />
            
            <hr className="my-4" />
            <h2>🕒 คำขอแก้ไขเวลาทำงาน</h2>

              {timeRequests.length === 0 ? (
                <div className="alert alert-success mt-3">✅ ไม่มีคำขอแก้ไขเวลา</div>
              ) : (
                timeRequests.map(req => (
                  <div key={req.request_time_id} className="card mt-3">
                    <div className="card-body">
                      <p><i className="fas fa-user"></i> <strong>พนักงาน:</strong> {req.employee?.name || 'ไม่ระบุ'}</p>
                      <p><i className="fas fa-clock"></i> <strong>ประเภท:</strong> {req.type === 'check-in' ? 'เข้างาน' : 'ออกงาน'}</p>
                      <p><i className="fas fa-calendar-alt"></i> <strong>เวลา:</strong> {new Date(req.time).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</p>
                      <p><i className="fas fa-building"></i> <strong>บริษัท:</strong> {req.company}</p>
                      <p><i className="fas fa-file-alt"></i> <strong>เหตุผล:</strong> {req.reason}</p>
                      <button className="btn btn-success me-2" onClick={() => handleApproveTime(req)}>✅ อนุมัติ</button>
                      <button className="btn btn-danger" onClick={() => handleRejectTime(req.request_time_id)}>❌ ปฏิเสธ</button>
                    </div>
                  </div>
                ))
              )}

            <hr className="my-4" />
            <h2>🕒 คำขอลางาน</h2>
            
            {requests.length === 0 ? (
              <div className="alert alert-success mt-3">✅ ไม่มีคำขอที่รออนุมัติ</div>
            ) : (
              requests.map(req => (
                <div key={req.leave_id} className="card mt-3">
                  <div className="card-body">
                    <p><i className="fas fa-user"></i> <strong>พนักงาน:</strong> {req.employee.name || 'ไม่ระบุชื่อ'}</p>
                    <p><i className="fas fa-calendar-alt"></i> <strong>วันที่:</strong> {req.start_date} {req.end_date && req.end_date !== req.start_date ? `ถึง ${req.end_date}` : ''}</p>
                    <p><i className="fas fa-file-alt"></i> <strong>ประเภท:</strong> {leaveTypeMap[req.leave_type] || '—'}</p>
                    <p><i className="fas fa-thumbtack"></i> <strong>รายละเอียด:</strong> {req.leave_remarks || '—'}</p>
                    <button className="btn btn-success me-2" onClick={() => handleApprove(req.leave_id)}>✅ อนุมัติ</button>
                    <button className="btn btn-danger" onClick={() => handleReject(req.leave_id)}>❌ ปฏิเสธ</button>
                  </div>
                </div>
              ))
            )}

            


            <hr className="my-4" />
            <h3><i className="fas fa-history"></i> ประวัติการอนุมัติ/ปฏิเสธ</h3>

            <input
              type="text"
              className="form-control my-3"
              placeholder="🔍 ค้นหาชื่อพนักงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {filteredHistory.length === 0 ? (
              <div className="alert alert-secondary">ไม่พบประวัติการขออนุมัติ</div>
            ) : (
              <div className="row g-4 mt-2">
                {filteredHistory.length === 0 ? (
                <div className="alert alert-secondary">ไม่พบประวัติคำขออนุมัติ</div>
              ) : (
                <div className="row row-cols-1 row-cols-md-2 g-4 mt-2">
                  {filteredHistory.map((req, index) => (
                    <div className="col" key={index}>
                      <div className="card shadow-sm border">
                        <div className="card-body">
                          <p><i className="fas fa-user"></i> <strong>พนักงาน:</strong> {req.employee?.name || 'ไม่ระบุชื่อ'}</p>

                          {req.type === 'leave' ? (
                            <>
                              <p><i className="fas fa-calendar-alt"></i> <strong>วันที่:</strong> {req.start_date}{req.end_date && req.end_date !== req.start_date ? ` ถึง ${req.end_date}` : ''}</p>
                              <p><i className="fas fa-file-alt"></i> <strong>ประเภท:</strong> {leaveTypeMap[req.leave_type] || '—'}</p>
                              <p><i className="fas fa-thumbtack"></i> <strong>รายละเอียด:</strong> {req.leave_remarks || '—'}</p>
                            </>
                          ) : (
                            <>
                              <p><i className="fas fa-clock"></i> <strong>ประเภทเวลา:</strong> {req.type === 'check-in' ? 'เข้างาน' : 'ออกงาน'}</p>
                              <p><i className="fas fa-calendar-alt"></i> <strong>เวลา:</strong> {new Date(req.time).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</p>
                              <p><i className="fas fa-building"></i> <strong>บริษัท:</strong> {req.company}</p>
                              <p><i className="fas fa-file-alt"></i> <strong>เหตุผล:</strong> {req.reason}</p>
                            </>
                          )}

                          <p><i className="fas fa-flag-checkered"></i> <strong>สถานะ:</strong>
                            <span className={`badge ms-2 ${req.status === 'approved' ? 'bg-success' : 'bg-danger'}`}>
                              {req.status === 'approved' ? '✅ อนุมัติแล้ว' : '❌ ถูกปฏิเสธ'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              </div>
            )}
          </div>
        </div>
    </div>
  );
}

export default RequestPage;
