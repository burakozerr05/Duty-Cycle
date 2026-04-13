import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const activeMessagesRef = useRef(new Set());
  const seenIdsRef = useRef(new Set());

  // 1. HAFIZA SİSTEMİ (LocalStorage'dan daha önce gösterilenleri yükle)
  useEffect(() => {
    const saved = localStorage.getItem('beton_seen_notifs');
    if (saved) {
      try {
        seenIdsRef.current = new Set(JSON.parse(saved));
      } catch (e) {
        seenIdsRef.current = new Set();
      }
    }
  }, []);

  const saveSeenId = (id) => {
    seenIdsRef.current.add(id);
    localStorage.setItem('beton_seen_notifs', JSON.stringify(Array.from(seenIdsRef.current)));
  };

  // Bildirimi manuel kapatma fonksiyonu
  const closeNotify = useCallback((id, message) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    activeMessagesRef.current.delete(message);
  }, []);

  const showNotify = useCallback((message, uniqueId) => {
    // KORUMA: Aynı mesaj ekrandayken veya bu ID daha önce gösterildiyse engelle
    if (!message || seenIdsRef.current.has(uniqueId) || activeMessagesRef.current.has(message)) return;

    const id = Math.random().toString(36).substr(2, 9);
    activeMessagesRef.current.add(message);
    if (uniqueId) saveSeenId(uniqueId);
    
    setNotifications((prev) => [...prev, { id, message }]);

    setTimeout(() => {
      setNotifications((prev) => {
        const exists = prev.find(n => n.id === id);
        if (exists) {
          activeMessagesRef.current.delete(message);
          return prev.filter((n) => n.id !== id);
        }
        return prev;
      });
    }, 5000);
  }, []);

  // --- OTOMATİK İZLEYİCİ (WATCHDOG) ---
  const runGlobalDataCheck = useCallback(() => {
    try {
      const archivedReports = JSON.parse(localStorage.getItem('beton_archived_reports') || '[]');
      const savedTasks = JSON.parse(localStorage.getItem('beton_tasks') || '[]');
      const currentUser = "BURAK"; // Admin/CEO ismi

      // 1. GÖREV SENARYOLARI
      savedTasks.forEach(task => {
        const assigned = (task.assignedTo || "").toUpperCase();
        const giver = (task.giver || "").toUpperCase();

        if (giver === currentUser && task.status === 'GÖREV DEVAM EDİYOR') {
          showNotify("BİR GÖREV VERDİNİZ.", `GIVE_SELF_${task.id}`);
        }

        if (assigned === currentUser && task.status === 'GÖREV DEVAM EDİYOR') {
          showNotify("YENİ BİR GÖREVİNİZ VAR! GÖREVLER SAYFASINDAN İNCELEYEBİLİRSİNİZ.", `NEW_TASK_ASSIGNED_${task.id}`);
        }
      });

      // 2. RAPOR SENARYOLARI
      archivedReports.forEach(report => {
        const sender = (report.personnelName || report.assignedTo || "").toUpperCase();

        // Sadece Ekip Raporları (Kullanıcının kendi rapor bildirimi artık manuel tetikleyiciden geliyor)
        if (!report.isArchivedByAdmin && !report.isWeekly) {
            if (sender !== currentUser) {
                showNotify("EKİP ÜYELERİNİZDEN BİR GÖREV RAPORU GELDİ!", `REP_ADMIN_${report.id}`);
            }
        }

        // HAFTALIK RAPOR BİLDİRİMİ BURADAN KALDIRILDI. 
        // ÇÜNKÜ ReportsPage.js içinde handleWeeklySubmit fonksiyonunda manuel olarak tetikleniyor.
      });

      // 3. MANUEL TETİKLENEN BİLDİRİMLER (Rapor sayfasındaki yeni bloğu yakalar)
      const manualNotifs = JSON.parse(localStorage.getItem('beton_notifications') || '[]');
      manualNotifs.forEach(notif => {
        if (!notif.isRead) {
          showNotify(notif.text, notif.id);
        }
      });

    } catch (err) { /* Sessiz hata */ }
  }, [showNotify]);

  // --- TETİKLEME ---
  useEffect(() => {
    const interval = setInterval(runGlobalDataCheck, 1500);
    
    // Tüm olası tetikleyicileri dinliyoruz
    window.addEventListener('storage', runGlobalDataCheck);
    window.addEventListener('beton_data_updated', runGlobalDataCheck);
    window.addEventListener('notificationsUpdated', runGlobalDataCheck);
    window.addEventListener('beton_new_notification', runGlobalDataCheck);
    
    runGlobalDataCheck();
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', runGlobalDataCheck);
      window.removeEventListener('beton_data_updated', runGlobalDataCheck);
      window.removeEventListener('notificationsUpdated', runGlobalDataCheck);
      window.removeEventListener('beton_new_notification', runGlobalDataCheck);
    };
  }, [runGlobalDataCheck]);

  return (
    <NotificationContext.Provider value={{ showNotify }}>
      {children}
      <div style={{
        position: 'fixed', top: '20px', right: '20px', zIndex: 9999999,
        display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none'
      }}>
        {notifications.map((n) => (
          <div key={n.id} style={{
            position: 'relative',
            background: '#000', color: '#fff', 
            padding: '10px 30px 10px 15px', // İç boşlukları daralttık
            borderRadius: '2px', fontSize: '11px', fontWeight: '900', // Fontu biraz küçülttük
            borderLeft: '4px solid #3B82F6', 
            minWidth: '240px', // Genişliği daralttık
            maxWidth: '320px',
            pointerEvents: 'auto', animation: 'fSlide 0.4s ease-out forwards',
            textTransform: 'uppercase', fontFamily: 'sans-serif',
            boxSizing: 'border-box',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.2)'
          }}>
            <style>{`@keyframes fSlide { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }`}</style>
            
            {/* Kapatma Butonu */}
            <button 
              onClick={() => closeNotify(n.id, n.message)}
              style={{
                position: 'absolute',
                top: '5px',
                right: '8px',
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold',
                padding: '0',
                lineHeight: '1',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#888'}
            >
              ×
            </button>

            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
export const useNotify = () => useContext(NotificationContext);