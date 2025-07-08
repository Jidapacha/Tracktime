import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import NavbarPage from './NavbarPage';
import { supabase } from '../supabaseClient';


const EditTimePage = () => {
    
    const [reason, setReason] = useState("");
    const [timeType, setTimeType] = useState("checkin"); // "checkin" หรือ "checkout"
    const [datetime, setDatetime] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [company, setCompany] = useState("LL");


    const convertLocalTimeToUTC = (localDateTimeStr) => {
    const local = new Date(localDateTimeStr);
    const tzDate = new Date(local.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const offset = tzDate.getTime() - local.getTime();
    const utcDate = new Date(local.getTime() - offset);
    return utcDate.toISOString(); 
    };

    const handleSubmit = async (e) => {
  e.preventDefault();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user.email;

  const { data: emp, error: empErr } = await supabase
    .from("employees")
    .select("employee_id")
    .eq("email", email)
    .single();

  if (empErr) {
    console.error("ไม่พบ employee", empErr);
    return;
  }

  const employee_id = emp.employee_id;

  const utcDatetime = convertLocalTimeToUTC(datetime);

  // 🟢 แปลงคำก่อน insert
  const checkType = timeType === "checkin" ? "check-in" : "check-out";

  const { error } = await supabase.from("time_correction_requests").insert([
    {
      employee_id,
      type: checkType, 
      time: utcDatetime,
      reason: reason,
      status: "pending",
      company: company,
    },
  ]);

  if (error) {
    console.error("Insert error:", error);
  } else {
    setSuccessMsg("✅ ส่งคำขอเรียบร้อย รอการอนุมัติ");
    setReason(""); setDatetime(""); setTimeType("checkin");
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
        <NavbarPage showSection={showSection}/>  
        <div className="main-content">
          <div id="edittime" className="section">
            <h1 className="fw-bold"><i className="fa-solid fa-clock"></i> แก้ไขเวลางาน</h1><hr />
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label>ประเภทเวลา:</label>
                    <select value={timeType} onChange={(e) => setTimeType(e.target.value)} className="form-control">
                        <option value="checkin">เข้างาน</option>
                        <option value="checkout">ออกงาน</option>
                    </select>

                </div>

                <div className="mb-3">
                    <label>บริษัท:</label>
                    <select value={company} onChange={(e) => setCompany(e.target.value)} className="form-control">
                        <option value="LL">LL</option>
                        <option value="Meta">Meta</option>
                        <option value="Med">Med</option>
                        <option value="W2D">W2D</option>
                        <option value="EDTech">EDTech</option>
                    </select>
                </div>


                <div className="mb-3">
                    <label>เวลาที่ต้องการลง:</label>
                    <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} className="form-control" required />
                </div>

                <div className="mb-3">
                    <label>เหตุผล:</label>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="form-control" required />
                </div>

                <button type="submit" className="btn btn-primary">ส่งคำขอ</button>
            </form>

            {successMsg && <div className="alert alert-success mt-3">{successMsg}</div>}

            
          </div>
        </div>
      </div>
    );
};

export default EditTimePage;
