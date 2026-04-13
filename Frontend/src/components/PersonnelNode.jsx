import React from 'react';
import { Handle, Position } from 'reactflow';

/**
 * PERSONNEL NODE BİLEŞENİ
 * - Borderline: 0.7px (İnce).
 * - Fontlar: 900 Weight (Kalın).
 * - Yazı: "ALT EKİP" kaldırıldı, siyah sembol (👥) eklendi.
 * - Renk Kontrolü: İsimler ve sayılar theme.text ile daima okunur.
 */
const PersonnelNode = ({ data }) => {
  const { theme } = data;

  // Emojiyi simsiyah yapan jilet filtre
  const blackSymbolFilter = {
    filter: 'grayscale(100%) brightness(0)',
    fontSize: '16px',
    display: 'inline-block'
  };

  const cardWrapperStyle = {
    background: theme.card,
    borderRadius: '12px', 
    border: `0.7px solid ${theme.border}`, 
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.06)',
    width: '200px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    color: theme.text,
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    cursor: theme.isEditable ? 'inherit' : 'default',
    fontFamily: '"Inter", sans-serif'
  };

  const floatingSeparatorStyle = {
    width: '85%',
    height: '0.5px',
    backgroundColor: theme.border,
    margin: '0 auto',
    opacity: 0.25
  };

  const handleStyle = {
    opacity: theme.isEditable ? 1 : 0, 
    background: '#000000', 
    width: '8px',
    height: '8px',
    border: `1px solid #FFFFFF`, 
    transition: 'opacity 0.3s ease',
    zIndex: 10
  };

  return (
    <div style={cardWrapperStyle}>
      <Handle type="target" position={Position.Top} style={handleStyle} />

      {/* 1. BÖLME: FOTOĞRAF VE İSİM */}
      <div style={{ padding: '25px 15px 15px 15px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: '75px', height: '75px', borderRadius: '50%', overflow: 'hidden', border: `0.7px solid #000000`, background: theme.background, marginBottom: '15px', padding: '2px' }}>
          <img src={data.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="p" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        </div>
        <div style={{ fontWeight: '900', fontSize: '15px', color: theme.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {data.label}
        </div>
      </div>

      <div style={floatingSeparatorStyle} />

      {/* 2. BÖLME: MEVKİ */}
      <div style={{ padding: '12px 10px', textAlign: 'center' }}>
        <div style={{ color: theme.primary, fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
          {data.role}
        </div>
      </div>

      <div style={floatingSeparatorStyle} />

      {/* 3. BÖLME: SİYAH SEMBOL VE SAYI (Okunabilir Renk) */}
      <div style={{ padding: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
        <span style={blackSymbolFilter}>👥</span>
        <span style={{ color: theme.text, fontWeight: '900', fontSize: '16px' }}>
          {data.subordinateCount || 0}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  );
};

export default PersonnelNode;