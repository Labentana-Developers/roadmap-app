import { addMonths, addWeeks, differenceInWeeks, format, startOfWeek } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  GanttChart,
  LayoutTemplate,
  PencilRuler,
  RotateCcw,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { RoadmapHeader } from "./components/roadmap-header";
import { GroupSection, type Group } from "./components/group-section";
import { SlideView } from "./components/slide-view";

const GROUP_COLORS = [
  "#00C853",
  "#008C37",
  "#08369B",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];

const CELL_WIDTH = 44;
const LABEL_WIDTH = 260;

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const initialGroups: Group[] = [
  {
    id: generateId(),
    name: "Planificación",
    color: GROUP_COLORS[0],
    isCollapsed: false,
    activities: [
      { id: generateId(), name: "Definición de alcance", selectedWeeks: [0, 1] },
      { id: generateId(), name: "Requerimientos", selectedWeeks: [1, 2, 3] },
      { id: generateId(), name: "Diseño técnico", selectedWeeks: [3, 4] },
    ],
  },
  {
    id: generateId(),
    name: "Desarrollo",
    color: GROUP_COLORS[1],
    isCollapsed: false,
    activities: [
      { id: generateId(), name: "Backend API", selectedWeeks: [4, 5, 6, 7] },
      { id: generateId(), name: "Frontend UI", selectedWeeks: [5, 6, 7, 8, 9] },
      { id: generateId(), name: "Integración", selectedWeeks: [8, 9, 10] },
    ],
  },
  {
    id: generateId(),
    name: "Pruebas y Lanzamiento",
    color: GROUP_COLORS[2],
    isCollapsed: false,
    activities: [
      { id: generateId(), name: "QA Testing", selectedWeeks: [10, 11] },
      { id: generateId(), name: "UAT", selectedWeeks: [11, 12] },
      { id: generateId(), name: "Deploy a producción", selectedWeeks: [12] },
    ],
  },
];

export default function App() {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [startDate, setStartDate] = useState<Date>(() => {
    const now = new Date();
    return startOfWeek(now, { weekStartsOn: 1 });
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const now = new Date();
    return addMonths(startOfWeek(now, { weekStartsOn: 1 }), 3);
  });
  const [newGroupName, setNewGroupName] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [projectName, setProjectName] = useState("Roadmap Planner");
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState("Roadmap Planner");
  const [viewMode, setViewMode] = useState<"editor" | "slide">("editor");

  const colorIndex = useRef(groups.length % GROUP_COLORS.length);

  const handleToggleCollapse = useCallback((groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g))
    );
  }, []);

  const handleAddActivity = useCallback((groupId: string, name: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              activities: [
                ...g.activities,
                { id: generateId(), name, selectedWeeks: [] },
              ],
            }
          : g
      )
    );
  }, []);

  const handleDeleteActivity = useCallback((groupId: string, activityId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, activities: g.activities.filter((a) => a.id !== activityId) }
          : g
      )
    );
  }, []);

  const handleToggleWeek = useCallback((groupId: string, activityId: string, weekIndex: number) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              activities: g.activities.map((a) =>
                a.id === activityId
                  ? {
                      ...a,
                      selectedWeeks: a.selectedWeeks.includes(weekIndex)
                        ? a.selectedWeeks.filter((w) => w !== weekIndex)
                        : [...a.selectedWeeks, weekIndex].sort((x, y) => x - y),
                    }
                  : a
              ),
            }
          : g
      )
    );
  }, []);

  const handleRangeSelect = useCallback(
    (groupId: string, activityId: string, startWeek: number, endWeek: number) => {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                activities: g.activities.map((a) => {
                  if (a.id !== activityId) return a;
                  const newWeeks = new Set(a.selectedWeeks);
                  for (let i = startWeek; i <= endWeek; i++) {
                    newWeeks.add(i);
                  }
                  return {
                    ...a,
                    selectedWeeks: Array.from(newWeeks).sort((x, y) => x - y),
                  };
                }),
              }
            : g
        )
      );
    },
    []
  );

  const handleRangeDeselect = useCallback(
    (groupId: string, activityId: string, startWeek: number, endWeek: number) => {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                activities: g.activities.map((a) => {
                  if (a.id !== activityId) return a;
                  return {
                    ...a,
                    selectedWeeks: a.selectedWeeks.filter((w) => w < startWeek || w > endWeek),
                  };
                }),
              }
            : g
        )
      );
    },
    []
  );

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      const color = GROUP_COLORS[colorIndex.current % GROUP_COLORS.length];
      colorIndex.current++;
      setGroups((prev) => [
        ...prev,
        {
          id: generateId(),
          name: newGroupName.trim(),
          color,
          isCollapsed: false,
          activities: [],
        },
      ]);
      setNewGroupName("");
      setIsAddingGroup(false);
    }
  };

  const handleDeleteGroup = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  const handleRenameGroup = useCallback((groupId: string, name: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name } : g))
    );
  }, []);

  const handleRenameActivity = useCallback((groupId: string, activityId: string, name: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, activities: g.activities.map((a) => (a.id === activityId ? { ...a, name } : a)) }
          : g
      )
    );
  }, []);

  const handleChangeGroupColor = useCallback((groupId: string, color: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, color } : g))
    );
  }, []);

  const handleMoveActivity = useCallback(
    (activityId: string, fromGroupId: string, toGroupId: string, toIndex: number) => {
      if (fromGroupId === toGroupId) {
        // Reorder within same group
        setGroups((prev) =>
          prev.map((g) => {
            if (g.id !== fromGroupId) return g;
            const actIdx = g.activities.findIndex((a) => a.id === activityId);
            if (actIdx === -1) return g;
            const newActivities = [...g.activities];
            const [moved] = newActivities.splice(actIdx, 1);
            const insertAt = toIndex > actIdx ? toIndex - 1 : toIndex;
            newActivities.splice(insertAt, 0, moved);
            return { ...g, activities: newActivities };
          })
        );
      } else {
        // Move between groups
        setGroups((prev) => {
          let movedActivity: typeof prev[0]["activities"][0] | null = null;
          const withoutActivity = prev.map((g) => {
            if (g.id !== fromGroupId) return g;
            const act = g.activities.find((a) => a.id === activityId);
            if (act) movedActivity = act;
            return { ...g, activities: g.activities.filter((a) => a.id !== activityId) };
          });
          if (!movedActivity) return prev;
          return withoutActivity.map((g) => {
            if (g.id !== toGroupId) return g;
            const newActivities = [...g.activities];
            newActivities.splice(toIndex, 0, movedActivity!);
            return { ...g, activities: newActivities };
          });
        });
      }
    },
    []
  );

  const handleReset = () => {
    setGroups(initialGroups);
    const newStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    setStartDate(newStart);
    setEndDate(addMonths(newStart, 3));
  };

  const totalActivities = groups.reduce((acc, g) => acc + g.activities.length, 0);
  const uniqueWeeks = new Set<number>();
  groups.forEach((g) => g.activities.forEach((act) => act.selectedWeeks.forEach((w) => uniqueWeeks.add(w))));
  const totalUniqueWeeks = uniqueWeeks.size;

  const totalWeeks = Math.max(4, Math.min(52, differenceInWeeks(endDate, startDate)));

  const gridWidth = LABEL_WIDTH + totalWeeks * CELL_WIDTH;

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="size-full flex flex-col bg-gray-50/50 overflow-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GanttChart size={20} className="text-primary" />
            {isEditingProjectName ? (
              <input
                type="text"
                value={editingProjectName}
                onChange={(e) => setEditingProjectName(e.target.value)}
                onBlur={() => {
                  if (editingProjectName.trim()) setProjectName(editingProjectName.trim());
                  setIsEditingProjectName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (editingProjectName.trim()) setProjectName(editingProjectName.trim());
                    setIsEditingProjectName(false);
                  }
                  if (e.key === "Escape") {
                    setEditingProjectName(projectName);
                    setIsEditingProjectName(false);
                  }
                }}
                className="text-lg bg-muted px-2 py-0.5 rounded border-none outline-none min-w-[120px]"
                autoFocus
              />
            ) : (
              <h1
                className="text-lg cursor-pointer hover:text-primary/70 transition-colors"
                onClick={() => {
                  setEditingProjectName(projectName);
                  setIsEditingProjectName(true);
                }}
                title="Clic para editar el nombre del proyecto"
              >
                {projectName}
              </h1>
            )}
          </div>
          <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
            <span>{groups.length} grupos</span>
            <span>·</span>
            <span>{totalActivities} actividades</span>
            <span>·</span>
            <span>{totalUniqueWeeks} semanas de trabajo</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("editor")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 transition-colors ${
                viewMode === "editor"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              title="Vista editor"
            >
              <PencilRuler size={13} />
              <span className="hidden sm:inline">Editor</span>
            </button>
            <button
              onClick={() => setViewMode("slide")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 transition-colors ${
                viewMode === "slide"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              title="Vista diapositiva"
            >
              <LayoutTemplate size={13} />
              <span className="hidden sm:inline">Diapositiva</span>
            </button>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <RotateCcw size={13} />
            Reiniciar
          </button>
        </div>
      </div>

      {/* Controls bar — only in editor mode */}
      {viewMode === "editor" && (
      <div className="bg-white border-b border-border px-4 py-2.5 flex items-center gap-4 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-muted-foreground" />
          <label className="text-xs text-muted-foreground">Inicio:</label>
          <input
            type="date"
            value={format(startDate, "yyyy-MM-dd")}
            onChange={(e) => {
              const date = new Date(e.target.value + "T00:00:00");
              if (!isNaN(date.getTime())) {
                const newStart = startOfWeek(date, { weekStartsOn: 1 });
                // If new start >= endDate, push endDate forward keeping same span
                if (newStart >= endDate) {
                  const currentSpan = differenceInWeeks(endDate, startDate);
                  setEndDate(addWeeks(newStart, Math.max(4, currentSpan)));
                }
                setStartDate(newStart);
              }
            }}
            className="text-sm border border-border rounded-md px-2 py-1 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Fin:</label>
          <input
            type="date"
            value={format(endDate, "yyyy-MM-dd")}
            onChange={(e) => {
              const date = new Date(e.target.value + "T00:00:00");
              if (!isNaN(date.getTime())) {
                // Ensure at least 4 weeks and at most 52 weeks from start
                const weeks = differenceInWeeks(date, startDate);
                if (weeks >= 4 && weeks <= 52) {
                  setEndDate(date);
                } else if (weeks < 4) {
                  setEndDate(addWeeks(startDate, 4));
                } else {
                  setEndDate(addWeeks(startDate, 52));
                }
              }
            }}
            min={format(addWeeks(startDate, 4), "yyyy-MM-dd")}
            max={format(addWeeks(startDate, 52), "yyyy-MM-dd")}
            className="text-sm border border-border rounded-md px-2 py-1 bg-white"
          />
        </div>

        <div className="h-5 w-px bg-border" />

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Semanas:</label>
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setEndDate((w) => addWeeks(startDate, Math.max(4, differenceInWeeks(w, startDate) - 4)))}
              className="px-1.5 py-1 hover:bg-muted transition-colors text-muted-foreground"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm px-2 min-w-[32px] text-center">{totalWeeks}</span>
            <button
              onClick={() => setEndDate((w) => addWeeks(startDate, Math.min(52, differenceInWeeks(w, startDate) + 4)))}
              className="px-1.5 py-1 hover:bg-muted transition-colors text-muted-foreground"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="h-5 w-px bg-border" />

        {isAddingGroup ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddGroup();
                if (e.key === "Escape") {
                  setIsAddingGroup(false);
                  setNewGroupName("");
                }
              }}
              placeholder="Nombre del grupo"
              className="text-sm border border-border rounded-md px-2 py-1 bg-white min-w-[160px]"
              autoFocus
            />
            <button
              onClick={handleAddGroup}
              className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Crear
            </button>
            <button
              onClick={() => {
                setIsAddingGroup(false);
                setNewGroupName("");
              }}
              className="text-xs px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingGroup(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <FolderPlus size={13} />
            Nuevo grupo
          </button>
        )}
      </div>
      )}

      {/* Content */}
      {viewMode === "slide" ? (
        <SlideView
          groups={groups}
          startDate={startDate}
          totalWeeks={totalWeeks}
          projectName={projectName}
        />
      ) : (
      /* Roadmap grid - single scrollable area */
      <div className="flex-1 overflow-auto">
        <div style={{ minWidth: gridWidth }}>
          {/* Sticky header */}
          <div className="sticky top-0 z-30 flex">
            {/* Label header - sticky left */}
            <div
              className="sticky left-0 z-40 bg-white border-r border-border shrink-0"
              style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }}
            >
              <div className="h-[29px] border-b border-border flex items-center px-3 bg-primary">
                <span className="text-xs text-primary-foreground uppercase tracking-wider">
                  Meses
                </span>
              </div>
              <div className="h-[29px] flex items-center px-3 bg-muted border-b border-border">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Semanas
                </span>
              </div>
            </div>
            {/* Week headers */}
            <div>
              <RoadmapHeader
                startDate={startDate}
                totalWeeks={totalWeeks}
                cellWidth={CELL_WIDTH}
              />
            </div>
          </div>

          {/* Groups */}
          {groups.map((group) => (
            <GroupSection
              key={group.id}
              group={group}
              totalWeeks={totalWeeks}
              cellWidth={CELL_WIDTH}
              labelWidth={LABEL_WIDTH}
              onToggleCollapse={() => handleToggleCollapse(group.id)}
              onAddActivity={(name) => handleAddActivity(group.id, name)}
              onDeleteActivity={(activityId) => handleDeleteActivity(group.id, activityId)}
              onToggleWeek={(activityId, weekIndex) =>
                handleToggleWeek(group.id, activityId, weekIndex)
              }
              onRangeSelect={(activityId, start, end) =>
                handleRangeSelect(group.id, activityId, start, end)
              }
              onRangeDeselect={(activityId, start, end) =>
                handleRangeDeselect(group.id, activityId, start, end)
              }
              onDeleteGroup={() => handleDeleteGroup(group.id)}
              onRenameGroup={(name) => handleRenameGroup(group.id, name)}
              onRenameActivity={(activityId, name) => handleRenameActivity(group.id, activityId, name)}
              onChangeGroupColor={(color) => handleChangeGroupColor(group.id, color)}
              onMoveActivity={(activityId, fromGroupId, toGroupId, toIndex) =>
                handleMoveActivity(activityId, fromGroupId, toGroupId, toIndex)
              }
            />
          ))}

          {groups.length === 0 && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <div className="text-center">
                <GanttChart size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay grupos todavía</p>
                <p className="text-xs mt-1">
                  Crea un nuevo grupo para comenzar a planificar tu roadmap
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
    </DndProvider>
  );
}