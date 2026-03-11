import type { ProjectFile } from "../types";

const INDEX_KEY = "roadmap-index";
const PROJECT_PREFIX = "roadmap-project-";

export interface SavedProjectMeta {
  id: string;
  name: string;
  updatedAt: string;
  groupCount: number;
  activityCount: number;
}

/** Create a unique ID from the project name: slug + short hash */
export function createProjectId(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  const hash = Math.random().toString(36).substring(2, 8);
  return `${slug}-${hash}`;
}

/** Get the index of all saved projects */
export function getSavedProjects(): SavedProjectMeta[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedProjectMeta[];
  } catch {
    return [];
  }
}

/** Save a project to localStorage */
export function saveProject(id: string, project: ProjectFile): void {
  // Save project data
  localStorage.setItem(PROJECT_PREFIX + id, JSON.stringify(project));

  // Update index
  const index = getSavedProjects();
  const activityCount = project.groups.reduce(
    (acc, g) => acc + g.activities.length,
    0
  );
  const existing = index.findIndex((p) => p.id === id);
  const meta: SavedProjectMeta = {
    id,
    name: project.projectName,
    updatedAt: new Date().toISOString(),
    groupCount: project.groups.length,
    activityCount,
  };

  if (existing >= 0) {
    index[existing] = meta;
  } else {
    index.unshift(meta);
  }

  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

/** Load a project from localStorage */
export function loadSavedProject(id: string): ProjectFile | null {
  try {
    const raw = localStorage.getItem(PROJECT_PREFIX + id);
    if (!raw) return null;
    return JSON.parse(raw) as ProjectFile;
  } catch {
    return null;
  }
}

/** Delete a project from localStorage */
export function deleteSavedProject(id: string): void {
  localStorage.removeItem(PROJECT_PREFIX + id);
  const index = getSavedProjects().filter((p) => p.id !== id);
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

/** Get the last active project ID */
export function getLastActiveId(): string | null {
  return localStorage.getItem("roadmap-active-id");
}

/** Set the last active project ID */
export function setLastActiveId(id: string): void {
  localStorage.setItem("roadmap-active-id", id);
}
