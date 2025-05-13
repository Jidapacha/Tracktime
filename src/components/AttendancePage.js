import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import * as bootstrap from 'bootstrap';
import { supabase } from '../supabaseClient';
import NavbarPage from './NavbarPage';

function AttendancePage() {

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
                <div className="container py-4" id="main-content">
                    <div id="attendence-log" className="section">
                        <h2>📜 ประวัติทำงานของพนักงาน</h2>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default AttendancePage;