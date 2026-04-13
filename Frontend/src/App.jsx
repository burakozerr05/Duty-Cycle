import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

// NotificationContext importu düzeltildi
import { NotificationProvider } from './NotificationContext';

import PersonnelNode from './components/PersonnelNode';
import AreaNode from './components/AreaNode';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar'; 
import TeamPopup from './components/TeamPopup';
import TasksPage from './pages/TasksPage'; 
import ReportsPage from './pages/ReportsPage'; 
import { THEMES } from './constants/colors';

const nodeTypes = { personnel: PersonnelNode, area: AreaNode };

// FLOW CONTENT BILESENI - TUM PROPLARI ALACAK SEKILDE DUZELTILDI
function FlowContent({ 
  tasks, setTasks, 
  currentView, setCurrentView, 
  theme, nodes, setNodes, 
  edges, setEdges, 
  darkMode, setDarkMode, 
  isEditable, setIsEditable, 
  mode, setMode,
  isTeamActive, setIsTeamActive 
}) {
  const { screenToFlowPosition, setCenter } = useReactFlow();
  
  const [drawStart, setDrawStart] = useState(null);
  const [tempAreaId, setTempAreaId] = useState(null);
  const [menu, setMenu] = useState(null);
  const [hoveredMenuItem, setHoveredMenuItem] = useState(null);

  // ARAMA SİSTEMİ STATE'LERİ
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [currentUser] = useState({
    name: "BURAK",
    role: "CEO / KURUCU",
    avatar: "https://via.placeholder.com/150/000000/FFFFFF?text=B",
    subordinateCount: 0 
  });

  // PERFORMANS OPTİMİZASYONU
  const countAllDescendants = useCallback((nodeId, currentEdges) => {
    let count = 0;
    const directChildren = currentEdges.filter(edge => edge.source === nodeId);
    count += directChildren.length;
    directChildren.forEach(child => { count += countAllDescendants(child.target, currentEdges); });
    return count;
  }, []);

  const onLabelChange = useCallback((nodeId, newLabel) => {
    setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, label: newLabel } } : node));
  }, [setNodes]);

  useEffect(() => {
    setNodes((currentNodes) => 
      currentNodes.map((node) => {
        const currentCount = node.type === 'personnel' ? countAllDescendants(node.id, edges) : 0;
        
        if (
          node.data.subordinateCount === currentCount && 
          node.data.theme === theme && 
          node.data.isEditable === isEditable
        ) return node;

        const baseData = { ...node.data, theme: { ...theme, isEditable }, onLabelChange };
        if (node.type === 'area') return { ...node, data: baseData };
        return { ...node, data: { ...baseData, subordinateCount: currentCount } };
      })
    );
  }, [edges, theme, isEditable, onLabelChange, countAllDescendants, setNodes]);

  const handleFocusNode = (node) => {
    const x = node.position.x + (node.width || 150) / 2;
    const y = node.position.y + (node.height || 50) / 2;
    setCenter(x, y, { zoom: 1.2, duration: 800 });
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return nodes.filter(node => 
      node.data.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.data.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, nodes]);

  const toggleTheme = () => setDarkMode(!darkMode);
  const handleToggleEdit = () => { setIsEditable(!isEditable); setMode(null); setMenu(null); };

  const onPaneClick = useCallback((event) => {
    if (mode !== 'area_draw') return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    if (!drawStart) {
      const newId = `area_${Date.now()}`;
      setDrawStart(position);
      setTempAreaId(newId);
      setNodes((nds) => [{ id: newId, type: 'area', position, data: { label: '', color: 'rgba(37, 99, 235, 0.15)', theme: { ...theme, isEditable: true }, onLabelChange }, style: { width: 50, height: 50 }, width: 50, height: 50, zIndex: 0 }, ...nds]);
    } else {
      setDrawStart(null); setTempAreaId(null); setMode(null);
    }
  }, [mode, drawStart, screenToFlowPosition, theme, onLabelChange, setNodes]);

  const onPaneMouseMove = useCallback((event) => {
    if (!drawStart || !tempAreaId) return;
    if (event.buttons !== 1) return;
    const currentPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setNodes((nds) => nds.map((node) => {
      if (node.id === tempAreaId) {
        const w = Math.max(20, Math.abs(currentPos.x - drawStart.x));
        const h = Math.max(20, Math.abs(currentPos.y - drawStart.y));
        return { ...node, position: { x: Math.min(currentPos.x, drawStart.x), y: Math.min(currentPos.y, drawStart.y) }, style: { ...node.style, width: w, height: h }, width: w, height: h };
      }
      return node;
    }));
  }, [drawStart, tempAreaId, screenToFlowPosition, setNodes]);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    if (node.type !== 'area' || !isEditable) return;
    setMenu({ id: node.id, top: event.clientY, left: event.clientX });
  }, [isEditable]);

  const closeMenu = () => { setMenu(null); setHoveredMenuItem(null); };
  const changeAreaColor = (color) => {
    setNodes((nds) => nds.map((node) => node.id === menu.id ? { ...node, data: { ...node.data, color } } : node));
    closeMenu();
  };
  const deleteArea = () => {
    setNodes((nds) => nds.filter((node) => node.id !== menu.id));
    closeMenu();
  };

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect = useCallback((params) => {
    if (mode === 'pen') {
      setEdges((eds) => addEdge({ ...params, id: `e-${Date.now()}`, style: { stroke: darkMode ? '#FFF' : '#000', strokeWidth: 3 } }, eds));
    }
  }, [mode, darkMode, setEdges]);

  const palette = [
    { name: 'MAVİ', val: 'rgba(37, 99, 235, 0.2)' }, { name: 'KIRMIZI', val: 'rgba(239, 68, 68, 0.2)' },
    { name: 'YEŞİL', val: 'rgba(34, 197, 94, 0.2)' }, { name: 'SARI', val: 'rgba(234, 179, 8, 0.2)' },
    { name: 'TURUNCU', val: 'rgba(249, 115, 22, 0.2)' }, { name: 'MOR', val: 'rgba(168, 85, 247, 0.2)' },
    { name: 'PEMBE', val: 'rgba(236, 72, 153, 0.2)' }, { name: 'TURKUAZ', val: 'rgba(20, 184, 166, 0.2)' },
    { name: 'GRİ', val: 'rgba(100, 116, 139, 0.2)' }, { name: 'SİYAH', val: 'rgba(0, 0, 0, 0.2)' }
  ];

  const renderView = () => {
    switch (currentView) {
      case 'tasks':
        return (
          <TasksPage 
            theme={theme} 
            personnel={nodes.filter(n => n.type === 'personnel')} 
            tasks={tasks || []} 
            setTasks={setTasks}
            onBack={() => setCurrentView('flow')} 
          />
        );
      case 'reports':
        return (
          <ReportsPage 
            theme={theme} 
            tasks={tasks} 
            onBack={() => setCurrentView('flow')} 
          />
        );
      case 'flow':
      default:
        return (
          <>
            {isEditable && (
              <div style={topPanelStyle(theme)}>
                <button style={topButtonStyle(mode === 'pen', theme)} onClick={() => setMode('pen')}>BAĞLANTI EKLE</button>
                <button style={topButtonStyle(mode === 'scissors', theme, true)} onClick={() => setMode('scissors')}>BAĞLANTIYI KES</button>
                <div style={dividerStyle(theme)} />
                <button style={topButtonStyle(mode === 'area_draw', theme)} onClick={() => setMode('area_draw')}>ALAN ÇİZ</button>
              </div>
            )}

            <ReactFlow
              nodes={nodes} edges={edges}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
              onConnect={onConnect} onPaneClick={onPaneClick} onMouseMove={onPaneMouseMove}
              onNodeContextMenu={onNodeContextMenu}
              nodeTypes={nodeTypes} fitView snapToGrid={mode !== 'area_draw'} snapGrid={[15, 15]}
              nodesDraggable={isEditable} elementsSelectable={isEditable}
              minZoom={0.01} maxZoom={100}
              panOnDrag={mode !== 'area_draw'}
            >
              <Background color={darkMode ? "#334155" : "#CBD5E1"} gap={15} variant="dots" />
            </ReactFlow>

            {menu && (
              <div style={{ ...winMenuStyle(theme), top: menu.top, left: menu.left }} onClick={(e) => e.stopPropagation()}>
                <div style={winOptionStyle(theme, hoveredMenuItem === 'color')} onMouseEnter={() => setHoveredMenuItem('color')}>
                  <span>RENK DEĞİŞTİR</span><span>▶</span>
                  {hoveredMenuItem === 'color' && (
                    <div style={winSubMenuStyle(theme)}>
                      {palette.map(c => (
                        <div key={c.val} onClick={() => changeAreaColor(c.val)} style={winOptionStyle(theme, false, true)}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: c.val, border: `1px solid ${theme.border}` }} />
                          {c.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={winOptionStyle(theme, hoveredMenuItem === 'delete', false, true)} onMouseEnter={() => setHoveredMenuItem('delete')} onClick={deleteArea}><span>ALANI SİL</span></div>
              </div>
            )}

            {isSearchOpen && (
              <div style={searchPopupStyle(theme)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                  <span style={{ fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', color: '#000000' }}>EKİP / ALAN BUL</span>
                  <button onClick={() => setIsSearchOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '900', color: '#000000' }}>X</button>
                </div>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="İsim veya görev yazın..." 
                  style={searchInputStyle(theme)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div style={searchResultsContainerStyle}>
                  {filteredResults.length > 0 ? filteredResults.map(node => (
                    <div 
                      key={node.id} 
                      style={searchResultItemStyle(theme)}
                      onClick={() => handleFocusNode(node)}
                    >
                      <div style={{ fontWeight: '900', fontSize: '12px', color: '#000000' }}>{node.data.label || "İsimsiz"}</div>
                      <div style={{ fontSize: '9px', opacity: 0.6, color: '#000000' }}>{node.type === 'area' ? 'ALAN / DEPARTMAN' : (node.data.role || 'PERSONEL')}</div>
                    </div>
                  )) : (
                    searchQuery && <div style={{ fontSize: '10px', textAlign: 'center', marginTop: '10px', fontWeight: '800', color: '#000000' }}>SONUÇ BULUNAMADI.</div>
                  )}
                </div>
              </div>
            )}

            <Toolbar 
              isEditable={isEditable} 
              setIsEditable={handleToggleEdit} 
              isTeamActive={isTeamActive} 
              setIsTeamActive={setIsTeamActive} 
              toggleTheme={toggleTheme} 
              theme={theme}
              setView={setCurrentView} 
              nodes={nodes}
              darkMode={darkMode}
              isSearchOpen={isSearchOpen}
              setIsSearchOpen={setIsSearchOpen} 
              onSearchClick={() => setIsSearchOpen(!isSearchOpen)} 
            />
          </>
        );
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: theme.background, overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      <Sidebar 
        theme={theme} 
        user={{...currentUser, subordinateCount: countAllDescendants('1', edges)}} 
        setView={setCurrentView} 
        setIsTeamActive={setIsTeamActive}
      />
      <main style={{ width: '100%', height: '100%', position: 'relative' }}>
        {renderView()}
      </main>
      {isTeamActive && (
        <TeamPopup 
          members={nodes.filter(n => n.type === 'personnel').map(n => ({ id: n.id, ...n.data }))} 
          theme={theme} onClose={() => setIsTeamActive(false)} 
          onAddMember={(d) => setNodes(nds => [{ id: `n-${Date.now()}`, type: 'personnel', data: { ...d, theme }, position: { x: 300, y: 300 } }, ...nds])}
          onRemoveMember={(id) => { setNodes((nds) => nds.filter(n => n.id !== id)); setEdges((eds) => eds.filter(e => e.source !== id && e.target !== id)); }}
        />
      )}
    </div>
  );
}

// ANA APP BILESENI
export default function App() { 
  // --- LOCALSTORAGE ENTEGRASYONU BAŞLANGIÇ ---
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('beton_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [nodes, setNodes] = useState(() => {
    const saved = localStorage.getItem('beton_nodes');
    return saved ? JSON.parse(saved) : [
      { 
        id: '1', type: 'personnel', 
        data: { label: 'BURAK', role: 'CEO / KURUCU', status: 'Online', subordinateCount: 0, theme: { isEditable: false } }, 
        position: { x: 450, y: 150 } 
      }
    ];
  });

  const [edges, setEdges] = useState(() => {
    const saved = localStorage.getItem('beton_edges');
    return saved ? JSON.parse(saved) : [];
  });

  // Veri her değiştiğinde localStorage'ı güncelle
  useEffect(() => {
    localStorage.setItem('beton_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('beton_nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('beton_edges', JSON.stringify(edges));
  }, [edges]);
  // --- LOCALSTORAGE ENTEGRASYONU BİTİŞ ---

  const [currentView, setCurrentView] = useState('flow');
  const [darkMode, setDarkMode] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [isTeamActive, setIsTeamActive] = useState(false);
  const [mode, setMode] = useState(null);

  const theme = useMemo(() => {
    const baseTheme = darkMode ? THEMES.dark : THEMES.light;
    return baseTheme || { background: '#f1f5f9', border: '#cbd5e1', card: '#ffffff', text: '#000000' };
  }, [darkMode]);

  return (
    <NotificationProvider>
      <ReactFlowProvider>
        <FlowContent 
          tasks={tasks} setTasks={setTasks}
          currentView={currentView} setCurrentView={setCurrentView}
          theme={theme} darkMode={darkMode} setDarkMode={setDarkMode}
          nodes={nodes} setNodes={setNodes}
          edges={edges} setEdges={setEdges}
          isEditable={isEditable} setIsEditable={setIsEditable}
          mode={mode} setMode={setMode}
          isTeamActive={isTeamActive} setIsTeamActive={setIsTeamActive}
        />
      </ReactFlowProvider>
    </NotificationProvider>
  ); 
}

// STIL FONKSIYONLARI
const topPanelStyle = (t) => ({ 
  position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, 
  display: 'flex', gap: '10px', padding: '10px 20px', background: t?.card || '#FFF', 
  border: `0.7px solid ${t?.border || '#000'}`, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' 
});
const topButtonStyle = (active, t, danger) => ({ 
  padding: '8px 16px', cursor: 'pointer', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', 
  background: active ? (danger ? '#EF4444' : t?.text || '#000') : t?.card || '#FFF', 
  color: active ? t?.card || '#FFF' : (danger ? '#EF4444' : t?.text || '#000'), 
  border: `0.7px solid ${danger ? '#EF4444' : t?.border || '#000'}` 
});
const dividerStyle = (t) => ({ width: '1px', height: '20px', background: t?.border || '#000', opacity: 0.3 });
const winMenuStyle = (t) => ({ 
  position: 'fixed', zIndex: 3000, background: t?.card || '#FFF', border: `1px solid ${t?.border || '#000'}`, 
  minWidth: '180px', padding: '4px 0', boxShadow: '4px 4px 12px rgba(0,0,0,0.15)', fontFamily: 'sans-serif' 
});
const winSubMenuStyle = (t) => ({ 
  position: 'absolute', left: '100%', top: '-1px', background: t?.card || '#FFF', border: `1px solid ${t?.border || '#000'}`, 
  minWidth: '140px', padding: '4px 0', boxShadow: '4px 4px 12px rgba(0,0,0,0.15)' 
});
const winOptionStyle = (t, isHover, isSub = false, isDanger = false) => ({ 
  padding: '8px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', 
  fontWeight: isSub ? '700' : '900', color: isDanger ? '#EF4444' : (isHover ? t?.card || '#FFF' : t?.text || '#000'), 
  background: isHover ? (isDanger ? '#EF4444' : t?.text || '#000') : 'transparent', 
  cursor: 'pointer', letterSpacing: '0.5px', gap: '10px' 
});
const searchPopupStyle = (t) => ({
  position: 'absolute', top: '20px', right: '30px', width: '280px', 
  background: '#FFFFFF', border: `3px solid #000000`, padding: '15px', 
  zIndex: 4000, boxShadow: '10px 10px 0px rgba(0,0,0,0.1)', fontFamily: '"Inter", sans-serif'
});
const searchInputStyle = (t) => ({
  width: '100%', padding: '10px', border: `2.5px solid #000000`, 
  boxSizing: 'border-box', fontWeight: '800', fontSize: '13px', outline: 'none',
  background: '#FFFFFF', color: '#000000'
});
const searchResultsContainerStyle = { maxHeight: '250px', overflowY: 'auto', marginTop: '10px' };
const searchResultItemStyle = (t) => ({
  padding: '10px', borderBottom: `1px solid #EEE`, cursor: 'pointer',
  transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '2px',
  background: 'transparent'
});