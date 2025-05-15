import React, { useEffect, useRef, useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import * as bootstrap from 'bootstrap';
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from '../supabaseClient';
import NavbarPage from './NavbarPage';
import '../cssfile/check.css'

function CheckOutPage() {
    const [hasScanned, setHasScanned] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState('LL');
    const qrScannerRef = useRef(null);

    useEffect(() => {
        if (!qrScannerRef.current) {
            qrScannerRef.current = new Html5Qrcode("qr-reader-checkout");
        }
    }, []);

    function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    async function startScanCheckout() {
        if (!qrScannerRef.current) return;

        setHasScanned(false);

        try {
            await qrScannerRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                async (decodedText, decodedResult) => {
                    if (hasScanned) return;

                    const todayCode = `qr-code-check-out-${new Date().toISOString().split('T')[0]}`;
                    console.log("QR สแกนได้:", decodedText);

                    if (decodedText === todayCode) {
                        setHasScanned(true);
                        await qrScannerRef.current.stop();
                        document.getElementById("qr-result-checkout").textContent = "✅ เช็คชื่อออกเรียบร้อย";
                        await saveCheckout();
                    } else {
                        document.getElementById("qr-result-checkout").textContent = "❌ QR ไม่ถูกต้อง";
                    }
                },
                (errorMessage) => {
                    console.warn("สแกนไม่ได้:", errorMessage);
                }
            );
        } catch (err) {
            console.error("เกิดข้อผิดพลาดในการสแกน:", err);
            await qrScannerRef.current.stop();
        }
    }

    async function saveCheckout() {
        const timestamp = new Date().toISOString();
        const { data: userData } = await supabase.auth.getUser();
        const email = userData?.user?.email;

        const { data: empData, error: empErr } = await supabase
            .from("employees")
            .select("employee_id")
            .eq("email", email)
            .single();

        if (empErr || !empData) {
            document.getElementById("qr-result-checkout").innerHTML = "❌ ไม่พบรหัสพนักงาน";
            return;
        }

        const employeeId = empData.employee_id;
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: checkLog, error: checkErr } = await supabase
            .from("attendance_log")
            .select("*")
            .eq("employee_id", employeeId)
            .eq("check_type", "check-out")
            .eq("company", selectedCompany)
            .gte("timestamp", startOfDay.toISOString())
            .lte("timestamp", endOfDay.toISOString());

        if (checkLog && checkLog.length > 0) {
            document.getElementById("qr-result-checkout").textContent = "✅ เช็คเอาท์ไปแล้ววันนี้ (บริษัทนี้)";
            return;
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                const officeLat = 13.791099492729726;
                const officeLon = 100.49673497164436;
                const distance = getDistanceFromLatLonInMeters(latitude, longitude, officeLat, officeLon);
                const locationLabel = distance <= 500
                    ? "office"
                    : `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

                const { error } = await supabase.from("attendance_log").insert([
                    {
                        check_type: "check-out",
                        timestamp: new Date().toISOString(),
                        employee_id: employeeId,
                        location: locationLabel,
                        latitude: latitude.toString(),
                        longitude: longitude.toString(),
                        company: selectedCompany
                    }
                ]);

                if (error) {
                    document.getElementById("qr-result-checkout").textContent = "❌ บันทึกไม่สำเร็จ";
                } else {
                    document.getElementById("qr-result-checkout").textContent = "✅ เช็คเอาท์สำเร็จ!";
                }
            }, () => {
                document.getElementById("qr-result-checkout").textContent = "❌ ไม่สามารถดึงตำแหน่งได้";
            });
        } else {
            document.getElementById("qr-result-checkout").textContent = "❌ เบราว์เซอร์ไม่รองรับการดึงตำแหน่ง";
        }
    }

    async function stopScan() {
        if (qrScannerRef.current) {
            try {
                await qrScannerRef.current.stop();
                document.getElementById("qr-result-checkout").textContent = "❌ การสแกนถูกหยุด";
            } catch (err) {
                console.error("เกิดข้อผิดพลาดในการหยุดการสแกน:", err);
            }
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
                <div id="checkout" className="section">
                    <h2>🔴 เช็คชื่อออก</h2>
                    <p>กรุณาสแกน QR Code ที่ได้รับจากแอดมินเพื่อเช็คชื่อออก</p>

                    <div className="mb-3">
                        <label htmlFor="companySelect" className="form-label">เลือกบริษัทที่เข้าทำงานวันนี้</label>
                        <select
                            id="companySelect"
                            className="form-select"
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                        >
                            <option value="LL">LL</option>
                            <option value="Meta">Meta</option>
                            <option value="Med">Med</option>
                            <option value="IRE">IRE</option>
                            <option value="EDTech">EDTech</option>
                        </select>
                    </div>

                    <div className="d-flex justify-content-center gap-2 flex-wrap">
                        <button className="btn btn-success mt-3" onClick={startScanCheckout}>เริ่มแสกน</button>
                        <button className="btn btn-danger mt-3" onClick={stopScan}>หยุดแสกน</button>
                    </div>
                    <div id="qr-reader-checkout" style={{ width: '250px', height: '250px' }}></div>
                    <div id="qr-result-checkout" className="mt-3 text-center"></div>
                </div>
            </div>
        </div>
    );
}

export default CheckOutPage;
