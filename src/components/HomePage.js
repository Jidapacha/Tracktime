import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../cssfile/HomePage.css';
import NavbarPage from './NavbarPage';
import { supabase } from '../supabaseClient';


const HomePage = () => {
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);

    useEffect(() => {
      const fetchUser = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          navigate('/'); 
          return;
        }

      const { data, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .eq('email', user.email)
        .single();

      if (fetchError) {
        console.error('Error fetching employee data:', fetchError.message);
        return;
      }

      setEmployee(data);
    };

    fetchUser();
    }, [navigate]);


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
          <div id="home" className="section active">
            <h2>🏠 หน้าหลัก</h2>
            <div id="employee">
              {employee ? (
                <div>
                  <h2>รายละเอียดพนักงาน</h2>
                  <p>ชื่อ: {employee.name}</p>
                  <p>ชื่อเล่น: {employee.username}</p>
                  <p>ตำแหน่ง: {employee.role}</p>
                  <p>อีเมล: {employee.email}</p>
                </div>
              ) : (
              <h2>กำลังโหลดข้อมูลพนักงาน...</h2>
              )}
              </div>
              <div id="datetime" className="mb-3 text-muted"></div>
              <div className="checkin-checkout-wrapper">
                <button className="btn btn-success" onClick={() => navigate('/checkin')}>🟢 บันทึกเข้า</button>
                <button className="btn btn-danger" onClick={() => navigate('/checkout')}>🔴 บันทึกออก</button>
              </div>

              <div className="mb-4">
                <h5>🔗 หัวข้อเพิ่ม</h5>
                <div className="d-grid gap-2">
                  <button className="btn btn-outline-primary" onClick={() => navigate('/calendar-page')}>📅 ปฏิทินกิจกรรม</button>
                  <button className="btn btn-outline-warning" onClick={() => navigate('/notifications')}>🔔 แจ้งเตือน</button>
                  <button className="btn btn-outline-info" onClick={() => navigate('/payroll')}>💸 สลิปเงินเดือน</button>
                </div>
              
            </div>
          </div>
        </div>
      </div>
    );
};

export default HomePage;
