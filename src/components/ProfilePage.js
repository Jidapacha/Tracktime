import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import NavbarPage from './NavbarPage';

function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [passwordChanged, setPasswordChanged] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [oldPassword, setOldPassword] = useState('');


    useEffect(() => {
        const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('email', user.email)
            .single();

        if (error) {
            setErrorMsg('ไม่สามารถโหลดข้อมูลพนักงานได้');
        } else {
            setProfile(data);
        }
        setLoading(false);
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSuccessMsg('');
        setErrorMsg('');

        const { error } = await supabase
        .from('employees')
        .update({
            name: profile.name,
            username: profile.username,
            tel: profile.tel,
            role: profile.role,
            bank: profile.bank,
            bank_number: profile.bank_number
        })
        .eq('email', profile.email);

        if (error) {
        setErrorMsg('เกิดข้อผิดพลาดในการบันทึก');
        } else {
        setSuccessMsg('บันทึกข้อมูลเรียบร้อยแล้ว');
        }
    };

    


    const handlePasswordChange = async () => {
        setPasswordChanged(false);
        setPasswordError('');

        if (newPassword.length < 6) {
            setPasswordError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();

        // ✅ 1. ยืนยันรหัสผ่านเดิม
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: oldPassword
        });

        if (authError) {
            setPasswordError('รหัสผ่านเดิมไม่ถูกต้อง');
            return;
        }

        // ✅ 2. อัปเดตใน Auth
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            setPasswordError('เปลี่ยนรหัสผ่านไม่สำเร็จ: ' + updateError.message);
            return;
        }

        // ✅ 3. อัปเดตลงในตาราง employees
        const { error: dbError } = await supabase
            .from('employees')
            .update({ password: newPassword })
            .eq('email', user.email)
            .select(); 


        if (dbError) {
            console.error('DB Update Error:', dbError);
            setPasswordError('บันทึกรหัสผ่านใหม่ใน employees ล้มเหลว: ' + dbError.message);
            
        } else {
            setPasswordChanged(true);
            setNewPassword('');
            setOldPassword('');
        }
        console.log('Updating employee password:', {
            email: user.email,
            newPassword: newPassword
        });

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
                <div id="profile" className="section">
                    <h2>👤 ข้อมูลพนักงาน</h2>

                    {loading ? (
                        <p>กำลังโหลดข้อมูล...</p>
                        ) : profile ? (
                        <div className="row">
                            {/* คอลัมน์ซ้าย: รูปโปรไฟล์ */}
                            <div className="col-md-4 text-center">
                                <img
                                src="https://img.icons8.com/pulsar-gradient/96/user-male-circle.png" // หรือ path รูปจริง
                                alt="profile"
                                className="img-fluid rounded-circle mb-3"
                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                />
                                <p className="fw-bold">{profile.name}</p>
                                <p className="text-muted">{profile.role}</p>

                            </div>

                            {/* คอลัมน์ขวา: รายละเอียด + แก้ไข + เปลี่ยนรหัสผ่าน */}
                            <div className="col-md-8">
                                {!isEditing ? (
                                <>
                                    <p><strong>ชื่อผู้ใช้:</strong> {profile.username}</p>
                                    <p><strong>อีเมล:</strong> {profile.email}</p>
                                    <p><strong>เบอร์โทร:</strong> {profile.tel}</p>
                                    <p><strong>ธนาคาร:</strong> {profile.bank}</p>
                                    <p><strong>เลขบัญชี:</strong> {profile.bank_number}</p>

                                    <button className="btn btn-secondary  me-2" onClick={() => setIsEditing(true)}>
                                    ✏️ แก้ไขข้อมูล
                                    </button>
                                </>
                                ) : (
                                <>
                                    <label>ชื่อ-นามสกุล</label>
                                    <input type="text" className="form-control mb-2" name="name" value={profile.name} onChange={handleChange}/>

                                    <label>ชื่อผู้ใช้</label>
                                    <input type="text" className="form-control mb-2" name="username" value={profile.username} onChange={handleChange} />

                                    <label>ตำแหน่ง</label>
                                    <input type="text" className="form-control mb-2" name="role" value={profile.role} onChange={handleChange} />

                                    <label>เบอร์โทร</label>
                                    <input type="text" className="form-control mb-2" name="tel" value={profile.tel} onChange={handleChange} />

                                    <label>ธนาคาร</label>
                                    <input type="text" className="form-control mb-2" name="bank" value={profile.bank} onChange={handleChange} />

                                    <label>เลขบัญชี</label>
                                    <input type="text" className="form-control mb-3" name="bank_number" value={profile.bank_number} onChange={handleChange} />

                                    <button className="btn btn-primary me-2" onClick={handleSave}>💾 บันทึก</button>
                                    <button className="btn btn-outline-secondary me-2" onClick={() => setIsEditing(false)}>❌ ยกเลิก</button>

                                    {successMsg && <div className="alert alert-success mt-3">{successMsg}</div>}
                                </>
                                )}


                                {!showPasswordForm ? (
                                <button className="btn btn-outline-warning me-2" onClick={() => setShowPasswordForm(true)}>
                                    🔒 เปลี่ยนรหัสผ่าน
                                </button>
                                ) : (
                                <>
                                    <h5>🔐 เปลี่ยนรหัสผ่าน</h5>
                                    <label>รหัสผ่านเดิม</label>
                                    <input type="password" className="form-control mb-2" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />

                                    <label>รหัสผ่านใหม่</label>
                                    <input type="password" className="form-control mb-2" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

                                    <button className="btn btn-warning me-2" onClick={handlePasswordChange}>บันทึกรหัสผ่านใหม่</button>
                                    <button className="btn btn-outline-secondary" onClick={() => setShowPasswordForm(false)}>❌ ยกเลิก</button>

                                    {passwordChanged && <div className="alert alert-success mt-2">เปลี่ยนรหัสผ่านเรียบร้อยแล้ว</div>}
                                    {passwordError && <div className="alert alert-danger mt-2">{passwordError}</div>}
                                </>
                                )}
                            </div>

                        </div>
                        ) : (
                        <div className="alert alert-danger">ไม่พบข้อมูลผู้ใช้</div>
                        )}

                    </div>
            </div>
        </div>
    );
}

export default ProfilePage;
