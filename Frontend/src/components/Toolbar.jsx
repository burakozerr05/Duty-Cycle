import React from 'react';

/**
 * KUSURSUZ TANJANT KİLİTLİ TOOLBAR (V12 - ALTIN ORAN BORDER)
 * - Eğimli borderline kalınlığı 1.8px olarak "altın oran"a çekildi.
 * - BUL butonu App.jsx'teki isSearchOpen state'ine bağlandı.
 * - Geometrik kilitler ve fonksiyonel mantık korundu.
 */
const Toolbar = ({ 
  isEditable, 
  setIsEditable, 
  isTeamActive, 
  setIsTeamActive, 
  toggleTheme, 
  theme, 
  setView,
  nodes, 
  darkMode,
  isSearchOpen,      // App.jsx'ten gelen arama durumu
  setIsSearchOpen    // App.jsx'ten gelen değiştirme fonksiyonu
}) => {
  const personnelCount = nodes.filter(n => n.type === 'personnel').length;
  const areaCount = nodes.filter(n => n.type === 'area').length;

  return (
    <div style={toolbarFullWrapper}>
      <div style={toolbarMainContainer}>
        
        {/* SOL GÖSTERGE */}
        <div style={sideBoxStyle(theme, 'left')}>
          <div style={contentWrapper}>
            <span style={symbolStyle}>👥</span>
            <span style={textStyle}>EKİP: {personnelCount}</span>
          </div>
        </div>

        {/* ORTA ANA GÖVDE (İKİZKENAR YAMUK) */}
        <div style={trapezoidBody(theme)}>
          {/* SOL EĞİMLİ BORDERLINE */}
          <div style={slantedBorderStyle(theme, 'left')} />

          {/* KOYU MOD BUTONU */}
          <button 
            style={trapezoidButtonStyle(darkMode, theme)} 
            onClick={toggleTheme}
          >
            {darkMode ? 'KOYU MOD' : 'AÇIK MOD'}
          </button>

          {/* DİK AYRAÇ (Butonlar arası) */}
          <div style={buttonDividerStyle(theme)} />

          {/* DÜZENLEME BUTONU */}
          <button 
            style={trapezoidButtonStyle(isEditable, theme)} 
            onClick={setIsEditable}
          >
            {isEditable ? 'DÜZENLENİYOR' : 'DÜZENLE'}
          </button>

          {/* DİK AYRAÇ (Butonlar arası) */}
          <div style={buttonDividerStyle(theme)} />

          {/* BUL BUTONU - ARTIK AKTİF */}
          <button 
            style={trapezoidButtonStyle(isSearchOpen, theme)} 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            {isSearchOpen ? 'ARAMA AÇIK' : 'BUL'}
          </button>

          {/* SAĞ EĞİMLİ BORDERLINE */}
          <div style={slantedBorderStyle(theme, 'right')} />
        </div>

        {/* SAĞ GÖSTERGE */}
        <div style={sideBoxStyle(theme, 'right')}>
          <div style={contentWrapper}>
            <span style={symbolStyle}>⬛</span>
            <span style={textStyle}>ALAN: {areaCount}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- GEOMETRİK MÜHENDİSLİK VE STİL TANIMLARI ---

const toolbarFullWrapper = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '100vw',
  height: '80px',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'flex-end',
  pointerEvents: 'none'
};

const toolbarMainContainer = {
  display: 'flex',
  width: '100%',
  height: '100%',
  alignItems: 'flex-end',
  background: 'transparent',
  pointerEvents: 'all'
};

const sideBoxStyle = (t, side) => ({
  flex: 1,
  height: '55px', 
  background: '#E2E8F0',
  borderTop: `2px solid ${t.border}`,
  clipPath: side === 'left' 
    ? 'polygon(0% 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)' 
    : 'polygon(0% 0%, 100% 0%, 100% 100%, 20px 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  zIndex: 5,
  marginRight: side === 'left' ? '-20px' : '0',
  marginLeft: side === 'right' ? '-20px' : '0',
  boxSizing: 'border-box'
});

const trapezoidBody = (t) => ({
  flex: 2,
  height: '75px',
  background: '#FFFFFF',
  borderTop: `2px solid ${t.border}`,
  borderBottom: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  clipPath: 'polygon(20px 0%, calc(100% - 20px) 0%, 100% 100%, 0% 100%)',
  zIndex: 10,
  padding: '0 40px',
  boxSizing: 'border-box',
  position: 'relative',
  boxShadow: '0 -8px 25px rgba(0,0,0,0.15)'
});

const slantedBorderStyle = (t, side) => ({
  position: 'absolute',
  top: '-2px',
  [side]: '19.2px', 
  width: '1.8px', 
  height: '110%',
  background: t.border,
  transform: side === 'left' 
    ? 'rotate(15deg)' 
    : 'rotate(-15deg)',
  transformOrigin: side === 'left' ? 'top left' : 'top right',
  zIndex: 11
});

const trapezoidButtonStyle = (isActive, t) => ({
  flex: 1,
  height: '100%',
  background: isActive ? '#CBD5E1' : 'transparent', 
  border: 'none',
  cursor: 'pointer',
  fontWeight: '900',
  fontSize: '13px',
  color: '#000000',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  transition: 'all 0.1s ease',
  outline: 'none',
  transform: isActive ? 'scale(0.96)' : 'scale(1)',
  boxShadow: isActive ? 'inset 2px 2px 8px rgba(0,0,0,0.2)' : 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const buttonDividerStyle = (t) => ({
  width: '1px',
  height: '40%',
  background: t.border,
  opacity: 0.3,
  zIndex: 12
});

const contentWrapper = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '0 15px'
};

const textStyle = {
  fontWeight: '900',
  fontSize: '11px',
  color: '#000000',
  textTransform: 'uppercase'
};

const symbolStyle = {
  fontSize: '18px',
  filter: 'grayscale(100%) brightness(0)' 
};

export default Toolbar;