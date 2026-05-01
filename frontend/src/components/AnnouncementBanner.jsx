import React, { useEffect, useState } from 'react';
import { getAnnouncements } from '../services/api';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetch = async () => {
        try {
            const res = await getAnnouncements();
            // Show only the latest 3
            setAnnouncements(res.data.announcements.slice(0, 3));
        } catch(e) { console.error(e); }
    };
    fetch();
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {announcements.map(ann => {
            let bg = '#eff6ff'; let color = '#1e40af'; let border = '#bfdbfe'; let icon = '📢';
            if (ann.type === 'warning') { bg = '#fffbeb'; color = '#92400e'; border = '#fde68a'; icon = ''; }
            if (ann.type === 'alert') { bg = '#fef2f2'; color = '#991b1b'; border = '#fecaca'; icon = '🚨'; }

            return (
                <div key={ann.id} style={{ 
                    background: bg, color: color, border: `1px solid ${border}`,
                    padding: '12px 20px', borderRadius: '8px', fontSize: '0.95rem',
                    display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500'
                }}>
                    <span>{icon}</span>
                    <span>{ann.content}</span>
                </div>
            );
        })}
    </div>
  );
};

export default AnnouncementBanner;