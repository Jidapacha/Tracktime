import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { supabase } from '../supabaseClient';
import NavbarPage from './NavbarPage';

function RequestPage() {
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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

  const fetchHistory = async () => {
    const { data, error } = await supabase
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
      .in('status', ['approved', 'rejected'])
      .order('start_date', { ascending: false });

    if (error) {
      console.error('โหลดประวัติไม่สำเร็จ:', error);
    } else {
      setHistory(data);
    }
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
        <div className="container py-4" id="main-content">
          <div id="request" className="section">
            <h2>⏳ รายการรออนุมัติ</h2>

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
              <div className="row row-cols-1 row-cols-md-2 g-4 mt-2">
                {filteredHistory.map(req => (
                  <div key={req.leave_id} className="col">
                    <div className="card shadow-sm border">
                      <div className="card-body">
                        <p><i className="fas fa-user"></i> <strong>พนักงาน:</strong> {req.employee.name || 'ไม่ระบุชื่อ'}</p>
                        <p><i className="fas fa-calendar-alt"></i> <strong>วันที่:</strong> {req.start_date}{req.end_date && req.end_date !== req.start_date ? ` ถึง ${req.end_date}` : ''}</p>
                        <p><i className="fas fa-file-alt"></i> <strong>ประเภท:</strong> {leaveTypeMap[req.leave_type] || '—'}</p>
                        <p><i className="fas fa-thumbtack"></i> <strong>รายละเอียด:</strong> {req.leave_remarks || '—'}</p>
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
        </div>
      </div>
    </div>
  );
}

export default RequestPage;
