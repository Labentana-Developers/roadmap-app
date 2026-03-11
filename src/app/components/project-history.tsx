import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, FolderOpen, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import type { SavedProjectMeta } from "../lib/storage";

interface ProjectHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: SavedProjectMeta[];
  activeProjectId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export function ProjectHistory({
  open,
  onOpenChange,
  projects,
  activeProjectId,
  onSelect,
  onDelete,
  onCreateNew,
}: ProjectHistoryProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={18} />
            Historial de proyectos
          </DialogTitle>
          <DialogDescription>
            Selecciona un proyecto guardado o crea uno nuevo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                p.id === activeProjectId
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted"
              }`}
            >
              <FolderOpen
                size={16}
                className="text-muted-foreground mt-0.5 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {p.groupCount} grupos · {p.activityCount} actividades ·{" "}
                  {format(new Date(p.updatedAt), "d MMM yyyy, HH:mm", {
                    locale: es,
                  })}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(p.id);
                }}
                className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded shrink-0"
                title="Eliminar proyecto"
              >
                <Trash2 size={14} />
              </button>
            </button>
          ))}

          {projects.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No hay proyectos guardados.
            </div>
          )}
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center justify-center gap-2 w-full text-sm px-3 py-2.5 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <Plus size={14} />
          Crear nuevo proyecto
        </button>
      </DialogContent>
    </Dialog>
  );
}
