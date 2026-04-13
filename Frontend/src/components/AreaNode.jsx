import React, { useState } from 'react';
import { NodeResizer } from 'reactflow';

/**
 * AREANODE BİLEŞENİ
 * - React Flow'dan gelen style (width/height) birebir uygulanır.
 * - Çizgi (line) problemi bu şekilde çözülür.
 */
const AreaNode = ({ id, data, selected, style }) => {
  const [isEditing, setIsEditing] = useState(false);
  const theme = data.theme;

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (data.theme?.isEditable) setIsEditing(true);
  };

  const handleBlur = () => setIsEditing(false);

  const handleInputChange = (e) => {
    data.onLabelChange(id, e.target.value.toUpperCase());
  };

  return (
<div style={{
  ...style,
  width: '100%',
  height: '100%',
  background: data.color || 'rgba(37, 99, 235, 0.1)',
  border: `2px dashed ${data.color || theme.primary}`,
  borderRadius: '8px',
  position: 'relative',
  pointerEvents: 'all'
}}
    >
     <NodeResizer 
  color={data.color || theme.primary} 
  isVisible={selected && data.theme.isEditable} 
  minWidth={50} 
  minHeight={50} 
/>
      
      <div 
        onDoubleClick={handleDoubleClick}
        style={{
          fontWeight: '900',
          fontSize: '10px',
          color: theme?.text || '#000000',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          backgroundColor: theme?.card || '#FFFFFF',
          padding: '4px 12px',
          borderRadius: '20px',
          border: `1px solid ${theme?.border || '#000000'}`,
          position: 'absolute',
          top: '-14px',
          left: '15px',
          cursor: 'text',
          zIndex: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap'
        }}
      >
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: data.color || theme?.primary }} />
        
        {isEditing ? (
          <input
            autoFocus
            value={data.label || ''}
            onChange={handleInputChange}
            onBlur={handleBlur}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              width: '120px',
              color: theme?.text || '#000000',
              fontWeight: '900',
              fontFamily: 'inherit'
            }}
          />
        ) : (
          data.label || (data.theme?.isEditable ? "ALAN TANIMLA" : "")
        )}
      </div>
    </div>
  );
};

export default AreaNode;