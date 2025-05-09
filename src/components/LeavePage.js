import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavbarPage from './NavbarPage';
import { supabase } from '../supabaseClient';

function LeavePage() {
  const [step, setStep] = useState('form');
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
      window.location.reload();
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
        <div className="d-flex justify-content-center mt-4">
          <div className="p-4 shadow rounded" style={{ width: '100%', maxWidth: '500px', backgroundColor: '#f9f9f9' }}>

            {step === 'form' && (
              <>
                <h2 className="text-center mb-4">📄 เพิ่มบันทึกการลา</h2>

                <div className="mb-3">
                  <label>📄 ระบุประเภทรายการ</label>
                  <select name="leaveType" className="form-control" value={formData.leaveType} onChange={handleChange}>
                    <option value="sick">ลาป่วย</option>
                    <option value="personal">ลากิจ</option>
                    <option value="vacation">ลาพักร้อน</option>
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

                <button className="btn btn-success w-100" onClick={handleSubmit}>ส่งคำขอ</button>
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
    </div>
  );
}

export default LeavePage;
