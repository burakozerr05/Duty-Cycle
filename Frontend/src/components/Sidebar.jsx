import React, { useState } from 'react';

/**
 * BETON SIDEBAR (V5 - DİNAMİK HOVER & EKİP FİX)
 * - Mouse üzerine gelinen buton Koyu Gri/Siyah vurgu alır.
 * - Ekip butonu App.jsx'e tam bağlandı.
 * - Sola sıfırlanmış, simetrik ve ikonlardan arındırılmış yapı.
 * - Raporlar butonu App.jsx setView fonksiyonuna bağlandı.
 */
const Sidebar = ({ theme, user, setView, setIsTeamActive }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeHoverItem, setActiveHoverItem] = useState(null);

  const sidebarWidth = isHovered ? '260px' : '50px';

  return (
    <div 
      style={{...sidebarContainer(theme), width: sidebarWidth}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setActiveHoverItem(null); }}
    >
      {/* KULLANICI PROFİL BÖLÜMÜ */}
      <div style={profileSection(isHovered)}>
        <img 
          src={user.avatar || "https://via.placeholder.com/150"} 
          alt="Profil" 
          style={avatarStyle(isHovered, theme)} 
        />
        {isHovered && (
          <div style={userInfoStyle}>
            <div style={userNameStyle}>{user.name}</div>
            <div style={userRoleStyle}>{user.role}</div>
            <div style={userStatsStyle}>👥 {user.subordinateCount} KİŞİ</div>
          </div>
        )}
      </div>

      <div style={mainDividerStyle(theme)} />

      {/* NAVİGASYON MENÜSÜ */}
      <nav style={navContainer}>
        <NavItem 
          id="tasks" label="GÖREVLER" isHovered={isHovered} 
          isHighlighted={activeHoverItem === 'tasks'}
          onMouseEnter={() => setActiveHoverItem('tasks')}
          onClick={() => setView('tasks')} theme={theme} 
        />
        <div style={innerDividerStyle(theme)} />
        
        {/* RAPORLAR BUTONU ENTEGRASYONU */}
        <NavItem 
          id="reports" label="DURUM & RAPOR" isHovered={isHovered} 
          isHighlighted={activeHoverItem === 'reports'}
          onMouseEnter={() => setActiveHoverItem('reports')}
          onClick={() => setView('reports')} 
          theme={theme} 
        />
        <div style={innerDividerStyle(theme)} />
        
        <NavItem 
          id="team" label="EKİP" isHovered={isHovered} 
          isHighlighted={activeHoverItem === 'team'}
          onMouseEnter={() => setActiveHoverItem('team')}
          onClick={() => setIsTeamActive(true)} 
          theme={theme} 
        />
        <div style={innerDividerStyle(theme)} />

        <NavItem 
          id="auth" label="YETKİLENDİRME" isHovered={isHovered} 
          isHighlighted={activeHoverItem === 'auth'}
          onMouseEnter={() => setActiveHoverItem('auth')}
          theme={theme} 
        />
        <div style={innerDividerStyle(theme)} />
        
        <NavItem 
          id="analysis" label="ANALİZ" isHovered={isHovered} 
          isHighlighted={activeHoverItem === 'analysis'}
          onMouseEnter={() => setActiveHoverItem('analysis')}
          theme={theme} 
        />
        <div style={innerDividerStyle(theme)} />
        
        <NavItem 
          id="settings" label="AYARLAR" isHovered={isHovered} 
          isHighlighted={activeHoverItem === 'settings'}
          onMouseEnter={() => setActiveHoverItem('settings')}
          theme={theme} 
        />
        <div style={innerDividerStyle(theme)} />
        
        <NavItem 
          id="profile" label="PROFİL" isHovered={isHovered} 
          isHighlighted={activeHoverItem === 'profile'}
          onMouseEnter={() => setActiveHoverItem('profile')}
          theme={theme} 
        />
      </nav>
    </div>
  );
};

// Menü Elemanı
const NavItem = ({ label, isHovered, onClick, theme, isHighlighted, onMouseEnter }) => (
  <div 
    style={navItemStyle(theme, isHovered, isHighlighted)} 
    onClick={onClick}
    onMouseEnter={onMouseEnter}
  >
    {isHovered ? (
      <span style={navLabelStyle(isHighlighted)}>{label}</span>
    ) : (
      <div style={collapsedDotStyle(theme, isHighlighted)} /> 
    )}
  </div>
);

// --- STİLLER ---

const sidebarContainer = (t) => ({
  position: 'fixed',
  left: 0,
  top: '80px',
  bottom: '80px',
  background: '#FFFFFF',
  border: `2px solid ${t.border}`,
  borderLeft: 'none',
  transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: 10000,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '4px 0 15px rgba(0,0,0,0.05)',
  borderRadius: '0 4px 4px 0'
});

const profileSection = (isHovered) => ({
  padding: isHovered ? '25px 20px' : '20px 0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: isHovered ? 'flex-start' : 'center',
  gap: '12px',
  minHeight: '130px',
  width: '100%'
});

const avatarStyle = (isHovered, t) => ({
  width: isHovered ? '60px' : '30px',
  height: isHovered ? '60px' : '30px',
  borderRadius: '2px',
  border: `1.5px solid ${t.border}`,
  objectFit: 'cover',
  transition: 'all 0.3s ease'
});

const userInfoStyle = { display: 'flex', flexDirection: 'column', gap: '2px' };
const userNameStyle = { fontWeight: '900', fontSize: '15px', color: '#000', letterSpacing: '0.5px', whiteSpace: 'nowrap' };
const userRoleStyle = { fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' };
const userStatsStyle = { fontSize: '11px', fontWeight: '900', color: '#2563eb', marginTop: '4px', whiteSpace: 'nowrap' };

const navContainer = { display: 'flex', flexDirection: 'column', flex: 1 };

const navItemStyle = (t, isHovered, isHighlighted) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: isHovered ? 'flex-start' : 'center',
  padding: isHovered ? '18px 25px' : '18px 0',
  cursor: 'pointer',
  transition: 'all 0.2s',
  background: isHighlighted ? '#f8fafc' : 'transparent',
  width: '100%',
  // Hover anında soldaki belirteç çizgisi (Koyu Gri/Siyah)
  borderLeft: isHighlighted && isHovered ? `4px solid #1e293b` : '4px solid transparent',
});

const navLabelStyle = (isHighlighted) => ({
  fontWeight: '900',
  fontSize: '12px',
  color: isHighlighted ? '#1e293b' : '#000', // Hoverda koyu gri olur
  letterSpacing: '1px',
  whiteSpace: 'nowrap',
  transition: 'color 0.2s ease'
});

const collapsedDotStyle = (t, isHighlighted) => ({
  width: '6px',
  height: '2px',
  background: isHighlighted ? '#1e293b' : t.border,
  opacity: isHighlighted ? 1 : 0.4,
  transition: 'all 0.2s ease'
});

const mainDividerStyle = (t) => ({ height: '2px', background: t.border, margin: '0 10px', opacity: 1 });
const innerDividerStyle = (t) => ({ height: '1px', background: t.border, margin: '0 15px', opacity: 0.15 });

export default Sidebar;