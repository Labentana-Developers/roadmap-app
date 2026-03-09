import { useCallback, useRef, useState } from "react";

interface ActivityRowProps {
  name: string;
  selectedWeeks: number[];
  totalWeeks: number;
  cellWidth: number;
  color: string;
  onToggleWeek: (weekIndex: number) => void;
  onRangeSelect: (startWeek: number, endWeek: number) => void;
  onRangeDeselect: (startWeek: number, endWeek: number) => void;
}

export function ActivityRow({
  name,
  selectedWeeks,
  totalWeeks,
  cellWidth,
  color,
  onToggleWeek,
  onRangeSelect,
  onRangeDeselect,
}: ActivityRowProps) {
  const selectedSet = new Set(selectedWeeks);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<number | null>(null);
  const dragMode = useRef<"select" | "deselect">("select");
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  const handleMouseDown = useCallback(
    (weekIndex: number) => {
      setIsDragging(true);
      dragStart.current = weekIndex;
      dragMode.current = selectedSet.has(weekIndex) ? "deselect" : "select";
      setDragEnd(weekIndex);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedWeeks]
  );

  const handleMouseEnter = useCallback(
    (weekIndex: number) => {
      if (isDragging) {
        setDragEnd(weekIndex);
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart.current !== null && dragEnd !== null) {
      const start = Math.min(dragStart.current, dragEnd);
      const end = Math.max(dragStart.current, dragEnd);
      if (start === end) {
        onToggleWeek(start);
      } else if (dragMode.current === "deselect") {
        onRangeDeselect(start, end);
      } else {
        onRangeSelect(start, end);
      }
    }
    setIsDragging(false);
    dragStart.current = null;
    setDragEnd(null);
  }, [isDragging, dragEnd, onToggleWeek, onRangeSelect, onRangeDeselect]);

  const getDragRange = (): Set<number> => {
    if (!isDragging || dragStart.current === null || dragEnd === null) return new Set();
    const start = Math.min(dragStart.current, dragEnd);
    const end = Math.max(dragStart.current, dragEnd);
    const range = new Set<number>();
    for (let i = start; i <= end; i++) range.add(i);
    return range;
  };

  const dragRange = getDragRange();
  const isDeselecting = isDragging && dragMode.current === "deselect";

  return (
    <div className="flex" onMouseLeave={() => isDragging && handleMouseUp()}>
      {Array.from({ length: totalWeeks }, (_, idx) => {
        const isSelected = selectedSet.has(idx);
        const isInDrag = dragRange.has(idx);

        // Determine visual state
        let showBlock = false;
        let opacity = "opacity-100";

        if (isDeselecting) {
          if (isSelected && isInDrag) {
            // Selected but being deselected → show faded
            showBlock = true;
            opacity = "opacity-25";
          } else if (isSelected) {
            showBlock = true;
          }
        } else {
          if (isSelected || isInDrag) {
            showBlock = true;
            if (isInDrag && !isSelected) {
              opacity = "opacity-50";
            }
          }
        }

        return (
          <div
            key={idx}
            className={`border-b border-r border-border cursor-pointer transition-colors duration-75 flex items-center justify-center select-none ${
              idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
            }`}
            style={{ width: cellWidth, minWidth: cellWidth, height: 36 }}
            onMouseDown={() => handleMouseDown(idx)}
            onMouseEnter={() => handleMouseEnter(idx)}
            onMouseUp={handleMouseUp}
          >
            {showBlock && (
              <div
                className={`rounded-sm transition-all ${opacity}`}
                style={{
                  width: cellWidth - 4,
                  height: 24,
                  backgroundColor: color,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}