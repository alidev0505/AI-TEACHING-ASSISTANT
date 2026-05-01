import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getAllCoursesAdmin } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const localizer = momentLocalizer(moment);

// --- 1. MINIMAL EVENT COMPONENT (Clean & Readable) ---
const CustomEvent = ({ event }) => {
  return (
    <div style={{ fontSize: '0.75rem', lineHeight: '1.1', overflow: 'hidden' }}>
      {/* Bold Class Code */}
      <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
        {event.code}
      </div>
      {/* Room Badge */}
      <div style={{ 
          background: 'rgba(0,0,0,0.15)', padding: '1px 4px', 
          borderRadius: '3px', marginTop: '2px', display: 'inline-block',
          fontSize: '0.7rem' 
      }}>
        📍 {event.resource}
      </div>
    </div>
  );
};

const AdminCalendar = () => {
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState([]); // Store ALL data
  const [filteredEvents, setFilteredEvents] = useState([]); // Store FILTERED data
  const [loading, setLoading] = useState(true);

  // --- FILTER STATES ---
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  // Re-run filtering whenever filters or data change
  useEffect(() => {
    applyFilters();
  }, [deptFilter, roomFilter, allEvents]);

  const fetchData = async () => {
    try {
      const res = await getAllCoursesAdmin();
      const events = transformToEvents(res.data.courses || []);
      setAllEvents(events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const transformToEvents = (courses) => {
    const events = [];
    const dayMap = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };

    courses.forEach(c => {
      if (!c.day || !c.time) return;
      const dayIndex = dayMap[c.day];
      if (!dayIndex) return;

      const currentDay = moment().isoWeekday(dayIndex);
      
      let startStr = c.time, endStr = "";
      if (c.time.includes('-')) {
          [startStr, endStr] = c.time.split(' - ');
      } else {
          startStr = c.time;
          endStr = moment(c.time, "HH:mm").add(1.5, 'hours').format("HH:mm");
      }

      const startDate = currentDay.clone().set({
          hour: parseInt(startStr.split(':')[0]), minute: parseInt(startStr.split(':')[1]), second: 0
      }).toDate();

      const endDate = currentDay.clone().set({
          hour: parseInt(endStr.split(':')[0]), minute: parseInt(endStr.split(':')[1]), second: 0
      }).toDate();

      // Extract Dept Code (e.g. "CSC" from "CSC-101")
      const deptCode = c.class_code ? c.class_code.split('-')[0].toUpperCase() : 'OTH';

      events.push({
        id: c.id,
        code: c.class_code, 
        title: c.name,      
        start: startDate,
        end: endDate,
        resource: c.room || 'TBD',
        teacher: c.teacher_name || 'Unassigned',
        dept: deptCode // Store dept for filtering
      });
    });
    return events;
  };

  // --- FILTER LOGIC ---
  const applyFilters = () => {
    let result = allEvents;

    if (deptFilter !== 'ALL') {
        result = result.filter(ev => ev.dept.includes(deptFilter));
    }

    if (roomFilter !== 'ALL') {
        result = result.filter(ev => ev.resource === roomFilter);
    }

    setFilteredEvents(result);
  };

  // Extract unique rooms for dropdown
  const uniqueRooms = [...new Set(allEvents.map(e => e.resource))].sort();

  // Styling Logic
  const eventStyleGetter = (event) => {
    let color = '#3b82f6'; 
    if (event.dept.includes('CS') || event.dept.includes('IT')) color = '#2563eb';
    else if (event.dept.includes('ENG')) color = '#dc2626';
    else if (event.dept.includes('MTH')) color = '#059669';

    return {
      style: {
        backgroundColor: color,
        borderRadius: '6px',
        opacity: 1,
        color: 'white',
        border: 'none',
        display: 'block'
      }
    };
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      
      {/* HEADER & CONTROLS */}
      <div style={{ background: '#1e293b', color: 'white', padding: '15px 30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Weekly Schedule</h1>
                    <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Showing {filteredEvents.length} Sessions</span>
                </div>
            </div>
            
            {/* --- FILTER BAR --- */}
            <div style={{ display: 'flex', gap: '10px' }}>
                <select 
                    value={deptFilter} 
                    onChange={e => setDeptFilter(e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: 'none', background: 'white', color: '#334155', fontWeight: 'bold' }}
                >
                    <option value="ALL">All Departments</option>
                    <option value="CS">Computer Science</option>
                    <option value="ENG">Engineering</option>
                    <option value="MTH">Mathematics</option>
                    <option value="BBA">Business</option>
                </select>

                <select 
                    value={roomFilter} 
                    onChange={e => setRoomFilter(e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: 'none', background: 'white', color: '#334155', fontWeight: 'bold', maxWidth: '150px' }}
                >
                    <option value="ALL">All Rooms</option>
                    {uniqueRooms.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
        </div>
      </div>

      {/* CALENDAR */}
      <div style={{ flex: 1, padding: '20px', overflow: 'hidden' }}>
        {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Loading...</div>
        ) : (
            <div style={{ height: '100%', background: 'white', borderRadius: '12px', padding: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Calendar
                    localizer={localizer}
                    events={filteredEvents} // Use filtered data
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    defaultView="week"
                    views={['week', 'day', 'agenda']} // 'agenda' is great for lists!
                    step={60}
                    timeslots={1}
                    min={new Date(0, 0, 0, 8, 0, 0)}
                    max={new Date(0, 0, 0, 20, 0, 0)}
                    components={{ event: CustomEvent }}
                    eventPropGetter={eventStyleGetter}
                    
                    // Native Tooltip (Hover to see full details)
                    tooltipAccessor={evt => `${evt.title} \nTeacher: ${evt.teacher} \nRoom: ${evt.resource}`}
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminCalendar;