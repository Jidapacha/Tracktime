import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import * as bootstrap from 'bootstrap';
import { supabase } from '../supabaseClient';
import NavbarPage from './NavbarPage';

function NotiPage() {

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
                <div id="notifications" className="section">
                    <h1 className="fw-bold"><i class="fa-solid fa-bell"></i> แจ้งเตือน</h1><hr />
                    
                </div>
            </div>
        </div>
    )
}

export default NotiPage;