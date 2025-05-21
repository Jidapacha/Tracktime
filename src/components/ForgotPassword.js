// ForgotPassword.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import '../cssfile/forgetpass.css'

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://tracktime.vercel.app/update-password',
    });

    if (error) {
      setMessage('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      setMessage('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว');
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card" style={{ minWidth: '300px' }}>
        <h4>ลืมรหัสผ่าน</h4>
        <input
          type="email"
          className="form-control my-2"
          placeholder="กรอกอีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="forgot-btn" onClick={handleReset}>
          ส่งลิงก์รีเซ็ตรหัสผ่าน
        </button>
        <p className="text-muted mt-2">{message}</p>
      </div>
    </div>
  );
}

export default ForgotPassword;
