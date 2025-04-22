import axios from "axios";

export default function CheckInButton() {
  const handleCheckIn = async () => {
    await axios.post("http://localhost:3001/api/attendance/checkin", {
      userId: "emp001", // เปลี่ยนตามจริง
      timestamp: new Date().toISOString(),
    });
    alert("เช็คอินเรียบร้อย");
  };

  return <button onClick={handleCheckIn}>เช็คอิน</button>;
}
