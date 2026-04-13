import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNotify } from '../NotificationContext'; // Bildirim sistemi enjekte edildi

/**
 * TASKS PAGE - GÖREV YÖNETİM MERKEZİ (V45 - TIME SENSITIVE SYSTEM)
 * - Deadline sistemi Saat (Time) hassasiyetine kavuşturuldu.
 * - Geçmiş zamanlı görev girişi engellendi.
 * - Süresi dolan görevler otomatik kütüphaneye aktarılır.
 * - Kütüphanedeki başarı/başarısız durumu saat bazlı hesaplanır.
 */
const TasksPage = ({ theme, user, personnel = [], tasks = [], setTasks, onBack }) => {
    const { showNotify } = useNotify(); // Bildirim ateşleyici fonksiyon alındı

    // --- STATE YÖNETİMİ ---
    const [viewMode, setViewMode] = useState('all'); 
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const fileInputRef = useRef(null);
    const [activeTaskForUpload, setActiveTaskForUpload] = useState(null);
    const [formFiles, setFormFiles] = useState([null]);

    const [newForm, setNewForm] = useState({
        id: null, assignedTo: '', title: '', detail: '', deadline: '', deadlineTime: '23:59'
    });

    // --- KRİTİK: LOCALSTORAGE ENJEKSİYONU ---
    useEffect(() => {
        if (tasks && tasks.length > 0) {
            localStorage.setItem('beton_tasks', JSON.stringify(tasks));
        }
    }, [tasks]);

    // --- PROFESYONEL JİLET TEMA ---
    const activeTheme = useMemo(() => ({
        background: '#FFFFFF',
        border: '#000000',
        gridLine: 'rgba(0, 0, 0, 0.15)', 
        headerBg: '#F1F5F9',
        text: '#000000'
    }), []);

    const safeUser = user || { name: "BURAK", role: "CEO" };
    const safePersonnel = Array.isArray(personnel) ? personnel : [];
    const safeTasks = Array.isArray(tasks) ? tasks : [];

    // --- MANTIKSAL FİLTRELEME & OTOMATİK ARŞİVLEME ---
    const sortedTasks = useMemo(() => {
        let baseTasks = [...safeTasks];
        const now = new Date();

        if (viewMode === 'library') {
            return baseTasks.filter(t => {
                if (t.status === 'Tamamlandı') return true;
                if (!t.deadline || t.deadline === 'Süresiz') return false;
                
                const dDate = new Date(`${t.deadline}T${t.deadlineTime || '23:59'}`);
                return dDate < now;
            }).sort((a, b) => b.id.localeCompare(a.id));
        }

        const activeTasks = baseTasks.filter(t => {
            if (t.status === 'Tamamlandı') return false;
            if (!t.deadline || t.deadline === 'Süresiz') return true;

            const dDate = new Date(`${t.deadline}T${t.deadlineTime || '23:59'}`);
            return dDate >= now;
        });

        if (viewMode === 'myTasks') {
            return activeTasks.filter(t => t.assignedTo === safeUser.name);
        }
        
        return activeTasks.filter(t => t.giver === safeUser.name).sort((a, b) => {
            if (!a.assignedTo || !b.assignedTo) return 0;
            return a.assignedTo.toUpperCase().localeCompare((b.assignedTo || "").toUpperCase());
        });
    }, [safeTasks, viewMode, safeUser.name]);

    const getStats = (personName) => {
        const personTasks = safeTasks.filter(t => t.assignedTo === personName);
        const completed = personTasks.filter(t => t.status === 'Tamamlandı').length;
        const total = personTasks.length;
        return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
    };

    const checkSuccess = (deadline, deadlineTime, status) => {
        if (status === 'Tamamlandı') return { label: 'BAŞARILI', color: '#000' };
        if (!deadline || deadline === 'Süresiz') return { label: 'SÜRESİZ', color: '#666' };
        
        const dDate = new Date(`${deadline}T${deadlineTime || '23:59'}`);
        const now = new Date();
        
        if (dDate >= now) return { label: 'DEVAM EDİYOR', color: '#000' };
        return { label: 'BAŞARISIZ / SÜRE DOLDU', color: '#D00' };
    };

    const handleAction = (task) => {
        if (viewMode === 'library') return;
        setTasks(prev => {
            const updated = prev.map(t => {
                if (t.id === task.id) {
                    // SENARYO 1: Sorumlu (Yapan Kişi) "TAMAMLA" butonuna basıyor
                    if (viewMode === 'myTasks' && t.assignedTo === safeUser.name) {
                        if (t.status === 'GÖREV DEVAM EDİYOR' || t.status === '..' || t.status === 'Beklemede') {
                            // Bildirimleri tetikle
                            showNotify("BİR GÖREVİ TAMAMLADINIZ.", `USER_DONE_${t.id}`);
                            showNotify("VERDİĞİNİZ GÖREVLERDEN BİRİ TAMAMLANDI! ONAY İÇİN SİZİ BEKLİYOR.", `GIVER_WAITING_${t.id}`);
                            
                            return { ...t, status: 'ONAY BEKLİYOR' };
                        }
                    }
                    // SENARYO 2: Yetkili (Veren Kişi) "ONAYLA" butonuna basıyor
                    if (viewMode === 'all' && t.giver === safeUser.name && t.status === 'ONAY BEKLİYOR') {
                        // --- YENİ BİLDİRİM TRIGGERLARI ENJEKTE EDİLDİ ---
                        showNotify("Bir görevi onayladınız.", `GIVER_APPROVED_${t.id}`);
                        showNotify("Bir göreviniz onaylandı! Raporlar sayfasından görev raporunuzu doldurabilirsiniz.", `USER_APPROVED_${t.id}`);
                        // ------------------------------------------------
                        
                        return { ...t, status: 'Tamamlandı' };
                    }
                }
                return t;
            });
            localStorage.setItem('beton_tasks', JSON.stringify(updated));
            // ÇAKIŞMAYI ÖNLEYEN TETİKLEYİCİ:
            window.dispatchEvent(new Event('beton_data_updated'));
            return updated;
        });
    };

    const deleteTask = (id) => {
        if (viewMode === 'library') return;
        setTasks(prev => {
            const updated = prev.filter(t => t.id !== id);
            localStorage.setItem('beton_tasks', JSON.stringify(updated));
            window.dispatchEvent(new Event('beton_data_updated'));
            return updated;
        });
    };

    const openUpdate = (task) => {
        if (viewMode === 'library') return;
        setNewForm({
            id: task.id, assignedTo: task.assignedTo, title: task.title,
            detail: task.description || task.detail, 
            deadline: task.deadline, 
            deadlineTime: task.deadlineTime || '23:59'
        });
        const existingFiles = Array.isArray(task.giverFiles) ? [...task.giverFiles] : (task.giverFiles ? [task.giverFiles] : []);
        setFormFiles([...existingFiles, null]);
        setIsUpdating(true);
        setIsAddModalOpen(true);
    };

    const handleSaveTask = (e) => {
        e.preventDefault();
        
        const inputDateTime = new Date(`${newForm.deadline}T${newForm.deadlineTime}`);
        const now = new Date();

        if (inputDateTime < now) {
            alert("Hata: Geçmiş bir tarih veya saate görev atayamazsınız!");
            return;
        }

        const finalFiles = formFiles.filter(f => f !== null).map(f => {
            if (typeof f === 'object' && f instanceof File) {
                const url = URL.createObjectURL(f);
                return { url, name: f.name };
            }
            return f;
        });

        if (isUpdating) {
            setTasks(prev => {
                const updated = prev.map(t => t.id === newForm.id ? { 
                    ...t, assignedTo: newForm.assignedTo, title: newForm.title, 
                    description: newForm.detail, deadline: newForm.deadline,
                    deadlineTime: newForm.deadlineTime,
                    giverFiles: finalFiles
                } : t);
                localStorage.setItem('beton_tasks', JSON.stringify(updated));
                window.dispatchEvent(new Event('beton_data_updated'));
                return updated;
            });
        } else {
            const newTask = {
                id: `task-${Date.now()}`, assignedTo: newForm.assignedTo, giver: safeUser.name,
                title: newForm.title, description: newForm.detail, 
                deadline: newForm.deadline || 'Süresiz',
                deadlineTime: newForm.deadlineTime || '23:59',
                status: "GÖREV DEVAM EDİYOR", 
                giverFiles: finalFiles, 
                userFiles: []
            };

            setTasks(prev => {
                const updated = [newTask, ...prev];
                localStorage.setItem('beton_tasks', JSON.stringify(updated));
                // ARTIK BURADA showNotify ÇAĞIRMIYORUZ, CONTEXT OTOMATİK YAKALAYACAK:
                window.dispatchEvent(new Event('beton_data_updated'));
                return updated;
            });
        }
        closeModals();
    };

    const closeModals = () => {
        setIsAddModalOpen(false);
        setIsDetailModalOpen(false);
        setIsUpdating(false);
        setFormFiles([null]);
        setNewForm({ id: null, assignedTo: '', title: '', detail: '', deadline: '', deadlineTime: '23:59' });
    };

    const handleFileOpen = (e, file) => {
        e.stopPropagation();
        if (!file || file === 'Ek Yok' || file === 'Yükle...' || file === '-') return;
        let targetUrl = (typeof file === 'object' && file.url) ? file.url : (typeof file === 'string' ? file : '');
        if (!targetUrl) return;
        try { window.open(targetUrl, '_blank'); } catch (err) { console.error(err); }
    };

    const triggerUserFileUpload = (e, task) => {
        e.stopPropagation();
        if (viewMode === 'library') return;
        setActiveTaskForUpload(task.id);
        fileInputRef.current.click();
    };

    const handleUserFileChange = (e) => {
        const file = e.target.files[0];
        if (file && activeTaskForUpload) {
            const url = URL.createObjectURL(file);
            const fileData = { url, name: file.name };
            setTasks(prev => {
                const updated = prev.map(t => {
                    if (t.id === activeTaskForUpload) {
                        const currentFiles = Array.isArray(t.userFiles) ? t.userFiles : [];
                        return { ...t, userFiles: [...currentFiles, fileData] };
                    }
                    return t;
                });
                localStorage.setItem('beton_tasks', JSON.stringify(updated));
                window.dispatchEvent(new Event('beton_data_updated'));
                return updated;
            });
            setActiveTaskForUpload(null);
            e.target.value = null;
        }
    };

    const EyeIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    );

    const colDefs = {
        view: 60, person: 120, role: 140, assigner: 110, title: 160, detail: 200, files: 220, deadline: 110, status: 150, progress: 130
    };
    const totalWidth = Object.values(colDefs).reduce((a, b) => a + b, 0);

    const pageStyle = {
        width: '100vw', height: '100vh', background: '#FFFFFF', padding: '20px 30px 20px 105px', overflowY: 'auto', boxSizing: 'border-box', color: '#000000', fontFamily: '"Inter", sans-serif'
    };

    const cellStyle = (width, isHeader = false) => ({
        width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `0.5px solid ${activeTheme.gridLine}`, padding: isHeader ? '0 10px' : '4px 10px', boxSizing: 'border-box', fontSize: '11px', fontWeight: '900', textAlign: 'center', overflow: 'hidden'
    });

    const getFileName = (file) => {
        if (!file) return '-';
        if (typeof file === 'object' && file.name) return file.name;
        return file;
    };

    return (
        <div style={pageStyle}>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleUserFileChange} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', width: `${totalWidth}px` }}>
                <button style={topBtn} onClick={onBack}>← GERİ DÖN</button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={tabBtn(viewMode === 'all')} onClick={() => setViewMode('all')}>VERİLEN GÖREVLER</button>
                    <button style={tabBtn(viewMode === 'myTasks')} onClick={() => setViewMode('myTasks')}>GÖREVLERİM</button>
                    <button style={tabBtn(viewMode === 'library')} onClick={() => setViewMode('library')}>GÖREV KÜTÜPHANESİ</button>
                    <button style={actionBtnBlack} onClick={() => { setIsUpdating(false); setIsAddModalOpen(true); }}>GÖREV EKLE</button>
                    <button style={editBtn(isEditMode)} onClick={() => setIsEditMode(!isEditMode)}>
                        {isEditMode ? 'KAYDET' : 'DÜZENLE'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', border: '2.5px solid #000', width: `${totalWidth}px`, boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', height: '40px', background: '#F1F5F9', borderBottom: '2.5px solid #000', alignItems: 'stretch' }}>
                    <div style={cellStyle(colDefs.view, true)}></div>
                    <div style={cellStyle(colDefs.person, true)}>SORUMLU</div>
                    <div style={cellStyle(colDefs.role, true)}>POZİSYON</div>
                    <div style={cellStyle(colDefs.assigner, true)}>VEREN</div>
                    <div style={cellStyle(colDefs.title, true)}>BAŞLIK</div>
                    <div style={cellStyle(colDefs.detail, true)}>DETAY</div>
                    <div style={cellStyle(colDefs.files, true)}>BELGELER</div>
                    <div style={cellStyle(colDefs.deadline, true)}>BİTİŞ (ZAMAN)</div>
                    <div style={cellStyle(colDefs.status, true)}>DURUM</div>
                    <div style={{ width: `${colDefs.progress}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900' }}>
                        {viewMode === 'library' ? 'BAŞARI DURUMU' : 'İLERLEME'}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {sortedTasks.map((task, index) => {
                        const stats = getStats(task.assignedTo);
                        const isNewPerson = index > 0 && task.assignedTo !== sortedTasks[index - 1].assignedTo;
                        const gFiles = Array.isArray(task.giverFiles) ? task.giverFiles : (task.giverFiles ? [task.giverFiles] : []);
                        const uFiles = Array.isArray(task.userFiles) ? task.userFiles : (task.userFiles ? [task.userFiles] : []);

                        let btnLabel = 'TAMAMLA';
                        let isBtnActive = false;
                        const isTaskFinished = task.status === 'Tamamlandı';

                        if (isTaskFinished) {
                            btnLabel = 'TAMAMLANDI'; isBtnActive = false;
                        } else if (viewMode === 'all') {
                            if (task.giver === safeUser.name && task.status === 'ONAY BEKLİYOR') {
                                btnLabel = 'ONAYLA'; isBtnActive = true;
                            } else {
                                btnLabel = task.status === 'ONAY BEKLİYOR' ? 'ONAY BEKLİYOR' : 'DEVAM EDİYOR';
                                isBtnActive = false;
                            }
                        } else if (viewMode === 'myTasks') {
                            if (task.assignedTo === safeUser.name && task.status !== 'ONAY BEKLİYOR') {
                                btnLabel = 'TAMAMLA'; isBtnActive = true;
                            } else {
                                btnLabel = 'ONAY BEKLİYOR'; isBtnActive = false;
                            }
                        }

                        const successInfo = checkSuccess(task.deadline, task.deadlineTime, task.status);

                        return (
                            <div key={task.id} style={{ 
                                display: 'flex', minHeight: '55px',
                                borderTop: isNewPerson ? '2.5px solid #000' : 'none',
                                borderBottom: index === sortedTasks.length - 1 ? 'none' : `0.5px solid ${activeTheme.gridLine}`, 
                                background: '#FFF', alignItems: 'stretch' 
                            }}>
                                <div style={{ ...cellStyle(colDefs.view), cursor: 'pointer' }} onClick={() => { setSelectedTask(task); setIsDetailModalOpen(true); }}>
                                    <EyeIcon />
                                </div>
                                <div style={cellStyle(colDefs.person)}>{task.assignedTo}</div>
                                <div style={{...cellStyle(colDefs.role), color: '#666', fontSize: '9px'}}>{safePersonnel.find(p => p.data?.label === task.assignedTo)?.data?.role || 'PERSONEL'}</div>
                                <div style={cellStyle(colDefs.assigner)}>{task.giver}</div>
                                <div style={cellStyle(colDefs.title)}>{task.title}</div>
                                <div style={{...cellStyle(colDefs.detail), opacity: 0.6, fontSize: '10px', justifyContent: 'flex-start', textAlign: 'left'}}>{(task.description || task.detail || '').substring(0, 30)}...</div>
                                
                                <div style={{...cellStyle(colDefs.files), flexDirection: 'column', gap: '2px', justifyContent: 'center', alignItems: 'stretch'}}>
                                    <div style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '1px'}}>
                                        <span style={{fontSize: '7px', fontWeight: '900', textAlign: 'left'}}>VEREN:</span>
                                        {gFiles.length > 0 ? gFiles.map((f, i) => (
                                            <div key={i} style={fileRow} onClick={(e) => handleFileOpen(e, f)}>{getFileName(f)}</div>
                                        )) : <div style={{...fileRow, opacity: 0.4}}>-</div>}
                                    </div>
                                    <div style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '1px'}}>
                                        <span style={{fontSize: '7px', fontWeight: '900', textAlign: 'left'}}>YAPAN:</span>
                                        {uFiles.length > 0 ? uFiles.map((f, i) => (
                                            <div key={i} style={fileRowRelative}>
                                                <span onClick={(e) => handleFileOpen(e, f)} style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>{getFileName(f)}</span>
                                                {viewMode !== 'library' && <button onClick={(e) => triggerUserFileUpload(e, task)} style={plusBtnInside}>+</button>}
                                            </div>
                                        )) : (
                                            <div style={fileRowRelative}>
                                                <span style={{opacity: 0.4}}>{viewMode === 'library' ? '-' : 'Yükle...'}</span>
                                                {viewMode !== 'library' && <button onClick={(e) => triggerUserFileUpload(e, task)} style={plusBtnInside}>+</button>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{...cellStyle(colDefs.deadline), flexDirection: 'column'}}>
                                    <span>{task.deadline}</span>
                                    <span style={{fontSize: '9px', opacity: 0.7}}>{task.deadlineTime || '23:59'}</span>
                                </div>
                                <div style={{...cellStyle(colDefs.status), flexDirection: 'column', gap: '2px'}}>
                                    <button style={statusBtn(task.status, isBtnActive)} onClick={() => isBtnActive && handleAction(task)} disabled={!isBtnActive || viewMode === 'library'}>{btnLabel}</button>
                                    {isEditMode && viewMode !== 'library' && (
                                        <div style={{ display: 'flex', gap: '2px', width: '100%' }}>
                                            <button style={miniBtn('#000')} onClick={() => openUpdate(task)}>GÜNCELLE</button>
                                            <button style={miniBtn('#000')} onClick={() => deleteTask(task.id)}>SİL</button>
                                        </div>
                                    )}
                                </div>
                                <div style={{ width: `${colDefs.progress}px`, padding: '0 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    {viewMode === 'library' ? (
                                        <div style={{fontSize: '10px', fontWeight: '900', color: successInfo.color, textAlign: 'center'}}>{successInfo.label}</div>
                                    ) : (
                                        <>
                                            <div style={{ width: '100%', height: '8px', background: '#EEE', border: '1px solid #000' }}>
                                                <div style={{ width: `${stats.percentage}%`, height: '100%', background: '#000' }} />
                                            </div>
                                            <div style={{fontSize: '8px', fontWeight: '900', marginTop: '2px'}}>%{stats.percentage} BAŞARI</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* GÖREV EKLE / GÜNCELLE MODAL */}
            {isAddModalOpen && (
                <div style={modalOverlay}>
                    <div style={{...modalBox, width: '500px'}}>
                        <h2 style={modalTitle}>{isUpdating ? 'GÖREV GÜNCELLE' : 'YENİ GÖREV OLUŞTUR'}</h2>
                        <form onSubmit={handleSaveTask}>
                            <div style={inputGroup}><label style={inputLabel}>SORUMLU</label><select required style={inputStyle} value={newForm.assignedTo} onChange={(e) => setNewForm({...newForm, assignedTo: e.target.value})}><option value="">Seçiniz...</option>{safePersonnel.map(p => <option key={p.id} value={p.data.label}>{p.data.label}</option>)}</select></div>
                            <div style={inputGroup}><label style={inputLabel}>BAŞLIK</label><input required style={inputStyle} value={newForm.title} onChange={(e) => setNewForm({...newForm, title: e.target.value})} /></div>
                            <div style={inputGroup}><label style={inputLabel}>DETAY</label><textarea style={{...inputStyle, height: '80px'}} value={newForm.detail} onChange={(e) => setNewForm({...newForm, detail: e.target.value})} /></div>
                            <div style={{display: 'flex', gap: '15px', alignItems: 'flex-start', marginBottom: '15px'}}>
                                <div style={{flex: 1.5, display: 'flex', flexDirection: 'column'}}>
                                    <label style={inputLabel}>TARİH & SAAT</label>
                                    <div style={{display: 'flex', gap: '5px'}}>
                                        <input type="date" required style={{...inputStyle, flex: 2, fontSize: '11px', padding: '6px'}} value={newForm.deadline} onChange={(e) => setNewForm({...newForm, deadline: e.target.value})} />
                                        <input type="time" required style={{...inputStyle, flex: 1, fontSize: '11px', padding: '6px'}} value={newForm.deadlineTime} onChange={(e) => setNewForm({...newForm, deadlineTime: e.target.value})} />
                                    </div>
                                </div>
                                <div style={{flex: 1.5, display: 'flex', flexDirection: 'column'}}><label style={inputLabel}>BELGELER</label><div style={{maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px'}}>{formFiles.map((file, idx) => (<div key={idx} style={fileRowRelative}>{file && typeof file === 'object' && !file.lastModified ? (<div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}><span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>{getFileName(file)}</span><button type="button" onClick={() => { const n = [...formFiles]; n.splice(idx, 1); setFormFiles(n); }} style={{...plusBtnInside, background: 'red', position: 'static', transform: 'none'}}>x</button></div>) : (<><input type="file" style={{border: 'none', background: 'transparent', fontSize: '10px', width: '100%', fontWeight: '800'}} onChange={(e) => { const n = [...formFiles]; n[idx] = e.target.files[0]; setFormFiles(n); }} />{idx === formFiles.length - 1 && (<button type="button" onClick={() => setFormFiles([...formFiles, null])} style={plusBtnInside}>+</button>)}</>)}</div>))}</div></div>
                            </div>
                            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}><button type="button" onClick={closeModals} style={cancelBtn}>İPTAL</button><button type="submit" style={saveBtn}>{isUpdating ? 'GÜNCELLE' : 'GÖREVİ VER'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* DETAY POPUP */}
            {isDetailModalOpen && selectedTask && (
                <div style={modalOverlay}>
                    <div style={{ ...modalBox, width: '600px' }}>
                        <h2 style={{ ...modalTitle, textAlign: 'center', borderBottom: '5px solid #000' }}>{selectedTask.title}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div style={detailContainer}><label style={inputLabel}>SORUMLU</label><div style={detailText}>{selectedTask.assignedTo}</div></div>
                            <div style={detailContainer}><label style={inputLabel}>SON TARİH</label><div style={detailText}>{selectedTask.deadline} | {selectedTask.deadlineTime || '23:59'}</div></div>
                            <div style={detailContainer}><label style={inputLabel}>VEREN YETKİLİ</label><div style={detailText}>{selectedTask.giver}</div></div>
                            <div style={detailContainer}><label style={inputLabel}>MEVCUT DURUM</label><div style={detailText}>{selectedTask.status}</div></div>
                        </div>
                        <div style={{ borderTop: '2px solid #000', paddingTop: '15px' }}>
                            <label style={inputLabel}>TAM GÖREV AÇIKLAMASI</label>
                            <div style={{ padding: '10px', background: '#F9FAFB', border: '1px solid #000', fontSize: '13px', fontWeight: '700', minHeight: '100px', wordBreak: 'break-all' }}>{selectedTask.description || selectedTask.detail}</div>
                        </div>
                        <button onClick={closeModals} style={{ ...saveBtn, width: '100%', marginTop: '20px' }}>PENCEREYİ KAPAT</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- STİLLER ---
const topBtn = { padding: '6px 16px', border: '2.5px solid #000', background: '#FFF', fontWeight: '900', fontSize: '11px', cursor: 'pointer', color: '#000' };
const tabBtn = (active) => ({ padding: '6px 16px', background: active ? '#000' : '#FFF', color: active ? '#FFF' : '#000', border: '2.5px solid #000', fontWeight: '900', fontSize: '11px', cursor: 'pointer' });
const actionBtnBlack = { padding: '6px 16px', background: '#000', color: '#FFF', border: '2.5px solid #000', fontWeight: '900', fontSize: '11px', cursor: 'pointer' };
const editBtn = (active) => ({ padding: '6px 16px', background: active ? '#000' : '#FFF', color: active ? '#FFF' : '#000', border: '2.5px solid #000', fontWeight: '900', fontSize: '11px', cursor: 'pointer' });
const fileRow = { width: '100%', padding: '2px 6px', background: '#F8F9FA', border: '1px solid #000', fontSize: '9px', fontWeight: '900', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '1px', boxSizing: 'border-box' };
const fileRowRelative = { position: 'relative', width: '100%', padding: '2px 25px 2px 6px', background: '#F8F9FA', border: '1px solid #000', fontSize: '9px', fontWeight: '900', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '1px', boxSizing: 'border-box', display: 'flex', alignItems: 'center' };
const plusBtnInside = { position: 'absolute', right: '3px', top: '50%', transform: 'translateY(-50%)', background: '#000', color: '#FFF', border: 'none', width: '13px', height: '13px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1px' };
const statusBtn = (status, active) => ({ width: '100%', padding: '4px', background: status === 'Tamamlandı' ? '#000' : (active ? '#FFF' : '#F1F5F9'), color: status === 'Tamamlandı' ? '#FFF' : (active ? '#000' : '#AAA'), border: '1.5px solid #000', fontSize: '9px', fontWeight: '900', cursor: active ? 'pointer' : 'default', opacity: active || status === 'Tamamlandı' ? 1 : 0.6 });
const miniBtn = (bg) => ({ flex: 1, padding: '2px', background: bg, color: '#FFF', border: '0.5px solid #FFF', fontSize: '8px', fontWeight: '900', cursor: 'pointer' });
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 };
const modalBox = { background: '#FFF', padding: '35px', border: '6px solid #000', boxShadow: '15px 15px 0px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' };
const modalTitle = { fontSize: '18px', fontWeight: '900', marginBottom: '20px', borderBottom: '4px solid #000', paddingBottom: '10px' };
const inputGroup = { marginBottom: '15px', display: 'flex', flexDirection: 'column' };
const inputLabel = { fontSize: '10px', fontWeight: '900', marginBottom: '5px', textAlign: 'left' };
const inputStyle = { padding: '8px', border: '2px solid #000', fontSize: '12px', fontWeight: '800', background: '#FFF', color: '#000', outline: 'none' };
const saveBtn = { padding: '10px', background: '#000', color: '#FFF', border: 'none', fontWeight: '900', cursor: 'pointer' };
const cancelBtn = { flex: 1, padding: '10px', background: '#EEE', color: '#000', border: 'none', fontWeight: '900', cursor: 'pointer' };
const detailContainer = { borderLeft: '4px solid #000', paddingLeft: '15px' };
const detailText = { fontSize: '16px', fontWeight: '900', marginTop: '5px' };

export default TasksPage;