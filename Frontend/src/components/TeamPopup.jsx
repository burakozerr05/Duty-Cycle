import React, { useState } from 'react';
import { ROLE_AUTHORITY } from '../constants/colors';

/**
 * TEAM POPUP BİLEŞENİ
 * - Borderline: 0.7px (İnce).
 * - Fontlar: 900 Weight (Kalın).
 * - Takvim & Input: Arka plan BEYAZ (#FFFFFF), Yazı SİYAH (#000000).
 * - Tecrübe Alanları: Sektör, Firma, Pozisyon, Süre alanları mevcuttur.
 * - Kutu Görünümü: Ana arayüzdeki kartların (PersonnelNode) tam ikizi.
 */
const TeamPopup = ({ members, onClose, onAddMember, onRemoveMember, theme }) => {
  // --- DURUM YÖNETİMİ ---
  const [viewMode, setViewMode] = useState('list'); 
  const [activeTab, setActiveTab] = useState('list'); 
  
  // Yeni Personel Form Verileri
  const [formData, setFormData] = useState({ 
    label: '', 
    role: 'YAZILIM GELİŞTİRİCİ', 
    birthDate: '', 
    salary: '' 
  });

  // SEKTÖR TECRÜBESİ ALANLARI (Geri Getirildi)
  const [experiences, setExperiences] = useState([
    { id: Date.now(), sector: '', company: '', position: '', duration: '' }
  ]);

  // --- FONKSİYONLAR ---
  const handleTabToggle = (target) => {
    setActiveTab(activeTab === target ? 'list' : target);
  };

  const addExperienceField = () => {
    setExperiences([...experiences, { id: Date.now(), sector: '', company: '', position: '', duration: '' }]);
  };

  const handleAddMember = () => {
    // Formu ve tecrübeleri birleştirip ana sisteme gönderir
    onAddMember({ ...formData, experiences });
    setActiveTab('list');
  };

  const sortedMembers = [...members].sort((a, b) => {
    const authA = ROLE_AUTHORITY[a.role] || 99;
    const authB = ROLE_AUTHORITY[b.role] || 99;
    return authA - authB;
  });

  // --- KESKİN STİL TANIMLARI ---

  // KRALIN İSTEĞİ: BEYAZ TAKVİM VE GİRİŞ ALANLARI
  const blackInputStyle = {
    width: '100%',
    padding: '12px',
    marginBottom: '20px',
    backgroundColor: '#FFFFFF', // ARTIK BEYAZ
    border: `0.7px solid ${theme.border}`, 
    color: '#000000', // ARTIK SİYAH YAZI
    fontSize: '13px',
    fontWeight: '900', // KALIN FONT
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: '"Inter", sans-serif',
    colorScheme: 'light' // Takvim ikonunun siyah görünmesi için light yapıldı
  };

  const labelTitleStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '900',
    marginBottom: '8px',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: '1px'
  };

  const blackSymbolStyle = {
    filter: 'grayscale(100%) brightness(0)',
    fontSize: '16px',
    display: 'inline-block'
  };

  const floatingLineStyle = {
    width: '85%',
    height: '0.5px',
    backgroundColor: theme.border,
    margin: '12px auto',
    opacity: 0.25
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...popupBoxStyle, width: '1100px', background: theme.card, border: `0.7px solid ${theme.border}` }}>
        
        {/* ÜST MENÜ */}
        <div style={headerBarStyle(theme)}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              style={navButtonStyle(activeTab === 'add', theme)} 
              onClick={() => handleTabToggle('add')}
            >
              EKİP ARKADAŞI EKLE
            </button>
            <button 
              style={navButtonStyle(activeTab === 'remove', theme)} 
              onClick={() => handleTabToggle('remove')}
            >
              EKİP ARKADAŞI ÇIKAR
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            {/* GÖRÜNÜM BUTONU (SEMBOLLÜ TEK YER) */}
            <button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} style={viewToggleButtonStyle(theme)}>
              <span style={{ color: '#000000', fontSize: '24px' }}>{viewMode === 'list' ? '⊞' : '☰'}</span>
            </button>

            {/* SAF METİN X BUTONU */}
            <button onClick={onClose} style={closeButtonStyle}><span style={{ position: 'relative', top: '-1px' }}>X</span></button>
          </div>
        </div>

        {activeTab === 'add' ? (
          /* --- EKLEME FORMU (TAM DETAYLI) --- */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px' }}>
            {/* SOL: KİMLİK VE MAAŞ */}
            <div style={{ borderRight: `0.7px solid ${theme.border}`, paddingRight: '40px' }}>
              <div style={sectionTitleStyle(theme)}>KİMLİK BİLGİLERİ</div>
              <label style={labelTitleStyle}>AD SOYAD</label>
              <input style={blackInputStyle} onChange={(e) => setFormData({...formData, label: e.target.value.toUpperCase()})} />
              
              <label style={labelTitleStyle}>MEVKİ</label>
              <input style={{ ...blackInputStyle, opacity: 0.6 }} value={formData.role} readOnly />

              <label style={labelTitleStyle}>DOĞUM TARİHİ (BEYAZ TAKVİM)</label>
              <input type="date" style={blackInputStyle} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} />

              <label style={labelTitleStyle}>AYLIK MAAŞ (TL)</label>
              <input type="number" style={blackInputStyle} onChange={(e) => setFormData({...formData, salary: e.target.value})} />
            </div>

            {/* SAĞ: SEKTÖR TECRÜBESİ (DETAYLI LİSTE) */}
            <div>
              <div style={sectionTitleStyle(theme)}>SEKTÖR TECRÜBESİ</div>
              <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '15px' }}>
                {experiences.map((exp, index) => (
                  <div key={exp.id} style={experienceBoxStyle(theme)}>
                    <label style={labelTitleStyle}>SEKTÖR VE FİRMA</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input placeholder="SEKTÖR" style={blackInputStyle} />
                      <input placeholder="FİRMA ADI" style={blackInputStyle} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={labelTitleStyle}>POZİSYON</label>
                        <input placeholder="GELİŞTİRİCİ" style={blackInputStyle} />
                      </div>
                      <div>
                        <label style={labelTitleStyle}>SÜRE (YIL)</label>
                        <input placeholder="4" style={blackInputStyle} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addExperienceField} style={addExpBtnStyle(theme)}>+ TECRÜBE ALANI EKLE</button>
              <button style={saveMemberBtnStyle(theme)} onClick={handleAddMember}>PERSONELİ SİSTEME KAYDET</button>
            </div>
          </div>
        ) : (
          /* --- LİSTE VE KUTU GÖRÜNÜMÜ --- */
          <div style={viewMode === 'list' ? listWrapperStyle : gridWrapperStyle}>
            {sortedMembers.map(m => (
              <div key={m.id} style={viewMode === 'list' ? listItemStyle(theme) : gridItemStyle(theme)}>
                
                {/* KUTU GÖRÜNÜMÜ (ANA KARTLARIN BİREBİR İKİZİ) */}
                {viewMode === 'grid' ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {activeTab === 'remove' && (
                      <button onClick={() => onRemoveMember(m.id)} style={gridRemoveBtnStyle}>ÇIKAR</button>
                    )}
                    <div style={gridPhotoWrapperStyle(theme)}>
                      <img src={m.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="p" style={{ width: '100%' }} />
                    </div>
                    {/* İsimlerin görünmesi için theme.text (Siyah) kullandık */}
                    <div style={{ fontWeight: '900', fontSize: '14px', color: theme.text, textTransform: 'uppercase' }}>{m.label}</div>
                    <div style={floatingLineStyle} />
                    <div style={{ color: theme.primary, fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}>{m.role}</div>
                    <div style={floatingLineStyle} />
                    {/* Siyah Sembol ve Sayı */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={blackSymbolStyle}>👥</span>
                      <span style={{ fontWeight: '900', fontSize: '14px', color: theme.text }}>{m.subordinateCount || 0}</span>
                    </div>
                  </div>
                ) : (
                  /* LİSTE GÖRÜNÜMÜ */
                  <>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '900', fontSize: '14px', color: theme.text }}>{m.label}</div>
                      <div style={{ fontSize: '10px', color: theme.primary, fontWeight: '900' }}>{m.role}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={countBadgeStyle(theme)}>
                        <span style={blackSymbolStyle}>👥</span>
                        <span style={{ marginLeft: '8px', fontWeight: '900', color: theme.text }}>{m.subordinateCount || 0}</span>
                      </div>
                      {activeTab === 'remove' && <button onClick={() => onRemoveMember(m.id)} style={fireButtonStyle}>ÇIKAR</button>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- STİLLER ---
const overlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' };
const popupBoxStyle = { padding: '50px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' };
const headerBarStyle = (theme) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: `0.7px solid ${theme.border}`, paddingBottom: '25px' });
const navButtonStyle = (active, theme) => ({ padding: '12px 25px', cursor: 'pointer', border: `0.7px solid ${theme.border}`, background: active ? '#000000' : 'transparent', color: active ? '#FFFFFF' : theme.text, fontWeight: '900', fontSize: '11px', textTransform: 'uppercase' });
const viewToggleButtonStyle = (theme) => ({ background: '#FFFFFF', border: `0.7px solid #000000`, cursor: 'pointer', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const closeButtonStyle = { background: '#EF4444', border: '0.7px solid #000000', color: '#FFFFFF', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', fontWeight: '900' };
const listWrapperStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const gridWrapperStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' };
const listItemStyle = (theme) => ({ display: 'flex', alignItems: 'center', padding: '18px 25px', background: theme.background, border: `0.7px solid ${theme.border}` });
const gridItemStyle = (theme) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px', background: theme.background, border: `0.7px solid ${theme.border}`, borderRadius: '10px' });
const gridPhotoWrapperStyle = (theme) => ({ width: '65px', height: '65px', borderRadius: '50%', overflow: 'hidden', border: `0.7px solid #000000`, marginBottom: '15px', padding: '2px', background: theme.card });
const countBadgeStyle = (theme) => ({ fontSize: '13px', fontWeight: '900', padding: '8px 16px', background: theme.card, border: `0.7px solid #000000`, display: 'flex', alignItems: 'center' });
const sectionTitleStyle = (theme) => ({ fontSize: '18px', fontWeight: '900', marginBottom: '25px', color: theme.text, borderBottom: `0.7px solid ${theme.border}`, paddingBottom: '10px', textTransform: 'uppercase' });
const experienceBoxStyle = (theme) => ({ padding: '20px', border: `0.7px solid ${theme.border}`, marginBottom: '20px', background: theme.background });
const addExpBtnStyle = (theme) => ({ width: '100%', padding: '12px', background: 'transparent', border: `0.7px dashed ${theme.primary}`, color: theme.primary, fontWeight: '900', cursor: 'pointer', fontSize: '11px', marginBottom: '15px' });
const saveMemberBtnStyle = (theme) => ({ width: '100%', background: theme.primary, color: 'white', padding: '20px', border: '0.7px solid #000000', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' });
const fireButtonStyle = { background: '#000000', color: '#FFFFFF', border: 'none', padding: '8px 15px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' };
const gridRemoveBtnStyle = { background: '#000000', color: '#FFFFFF', border: 'none', padding: '5px 12px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', marginBottom: '15px' };

export default TeamPopup;