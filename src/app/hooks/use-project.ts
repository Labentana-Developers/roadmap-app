import { addWeeks, differenceInWeeks, startOfWeek } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type ProjectState,
  type ProjectFile,
  GROUP_COLORS,
  generateId,
  createDefaultProject,
} from "../types";
import {
  createProjectId,
  deleteSavedProject,
  getLastActiveId,
  getSavedProjects,
  loadSavedProject,
  saveProject,
  setLastActiveId,
  type SavedProjectMeta,
} from "../lib/storage";

export function useProject() {
  // Determine initial state: try to load last active project from localStorage
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const lastId = getLastActiveId();
    if (lastId && loadSavedProject(lastId)) return lastId;
    return null;
  });

  const [project, setProject] = useState<ProjectState>(() => {
    if (activeProjectId) {
      const saved = loadSavedProject(activeProjectId);
      if (saved) return projectFileToState(saved);
    }
    return createDefaultProject();
  });

  const [savedProjects, setSavedProjects] = useState<SavedProjectMeta[]>(getSavedProjects);

  // Auto-assign an ID to a new project if it doesn't have one yet
  useEffect(() => {
    if (!activeProjectId) {
      const id = createProjectId(project.projectName);
      setActiveProjectId(id);
      setLastActiveId(id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Auto-save with debounce ---
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!activeProjectId) return;

    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const file = stateToProjectFile(project);
      saveProject(activeProjectId, file);
      setLastActiveId(activeProjectId);
      setSavedProjects(getSavedProjects());
    }, 800);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [project, activeProjectId]);

  // --- Group operations ---

  const toggleCollapse = useCallback((groupId: string) => {
    setProject((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g
      ),
    }));
  }, []);

  const addGroup = useCallback((name: string) => {
    setProject((prev) => {
      const color = GROUP_COLORS[prev.groups.length % GROUP_COLORS.length];
      return {
        ...prev,
        groups: [
          ...prev.groups,
          {
            id: generateId(),
            name,
            color,
            isCollapsed: false,
            activities: [],
          },
        ],
      };
    });
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    setProject((prev) => ({
      ...prev,
      groups: prev.groups.filter((g) => g.id !== groupId),
    }));
  }, []);

  const renameGroup = useCallback((groupId: string, name: string) => {
    setProject((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId ? { ...g, name } : g
      ),
    }));
  }, []);

  const changeGroupColor = useCallback((groupId: string, color: string) => {
    setProject((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId ? { ...g, color } : g
      ),
    }));
  }, []);

  // --- Activity operations ---

  const addActivity = useCallback((groupId: string, name: string) => {
    setProject((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              activities: [
                ...g.activities,
                { id: generateId(), name, selectedWeeks: [] },
              ],
            }
          : g
      ),
    }));
  }, []);

  const deleteActivity = useCallback((groupId: string, activityId: string) => {
    setProject((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId
          ? { ...g, activities: g.activities.filter((a) => a.id !== activityId) }
          : g
      ),
    }));
  }, []);

  const renameActivity = useCallback(
    (groupId: string, activityId: string, name: string) => {
      setProject((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                activities: g.activities.map((a) =>
                  a.id === activityId ? { ...a, name } : a
                ),
              }
            : g
        ),
      }));
    },
    []
  );

  const toggleWeek = useCallback(
    (groupId: string, activityId: string, weekIndex: number) => {
      setProject((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
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
        ),
      }));
    },
    []
  );

  const rangeSelect = useCallback(
    (groupId: string, activityId: string, startWeek: number, endWeek: number) => {
      setProject((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                activities: g.activities.map((a) => {
                  if (a.id !== activityId) return a;
                  const newWeeks = new Set(a.selectedWeeks);
                  for (let i = startWeek; i <= endWeek; i++) newWeeks.add(i);
                  return {
                    ...a,
                    selectedWeeks: Array.from(newWeeks).sort((x, y) => x - y),
                  };
                }),
              }
            : g
        ),
      }));
    },
    []
  );

  const rangeDeselect = useCallback(
    (groupId: string, activityId: string, startWeek: number, endWeek: number) => {
      setProject((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                activities: g.activities.map((a) => {
                  if (a.id !== activityId) return a;
                  return {
                    ...a,
                    selectedWeeks: a.selectedWeeks.filter(
                      (w) => w < startWeek || w > endWeek
                    ),
                  };
                }),
              }
            : g
        ),
      }));
    },
    []
  );

  const moveActivity = useCallback(
    (activityId: string, fromGroupId: string, toGroupId: string, toIndex: number) => {
      setProject((prev) => {
        if (fromGroupId === toGroupId) {
          return {
            ...prev,
            groups: prev.groups.map((g) => {
              if (g.id !== fromGroupId) return g;
              const actIdx = g.activities.findIndex((a) => a.id === activityId);
              if (actIdx === -1) return g;
              const newActivities = [...g.activities];
              const [moved] = newActivities.splice(actIdx, 1);
              const insertAt = toIndex > actIdx ? toIndex - 1 : toIndex;
              newActivities.splice(insertAt, 0, moved);
              return { ...g, activities: newActivities };
            }),
          };
        }

        let movedActivity: (typeof prev.groups)[0]["activities"][0] | null = null;
        const withoutActivity = prev.groups.map((g) => {
          if (g.id !== fromGroupId) return g;
          const act = g.activities.find((a) => a.id === activityId);
          if (act) movedActivity = act;
          return { ...g, activities: g.activities.filter((a) => a.id !== activityId) };
        });
        if (!movedActivity) return prev;
        return {
          ...prev,
          groups: withoutActivity.map((g) => {
            if (g.id !== toGroupId) return g;
            const newActivities = [...g.activities];
            newActivities.splice(toIndex, 0, movedActivity!);
            return { ...g, activities: newActivities };
          }),
        };
      });
    },
    []
  );

  // --- Project-level operations ---

  const setProjectName = useCallback((projectName: string) => {
    setProject((prev) => ({ ...prev, projectName }));
  }, []);

  const setStartDate = useCallback((date: Date) => {
    setProject((prev) => {
      const newStart = startOfWeek(date, { weekStartsOn: 1 });
      let newEnd = prev.endDate;
      if (newStart >= prev.endDate) {
        const currentSpan = differenceInWeeks(prev.endDate, prev.startDate);
        newEnd = addWeeks(newStart, Math.max(4, currentSpan));
      }
      return { ...prev, startDate: newStart, endDate: newEnd };
    });
  }, []);

  const setEndDate = useCallback((date: Date) => {
    setProject((prev) => {
      const weeks = differenceInWeeks(date, prev.startDate);
      let newEnd: Date;
      if (weeks >= 4 && weeks <= 52) {
        newEnd = date;
      } else if (weeks < 4) {
        newEnd = addWeeks(prev.startDate, 4);
      } else {
        newEnd = addWeeks(prev.startDate, 52);
      }
      return { ...prev, endDate: newEnd };
    });
  }, []);

  const adjustWeeks = useCallback((delta: number) => {
    setProject((prev) => {
      const current = differenceInWeeks(prev.endDate, prev.startDate);
      const clamped = Math.max(4, Math.min(52, current + delta));
      return { ...prev, endDate: addWeeks(prev.startDate, clamped) };
    });
  }, []);

  const createNewProject = useCallback(() => {
    const newState = createDefaultProject();
    const id = createProjectId(newState.projectName);
    setProject(newState);
    setActiveProjectId(id);
    setLastActiveId(id);
    // Save immediately
    const file = stateToProjectFile(newState);
    saveProject(id, file);
    setSavedProjects(getSavedProjects());
  }, []);

  const switchProject = useCallback((id: string) => {
    const saved = loadSavedProject(id);
    if (!saved) return;
    setProject(projectFileToState(saved));
    setActiveProjectId(id);
    setLastActiveId(id);
  }, []);

  const deleteProject = useCallback(
    (id: string) => {
      deleteSavedProject(id);
      setSavedProjects(getSavedProjects());
      // If we deleted the active project, switch to another or create new
      if (id === activeProjectId) {
        const remaining = getSavedProjects();
        if (remaining.length > 0) {
          const first = remaining[0];
          const saved = loadSavedProject(first.id);
          if (saved) {
            setProject(projectFileToState(saved));
            setActiveProjectId(first.id);
            setLastActiveId(first.id);
            return;
          }
        }
        // No projects left — create a fresh one
        const newState = createDefaultProject();
        const newId = createProjectId(newState.projectName);
        setProject(newState);
        setActiveProjectId(newId);
        setLastActiveId(newId);
      }
    },
    [activeProjectId]
  );

  const loadProject = useCallback((file: ProjectFile) => {
    const state = projectFileToState(file);
    const id = createProjectId(file.projectName);
    setProject(state);
    setActiveProjectId(id);
    setLastActiveId(id);
    saveProject(id, file);
    setSavedProjects(getSavedProjects());
  }, []);

  const getProjectFile = useCallback((): ProjectFile => {
    return stateToProjectFile(project);
  }, [project]);

  return {
    project,
    activeProjectId,
    savedProjects,
    // Group
    toggleCollapse,
    addGroup,
    deleteGroup,
    renameGroup,
    changeGroupColor,
    // Activity
    addActivity,
    deleteActivity,
    renameActivity,
    toggleWeek,
    rangeSelect,
    rangeDeselect,
    moveActivity,
    // Project-level
    setProjectName,
    setStartDate,
    setEndDate,
    adjustWeeks,
    createNewProject,
    switchProject,
    deleteProject,
    loadProject,
    getProjectFile,
  };
}

// --- Helpers ---

function projectFileToState(file: ProjectFile): ProjectState {
  const startDate = startOfWeek(new Date(file.startDate), { weekStartsOn: 1 });
  return {
    projectName: file.projectName,
    startDate,
    endDate: new Date(file.endDate),
    groups: file.groups.map((g) => ({
      ...g,
      isCollapsed: g.isCollapsed ?? false,
      id: g.id || generateId(),
      activities: g.activities.map((a) => ({
        ...a,
        id: a.id || generateId(),
      })),
    })),
  };
}

function stateToProjectFile(project: ProjectState): ProjectFile {
  return {
    version: 1,
    projectName: project.projectName,
    startDate: project.startDate.toISOString(),
    endDate: project.endDate.toISOString(),
    groups: project.groups.map(({ isCollapsed: _, ...g }) => ({
      ...g,
      isCollapsed: false,
    })),
  };
}
