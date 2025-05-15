import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import * as bootstrap from 'bootstrap';
import { supabase, supabaseAdmin } from '../supabaseClient';
import NavbarPage from './NavbarPage';
import '../cssfile/admin.css'

function AdminPage() {

    const [employees, setEmployees] = useState([]);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [logError, setLogError] = useState(null);
    const [showCheckInQR, setShowCheckInQR] = useState(false);
    const [showCheckOutQR, setShowCheckOutQR] = useState(false);
    const [checkInQRUrl, setCheckInQRUrl] = useState('');
    const [checkOutQRUrl, setCheckOutQRUrl] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showOtherBank, setShowOtherBank] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [showAllEmployees, setShowAllEmployees] = useState(true);

    const toggleAddForm = () => {
        setShowAddForm(prev => {
          const next = !prev;
          if (next) {
            setSearchQuery('');
            setEditingEmployee(null);
            setShowSearch(false);  // ปิดโหมดค้นหา
          }
          return next;
        });
      };
      
      const toggleSearchForm = () => {
        setShowSearch(prev => {
          const next = !prev;
          if (next) {
            setShowAddForm(false);
          } else {
            setSearchQuery('');
            setEditingEmployee(null);
          }
          return next;
        });
      };
      

    const handleBankChange = (e) => {
        setShowOtherBank(e.target.value === 'อื่นๆ');
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
      
        const name = document.getElementById('name').value;
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const tel = document.getElementById('tel').value;
        const role = document.getElementById('role').value;
        const bank = document.getElementById('bank').value === "อื่นๆ"
            ? document.getElementById('other-bank').value
            : document.getElementById('bank').value;
        const bank_number = document.getElementById('bank_number').value;
      
        const password = Math.random().toString(36).slice(-8);
      
        // 1. เพิ่มข้อมูลใน employees table
        const { data, error } = await supabase.from('employees').insert([
            {
                name,
                username,
                email,
                tel,
                role,
                bank,
                bank_number,
                password,          
                special_role: null,  
            }
        ]);
      
        if (error) {
            alert("เกิดข้อผิดพลาด: " + error.message);
            console.error(error);
            return;
        }
      
        // 2. สร้าง user ใน Supabase Auth ด้วย email เดียวกัน
        const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true
        });
      
        if (authError) {
            alert("เพิ่มพนักงานสำเร็จ แต่สร้างผู้ใช้ใน Auth ไม่ได้: " + authError.message);
            console.error(authError);
        } else {
            alert("เพิ่มพนักงานสำเร็จและสร้างบัญชีผู้ใช้เรียบร้อยแล้ว 🎉");
            e.target.reset();
        }
    };

    

    useEffect(() => {
        async function fetchData() {
            const { data, error } = await supabase.from('employees').select('*');
            if (error) {
                setLogError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
            } else {
                setEmployees(data);
            }
        }
        fetchData();
    }, []);

    const filteredEmployees = employees.filter(emp => {
      const searchQueryLower = searchQuery.toLowerCase();
      return (
        (emp.name && emp.name.toLowerCase().includes(searchQueryLower)) ||
        (emp.username && emp.username.toLowerCase().includes(searchQueryLower))
      );
    });

    
    const displayedEmployees = editingEmployee
    ? filteredEmployees.filter(emp => emp.employee_id === editingEmployee.employee_id)
    : searchQuery
      ? filteredEmployees
      : showAllEmployees
        ? filteredEmployees
        : filteredEmployees.slice(0, 5);



      
    const handleEditClick = (emp) => {
      setEditingEmployee(emp);
      setShowAllEmployees(false);
      setEditFormData({
        name: emp.name || '',
        username: emp.username || '',
        email: emp.email || '',
        tel: emp.tel || '',
        role: emp.role || '',
        bank: emp.bank || '',
        bank_number: emp.bank_number || '',
      });
    };
      
  

      useEffect(() => {
        if (editingEmployee) {
          setEditFormData({ ...editingEmployee });  // Clone object ไม่ใช่ reference เดิม
        }
      }, [editingEmployee]);
      
      const fetchEmployees = async () => {
        const { data, error } = await supabase.from('employees').select('*');
        if (error) {
          setLogError('โหลดข้อมูลล้มเหลว');
        } else {
          setEmployees(data);
        }
      };
      
      const handleEditEmployee = async (e) => {
        e.preventDefault();
      
        const updated = {};
      
        // ✅ เปรียบเทียบข้อมูลที่เปลี่ยนจริง ๆ เท่านั้น
        Object.entries(editFormData).forEach(([key, value]) => {
          if (value !== undefined && value !== editingEmployee[key]) {
            updated[key] = value;
          }
        });
      
        console.log('เปรียบเทียบข้อมูล:', editFormData, editingEmployee);
        console.log('ข้อมูลที่เปลี่ยน:', updated);
      
        if (Object.keys(updated).length > 0) {
          const { error } = await supabase
            .from('employees')
            .update(updated)
            .eq('employee_id', editingEmployee.employee_id);
      
          if (error) {
            alert('อัปเดตไม่สำเร็จ: ' + error.message);
          } else {
            alert('✅ อัปเดตสำเร็จแล้ว');
            setEditingEmployee(null);
            setEditFormData({});
            await fetchEmployees(); // ✅ รอให้โหลดใหม่ก่อน
          }
        } else {
          alert('ไม่มีข้อมูลที่เปลี่ยน');
        }
      };
      
      
    
    function toggleQRCode(type) {
        const today = new Date().toISOString().split("T")[0];
        const codeData = `qr-code-${type}-${today}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${codeData}`;
      
        if (type === "check-in") {
          if (showCheckInQR) {
            setShowCheckInQR(false);  // ปิด QR เดิม
          } else {
            setCheckInQRUrl(qrUrl);
            setShowCheckInQR(true);
            setShowCheckOutQR(false); // ✅ ปิดอีกฝั่งอัตโนมัติ
          }
        } else if (type === "check-out") {
          if (showCheckOutQR) {
            setShowCheckOutQR(false);
          } else {
            setCheckOutQRUrl(qrUrl);
            setShowCheckOutQR(true);
            setShowCheckInQR(false); // ✅ ปิดอีกฝั่งอัตโนมัติ
          }
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
                    <div id="admin" className="section">
                        <h2>🛠️ การจัดการพนักงาน</h2><hr />
                        <div className="mb-4">
                            <h4>👥 จัดการพนักงาน</h4>
                            <button className="btn btn-outline-primary me-2 mb-2" onClick={toggleAddForm}>➕ เพิ่มพนักงาน</button>
                            <button className="btn btn-outline-warning me-2 mb-2" onClick={toggleSearchForm}>✏️ แก้ไขข้อมูล</button>
                            
                            {showAddForm && (
                                <form id="add-employee-form" className="row g-2 mb-3" onSubmit={handleAddEmployee}>
                                    <div className="col-md-4">
                                        <input type="text" className="form-control" id="name" placeholder="ชื่อจริง" required />
                                    </div>
                                    <div className="col-md-4">
                                        <input type="text" className="form-control" id="username" placeholder="ชื่อเล่น" required />
                                    </div>
                                    <div className="col-md-4">
                                        <input type="email" className="form-control" id="email" placeholder="อีเมล" required />
                                    </div>
                                    <div className="col-md-4">
                                        <input type="text" className="form-control" id="tel" placeholder="เบอร์โทร" required />
                                    </div>
                                    <div className="col-md-4">
                                        <select id="role" className="form-select" required defaultValue="">
                                            <option value="" disabled>เลือกตำแหน่ง</option>
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Internship">Internship</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <select id="bank" className="form-select" required onChange={handleBankChange} defaultValue="">
                                            <option value="" disabled>เลือกธนาคาร</option>
                                            <option value="กรุงเทพ">กรุงเทพ</option>
                                            <option value="ไทยพาณิชย์">ไทยพาณิชย์</option>
                                            <option value="กสิกรไทย">กสิกรไทย</option>
                                            <option value="กรุงไทย">กรุงไทย</option>
                                            <option value="กรุงศรี">กรุงศรี</option>
                                            <option value="ออมสิน">ออมสิน</option>
                                            <option value="พร้อมเพย์">พร้อมเพย์</option>
                                            <option value="อื่นๆ">อื่นๆ</option>
                                        </select>
                                    </div>
                                    {showOtherBank && (
                                        <div className="col-md-4" id="other-bank-container">
                                            <input type="text" className="form-control" id="other-bank" placeholder="กรุณากรอกชื่อธนาคาร" required />
                                        </div>
                                    )}
                                    <div className="col-md-4">
                                        <input type="text" className="form-control" id="bank_number" placeholder="เลขบัญชี" required />
                                    </div>
                                    <div className="col-md-4">
                                        <button type="submit" className="btn btn-success">✅ บันทึก</button>
                                    </div>
                                </form>
                            )}
                        
                        
                            {showSearch && (
                                <div className="mb-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="ค้นหาพนักงานตามชื่อหรือชื่อผู้ใช้"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            )}
                            {logError && <p className="text-danger">{logError}</p>}

                            {searchQuery && filteredEmployees.length > 0 && (
                                <ul className="list-group mb-3">
                                  {displayedEmployees.map(emp => (
                                    <li key={emp.employee_id} className="list-group-item d-flex justify-content-between align-items-center">
                                      <span>👤 {emp.username} : {emp.name}</span>
                                      <div>
                                        <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditClick(emp)}>✏️ แก้ไข</button>
                                        <button className="btn btn-sm btn-danger" onClick={() => setEmployeeToDelete(emp)}>🗑️ ลบ</button>
                                      </div>
                                    </li>
                                  ))}
                                </ul>

                            )}
                            {!showAllEmployees && (
                              <button className="btn btn-secondary" onClick={() => {
                                setShowAllEmployees(true);
                                setEditingEmployee(null);
                              }}>🔙 กลับไปดูรายชื่อทั้งหมด</button>
                            )}

                            {editingEmployee && (
                              <form className="row g-2 mt-3" onSubmit={handleEditEmployee}>
                                <div className="col-md-4">
                                  <input type="text" className="form-control" placeholder="ชื่อจริง" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                  <input type="text" className="form-control" placeholder="ชื่อเล่น" value={editFormData.username} onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                  <input type="email" className="form-control" placeholder="อีเมล" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                  <input type="text" className="form-control" placeholder="เบอร์โทร" value={editFormData.tel} onChange={(e) => setEditFormData({ ...editFormData, tel: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                  <select className="form-select" value={editFormData.role} onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}>
                                    <option value="">เลือกตำแหน่ง</option>
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="Internship">Internship</option>
                                  </select>
                                </div>
                                <div className="col-md-4">
                                  <input type="text" className="form-control" placeholder="ธนาคาร" value={editFormData.bank} onChange={(e) => setEditFormData({ ...editFormData, bank: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                  <input type="text" className="form-control" placeholder="เลขบัญชี" value={editFormData.bank_number} onChange={(e) => setEditFormData({ ...editFormData, bank_number: e.target.value })} />
                                </div>
                                <div className="col-12 text-center mt-3">
                                  <button type="submit" className="btn btn-primary me-2">💾 บันทึกการแก้ไข</button>
                                  <button type="button" className="btn btn-secondary" onClick={() => {
                                    setEditingEmployee(null);
                                    setShowAllEmployees(true);
                                  }}>❌ ยกเลิก</button>
                                </div>

                              </form>
                            )}

                            
                            
                            {employeeToDelete && (
                                <div
                                    className="modal show fade d-block"
                                    tabIndex="-1"
                                    role="dialog"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                                >
                                    <div className="modal-dialog modal-dialog-centered" role="document">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                        <h5 className="modal-title">🗑️ ยืนยันการลบพนักงาน</h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            aria-label="Close"
                                            onClick={() => setEmployeeToDelete(null)}
                                        ></button>
                                        </div>
                                        <div className="modal-body">
                                        <p>คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานต่อไปนี้?</p>
                                        <ul className="list-unstyled ps-3">
                                            <li><strong>ชื่อจริง:</strong> {employeeToDelete.name}</li>
                                            <li><strong>ชื่อเล่น:</strong> {employeeToDelete.username}</li>
                                            <li><strong>อีเมล:</strong> {employeeToDelete.email}</li>
                                            <li><strong>ตำแหน่ง:</strong> {employeeToDelete.role}</li>
                                        </ul>
                                        </div>
                                        <div className="modal-footer">
                                        <button
                                            className="btn btn-danger"
                                            onClick={async () => {
                                            const { error } = await supabase
                                                .from('employees')
                                                .delete()
                                                .eq('employee_id', employeeToDelete.employee_id);
                                            if (error) {
                                                alert('ลบไม่สำเร็จ: ' + error.message);
                                            } else {
                                                alert('✅ ลบพนักงานสำเร็จแล้ว');
                                                setEmployeeToDelete(null);
                                                fetchEmployees(); // รีโหลดข้อมูล
                                            }
                                            }}
                                        >
                                            ✅ ยืนยันการลบ
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => setEmployeeToDelete(null)}
                                        >
                                            ❌ ยกเลิก
                                        </button>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                                )}

                        </div>

                        <div className="mb-4">
                            <h4>📦 QR Code สำหรับวันนี้</h4>
                            <button className="btn btn-outline-success me-2 mb-2" onClick={() => toggleQRCode("check-in")}>
                                🔄 สร้าง QR สำหรับเข้างาน
                            </button>
                            <button className="btn btn-outline-danger mb-2" onClick={() => toggleQRCode("check-out")}>
                                🔄 สร้าง QR สำหรับออกงาน
                            </button>

                            {showCheckInQR && (
                            <div className="mt-3">
                                <h5>QR Code สำหรับการเข้างาน:</h5>
                                <img src={checkInQRUrl} alt="Check-in QR" />
                            </div>
                            )}

                            {showCheckOutQR && (
                            <div className="mt-3">
                                <h5>QR Code สำหรับการเลิกงาน:</h5>
                                <img src={checkOutQRUrl} alt="Check-out QR" />
                            </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        
    )
}


export default AdminPage;