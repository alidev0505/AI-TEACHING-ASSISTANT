import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Navbar = ({ isTransparent = false }) => {
  const { user, logoutUser } = useContext(AuthContext);
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close menus on page change
  useEffect(() => {
    setShowNotif(false);
    setMobileMenuOpen(false);
  }, [location]);

  // Handle scroll for transparency
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) setScrolled(true);
      else setScrolled(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      api.get('/notifications/').then(r => setNotifications(r.data.notifications || [])).catch(() => { });
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U';

  // --- DYNAMIC STYLING LOGIC ---
  // If we are NOT on the landing page (isTransparent=false), it should always be solid white.
  // If we ARE on landing page, it is transparent until we scroll or open the mobile menu.
  const shouldBeSolid = !isTransparent || scrolled || mobileMenuOpen;
  
  const navBg = shouldBeSolid ? '#ffffff' : 'transparent';
  const navText = shouldBeSolid ? '#1e293b' : '#3b2a2a'; // Slate-800 or pure white
  const navBorder = shouldBeSolid ? '#e2e8f0' : 'transparent';

  return (
    <nav style={{
      background: navBg,
      borderBottom: `1px solid ${navBorder}`,
      height: '72px',
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      fontFamily: "'Inter', sans-serif",
      backdropFilter: shouldBeSolid ? 'blur(12px)' : 'none',
      transition: 'all 0.3s ease',
      display: 'flex', alignItems: 'center'
    }}>
      <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* LOGO */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1100 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #1d4ed8, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🎓</div>
          <span style={{ fontWeight: '800', fontSize: '1.1rem', color: navText, letterSpacing: '-0.3px', transition: 'color 0.3s' }}>AI Teaching Assistant</span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {user ? (
            <>
              <Link to={user.role === 'teacher' ? '/teacher' : user.role === 'admin' ? '/admin' : '/student'}
                style={{ color: navText, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', opacity: 0.9 }}>
                Dashboard
              </Link>

              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowNotif(!showNotif)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: navText }}>
                  🔔 {unreadCount > 0 && <span style={{ position: 'absolute', top: '0', right: '0', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }} />}
                </button>
              </div>

              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>{initials}</div>
                <span className="hide-mobile" style={{ color: navText, fontSize: '0.85rem', fontWeight: '700' }}>{user.username}</span>
              </Link>

              <button onClick={logoutUser} style={{ 
                background: shouldBeSolid ? '#f8fafc' : 'rgba(255,255,255,0.1)', 
                border: `1px solid ${shouldBeSolid ? '#e2e8f0' : 'rgba(255,255,255,0.3)'}`, 
                color: navText, padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' 
              }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: navText, textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>Log In</Link>
              <Link to="/signup" style={{ 
                background: shouldBeSolid ? '#1d4ed8' : '#ffffff', 
                color: shouldBeSolid ? '#ffffff' : '#1d4ed8', 
                textDecoration: 'none', fontSize: '0.9rem', fontWeight: '700', padding: '10px 24px', borderRadius: '8px' 
              }}>Get Started Free</Link>
            </>
          )}
        </div>

        {/* MOBILE TOGGLE */}
        <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', zIndex: 1100 }}>
           <div style={{ width: '25px', height: '2px', background: navText, marginBottom: '6px', transition: '0.3s', transform: mobileMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none' }}></div>
           <div style={{ width: '25px', height: '2px', background: navText, transition: '0.3s', opacity: mobileMenuOpen ? 0 : 1 }}></div>
           <div style={{ width: '25px', height: '2px', background: navText, marginTop: '6px', transition: '0.3s', transform: mobileMenuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none' }}></div>
        </button>
      </div>

      {/* MOBILE MENU OVERLAY */}
      <div style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        background: 'black', display: 'flex', flexDirection: 'column', 
        padding: '100px 30px', gap: '25px', zIndex: 1050,
        transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out'
      }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', textDecoration: 'none' }}>Home</Link>
          <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', textDecoration: 'none' }}>Log In</Link>
          <Link to="/signup" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1d4ed8', textDecoration: 'none' }}>Get Started Free</Link>
      </div>

      <style>{`
        @media (max-width: 850px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;