import React, { useEffect, useRef, useState } from 'react'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from '../supabaseClient';
import NavbarPage from './NavbarPage';
import '../cssfile/check.css'

function CheckInPage() {
    const [hasScanned, setHasScanned] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState('LL');
    const qrScannerRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isSavingOnline, setIsSavingOnline] = useState(false);

    useEffect(() => {
        if (!qrScannerRef.current) {
            qrScannerRef.current = new Html5Qrcode("qr-reader");
        }
    }, []);


    async function startScan() {
        if (!qrScannerRef.current || isScanning) return;
        setIsScanning(true);
        setHasScanned(false);

        try {
            await qrScannerRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                async (decodedText) => {
                    if (hasScanned) return;

                    const todayCode = `qr-code-check-in-${new Date().toISOString().split('T')[0]}`;
                    if (decodedText === todayCode) {
                        setHasScanned(true);
                        await qrScannerRef.current.stop();
                        setIsScanning(false);
                        await saveCheckin();
                    } else {
                        alert("❌ QR ไม่ถูกต้อง");
                    }
                },
                (errorMessage) => {
                    console.warn("สแกนไม่ได้:", errorMessage);
                }
            );
        } catch (err) {
            await qrScannerRef.current.stop();
            setIsScanning(false);
        }
    }

    async function saveCheckin() {
        const timestamp = new Date().toISOString();
        const { data: userData } = await supabase.auth.getUser();
        const email = userData?.user?.email;

        const { data: empData, error: empErr } = await supabase
            .from("employees")
            .select("employee_id")
            .eq("email", email)
            .single();

        if (empErr || !empData) {
            alert("❌ ไม่พบรหัสพนักงาน");
            return;
        }

        const employeeId = empData.employee_id;
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const { data: checkLog, error: checkErr } = await supabase
            .from("attendance_log")
            .select("*")
            .eq("employee_id", employeeId)
            .eq("check_type", "check-in")
            .gte("timestamp", startOfDay.toISOString())
            .lte("timestamp", endOfDay.toISOString());

        const lastLog = checkLog?.filter(log => !log.company || log.company !== selectedCompany)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        if (lastLog) {
            const { data: lastCheckOut } = await supabase
                .from("attendance_log")
                .select("*")
                .eq("employee_id", employeeId)
                .eq("check_type", "check-out")
                .eq("company", lastLog.company)
                .gte("timestamp", startOfDay.toISOString())
                .lte("timestamp", endOfDay.toISOString())
                .order("timestamp", { ascending: false })
                .limit(1)
                .single();

            if (!lastCheckOut) {
                alert(`❌ โปรดเช็คชื่อออกจากบริษัท (${lastLog.company}) ก่อน`);
                return;
            }
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                const bangphlatLat = 13.791118737099783;
                const bangphlatLon = 100.49677053240012;

                const ladkrabangLat = 13.727466744643005;
                const ladkrabangLon = 100.77170407186941;

                function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
                    const R = 6371000;
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLon = (lon2 - lon1) * Math.PI / 180;
                    const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(lat1 * Math.PI / 180) *
                        Math.cos(lat2 * Math.PI / 180) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    return R * c;
                }

                let locationLabel = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

                const distBangphlat = getDistanceFromLatLonInMeters(latitude, longitude, bangphlatLat, bangphlatLon);
                const distLadkrabang = getDistanceFromLatLonInMeters(latitude, longitude, ladkrabangLat, ladkrabangLon);

                if (distBangphlat <= 2000) {
                    locationLabel = "สาขาบางพลัด";
                } else if (distLadkrabang <= 2000) {
                    locationLabel = "สาขาลาดกระบัง";
                }

                console.log("🔍 พิกัดปัจจุบัน:", latitude, longitude);
                console.log("📏 ระยะห่างบางพลัด:", distBangphlat);
                console.log("📏 ระยะห่างลาดกระบัง:", distLadkrabang);
                console.log("📍 จะบันทึกว่า:", locationLabel);

                const { error } = await supabase.from("attendance_log").insert([{
                    check_type: "check-in",
                    timestamp: new Date().toISOString(),
                    employee_id: employeeId,
                    location: locationLabel,
                    company: selectedCompany
                }]);

                if (error) {
                    alert("❌ บันทึกไม่สำเร็จ");
                } else {
                    alert("✅ เช็คชื่อเข้าสำเร็จ!");
                }
            }, () => {
                alert("❌ ไม่สามารถดึงตำแหน่งได้");
            });
        } else {
            alert("❌ เบราว์เซอร์ไม่รองรับการดึงตำแหน่ง");
        }

    }

    async function saveOnlineCheckin() {
        if (isSavingOnline) return;
        setIsSavingOnline(true);

        const timestamp = new Date().toISOString();
        const { data: userData } = await supabase.auth.getUser();
        const email = userData?.user?.email;

        const { data: empData, error: empErr } = await supabase
            .from("employees")
            .select("employee_id")
            .eq("email", email)
            .single();

        if (empErr || !empData) {
            alert("❌ ไม่พบรหัสพนักงาน");
            setIsSavingOnline(false);
            return;
        }

        const employeeId = empData.employee_id;
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const { data: checkLog } = await supabase
            .from("attendance_log")
            .select("*")
            .eq("employee_id", employeeId)
            .eq("check_type", "check-in")
            .gte("timestamp", startOfDay.toISOString())
            .lte("timestamp", endOfDay.toISOString());

        const lastLog = checkLog?.filter(log => !log.company || log.company !== selectedCompany)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        if (lastLog) {
            const { data: lastCheckOut } = await supabase
                .from("attendance_log")
                .select("*")
                .eq("employee_id", employeeId)
                .eq("check_type", "check-out")
                .eq("company", lastLog.company)
                .gte("timestamp", startOfDay.toISOString())
                .lte("timestamp", endOfDay.toISOString())
                .order("timestamp", { ascending: false })
                .limit(1)
                .single();

            if (!lastCheckOut) {
                alert(`❌ โปรดเช็คชื่อออกจากบริษัท (${lastLog.company}) ก่อน`);
                setIsSavingOnline(false);
                return;
            }
        }

        const { error } = await supabase.from("attendance_log").insert([{
            check_type: "check-in",
            timestamp: new Date().toISOString(),
            employee_id: employeeId,
            location: "ลงชื่อแบบออนไลน์",
            company: selectedCompany
        }]);

        if (error) {
            alert("❌ บันทึกไม่สำเร็จ");
        } else {
            alert("✅ เช็คชื่อเข้าสำเร็จ!");
        }

        setIsSavingOnline(false);
    }


    async function stopScan() {
        if (qrScannerRef.current) {
            try {
                await qrScannerRef.current.stop();
                alert("❌ การสแกนถูกหยุด");
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
                <div id="checkin" className="section">
                    <h1 className="fw-bold"><i className="fa-solid fa-right-to-bracket"></i> เช็คชื่อเข้า</h1><hr />
                    <p>กรุณาสแกน QR Code ที่ได้รับจากแอดมินเพื่อเช็คชื่อเข้า</p>

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
                            <option value="W2D">W2D</option>
                            <option value="EDTech">EDTech</option>
                        </select>
                    </div>

                    <div className="d-flex justify-content-center gap-2 flex-wrap">
                        <button
                            className="btn btn-success"
                            onClick={startScan}
                            disabled={isScanning}
                        >
                            {isScanning ? "กำลังสแกน..." : "เริ่มแสกน"}
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={stopScan}
                            disabled={!isScanning}
                        >
                            หยุดแสกน
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                document.getElementById("qr-result").textContent = "กำลังบันทึก...";
                                saveOnlineCheckin();
                            }}
                            disabled={isSavingOnline}
                        >
                            {isSavingOnline ? "กำลังลงเวลา..." : "ลงเวลาเข้าแบบออนไลน์"}
                        </button>
                    </div>
                    <div id="qr-reader" style={{ width: '250px', height: '250px' }}></div>
                    <div id="qr-result" className="mt-3 text-center"></div>
                </div>
            </div>
        </div>
    );
}

export default CheckInPage;
