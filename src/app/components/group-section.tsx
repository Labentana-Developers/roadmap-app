import { Check, ChevronDown, ChevronRight, GripVertical, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { ActivityRow } from "./activity-row";

const ACTIVITY_DND_TYPE = "ACTIVITY";

const COLOR_PALETTE = [
  "#00C853", "#008C37", "#08369B", "#3B82F6", "#0EA5E9",
  "#06B6D4", "#14B8A6", "#10B981", "#84CC16", "#F59E0B",
  "#F97316", "#EF4444", "#F43F5E", "#EC4899", "#D946EF",
  "#A855F7", "#8B5CF6", "#6366F1", "#78716C", "#64748B",
];

export interface Activity {
  id: string;
  name: string;
  selectedWeeks: number[];
}

export interface Group {
  id: string;
  name: string;
  color: string;
  isCollapsed: boolean;
  activities: Activity[];
}

interface DragItem {
  type: string;
  activityId: string;
  fromGroupId: string;
  index: number;
}

interface GroupSectionProps {
  group: Group;
  totalWeeks: number;
  cellWidth: number;
  labelWidth: number;
  onToggleCollapse: () => void;
  onAddActivity: (name: string) => void;
  onDeleteActivity: (activityId: string) => void;
  onToggleWeek: (activityId: string, weekIndex: number) => void;
  onRangeSelect: (activityId: string, startWeek: number, endWeek: number) => void;
  onRangeDeselect: (activityId: string, startWeek: number, endWeek: number) => void;
  onDeleteGroup: () => void;
  onRenameGroup: (name: string) => void;
  onChangeGroupColor: (color: string) => void;
  onMoveActivity: (activityId: string, fromGroupId: string, toGroupId: string, toIndex: number) => void;
  onRenameActivity: (activityId: string, name: string) => void;
}

function ColorPicker({
  currentColor,
  onSelectColor,
  onClose,
}: {
  currentColor: string;
  onSelectColor: (color: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hexInput, setHexInput] = useState(currentColor);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const isValidHex = (val: string) => /^#([0-9A-Fa-f]{3}){1,2}$/.test(val);

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (isValidHex(val)) {
      onSelectColor(val);
    }
  };

  const handleHexSubmit = () => {
    if (isValidHex(hexInput)) {
      onSelectColor(hexInput);
      onClose();
    }
  };

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg p-3 z-50"
      style={{ width: 200 }}
    >
      {/* Native color picker */}
      <div className="flex items-center gap-2 mb-2">
        <input
          type="color"
          value={currentColor}
          onChange={(e) => {
            const color = e.target.value;
            onSelectColor(color);
            setHexInput(color);
          }}
          className="w-8 h-8 rounded cursor-pointer border border-border p-0"
          style={{ WebkitAppearance: "none", appearance: "none" }}
          title="Seleccionar color"
        />
        <div className="flex items-center gap-1 flex-1">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleHexSubmit();
              if (e.key === "Escape") onClose();
            }}
            placeholder="#000000"
            maxLength={7}
            className={`flex-1 text-xs font-mono px-2 py-1 rounded border outline-none ${
              isValidHex(hexInput) ? "border-border" : "border-red-300"
            }`}
          />
        </div>
      </div>

      {/* Quick palette */}
      <div className="grid grid-cols-10 gap-1">
        {COLOR_PALETTE.map((color) => (
          <button
            key={color}
            onClick={() => {
              onSelectColor(color);
              setHexInput(color);
              onClose();
            }}
            className="w-4 h-4 rounded-sm border border-black/10 hover:scale-125 transition-transform flex items-center justify-center"
            style={{ backgroundColor: color }}
            title={color}
          >
            {color.toLowerCase() === currentColor.toLowerCase() && (
              <Check size={8} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function DraggableActivityRow({
  activity,
  index,
  groupId,
  groupColor,
  labelWidth,
  totalWeeks,
  cellWidth,
  onDeleteActivity,
  onToggleWeek,
  onRangeSelect,
  onRangeDeselect,
  onMoveActivity,
  onRenameActivity,
}: {
  activity: Activity;
  index: number;
  groupId: string;
  groupColor: string;
  labelWidth: number;
  totalWeeks: number;
  cellWidth: number;
  onDeleteActivity: (activityId: string) => void;
  onToggleWeek: (activityId: string, weekIndex: number) => void;
  onRangeSelect: (activityId: string, startWeek: number, endWeek: number) => void;
  onRangeDeselect: (activityId: string, startWeek: number, endWeek: number) => void;
  onMoveActivity: (activityId: string, fromGroupId: string, toGroupId: string, toIndex: number) => void;
  onRenameActivity: (activityId: string, name: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ACTIVITY_DND_TYPE,
    item: (): DragItem => ({
      type: ACTIVITY_DND_TYPE,
      activityId: activity.id,
      fromGroupId: groupId,
      index,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ACTIVITY_DND_TYPE,
    hover: (item: DragItem, monitor) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      const dragGroupId = item.fromGroupId;

      if (dragGroupId === groupId && dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragGroupId === groupId) {
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      }

      onMoveActivity(item.activityId, item.fromGroupId, groupId, hoverIndex);
      item.index = hoverIndex;
      item.fromGroupId = groupId;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  preview(drop(ref));

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(activity.name);

  const handleRenameSubmit = () => {
    if (editValue.trim()) {
      onRenameActivity(activity.id, editValue.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={ref}
      className={`flex group/row transition-colors ${
        isDragging ? "opacity-40" : ""
      } ${isOver && canDrop ? "bg-blue-50/60" : ""}`}
    >
      <div
        className="sticky left-0 z-20 flex items-center gap-1.5 border-b border-r border-border px-3 py-0 bg-white shrink-0 hover:bg-blue-50 transition-colors"
        style={{ width: labelWidth, minWidth: labelWidth }}
      >
        <div ref={drag} className="cursor-grab active:cursor-grabbing shrink-0">
          <GripVertical size={12} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
        </div>
        <div
          className="w-1 self-stretch rounded-full shrink-0"
          style={{ backgroundColor: groupColor }}
        />
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") setIsEditing(false);
            }}
            className="flex-1 min-w-0 text-sm bg-muted px-1.5 py-0.5 rounded border-none outline-none"
            autoFocus
          />
        ) : (
          <span
            className="text-sm text-foreground/80 truncate flex-1 pl-1 cursor-pointer hover:text-primary/70"
            onDoubleClick={() => {
              setEditValue(activity.name);
              setIsEditing(true);
            }}
            title="Doble clic para renombrar"
          >
            {activity.name}
          </span>
        )}
        <button
          onClick={() => onDeleteActivity(activity.id)}
          className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover/row:opacity-100 shrink-0"
          title="Eliminar actividad"
        >
          <X size={12} />
        </button>
      </div>
      <ActivityRow
        name={activity.name}
        selectedWeeks={activity.selectedWeeks}
        totalWeeks={totalWeeks}
        cellWidth={cellWidth}
        color={groupColor}
        onToggleWeek={(weekIndex) => onToggleWeek(activity.id, weekIndex)}
        onRangeSelect={(start, end) => onRangeSelect(activity.id, start, end)}
        onRangeDeselect={(start, end) => onRangeDeselect(activity.id, start, end)}
      />
    </div>
  );
}

export function GroupSection({
  group,
  totalWeeks,
  cellWidth,
  labelWidth,
  onToggleCollapse,
  onAddActivity,
  onDeleteActivity,
  onToggleWeek,
  onRangeSelect,
  onRangeDeselect,
  onDeleteGroup,
  onRenameGroup,
  onChangeGroupColor,
  onMoveActivity,
  onRenameActivity,
}: GroupSectionProps) {
  const [newActivityName, setNewActivityName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleAddActivity = () => {
    if (newActivityName.trim()) {
      onAddActivity(newActivityName.trim());
      setNewActivityName("");
      setIsAdding(false);
    }
  };

  const handleRename = () => {
    if (editName.trim()) {
      onRenameGroup(editName.trim());
    }
    setIsEditingName(false);
  };

  const [{ isOverGroup }, dropGroup] = useDrop({
    accept: ACTIVITY_DND_TYPE,
    drop: (item: DragItem) => {
      onMoveActivity(item.activityId, item.fromGroupId, group.id, group.activities.length);
    },
    canDrop: (item: DragItem) => {
      return item.fromGroupId !== group.id || group.activities.length === 0;
    },
    collect: (monitor) => ({
      isOverGroup: monitor.isOver() && monitor.canDrop(),
    }),
  });

  return (
    <div className="mb-0">
      {/* Group header row */}
      <div ref={dropGroup} className={`flex group ${isOverGroup ? "bg-blue-50/80" : ""}`} style={{ position: "relative", zIndex: showColorPicker ? 30 : undefined }}>
        <div
          className="sticky left-0 flex items-center gap-1.5 border-b border-r border-border px-3 py-2 bg-white shrink-0"
          style={{ width: labelWidth, minWidth: labelWidth, zIndex: showColorPicker ? 50 : 20 }}
        >
          <button
            onClick={onToggleCollapse}
            className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground"
          >
            {group.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowColorPicker((v) => !v)}
              className="w-3.5 h-3.5 rounded-sm shrink-0 border border-black/10 hover:scale-125 transition-transform cursor-pointer"
              style={{ backgroundColor: group.color }}
              title="Cambiar color del grupo"
            />
            {showColorPicker && (
              <ColorPicker
                currentColor={group.color}
                onSelectColor={onChangeGroupColor}
                onClose={() => setShowColorPicker(false)}
              />
            )}
          </div>
          {isEditingName ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              className="flex-1 min-w-0 text-sm bg-muted px-1.5 py-0.5 rounded border-none outline-none"
              autoFocus
            />
          ) : (
            <span
              className="text-sm truncate cursor-pointer hover:text-primary/70 flex-1"
              onDoubleClick={() => {
                setEditName(group.name);
                setIsEditingName(true);
              }}
              title="Doble clic para renombrar"
            >
              {group.name}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto shrink-0 mr-1">
            {group.activities.length}
          </span>
          <button
            onClick={onDeleteGroup}
            className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
            title="Eliminar grupo"
          >
            <Trash2 size={12} />
          </button>
        </div>
        <div
          className="border-b border-border shrink-0"
          style={{
            width: totalWeeks * cellWidth,
            minWidth: totalWeeks * cellWidth,
            backgroundColor: `${group.color}0A`,
          }}
        />
      </div>

      {/* Activities */}
      {!group.isCollapsed && (
        <>
          {group.activities.map((activity, index) => (
            <DraggableActivityRow
              key={activity.id}
              activity={activity}
              index={index}
              groupId={group.id}
              groupColor={group.color}
              labelWidth={labelWidth}
              totalWeeks={totalWeeks}
              cellWidth={cellWidth}
              onDeleteActivity={onDeleteActivity}
              onToggleWeek={onToggleWeek}
              onRangeSelect={onRangeSelect}
              onRangeDeselect={onRangeDeselect}
              onMoveActivity={onMoveActivity}
              onRenameActivity={onRenameActivity}
            />
          ))}

          {/* Add activity row */}
          <div className="flex">
            <div
              className="sticky left-0 z-20 flex items-center border-b border-r border-border px-3 py-1.5 bg-white shrink-0"
              style={{ width: labelWidth, minWidth: labelWidth }}
            >
              {isAdding ? (
                <div className="flex items-center gap-1 w-full pl-5">
                  <input
                    type="text"
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddActivity();
                      if (e.key === "Escape") {
                        setIsAdding(false);
                        setNewActivityName("");
                      }
                    }}
                    placeholder="Nombre de la actividad"
                    className="flex-1 min-w-0 text-sm bg-muted px-2 py-0.5 rounded border-none outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleAddActivity}
                    className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewActivityName("");
                    }}
                    className="p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors pl-5"
                >
                  <Plus size={12} />
                  Agregar actividad
                </button>
              )}
            </div>
            <div
              className="border-b border-border shrink-0"
              style={{ width: totalWeeks * cellWidth, minWidth: totalWeeks * cellWidth }}
            />
          </div>
        </>
      )}
    </div>
  );
}