import React, { useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { supabase } from '../supabaseClient';
import '@fullcalendar/core/locales/th';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import NavbarPage from './NavbarPage';
import '../cssfile/calendar.css';

function CalendarPage() {
  const calendarRef = useRef(null);

  function markMondaysAsHoliday(dayTypes, startDate, endDate) {
    const current = new Date(startDate.getTime());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()); 
  
    while (current <= end) {
      if (current.getDay() === 2) {
        const dateStr = current.toISOString().split('T')[0];
        if (!dayTypes[dateStr]) dayTypes[dateStr] = [];
        if (!dayTypes[dateStr].includes('mondayHoliday')) {
          dayTypes[dateStr].push('mondayHoliday');
        }
      }
      current.setDate(current.getDate() + 1);
    }
  }
  


  function parseDateLocal(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  useEffect(() => {
    const loadCalendar = async () => {
      const calendarEl = document.getElementById('calendar');
      if (!calendarEl) return;

      const [leaveRes, holidayRes, attendanceRes] = await Promise.all([
        supabase.from('leave_days').select('start_date, end_date, start_time, end_time, leave_type'),
        supabase.from('holidays').select('date, title'),
        supabase.from('attendance_log').select('timestamp, check_type'),
      ]);

      if (leaveRes.error || holidayRes.error || attendanceRes.error) {
        console.error('Error loading data', leaveRes.error, holidayRes.error, attendanceRes.error);
        return;
      }

      const dayTypes = {};

      leaveRes.data.forEach(item => {
        const start = item.start_date;
        const end = item.end_date || start;
        const current = parseDateLocal(start);
        const endDate = parseDateLocal(end);

        while (current <= endDate) {
          const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;

          if (!dayTypes[dateStr]) dayTypes[dateStr] = [];
          dayTypes[dateStr].push('leave');

          current.setDate(current.getDate() + 1);
        }
      });

      holidayRes.data.forEach(item => {
        const dateObj = parseDateLocal(item.date);
        const date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

        if (!dayTypes[date]) dayTypes[date] = [];
        dayTypes[date].push('holiday');
      });

      attendanceRes.data.forEach(item => {
        if (item.check_type.includes('check-in')) {
          const localDate = new Date(item.timestamp);
          const dateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
          if (!dayTypes[dateStr]) dayTypes[dateStr] = [];
          if (!dayTypes[dateStr].includes('workday')) {
            dayTypes[dateStr].push('workday');
          }
        }
      });

      const calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        locale: 'th',
        height: 'auto',
        showNonCurrentDates: false,
        dayHeaders: true,

        headerToolbar: {
          left: '',
          center: 'title',
          right: 'prev,today,next'
        },

        dayCellContent: function (arg) {
          if (arg.isOther) return { html: '' }; 
        
          const day = arg.date.getDate();
          const dateStr = `${arg.date.getFullYear()}-${String(arg.date.getMonth() + 1).padStart(2, '0')}-${String(arg.date.getDate()).padStart(2, '0')}`;
        
          let dots = '<div class="dots-container">';
          if (dayTypes[dateStr] && dayTypes[dateStr].length > 0) {
            dayTypes[dateStr].forEach(type => {
              dots += `<span class="dot ${type}"></span>`;
            });
          } else {
            dots += `<span class="dot empty"></span>`;
          }
          dots += '</div>';
        
          return {
            html: `
              <div class="custom-day-cell">
                <div class="custom-day-label">
                  <span class="day-number">${day}</span>
                </div>
                ${dots}
              </div>
            `
          };
        },
        
        

        dateClick: function (info) {
          console.log('👉 วันที่ถูกคลิก:', info.dateStr); 
          const clickedDate = info.dateStr;
          const types = dayTypes[clickedDate] || [];   
        
          const descriptionMap = {
            leave: 'วันลา',
            holiday: 'วันหยุด',
            workday: 'เข้าทำงาน',
            mondayHoliday: 'วันหยุดประจำบริษัท',
          };
        
          const readable = types.length > 0 ? types.map(type => descriptionMap[type] || type).join(', ') : 'ไม่มีข้อมูล';
        
          const holiday = holidayRes.data.find(h => h.date === clickedDate);
          const holidayTitle = holiday ? holiday.title : null;
        
          const detailsEl = document.getElementById('calendar-details');
          if (detailsEl) {
            detailsEl.innerHTML = `
              <h5>📅 วันที่ ${clickedDate}</h5>
              <p><strong>สถานะ:</strong> ${readable}</p>
              ${holidayTitle ? `<p><strong>กิจกรรม/วันหยุด:</strong> ${holidayTitle}</p>` : ''}
            `;
          } else {
            console.warn('❌ ไม่พบ calendar-details');
          }
        },

        datesSet: function (info) {
          Object.keys(dayTypes).forEach(date => {
            const d = parseDateLocal(date);
            if (d.getDay() === 1) {
              dayTypes[date] = dayTypes[date].filter(type => type !== 'holiday');
              if (dayTypes[date].length === 0) delete dayTypes[date];
            }
          });

          markMondaysAsHoliday(dayTypes, info.start, new Date(info.end.getTime() - 1));
          calendar.render();

        },
      });

      
      console.log(dayTypes);
      calendar.render();
      calendarRef.current = calendar;
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const typesToday = dayTypes[todayStr] || [];

      const descriptionMap = {
        leave: 'วันลา',
        holiday: 'วันหยุด',
        workday: 'เข้าทำงาน',
        mondayHoliday: 'วันหยุดประจำบริษัท',
      };

      const readableToday = typesToday.length > 0
        ? typesToday.map(type => descriptionMap[type] || type).join(', ')
        : 'ไม่มีข้อมูล';

      const holidayToday = holidayRes.data.find(h => h.date === todayStr);
      const holidayTitleToday = holidayToday ? holidayToday.title : null;

      const detailsEl = document.getElementById('calendar-details');
      detailsEl.innerHTML = `
        <h5>📅 วันที่ ${todayStr}</h5>
        <p><strong>สถานะ:</strong> ${readableToday}</p>
        ${holidayTitleToday ? `<p><strong>กิจกรรม/วันหยุด:</strong> ${holidayTitleToday}</p>` : ''}
      `;

    };

    loadCalendar();
  }, []);

  const showSection = id => {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
  };

  return (
    <div>
      <NavbarPage showSection={showSection} />
      <div className="main-content">
          <div id="calendar-page" className="section">
            <h1 className="fw-bold"><i class="fa-solid fa-calendar-days"></i> ปฏิทินกิจกรรม</h1><hr />
            <div id="calendar"></div>
            <div id="calendar-details" className="mt-3 p-2 border rounded bg-light"></div>
          </div>
      </div>
    </div>
  );
}

export default CalendarPage;
