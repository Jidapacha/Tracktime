import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import '../cssfile/forgetpass.css';

function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const handleRecovery = async () => {
            const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
            if (error) {
            console.error('Error restoring session:', error.message);
            }
        };

        handleRecovery();

        const fetchUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (user) {
            setUserEmail(user.email);
            }
        };
        fetchUser();
        }, []);
        

    const handleUpdate = async () => {
        setMessage('');
        setError('');

        if (!password || !confirmPassword) {
            setError('กรุณากรอกรหัสผ่านทั้ง 2 ช่อง');
        return;
        }

        if (password !== confirmPassword) {
            setError('❌ รหัสผ่านไม่ตรงกัน');
        return;
        }

        const { error: updateError } = await supabase.auth.updateUser({ password });

        if (updateError) {
            setError('เปลี่ยนรหัสผ่านไม่สำเร็จ: ' + updateError.message);
            return;
        }

        const { error: dbError } = await supabase
            .from('employees')
            .update({ password }) 
            .eq('email', userEmail);

        if (dbError) {
            setMessage('Auth สำเร็จ แต่บันทึกในฐานข้อมูลล้มเหลว ❗');
        } else {
            setMessage('✅ เปลี่ยนรหัสผ่านสำเร็จ');
        }
    };

    return (
        <div className="forgot-container">
            <div className="forgot-card">
                <h4>ตั้งรหัสผ่านใหม่</h4>

                <input
                    type="password"
                    className="form-control my-2"
                    placeholder="รหัสผ่านใหม่"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <input
                    type="password"
                    className="form-control my-2"
                    placeholder="ยืนยันรหัสผ่านใหม่"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button className="forgot-btn" onClick={handleUpdate}>
                เปลี่ยนรหัสผ่าน
                </button>

                {message && <p className="forgot-message text-success">{message}</p>}
                {error && <p className="forgot-message text-danger">{error}</p>}

                <Link to="/" className="back-link">
                กลับไปหน้าเข้าสู่ระบบ
                </Link>
            </div>
        </div>
    );
}

export default UpdatePassword;
