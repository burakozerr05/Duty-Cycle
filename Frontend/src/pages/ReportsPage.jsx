import React, { useState, useEffect } from 'react';

/**
 * REPORTS PAGE (V34 - WEEKLY STATUS NOTIFICATIONS ADDED)
 * - Haftalık durum gönderildiğinde yetkiliye bildirim gider.
 * - Haftanın ilk gününde alan açıldığında sorumluya bildirim gider.
 * - Merkezi bildirim sistemi (Watchdog) ile uyumludur.
 */

const ReportsPage = ({ theme, tasks = [], onBack }) => {
  const [activeTab, setActiveTab] = useState('myReports'); 
  const [selectedReport, setSelectedReport] = useState(null); 
  const [weeklyText, setWeeklyText] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  
  // --- KALICILIK (LOCAL STORAGE) ---
  const [archivedReports, setArchivedReports] = useState(() => {
    const saved = localStorage.getItem('beton_archived_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [archivedWeekly, setArchivedWeekly] = useState(() => {
    const saved = localStorage.getItem('beton_archived_weekly');
    return saved ? JSON.parse(saved) : [];
  });

  const [reportData, setReportData] = useState({});

  useEffect(() => {
    localStorage.setItem('beton_archived_reports', JSON.stringify(archivedReports));
  }, [archivedReports]);

  useEffect(() => {
    localStorage.setItem('beton_archived_weekly', JSON.stringify(archivedWeekly));
  }, [archivedWeekly]);

  // --- HAFTALIK ALAN AÇILMA TETİKLEYİCİSİ (PAZARTESİ KONTROLÜ) ---
  useEffect(() => {
    const checkWeeklyOpeningNotification = () => {
      const today = new Date();
      const isMonday = today.getDay() === 1; // 1 = Pazartesi
      const currentWeekKey = `weekly_notif_sent_${today.getFullYear()}_${getWeekNumber(today)}`;
      const alreadySent = localStorage.getItem(currentWeekKey);

      // Eğer bugün Pazartesi ise ve bu hafta için "açıldı" bildirimi henüz atılmadıysa
      if (isMonday && !alreadySent) {
        const existingNotifs = JSON.parse(localStorage.getItem('beton_notifications') || '[]');
        const openNotif = {
          id: Date.now() + 50,
          text: "Haftalık Durum alanı açıldı, bu haftaki durumunuzu yazabilirsiniz.",
          type: 'info',
          timestamp: new Date().toISOString(),
          isRead: false
        };
        localStorage.setItem('beton_notifications', JSON.stringify([...existingNotifs, openNotif]));
        localStorage.setItem(currentWeekKey, 'true'); // Tekrar atmaması için işaretle
        
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      }
    };

    checkWeeklyOpeningNotification();
  }, []);

  // --- HAFIZA SİFİRLAMA ---
  const handleClearMemory = () => {
    if (window.confirm("Tüm rapor arşivi ve ekip raporları silinecek. Emin misiniz?")) {
      localStorage.removeItem('beton_archived_reports');
      localStorage.removeItem('beton_archived_weekly');
      localStorage.removeItem('beton_seen_notifs'); 
      window.location.reload();
    }
  };

  // --- YARDIMCI FONKSİYONLAR ---
  const getWeeklyTitle = (targetDate = new Date()) => {
    const months = ["OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN", "TEMMUZ", "AĞUSTOS", "EYLÜL", "EKİM", "KASIM", "ARALIK"];
    const monthName = months[targetDate.getMonth()];
    const date = targetDate.getDate();
    const weekNumber = Math.ceil(date / 7);
    return `${monthName} ${weekNumber}. HAFTA RAPORU`;
  };

  const getWeekNumber = (d) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const hasSentWeeklyThisWeek = archivedReports.some(r => {
    if (!r.isWeekly) return false;
    const reportDate = new Date(r.createdAt || Date.now());
    const currentWeek = getWeekNumber(new Date());
    const reportWeek = getWeekNumber(reportDate);
    return reportWeek === currentWeek && reportDate.getFullYear() === new Date().getFullYear();
  });

  // --- VERİ FİLTRELEME ---
  const pendingReports = (tasks || []).filter(task => 
    task.status === 'Tamamlandı' && !archivedReports.find(r => r.id === task.id)
  );

  const teamTaskReports = archivedReports.filter(r => !r.isWeekly && !r.isArchivedByAdmin);

  const teamWeeklyReports = archivedReports.filter(r => {
    if (!r.isWeekly) return false;
    const reportDate = new Date(r.createdAt || Date.now());
    const currentWeek = getWeekNumber(new Date());
    const reportWeek = getWeekNumber(reportDate);
    return reportWeek === currentWeek && reportDate.getFullYear() === new Date().getFullYear();
  });

  const completedReports = archivedReports.map(rep => ({
    ...rep,
    isFinal: true
  }));

  // --- AKSİYONLAR ---
  const handleOpenReport = (report) => {
    setSelectedReport(report);
    setShowFeedbackInput(false);
    setFeedbackText("");
  };

  const handleSaveReport = () => {
    if (!selectedReport) return;
    const finalData = { 
      ...selectedReport, 
      ...reportData, 
      archiveDate: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0,5),
      createdAt: new Date().toISOString(),
      isFinal: true,
      isWeekly: false,
      isArchivedByAdmin: false,
      adminFeedback: ""
    };
    
    setArchivedReports(prev => [...prev, finalData]);

    // --- BİLDİRİM TRIGGERI ---
    const existingNotifs = JSON.parse(localStorage.getItem('beton_notifications') || '[]');
    const newNotifs = [
      {
        id: Date.now() + 1,
        text: "Bir görev raporu gönderdiniz.",
        type: 'info',
        timestamp: new Date().toISOString(),
        isRead: false
      },
      {
        id: Date.now() + 2,
        text: "Ekibinizden yeni bir 'Görev Raporu' geldi! Raporlar sayfasından inceleyebilirsiniz.",
        type: 'success',
        timestamp: new Date().toISOString(),
        isRead: false
      }
    ];
    localStorage.setItem('beton_notifications', JSON.stringify([...existingNotifs, ...newNotifs]));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    // -------------------------

    setSelectedReport(null);
    setReportData({});
  };

  const handleWeeklySubmit = () => {
    if (!weeklyText.trim() || hasSentWeeklyThisWeek) return;
    const dynamicTitle = getWeeklyTitle();
    const newWeekly = {
      id: Date.now(),
      title: dynamicTitle,
      assignedTo: "EKİP ÜYESİ",
      content: weeklyText,
      archiveDate: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0,5),
      createdAt: new Date().toISOString(),
      isWeekly: true,
      isFinal: true,
      isArchivedByAdmin: false,
      adminFeedback: ""
    };
    setArchivedReports(prev => [...prev, newWeekly]);
    setArchivedWeekly(prev => [...prev, newWeekly]);
    setWeeklyText("");

    // --- HAFTALIK DURUM BİLDİRİM TRIGGERI ---
    const existingNotifs = JSON.parse(localStorage.getItem('beton_notifications') || '[]');
    const weeklyNotifs = [
      {
        id: Date.now() + 20,
        text: "Haftalık durum raporunuz başarıyla iletildi.",
        type: 'info',
        timestamp: new Date().toISOString(),
        isRead: false
      },
      {
        id: Date.now() + 21,
        text: "Ekibinizden yeni bir 'Haftalık Durum' geldi!",
        type: 'success',
        timestamp: new Date().toISOString(),
        isRead: false
      }
    ];
    localStorage.setItem('beton_notifications', JSON.stringify([...existingNotifs, ...weeklyNotifs]));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    // ----------------------------------------
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) return;
    const updatedReports = archivedReports.map(r => {
      if (r.id === selectedReport.id) {
        return { 
          ...r, 
          adminFeedback: feedbackText, 
          isArchivedByAdmin: true,
          archivedAt: new Date().toISOString()
        };
      }
      return r;
    });
    setArchivedReports(updatedReports);

    // --- FEEDBACK BİLDİRİM TRIGGERI ---
    const existingNotifs = JSON.parse(localStorage.getItem('beton_notifications') || '[]');
    const feedbackNotifs = [
      {
        id: Date.now() + 10,
        text: "Bir rapora feedback verdiniz.",
        type: 'info',
        timestamp: new Date().toISOString(),
        isRead: false
      },
      {
        id: Date.now() + 11,
        text: "Yeni bir Feedbackiniz var! Arşivinizden bakabilirsiniz.",
        type: 'success',
        timestamp: new Date().toISOString(),
        isRead: false
      }
    ];
    localStorage.setItem('beton_notifications', JSON.stringify([...existingNotifs, ...feedbackNotifs]));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    // ----------------------------------

    setSelectedReport(null);
    setShowFeedbackInput(false);
  };

  const isReadOnly = selectedReport?.isFinal === true;

  // --- STİLLER ---
  const pageContainer = {
    width: '100%',
    height: '100vh',
    background: theme.background,
    color: '#000000',
    fontFamily: '"Inter", sans-serif',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflow: 'hidden'
  };

  const headerSection = {
    padding: '40px 30px 20px 105px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const headerTitleStyle = {
    fontSize: '32px',
    fontWeight: '900',
    color: '#000000',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    borderLeft: '8px solid #000000',
    paddingLeft: '20px',
    margin: 0
  };

  const backButtonStyle = {
    padding: '12px 24px',
    background: '#000000',
    color: '#FFFFFF',
    border: 'none',
    fontWeight: '900',
    fontSize: '11px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    boxShadow: '6px 6px 0px rgba(0,0,0,0.2)'
  };

  const resetButtonStyle = {
    padding: '12px 24px',
    background: '#FF3B30',
    color: '#FFFFFF',
    border: 'none',
    fontWeight: '900',
    fontSize: '11px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    boxShadow: '6px 6px 0px rgba(0,0,0,0.2)',
    marginRight: '15px'
  };

  const tabContainer = {
    display: 'flex',
    paddingLeft: '105px', 
    paddingRight: '30px',
    borderBottom: `2.5px solid #000000`,
    gap: '5px',
    marginTop: '10px'
  };

  const tabStyle = (isActive) => ({
    padding: '12px 35px',
    cursor: 'pointer',
    background: isActive ? '#000000' : '#FFFFFF',
    border: `2.5px solid #000000`,
    borderBottom: 'none',
    marginBottom: '-2.5px',
    borderRadius: '0', 
    fontWeight: '900',
    fontSize: '11px',
    color: isActive ? '#FFFFFF' : '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  });

  const contentArea = {
    flex: 1,
    padding: '20px 30px 40px 105px', 
    display: 'flex',
    gap: '20px',
    boxSizing: 'border-box',
    maxHeight: 'calc(100vh - 200px)',
    overflow: 'hidden'
  };

  const listSection = (flexWeight) => ({
    flex: flexWeight,
    background: '#FFFFFF',
    border: `2.5px solid #000000`,
    borderRadius: '0', 
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    padding: '25px',
    boxShadow: '8px 8px 0px rgba(0,0,0,0.05)'
  });

  const reportCardStyle = {
    padding: '15px',
    borderBottom: `1px solid #EEEEEE`,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const inputAreaStyle = {
    width: '100%',
    padding: '12px',
    background: '#FFFFFF',
    color: '#000000',
    border: '2px solid #000',
    fontWeight: '600',
    minHeight: '100px',
    borderRadius: '0',
    outline: 'none',
    boxSizing: 'border-box',
    fontSize: '13px'
  };

  // --- RENDER MODÜLLERİ ---
  const renderMyReports = () => (
    <div style={contentArea}>
      <div style={listSection(3)}>
        <h2 style={{ fontWeight: '900', fontSize: '16px', marginBottom: '25px', borderLeft: '5px solid #000', paddingLeft: '15px' }}>BEKLEYEN RAPORLARIM</h2>
        {pendingReports.length > 0 ? pendingReports.map(task => (
          <div key={task.id} style={reportCardStyle} onClick={() => handleOpenReport(task)}>
            <div>
              <div style={{ fontWeight: '900', fontSize: '14px', textTransform: 'uppercase' }}>{task.assignedTo}</div>
              <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: '700' }}>GÖREV: {task.title?.toUpperCase()}</div>
            </div>
            <div style={{ fontSize: '9px', fontWeight: '900', color: '#000' }}>RAPOR YAZ</div>
          </div>
        )) : (
          <div style={{ padding: '20px', textAlign: 'center', opacity: 0.4, fontWeight: '800' }}>YAZILACAK RAPORUNUZ BULUNMAMAKTADIR.</div>
        )}
      </div>

      <div style={listSection(1.5)}>
        <h2 style={{ fontWeight: '900', fontSize: '14px', marginBottom: '15px' }}>HAFTALIK DURUM</h2>
        <p style={{ fontSize: '10px', marginBottom: '15px', fontWeight: '700', opacity: 0.7 }}>{getWeeklyTitle()}</p>
        
        {!hasSentWeeklyThisWeek ? (
          <>
            <textarea 
              style={{ ...inputAreaStyle, flex: 1, minHeight: '200px', marginBottom: '15px', resize: 'none' }}
              placeholder="İlerlemenizi, modunuzu ve haftalık özetinizi yazın..."
              value={weeklyText}
              onChange={(e) => setWeeklyText(e.target.value)}
            />
            <button 
              style={{ padding: '18px', background: '#000000', color: '#FFF', border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase' }}
              onClick={handleWeeklySubmit}
            >
              DURUMU GÖNDER
            </button>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F5F5F5', border: '2px dashed #CCC', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>✅</div>
            <div style={{ fontSize: '11px', fontWeight: '900', color: '#666', textTransform: 'uppercase' }}>BU HAFTAKİ DURUMUNUZU GÖNDERDİNİZ.</div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#999', marginTop: '5px' }}>GELECEK HAFTA TEKRAR GİRİŞ YAPABİLİRSİNİZ.</div>
          </div>
        )}
      </div>
    </div>
  );

  const renderArchive = () => (
    <div style={contentArea}>
      <div style={listSection(2)}>
        <h2 style={{ fontWeight: '900', fontSize: '16px', marginBottom: '25px', borderLeft: '5px solid #000', paddingLeft: '15px' }}>GÖREV RAPORLARI ARŞİVİ</h2>
        {completedReports.filter(r => !r.isWeekly).length > 0 ? completedReports.filter(r => !r.isWeekly).map((rep, idx) => (
          <div key={idx} style={reportCardStyle} onClick={() => handleOpenReport(rep)}>
            <div>
              <div style={{ fontWeight: '900', fontSize: '14px', textTransform: 'uppercase' }}>{rep.assignedTo}</div>
              <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: '700' }}>{rep.title?.toUpperCase()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', fontWeight: '900' }}>{rep.archiveDate}</div>
            </div>
          </div>
        )) : (
          <div style={{ padding: '20px', textAlign: 'center', opacity: 0.4, fontWeight: '800' }}>ARŞİV BOŞ.</div>
        )}
      </div>

      <div style={listSection(1)}>
        <h2 style={{ fontWeight: '900', fontSize: '16px', marginBottom: '25px', borderLeft: '5px solid #000', paddingLeft: '15px' }}>HAFTALIK ARŞİV</h2>
        {archivedWeekly.map((w, idx) => (
          <div key={idx} style={reportCardStyle} onClick={() => handleOpenReport(w)}>
            <div>
              <div style={{ fontWeight: '900', fontSize: '12px' }}>{w.title}</div>
              <div style={{ fontSize: '9px', fontWeight: '700', opacity: 0.6 }}>{w.archiveDate}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTeamReports = () => (
    <div style={contentArea}>
      <div style={listSection(2)}>
        <h2 style={{ fontWeight: '900', fontSize: '16px', marginBottom: '25px', borderLeft: '5px solid #000', paddingLeft: '15px' }}>EKİP RAPORLARI (AKTİF)</h2>
        {teamTaskReports.length > 0 ? teamTaskReports.map((rep, idx) => (
          <div key={idx} style={reportCardStyle} onClick={() => handleOpenReport(rep)}>
            <div>
              <div style={{ fontWeight: '900', textTransform: 'uppercase' }}>{rep.assignedTo}</div>
              <div style={{ fontSize: '10px', fontWeight: '700' }}>{rep.title?.toUpperCase()}</div>
            </div>
            <div style={{ fontSize: '9px', fontWeight: '900' }}>FEEDBACK BEKLİYOR</div>
          </div>
        )) : (
          <div style={{ padding: '20px', textAlign: 'center', fontWeight: '800', opacity: 0.5 }}>AKTİF GÖREV RAPORU YOK.</div>
        )}
      </div>

      <div style={listSection(1.5)}>
        <h2 style={{ fontWeight: '900', fontSize: '16px', marginBottom: '25px', borderLeft: '5px solid #000', paddingLeft: '15px' }}>EKİP HAFTALIK ÖZETLERİ</h2>
        {teamWeeklyReports.length > 0 ? teamWeeklyReports.map((rep, idx) => (
          <div key={idx} style={reportCardStyle} onClick={() => handleOpenReport(rep)}>
            <div>
              <div style={{ fontWeight: '900', fontSize: '12px' }}>{rep.title}</div>
              <div style={{ fontSize: '9px', fontWeight: '700', opacity: 0.6 }}>GİRİŞ: {rep.archiveDate}</div>
            </div>
            <div style={{ fontSize: '9px', fontWeight: '900' }}>YENİ</div>
          </div>
        )) : (
          <div style={{ opacity: 0.4, fontSize: '11px', fontWeight: '800', textAlign: 'center', marginTop: '20px' }}>BU HAFTA İÇİN ÖZET YOK.</div>
        )}
      </div>
    </div>
  );

  return (
    <div style={pageContainer}>
      <div style={headerSection}>
        <h1 style={headerTitleStyle}>RAPORLAR & DURUM</h1>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={handleClearMemory} style={resetButtonStyle}>HAFIZAYI SIFIRLA</button>
          <button onClick={onBack} style={backButtonStyle}>GERİ DÖN</button>
        </div>
      </div>

      <div style={tabContainer}>
        <div style={tabStyle(activeTab === 'myReports')} onClick={() => setActiveTab('myReports')}>RAPORLARIM</div>
        <div style={tabStyle(activeTab === 'teamReports')} onClick={() => setActiveTab('teamReports')}>EKİP RAPORLARI</div>
        <div style={tabStyle(activeTab === 'archive')} onClick={() => setActiveTab('archive')}>ARŞİV</div>
      </div>

      {activeTab === 'myReports' && renderMyReports()}
      {activeTab === 'teamReports' && renderTeamReports()}
      {activeTab === 'archive' && renderArchive()}

      {/* RAPOR DETAY POPUP */}
      {selectedReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20000 }}>
          <div style={{ background: '#FFFFFF', width: '750px', maxHeight: '94vh', margin: '20px auto', border: `3px solid #000000`, padding: '40px', overflowY: 'auto', position: 'relative', boxSizing: 'border-box' }}>
            
            <button 
              onClick={() => setSelectedReport(null)} 
              style={{ 
                position: 'absolute', 
                right: '25px', 
                top: '25px', 
                background: '#000', 
                color: '#FFF', 
                border: 'none', 
                fontWeight: '900', 
                cursor: 'pointer', 
                width: '35px', 
                height: '35px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '20px', 
                padding: '0', 
                lineHeight: '1' 
              }}
            >
              <span style={{ marginTop: '-2px' }}>×</span>
            </button>
            
            <h2 style={{ fontWeight: '900', fontSize: '20px', marginBottom: '35px', borderBottom: `4px solid #000`, paddingBottom: '15px', textTransform: 'uppercase', paddingRight: '40px' }}>
              {selectedReport.title?.toUpperCase()}
            </h2>

            {selectedReport.isWeekly ? (
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', fontWeight: '600', lineHeight: '1.6', background: '#F9F9F9', padding: '25px', border: '2px solid #000', marginBottom: '20px' }}>
                {selectedReport.content}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '45px' }}>
                  <label style={{ display: 'block', fontWeight: '900', fontSize: '10px', marginBottom: '25px', textTransform: 'uppercase' }}>GÖREV ZORLUĞU SEÇİMİ</label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px', maxWidth: '650px' }}>
                    {[
                      { val: '1', label: 'ÇOK KOLAY' },
                      { val: '2', label: 'KOLAY' },
                      { val: '3', label: 'KARARSIZIM' },
                      { val: '4', label: 'ZOR' },
                      { val: '5', label: 'ÇOK ZOR' }
                    ].map((item) => (
                      <div key={item.val} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <span style={{ fontSize: '8px', fontWeight: '900', marginBottom: '10px', textAlign: 'center', height: '10px' }}>{item.label}</span>
                        <div 
                          onClick={() => !isReadOnly && setReportData({...reportData, difficulty: item.val})}
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%', 
                            border: '2.5px solid #000', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            cursor: isReadOnly ? 'default' : 'pointer',
                            background: (reportData.difficulty || selectedReport.difficulty) === item.val ? '#000' : 'transparent',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {(reportData.difficulty || selectedReport.difficulty) === item.val && (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFF' }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {[
                  { label: 'KULLANILAN YETKİNLİKLER', key: 'skills' },
                  { label: 'NASIL HİSSETTİNİZ?', key: 'feeling' },
                  { label: 'ODAK VE UYUMLULUK', key: 'focus' },
                  { label: 'NELER ÖĞRENDİNİZ?', key: 'learning' },
                  { label: 'KARŞILAŞILAN ENGELLER', key: 'blockers' },
                  { label: 'GENEL YORUM', key: 'comment' }
                ].map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', fontWeight: '900', fontSize: '10px', marginBottom: '8px', textTransform: 'uppercase' }}>{item.label}</label>
                    <textarea 
                      disabled={isReadOnly}
                      style={inputAreaStyle}
                      value={selectedReport[item.key] || reportData[item.key] || ""}
                      onChange={(e) => !isReadOnly && setReportData({...reportData, [item.key]: e.target.value})}
                    />
                  </div>
                ))}
              </>
            )}

            {selectedReport.adminFeedback && (
              <div style={{ marginTop: '20px', padding: '20px', background: '#F5F5F5', border: '2.5px solid #000' }}>
                <label style={{ fontWeight: '900', fontSize: '10px', display: 'block', marginBottom: '10px', color: '#666' }}>YETKİLİ FEEDBACK NOTU</label>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#000' }}>{selectedReport.adminFeedback}</div>
              </div>
            )}

            {!selectedReport.isWeekly && activeTab === 'teamReports' && !showFeedbackInput && (
              <button 
                style={{ width: '100%', padding: '20px', background: '#000', color: '#FFF', fontWeight: '900', border: 'none', cursor: 'pointer', marginTop: '20px' }}
                onClick={() => setShowFeedbackInput(true)}
              >
                FEEDBACK VER VE ARŞİVLE
              </button>
            )}

            {showFeedbackInput && (
              <div style={{ marginTop: '20px', borderTop: '4px solid #000', paddingTop: '20px' }}>
                <label style={{ fontWeight: '900', fontSize: '10px', display: 'block', marginBottom: '10px' }}>YETKİLİ GÖRÜŞÜ</label>
                <textarea 
                  style={{ ...inputAreaStyle, minHeight: '120px' }} 
                  placeholder="Ekip üyesine iletilecek notu yazın..." 
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
                <button 
                  style={{ width: '100%', padding: '15px', background: '#000', color: '#FFF', fontWeight: '900', border: 'none', cursor: 'pointer', marginTop: '10px' }}
                  onClick={handleSubmitFeedback}
                >
                  FEEDBACK'İ ONAYLA VE ARŞİVE TAŞI
                </button>
              </div>
            )}

            {!isReadOnly && !selectedReport.isWeekly && activeTab === 'myReports' && (
              <button 
                style={{ width: '100%', padding: '20px', background: '#000', color: '#FFF', fontWeight: '900', border: 'none', cursor: 'pointer', marginTop: '20px' }} 
                onClick={handleSaveReport}
              >
                RAPORU TAMAMLA VE GÖNDER
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;