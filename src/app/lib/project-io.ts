import type { ProjectFile } from "../types";

export function downloadProjectAsJson(project: ProjectFile): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${project.projectName.replace(/\s+/g, "_")}_roadmap.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function readProjectFromFile(file: File): Promise<ProjectFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const validated = validateProjectFile(data);
        resolve(validated);
      } catch (e) {
        reject(
          e instanceof Error
            ? e
            : new Error("Archivo de proyecto inválido")
        );
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsText(file);
  });
}

function validateProjectFile(data: unknown): ProjectFile {
  if (!data || typeof data !== "object") {
    throw new Error("El archivo no contiene un proyecto válido");
  }

  const obj = data as Record<string, unknown>;

  if (obj.version !== 1) {
    throw new Error(
      `Versión de proyecto no soportada: ${obj.version ?? "desconocida"}`
    );
  }

  if (typeof obj.projectName !== "string" || !obj.projectName.trim()) {
    throw new Error("El proyecto debe tener un nombre");
  }

  if (typeof obj.startDate !== "string" || isNaN(Date.parse(obj.startDate))) {
    throw new Error("Fecha de inicio inválida");
  }

  if (typeof obj.endDate !== "string" || isNaN(Date.parse(obj.endDate))) {
    throw new Error("Fecha de fin inválida");
  }

  if (!Array.isArray(obj.groups)) {
    throw new Error("El proyecto debe tener un array de grupos");
  }

  const groups = obj.groups.map((g: unknown, gi: number) => {
    if (!g || typeof g !== "object") {
      throw new Error(`Grupo ${gi + 1} inválido`);
    }
    const group = g as Record<string, unknown>;

    if (typeof group.name !== "string" || !group.name.trim()) {
      throw new Error(`El grupo ${gi + 1} debe tener un nombre`);
    }
    if (typeof group.color !== "string") {
      throw new Error(`El grupo "${group.name}" debe tener un color`);
    }
    if (!Array.isArray(group.activities)) {
      throw new Error(`El grupo "${group.name}" debe tener un array de actividades`);
    }

    const activities = group.activities.map((a: unknown, ai: number) => {
      if (!a || typeof a !== "object") {
        throw new Error(
          `Actividad ${ai + 1} del grupo "${group.name}" es inválida`
        );
      }
      const act = a as Record<string, unknown>;

      if (typeof act.name !== "string" || !act.name.trim()) {
        throw new Error(
          `La actividad ${ai + 1} del grupo "${group.name}" debe tener un nombre`
        );
      }
      if (
        !Array.isArray(act.selectedWeeks) ||
        !act.selectedWeeks.every((w: unknown) => typeof w === "number")
      ) {
        throw new Error(
          `La actividad "${act.name}" tiene semanas inválidas`
        );
      }

      return {
        id: typeof act.id === "string" && act.id ? act.id : "",
        name: act.name as string,
        selectedWeeks: act.selectedWeeks as number[],
      };
    });

    return {
      id: typeof group.id === "string" && group.id ? group.id : "",
      name: group.name as string,
      color: group.color as string,
      isCollapsed: typeof group.isCollapsed === "boolean" ? group.isCollapsed : false,
      activities,
    };
  });

  return {
    version: 1,
    projectName: obj.projectName as string,
    startDate: obj.startDate as string,
    endDate: obj.endDate as string,
    groups,
  };
}
