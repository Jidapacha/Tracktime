import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import * as bootstrap from 'bootstrap';
import { supabase } from '../supabaseClient';
import NavbarPage from './NavbarPage';

function RequestPage() {

    const showSection = (id) => {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => section.classList.remove('active'));
        const target = document.getElementById(id);
        if (target) target.classList.add('active');
    };

    return (
        <div>
      <NavbarPage showSection={showSection}/>
        <div id="request" className="section">
            <h2>⏳ รายการรออนุมัติ</h2>
        </div>  
        </div>
    )
}


export default RequestPage;