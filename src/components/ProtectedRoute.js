import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ProtectedRoute = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      const user = data?.user;

      if (error || !user) {
        console.error("Error fetching user:", error?.message || "No user found");
        setLoading(false);
        return;
      }

      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('employee_id, name, username, email')  
        .eq('email', user.email);

      if (employeeError) {
        console.error("Error fetching user data from 'employees' table:", employeeError.message);
      } else {
        setUserData(employeeData[0]);
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!userData) return <div>ไม่พบข้อมูลผู้ใช้ในฐานข้อมูล</div>;

  return (
    <div>
      <h1>ยินดีต้อนรับ, {userData.name}</h1>
      <p>อีเมล: {userData.email}</p>
      <p>ชื่อผู้ใช้: {userData.username}</p>
    </div>
  );
};

export default ProtectedRoute;
