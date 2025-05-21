import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavbarPage from './NavbarPage';
import { supabase } from '../supabaseClient';
import '../cssfile/leave.css'

function LeavePage() {
  const [step, setStep] = useState('summary');
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState({
    leaveType: 'sick',
    timeType: 'day',
    startDate: '',
    endDate: '',
    hourDate: '',
    startTime: '',
    endTime: '',
    remarks: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    setStep('preview');
  };

  const handleConfirm = async () => {
    const { leaveType, timeType, startDate, endDate, hourDate, startTime, endTime, remarks } = formData;

    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email;

    const { data: empData, error: empError } = await supabase
      .from('employees')
      .select('employee_id')
      .eq('email', email)
      .single();

    if (empError || !empData) {
      alert('❌ ไม่พบข้อมูลพนักงาน');
      return;
    }

    const employeeId = empData.employee_id;

    const payload = {
      employee_id: employeeId,
      leave_type: leaveType,
      time_type: timeType,
      start_date: timeType === 'day' ? startDate : hourDate,
      end_date: timeType === 'day' ? endDate : hourDate,
      start_time: timeType === 'hour' ? startTime : null,
      end_time: timeType === 'hour' ? endTime : null,
      leave_remarks: remarks || null,
      status: 'pending',
    };

    const { error } = await supabase.from('leave_days').insert(payload);

    if (error) {
      alert('❌ เกิดข้อผิดพลาดในการส่งคำขอ: ' + error.message);
    } else {
      alert('✅ ส่งคำขอเรียบร้อยแล้ว!');
      setStep('summary');
    }

  };

  const mapLeaveType = (value) => {
    switch (value) {
      case 'sick': return 'ลาป่วย';
      case 'personal': return 'ลากิจ';
      case 'vacation': return 'ลาพักร้อน';
      case 'other': return 'อื่นๆ';
      default: return 'ไม่ทราบ';
    }
  };


  useEffect(() => {
    const fetchLeaveHistory = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;

      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('employee_id')
        .eq('email', email)
        .single();

      if (empError || !empData) return;

      const { data: leaveData } = await supabase
        .from('leave_days')
        .select('*')
        .eq('employee_id', empData.employee_id)
        .order('start_date', { ascending: false });

      setHistory(leaveData || []);
    };

    fetchLeaveHistory();
  }, []);

  const formatDate = (str) => {
    const date = new Date(str);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const mapStatus = (status) => {
    switch (status) {
      case 'approved': return '✅ อนุมัติแล้ว';
      case 'rejected': return '❌ ไม่อนุมัติ';
      case 'pending': default: return '⏳ รอตรวจสอบ';
    }
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
        <div id="leave" className="section">
            <h1 className="fw-bold"><i class="fa-solid fa-file-lines"></i> เพิ่มบันทึกการลา</h1><hr />
            
            {step === 'summary' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">สิทธิคงเหลือ</h4>
                <button className="btn btn-outline-success btn-sm" onClick={() => setStep('form')}>
                  + เพิ่มบันทึกการลา
                </button>
              </div>

              <table className="table leave-summary">
                <thead>
                  <tr>
                    <th>ประเภท</th>
                    <th>จำนวนวัน</th>
                    <th>ชั่วโมง</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>ลากิจ</td><td>6 วัน</td><td>0 ชม.</td></tr>
                  <tr><td>ลาป่วย</td><td>30 วัน</td><td>0 ชม.</td></tr>
                </tbody>
              </table>

              <hr />
              <h5>ประวัติการลา</h5>
              <ul className="list-group list-group-flush small leave-history">
                {history.length === 0 && (
                  <li className="list-group-item text-muted">ไม่พบข้อมูลการลา</li>
                )}

                {history.map((leave, index) => (
                  <li key={index} className="list-group-item">
                    {mapLeaveType(leave.leave_type)}{' '}
                    {leave.time_type === 'day'
                      ? `${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}`
                      : `${formatDate(leave.start_date)} เวลา ${leave.start_time} - ${leave.end_time}`}
                    <button className="btn btn-outline-secondary btn-status ms-2" disabled>
                      {mapStatus(leave.status)}
                    </button>
                  </li>
                ))}
              </ul>
              </>
            )}  
            {step === 'form' && (
              <>
              <h4 className="text-center mb-4">เพิ่มบันทึกการลา</h4>
                <div className="mb-3">
                  <label>📄 ระบุประเภทรายการ</label>
                  <select name="leaveType" className="form-control" value={formData.leaveType} onChange={handleChange}>
                    <option value="sick">ลาป่วย</option>
                    <option value="personal">ลากิจ</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label>⏰ ระบุประเภทของเวลา</label><br/>
                  <div>
                    <input type="radio" name="timeType" value="day" checked={formData.timeType === 'day'} onChange={handleChange} /> เป็นวัน
                    <input type="radio" name="timeType" value="hour" checked={formData.timeType === 'hour'} onChange={handleChange} className="ms-3" /> เป็นชั่วโมง
                  </div>
                </div>

                {formData.timeType === 'day' ? (
                  <>
                    <div className="mb-3">
                      <label>🗓️ วันที่เริ่มต้น</label>
                      <input type="date" name="startDate" className="form-control" value={formData.startDate} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                      <label>🗓️ วันที่สิ้นสุด</label>
                      <input type="date" name="endDate" className="form-control" value={formData.endDate} onChange={handleChange} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-3">
                      <label>🗓️ วันที่</label>
                      <input type="date" name="hourDate" className="form-control" value={formData.hourDate} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                      <label>⏰ เวลาเริ่ม</label>
                      <input type="time" name="startTime" className="form-control" value={formData.startTime} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                      <label>⏰ เวลาสิ้นสุด</label>
                      <input type="time" name="endTime" className="form-control" value={formData.endTime} onChange={handleChange} />
                    </div>
                  </>
                )}

                <div className="mb-3">
                  <label>📝 รายละเอียดเพิ่มเติม</label>
                  <textarea name="remarks" className="form-control" rows="3" value={formData.remarks} onChange={handleChange} placeholder="เช่น เหตุผลในการลา..."></textarea>
                </div>

                <div className="d-flex justify-content-between mt-4">
                <button className="btn btn-secondary" onClick={() => setStep('summary')}>ย้อนกลับ</button>
                <button className="btn btn-success" onClick={handleSubmit}>ส่งคำขอ</button>
              </div>
              </>
            )}

            {step === 'preview' && (
              <>
                <h2 className="text-center mb-4">📋 สรุปการลา</h2>
                <div className="mb-3">
                  <strong>📄 ประเภทการลา:</strong> {mapLeaveType(formData.leaveType)}<br/>
                  <strong>⏰ ประเภทเวลา:</strong> {formData.timeType === 'day' ? 'เป็นวัน' : 'เป็นชั่วโมง'}<br/>
                  {formData.timeType === 'day' ? (
                    <>
                      <strong>🗓️ วันที่เริ่มต้น:</strong> {formData.startDate}<br/>
                      <strong>🗓️ วันที่สิ้นสุด:</strong> {formData.endDate}<br/>
                    </>
                  ) : (
                    <>
                      <strong>🗓️ วันที่:</strong> {formData.hourDate}<br/>
                      <strong>⏰ เวลา:</strong> {formData.startTime} - {formData.endTime}<br/>
                    </>
                  )}
                  {formData.remarks && (
                    <>
                      <strong>📝 หมายเหตุ:</strong> {formData.remarks}<br/>
                    </>
                  )}
                </div>

                <div className="d-flex justify-content-between">
                  <button className="btn btn-primary" onClick={() => setStep('form')}>แก้ไข</button>
                  <button className="btn btn-success" onClick={handleConfirm}>ยืนยันส่งคำขอ</button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
  );
}

export default LeavePage;
