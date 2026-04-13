import React, { useState, useCallback, useMemo, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  MarkerType,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

/**
 * PERSONNEL PAGE - EKİP AĞACI & NAVİGASYON SİSTEMİ (V46)
 * - "Bul" butonu aktif edildi: Kişi ve Alan arama özelliği eklendi.
 * - Zoom & Focus: Aranan ögeye otomatik odaklanma sağlandı.
 * - Mevcut sürükle-bırak ve tema mantığı korundu.
 */

// --- CUSTOM NODE BİLEŞENİ (PERSONEL KARTI) ---
const PersonNode = ({ data }) => {
  return (
    <div style={{
      padding: '10px',
      borderRadius: '2px',
      background: '#FFFFFF',
      border: '2.5px solid #000000',
      minWidth: '150px',
      boxShadow: '5px 5px 0px rgba(0,0,0,0.1)',
      textAlign: 'center',
      fontFamily: '"Inter", sans-serif'
    }}>
      <div style={{ fontSize: '10px', fontWeight: '900', color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}>
        {data.role || 'PERSONEL'}
      </div>
      <div style={{ fontSize: '14px', fontWeight: '900', color: '#000' }}>
        {data.label}
      </div>
    </div>
  );
};

// --- ALAN NODE BİLEŞENİ (DEPARTMAN/ALAN) ---
const AreaNode = ({ data }) => {
  return (
    <div style={{
      padding: '20px',
      border: '2px dashed #000',
      background: 'rgba(0,0,0,0.02)',
      borderRadius: '4px',
      width: data.width || 300,
      height: data.height || 200,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      pointerEvents: 'none'
    }}>
      <div style={{ fontSize: '18px', fontWeight: '900', color: 'rgba(0,0,0,0.2)', textTransform: 'uppercase' }}>
        {data.label}
      </div>
    </div>
  );
};

const nodeTypes = {
  person: PersonNode,
  area: AreaNode
};

const PersonnelContent = ({ onBack, personnel, setPersonnel, theme }) => {
  const { setCenter, getNodes } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(personnel.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(personnel.edges || []);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- ARAMA FONKSİYONU ---
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return nodes.filter(node => 
      node.data.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.data.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, nodes]);

  const handleFocusNode = (node) => {
    const x = node.position.x + (node.width || 150) / 2;
    const y = node.position.y + (node.height || 50) / 2;
    const zoom = 1.2;

    setCenter(x, y, { zoom, duration: 800 });
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({
    ...params,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#000', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#000' }
  }, eds)), [setEdges]);

  // Kaydetme işlemi (Eski mantık korunuyor)
  const handleSave = () => {
    setPersonnel({ nodes, edges });
    setIsEditMode(false);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#FFF', position: 'relative' }}>
      
      {/* ÜST ARAÇ ÇUBUĞU */}
      <div style={toolbarStyle}>
        <button style={btnStyle} onClick={onBack}>← GERİ</button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={btnStyle} title="Tema Ayarla">🎨</button>
          
          {/* BUL BUTONU ARTIK AKTİF */}
          <button 
            style={{ ...btnStyle, background: isSearchOpen ? '#000' : '#FFF', color: isSearchOpen ? '#FFF' : '#000' }} 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="Ekipte/Alanlarda Bul"
          >
            🔍 BUL
          </button>

          <button 
            style={{ ...btnStyle, background: isEditMode ? '#000' : '#FFF', color: isEditMode ? '#FFF' : '#000' }} 
            onClick={() => isEditMode ? handleSave() : setIsEditMode(true)}
          >
            {isEditMode ? '💾 KAYDET' : '⚙️ DÜZENLE'}
          </button>
        </div>
      </div>

      {/* ARAMA POPUP (NAVİGASYON) */}
      {isSearchOpen && (
        <div style={searchPopupStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: '900', fontSize: '12px' }}>EKİP / ALAN ARA</span>
            <button onClick={() => setIsSearchOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '900' }}>X</button>
          </div>
          <input 
            autoFocus
            type="text" 
            placeholder="İsim veya alan yazın..." 
            style={searchInputStyle}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div style={resultsAreaStyle}>
            {filteredResults.length > 0 ? filteredResults.map(node => (
              <div 
                key={node.id} 
                style={resultItemStyle}
                onClick={() => handleFocusNode(node)}
              >
                <div style={{ fontWeight: '900' }}>{node.data.label}</div>
                <div style={{ fontSize: '9px', opacity: 0.6 }}>{node.type === 'area' ? 'ALAN / DEPARTMAN' : node.data.role}</div>
              </div>
            )) : (
              searchQuery && <div style={{ fontSize: '10px', textAlign: 'center', marginTop: '10px' }}>Eşleşme bulunamadı.</div>
            )}
          </div>
        </div>
      )}

      {/* REACT FLOW ANA EKRAN */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        nodesDraggable={isEditMode}
        nodesConnectable={isEditMode}
        fitView
      >
        <Background color="#000" gap={20} size={1} variant="lines" style={{ opacity: 0.05 }} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* DÜZENLEME MODU UYARISI */}
      {isEditMode && (
        <div style={editBadgeStyle}>
          DÜZENLEME MODU AKTİF: Kartları sürükleyebilir ve bağlayabilirsiniz.
        </div>
      )}
    </div>
  );
};

// --- PROVIDER WRAPPER ---
const PersonnelPage = (props) => (
  <ReactFlowProvider>
    <PersonnelContent {...props} />
  </ReactFlowProvider>
);

// --- STİLLER ---
const toolbarStyle = {
  position: 'absolute', top: '20px', left: '105px', right: '30px',
  display: 'flex', justifyContent: 'space-between', zIndex: 1000, pointerEvents: 'auto'
};

const btnStyle = {
  padding: '8px 16px', border: '2.5px solid #000', background: '#FFF',
  fontWeight: '900', fontSize: '11px', cursor: 'pointer', boxShadow: '4px 4px 0px #000'
};

const searchPopupStyle = {
  position: 'absolute', top: '70px', right: '150px', width: '250px',
  background: '#FFF', border: '3px solid #000', padding: '15px',
  zIndex: 2000, boxShadow: '10px 10px 0px rgba(0,0,0,0.1)'
};

const searchInputStyle = {
  width: '100%', padding: '8px', border: '2px solid #000',
  boxSizing: 'border-box', fontWeight: '800', fontSize: '12px', outline: 'none'
};

const resultsAreaStyle = {
  maxHeight: '200px', overflowY: 'auto', marginTop: '10px'
};

const resultItemStyle = {
  padding: '8px', borderBottom: '1px solid #EEE', cursor: 'pointer',
  transition: 'background 0.2s'
};

const editBadgeStyle = {
  position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
  background: '#000', color: '#FFF', padding: '5px 15px', fontSize: '10px',
  fontWeight: '900', zIndex: 1000, letterSpacing: '1px'
};

export default PersonnelPage;