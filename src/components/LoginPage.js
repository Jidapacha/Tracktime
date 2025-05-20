// src/components/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../cssfile/LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setErrorMsg("❌ เข้าสู่ระบบล้มเหลว: " + loginError.message);
      return;
    }

    const userEmail = authData.user.email;

    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (fetchError) {
      console.error("❌ ดึงข้อมูลพนักงานล้มเหลว:", fetchError.message);
      return;
    }

    navigate('/home');
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="text-center mb-4">เข้าสู่ระบบ</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="อีเมล"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-custom">เข้าสู่ระบบ</button>
        </form>
        {errorMsg && <p className="error-message mt-3">{errorMsg}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
