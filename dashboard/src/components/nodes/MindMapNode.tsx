import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

type ColorVariant = "emerald" | "amber" | "blue";

interface MindMapNodeData {
  label: string;
  icon: string;
  description: string;
  color: ColorVariant;
  targetHandle: string;
  count?: number;
}

const colorClasses: Record<ColorVariant, { bg: string; border: string; text: string; glow: string }> = {
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-700",
    glow: "shadow-emerald-200/50",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-700",
    glow: "shadow-amber-200/50",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-700",
    glow: "shadow-blue-200/50",
  },
};

const handleStyle = {
  background: 'transparent',
  border: 'none',
  width: 1,
  height: 1,
};

function MindMapNodeComponent(props: NodeProps) {
  const data = props.data as unknown as MindMapNodeData;
  const { label, icon, description, color, count } = data;
  const colors = colorClasses[color];

  return (
    <>
      {/* Handles at all positions - edges will connect to the correct one */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ ...handleStyle, top: 0, left: '50%', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        style={{ ...handleStyle, right: 0, top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ ...handleStyle, bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ ...handleStyle, left: 0, top: '50%', transform: 'translateY(-50%)' }}
      />
      
      <div
        className={`relative px-8 py-5 rounded-2xl ${colors.bg} border-2 ${colors.border} backdrop-blur-sm cursor-pointer shadow-lg ${colors.glow} hover-scale animate-scale-in`}
      >
        <div className="flex flex-col items-center gap-3 min-w-[160px]">
          <div className="text-4xl animate-bounce-subtle">
            {icon}
          </div>
          
          <div className="text-center">
            <h3 className={`font-semibold text-lg ${colors.text}`}>
              {label}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {description}
            </p>
          </div>

          {count !== undefined && (
            <div
              className={`absolute -top-2 -right-2 w-7 h-7 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center text-sm font-bold ${colors.text} shadow-sm animate-scale-in`}
              style={{ animationDelay: '0.1s' }}
            >
              {count}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const MindMapNode = memo(MindMapNodeComponent);
