import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import * as bootstrap from 'bootstrap';
import { supabase } from '../supabaseClient';
import NavbarPage from './NavbarPage';
function LeavePage() {

    function openLeaveForm() {
        document.getElementById('leave-form').style.display = 'block';
    }
    
    async function submitLeaveRequest() {
        const type = document.getElementById('leave-type').value;
        const date = document.getElementById('leave-date').value;
        const user = await supabase.auth.getUser();
        const email = user.data.user.email;
    
        // ดึง employee_id จากอีเมล (สมมุติว่า login ด้วยอีเมลตรง employee)
        const { data: employeeData, error: empError } = await supabase
            .from('employees')
            .select('employee_id')
            .eq('email', email)
            .single();
        
        if (empError || !employeeData) {
            alert('ไม่พบข้อมูลพนักงาน');
            return;
        }
    
        const employee_id = employeeData.employee_id;
    
        const { error } = await supabase.from('leave_days').insert([
            {
                employee_id: employee_id,
                type: type,
                date: date,
                status: 'pending' // ส่งให้แอดมินอนุมัติ
            }
        ]);
    
        if (error) {
            alert('เกิดข้อผิดพลาดในการส่งคำขอ');
            console.error(error);
        } else {
            alert('ส่งคำขอลาสำเร็จ รอการอนุมัติจากแอดมิน');
            document.getElementById('leave-form').style.display = 'none';
        }
    }
    
    function toggleTimeInputs() {
        const type = document.querySelector('input[name="time-type"]:checked').value;
        document.getElementById('hour-inputs').style.display = (type === 'hour') ? 'block' : 'none';
        document.getElementById('day-inputs').style.display = (type === 'day') ? 'block' : 'none';
    }
    
    
    window.onload = function () {
        document.getElementById("start-date").addEventListener("change", calcDayLeave);
        document.getElementById("end-date").addEventListener("change", calcDayLeave);
    
        document.getElementById("start-time").addEventListener("change", calcHourLeave);
        document.getElementById("end-time").addEventListener("change", calcHourLeave);
    }
    
    function calcHourLeave() {
        const date = document.getElementById("hour-date").value;
        const startTime = document.getElementById("start-time").value;
        const endTime = document.getElementById("end-time").value;
        const output = document.getElementById("hour-duration");
        
        if (date && startTime && endTime) {
            const startDateTime = new Date(`${date}T${startTime}`);
            const endDateTime = new Date(`${date}T${endTime}`);
        
            if (endDateTime > startDateTime) {
            const diffMs = endDateTime - startDateTime;
            const hours = diffMs / (1000 * 60 * 60);
            output.innerText = `ลาทั้งหมด: ${hours.toFixed(2)} ชั่วโมง`;
            } else {
            output.innerText = "⚠️ เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น";
            }
        } else {
            output.innerText = ""; // ยังไม่กรอกครบ
        }
    }
   
    function calcDayLeave() {
        const start = document.getElementById("start-date").value;
        const end = document.getElementById("end-date").value;
        const output = document.getElementById("day-duration");
    
        if (start && end) {
            const startDate = new Date(start);
            const endDate = new Date(end);
        
            if (endDate >= startDate) {
                const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;
                output.innerText = `ลาทั้งหมด: ${diffDays} วัน`;
            } else {
                output.innerText = "⚠️ วันที่สิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น";
            }
        } else {
            output.innerText = ""; // Clear text if one of the dates is missing
        }
    }
    
    
    function previewLeave() {
        if (!validateLeaveForm()) return;
        
        const timeType = document.querySelector('input[name="time-type"]:checked').value;
        const leaveType = document.getElementById('leave-type').value;
        const remarks = document.getElementById('leave-remarks').value.trim();
        const summary = [];
        
        summary.push(`ประเภทการลา: ${mapLeaveType(leaveType)}`);
        summary.push(`ประเภทเวลา: ${timeType === "day" ? "เป็นวัน" : "เป็นชั่วโมง"}`);
        
        if (timeType === "day") {
            const startDate = document.getElementById("start-date").value;
            const endDate = document.getElementById("end-date").value;
        
            if (new Date(startDate) > new Date(endDate)) {
                alert("⚠️ วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด");
                return;
            }
        
            summary.push(`วันที่เริ่มต้น: ${startDate}`);
            summary.push(`วันที่สิ้นสุด: ${endDate}`);
            const diffDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
            summary.push(`จำนวน: ${diffDays} วัน`);
        
        } else {
            const date = document.getElementById("hour-date").value;
            const startTime = document.getElementById("start-time").value;
            const endTime = document.getElementById("end-time").value;
        
            if (!date || !startTime || !endTime) {
                alert("⚠️ กรุณากรอกวันและเวลาให้ครบถ้วน");
                return;
            }
    
            const start = new Date(`${date}T${startTime}`);
            const end = new Date(`${date}T${endTime}`);
        
            if (end <= start) {
            alert("⚠️ เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น");
            return;
            }
        
            const diffHours = (end - start) / (1000 * 60 * 60);
        
            summary.push(`วันที่: ${date}`);
            summary.push(`เวลา: ${startTime} - ${endTime}`);
            summary.push(`จำนวน: ${diffHours.toFixed(2)} ชั่วโมง`);
        }
        if (remarks) {
            summary.push(`รายละเอียดเพิ่มเติม: ${remarks}`);
        }
        document.getElementById("leave-form").style.display = "none"; // ซ่อนฟอร์ม
        document.getElementById("leave-summary").style.display = "block";
        document.getElementById("summary-content").innerHTML = summary.join("<br>");
    }
    
    
    // helper แปลงประเภทลา
    function mapLeaveType(value) {
        switch (value) {
            case "sick": return "ลาป่วย";
            case "personal": return "ลากิจ";
            case "vacation": return "ลาพักร้อน";
            case "other": return "อื่นๆ";
            default: return "ไม่ทราบ";
        }
    }
    
    function validateLeaveForm() {
        const leaveType = document.getElementById("leave-type").value;
        const timeType = document.querySelector('input[name="time-type"]:checked').value;
        
    
        if (timeType === "day") {
            const startDate = document.getElementById("start-date").value;
            const endDate = document.getElementById("end-date").value;
            if (!startDate || !endDate) {
                alert("⚠️ กรุณากรอกวันที่เริ่มต้นและสิ้นสุด");
                return false;
            }
        } else {
            const date = document.getElementById("hour-date").value;
            const startTime = document.getElementById("start-time").value;
            const endTime = document.getElementById("end-time").value;
            if (!date || !startTime || !endTime) {
                alert("⚠️ กรุณากรอกข้อมูลให้ครบถ้วน");
                return false;
            }
        }
        return true;
    }
    
    function cancelPreview() {
        document.getElementById("leave-form").style.display = "block"; // แสดงฟอร์มกลับมา
        document.getElementById("leave-summary").style.display = "none"; // ซ่อนสรุป
    }
    
    async function confirmSubmit() {
        const leaveType = document.getElementById('leave-type').value;
        const timeType = document.querySelector('input[name="time-type"]:checked').value;
        const remarks = document.getElementById('leave-remarks').value;
      
        let startDate = null;
        let endDate = null;
        let startTime = null;
        let endTime = null;
      
        // Handle day-based or hour-based leave
        if (timeType === 'day') {
            startDate = document.getElementById('start-date').value;
            endDate = document.getElementById('end-date').value;
        } else {
            startDate = document.getElementById('hour-date').value;
            startTime = document.getElementById('start-time').value;
            endTime = document.getElementById('end-time').value;
        }
      
        // Simulate employee_id for demo
        const employeeId = 1;
      
        // Insert leave request into Supabase
        const { error } = await supabase.from('leave_days').insert({
            employee_id: employeeId,
            leave_type: leaveType,
            time_type: timeType,
            start_date: startDate || null,
            end_date: endDate || null,
            start_time: startTime || null,
            end_time: endTime || null,
            leave_remarks: remarks,
            status: 'pending', // Default status
        });
      
        if (error) {
            alert('เกิดข้อผิดพลาดในการส่งคำขอ: ' + error.message);
        } else {
            alert('✅ ส่งคำขอเรียบร้อยแล้ว!');
            window.location.reload(); // Reload the page to reflect changes
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
                <div id="leave-form" className="section">
                    <h2>📄 เพิ่มบันทึกการลา</h2>

                    <label>ระบุประเภทรายการ</label><br />
                    <select id="leave-type">
                        <option value="sick">ลาป่วย</option>
                        <option value="personal">ลากิจ</option>
                        <option value="vacation">ลาพักร้อน</option>
                        <option value="other">อื่นๆ</option>
                    </select>
                    <br />

                    <label>ระบุประเภทของเวลา</label><br />
                    <input
                        type="radio"
                        name="time-type"
                        value="day"
                        defaultChecked
                        onChange={toggleTimeInputs}
                    /> เป็นวัน
                    <input
                        type="radio"
                        name="time-type"
                        value="hour"
                        onChange={toggleTimeInputs}
                    /> เป็นชั่วโมง
                    <br/>

                    <div id="hour-inputs" style={{ display: "none" }}>
                        <label>ระบุรายละเอียดของรายการ</label><br />
                        <label>📅 วันที่</label><br />
                        <input type="date" id="hour-date" /><br />
                        ⏰ เวลาเริ่ม <input type="time" id="start-time" /><br />
                        ⏰ เวลาสิ้นสุด <input type="time" id="end-time" /><br />
                    </div>

                    <div id="day-inputs">
                        <label>ระบุรายละเอียดของรายการ</label><br />
                        <label>📅 วันที่เริ่มต้น</label><br />
                        <input type="date" id="start-date" /><br />
                        <label>📅 วันที่สิ้นสุด</label><br />
                        <input type="date" id="end-date" /><br /><br />
                    </div>

                    <label>📝 รายละเอียดเพิ่มเติม</label><br />
                    <textarea
                        id="leave-remarks"
                        placeholder="เช่น เหตุผลในการลา..."
                        rows="4"
                    ></textarea>
                    <br />

                    <p id="hour-duration" style={{ color: "green" }}></p>
                    <p id="day-duration" style={{ color: "green" }}></p>

                    <button onClick={previewLeave}>ส่งคำขอ</button>
                    
                    <div id="leave-summary" style={{ display: "none", border: "1px solid gray", padding: "20px", marginTop: "20px" }}>
                        <h3>📋 สรุปการลา</h3>
                        <div id="summary-content"></div>
                        <br />
                        <button onClick={confirmSubmit}>ยืนยันส่งคำขอ</button>
                        <button onClick={cancelPreview}>แก้ไข</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LeavePage;
