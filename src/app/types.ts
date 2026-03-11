import { addMonths, startOfWeek } from "date-fns";

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

/** Runtime state — used by components and the useProject hook */
export interface ProjectState {
  projectName: string;
  startDate: Date;
  endDate: Date;
  groups: Group[];
}

/** Serialization format — what gets saved to / loaded from JSON */
export interface ProjectFile {
  version: 1;
  projectName: string;
  startDate: string;
  endDate: string;
  groups: Group[];
}

export const GROUP_COLORS = [
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

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function createDefaultProject(): ProjectState {
  const now = new Date();
  const startDate = startOfWeek(now, { weekStartsOn: 1 });
  return {
    projectName: "Roadmap Planner",
    startDate,
    endDate: addMonths(startDate, 3),
    groups: [
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
    ],
  };
}
