import { Handle, Position } from "@xyflow/react";
import { CentralOrb } from "../CentralOrb";

export function CentralOrbNode() {
  return (
    <div style={{ width: 128, height: 128, position: 'relative' }}>
      {/* Handles positioned at the edges of the orb */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'transparent',
          border: 'none',
          width: 1,
          height: 1,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          width: 1,
          height: 1,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'transparent',
          border: 'none',
          width: 1,
          height: 1,
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          width: 1,
          height: 1,
        }}
      />

      <CentralOrb />
    </div>
  );
}
