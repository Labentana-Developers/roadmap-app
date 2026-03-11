import { addWeeks, differenceInWeeks, format, startOfWeek } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderPlus,
  GanttChart,
  LayoutTemplate,
  PencilRuler,
  RotateCcw,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { RoadmapHeader } from "./components/roadmap-header";
import { GroupSection } from "./components/group-section";
import { SlideView } from "./components/slide-view";
import { useProject } from "./hooks/use-project";
import { downloadProjectAsJson, readProjectFromFile } from "./lib/project-io";

const CELL_WIDTH = 44;
const LABEL_WIDTH = 260;

export default function App() {
  const {
    project,
    toggleCollapse,
    addGroup,
    deleteGroup,
    renameGroup,
    changeGroupColor,
    addActivity,
    deleteActivity,
    renameActivity,
    toggleWeek,
    rangeSelect,
    rangeDeselect,
    moveActivity,
    setProjectName,
    setStartDate,
    setEndDate,
    adjustWeeks,
    resetProject,
    loadProject,
    getProjectFile,
  } = useProject();

  const { projectName, startDate, endDate, groups } = project;

  // UI-only state
  const [newGroupName, setNewGroupName] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState(projectName);
  const [viewMode, setViewMode] = useState<"editor" | "slide">("editor");
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim());
      setNewGroupName("");
      setIsAddingGroup(false);
    }
  };

  const handleExport = () => {
    downloadProjectAsJson(getProjectFile());
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportError(null);
      const projectFile = await readProjectFromFile(file);
      loadProject(projectFile);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al importar el proyecto";
      setImportError(message);
      setTimeout(() => setImportError(null), 4000);
    }
    // Reset input so same file can be re-imported
    e.target.value = "";
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

          <div className="h-5 w-px bg-border" />

          {/* Export / Import */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors"
            title="Exportar proyecto como JSON"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors"
            title="Importar proyecto desde JSON"
          >
            <Upload size={13} />
            <span className="hidden sm:inline">Importar</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          <div className="h-5 w-px bg-border" />

          <button
            onClick={resetProject}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <RotateCcw size={13} />
            Reiniciar
          </button>
        </div>
      </div>

      {/* Import error toast */}
      {importError && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-sm text-destructive shrink-0">
          {importError}
        </div>
      )}

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
                setStartDate(date);
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
                setEndDate(date);
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
              onClick={() => adjustWeeks(-4)}
              className="px-1.5 py-1 hover:bg-muted transition-colors text-muted-foreground"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm px-2 min-w-[32px] text-center">{totalWeeks}</span>
            <button
              onClick={() => adjustWeeks(4)}
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
              onToggleCollapse={() => toggleCollapse(group.id)}
              onAddActivity={(name) => addActivity(group.id, name)}
              onDeleteActivity={(activityId) => deleteActivity(group.id, activityId)}
              onToggleWeek={(activityId, weekIndex) =>
                toggleWeek(group.id, activityId, weekIndex)
              }
              onRangeSelect={(activityId, start, end) =>
                rangeSelect(group.id, activityId, start, end)
              }
              onRangeDeselect={(activityId, start, end) =>
                rangeDeselect(group.id, activityId, start, end)
              }
              onDeleteGroup={() => deleteGroup(group.id)}
              onRenameGroup={(name) => renameGroup(group.id, name)}
              onRenameActivity={(activityId, name) => renameActivity(group.id, activityId, name)}
              onChangeGroupColor={(color) => changeGroupColor(group.id, color)}
              onMoveActivity={(activityId, fromGroupId, toGroupId, toIndex) =>
                moveActivity(activityId, fromGroupId, toGroupId, toIndex)
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
