import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import * as bootstrap from 'bootstrap';
import { supabase } from '../supabaseClient';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import '@fullcalendar/core/locales/th';
import '@fullcalendar/daygrid/main.css';
import NavbarPage from './NavbarPage';
import '../cssfile/calendar.css'

function CalendarPage() {

    const calendarRef = useRef(null);

    function markMondaysAsHoliday(dayTypes, startDate, endDate) {
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (d.getDay() === 1) { 
            const dateStr = d.toISOString().split('T')[0];
            if (!dayTypes[dateStr]) dayTypes[dateStr] = [];
            if (!dayTypes[dateStr].includes('holiday')) {
              dayTypes[dateStr].push('holiday');
            }
          }
        }
    }useEffect(() => {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;
    
        const loadCalendar = async () => {
            const [leaveRes, holidayRes, attendanceRes] = await Promise.all([
                supabase.from('leave_days').select('start_date, end_date, start_time, end_time, leave_type'),
                supabase.from('holidays').select('date, title'),
                supabase.from('attendance_log').select('timestamp, check_type')
            ]);
    
            if (leaveRes.error || holidayRes.error || attendanceRes.error) {
                console.error('Error loading data', leaveRes.error, holidayRes.error, attendanceRes.error);
                return;
            }
    
            const dayTypes = {};
    
            // Process leave days
            leaveRes.data.forEach(item => {
                const start = item.start_date;
                const end = item.end_date || start;
                const current = new Date(start + 'T00:00:00');
                const endDate = new Date(end + 'T00:00:00');
    
                while (current <= endDate) {
                    const dateStr = current.toISOString().split('T')[0];
                    if (!dayTypes[dateStr]) dayTypes[dateStr] = [];
                    dayTypes[dateStr].push('leave');
                    current.setDate(current.getDate() + 1);
                }
            });
    
            // Process holidays
            holidayRes.data.forEach(item => {
                const date = item.date;
                if (!dayTypes[date]) dayTypes[date] = [];
                dayTypes[date].push('holiday');
            });
    
            // Process attendance
            attendanceRes.data.forEach(item => {
                if (item.check_type === 'in') {
                    const date = new Date(item.timestamp).toISOString().split('T')[0];
                    if (!dayTypes[date]) dayTypes[date] = [];
                    if (!dayTypes[date].includes('workday')) {
                        dayTypes[date].push('workday');
                    }
                }
            });
    
            // Render calendar
            const calendar = new Calendar(calendarEl, {
                plugins: [dayGridPlugin], // เพิ่มบรรทัดนี้
                initialView: 'dayGridMonth',  // ใช้ dayGridMonth
                locale: 'th',
                height: 'auto',
                showNonCurrentDates: false,
                headerToolbar: {
                    left: '',
                    center: 'title',
                    right: 'prev,next today'
                },
            
                dayCellContent: function (arg) {
                    const year = arg.date.getFullYear();
                    const month = (arg.date.getMonth() + 1).toString().padStart(2, '0');
                    const day = arg.date.getDate().toString().padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                  
                    let dots = '';
                    if (dayTypes[dateStr]) {
                      dots += `<div class="dots-container">`;
                      dayTypes[dateStr].forEach(type => {
                        dots += `<span class="dot ${type}"></span>`;
                      });
                      dots += `</div>`;
                    }
                  
                    return {
                      html: `
                        <div class="custom-day-cell">
                          <div class="custom-date-number">${arg.date.getDate()}</div>
                          ${dots}
                        </div>
                      `
                    };
                  },
            
                dateClick: function (info) {
                    const clickedDate = info.dateStr;
                    const types = dayTypes[clickedDate] || [];
            
                    const descriptionMap = {
                        leave: 'วันลา',
                        holiday: 'วันหยุด',
                        workday: 'เข้าทำงาน',
                        mondayHoliday: 'วันหยุดประจำบริษัท'
                    };
            
                    const readable = types.length > 0
                        ? types.map(type => descriptionMap[type] || type).join(', ')
                        : 'ไม่มีข้อมูล';
            
                    const detailsEl = document.getElementById('calendar-details');
                    detailsEl.innerHTML = `
                        <h5>📅 วันที่ ${clickedDate}</h5>
                        <p><strong>สถานะ:</strong> ${readable}</p>
                    `;
                },
            
                datesSet: function (info) {
                    // Remove auto-marked holidays on Mondays
                    Object.keys(dayTypes).forEach(date => {
                        const d = new Date(date);
                        if (d.getDay() === 1) {
                            const types = dayTypes[date];
                            const index = types.indexOf('holiday');
                            if (index !== -1) {
                                types.splice(index, 1);
                                if (types.length === 0) delete dayTypes[date];
                            }
                        }
                    });
            
                    markMondaysAsHoliday(dayTypes, info.start, new Date(info.end.getTime() - 1));
                    info.view.calendar.render();
                }
            });
            
    
            calendar.render();
            calendarRef.current = calendar; 

        };
    
        loadCalendar();
    }, []);

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
                <div className="container py-4" id="main-content">
                    <div id="calendar-page" className="section">
                        <h2>📅 ปฏิทินกิจกรรม</h2>
                        <div id="calendar"></div>
                        <div id="calendar-details" className="mt-3 p-2 border rounded bg-light"></div>
                    </div>
                </div>
            </div>
        </div>
    
    );
}

export default CalendarPage;
