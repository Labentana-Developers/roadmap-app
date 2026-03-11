import { addWeeks, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { toPng, toBlob } from "html-to-image";
import { Copy, Check, Download, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { Group } from "../types";

interface SlideViewProps {
  groups: Group[];
  startDate: Date;
  totalWeeks: number;
  projectName: string;
}

// Threshold: hide week labels when there are too many to fit without overlapping
const WEEK_LABEL_THRESHOLD = 24;

export function SlideView({ groups, startDate, totalWeeks, projectName }: SlideViewProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "loading" | "done">("idle");

  const handleCopyAsImage = useCallback(async () => {
    if (!slideRef.current || copyState === "loading") return;
    setCopyState("loading");
    try {
      const blob = await toBlob(slideRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      if (blob && navigator.clipboard && typeof ClipboardItem !== "undefined") {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCopyState("done");
          setTimeout(() => setCopyState("idle"), 2000);
          return;
        } catch {
          // Clipboard blocked — fall through to download
        }
      }
      const dataUrl = await toPng(slideRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `${projectName.replace(/\s+/g, "_")}_roadmap.png`;
      link.href = dataUrl;
      link.click();
      setCopyState("done");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("idle");
    }
  }, [copyState, projectName]);

  const handleDownloadPng = useCallback(async () => {
    if (!slideRef.current) return;
    try {
      const dataUrl = await toPng(slideRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `${projectName.replace(/\s+/g, "_")}_roadmap.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error al descargar imagen:", err);
    }
  }, [projectName]);

  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
  const showWeekLabels = totalWeeks <= WEEK_LABEL_THRESHOLD;

  const weeks: { label: string; month: string; date: Date }[] = [];
  for (let i = 0; i < totalWeeks; i++) {
    const date = addWeeks(weekStart, i);
    weeks.push({
      label: `S${i + 1}`,
      month: format(date, "MMM", { locale: es }),
      date,
    });
  }

  const monthGroups: { month: string; count: number; startIdx: number }[] = [];
  for (let i = 0; i < weeks.length; i++) {
    const m = format(weeks[i].date, "MMM yyyy", { locale: es });
    if (monthGroups.length > 0 && monthGroups[monthGroups.length - 1].month === m) {
      monthGroups[monthGroups.length - 1].count++;
    } else {
      monthGroups.push({ month: m, count: 1, startIdx: i });
    }
  }

  const visibleGroups = groups.filter((g) => g.activities.length > 0);

  const todayWeekIndex = (() => {
    const now = new Date();
    for (let i = 0; i < totalWeeks; i++) {
      const wStart = addWeeks(weekStart, i);
      const wEnd = addWeeks(weekStart, i + 1);
      if (now >= wStart && now < wEnd) return i;
    }
    return null;
  })();

  const uniqueWeeks = new Set<number>();
  groups.forEach((g) =>
    g.activities.forEach((a) => a.selectedWeeks.forEach((w) => uniqueWeeks.add(w)))
  );

  const totalActivities = groups.reduce((acc, g) => acc + g.activities.length, 0);

  const endDate = addWeeks(weekStart, totalWeeks - 1);
  const dateRange = `${format(weekStart, "d MMM yyyy", { locale: es })} – ${format(endDate, "d MMM yyyy", { locale: es })}`;

  return (
    <div className="flex-1 overflow-auto bg-gray-200 flex flex-col items-center justify-center p-8 gap-4">
      <p className="text-xs text-gray-500 tracking-wide uppercase">
        Vista diapositiva — {totalWeeks} semanas
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCopyAsImage}
          disabled={copyState === "loading"}
          className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all ${
            copyState === "done"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400"
          }`}
        >
          {copyState === "loading" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : copyState === "done" ? (
            <Check size={14} />
          ) : (
            <Copy size={14} />
          )}
          {copyState === "done" ? "Listo!" : copyState === "loading" ? "Capturando..." : "Copiar / Descargar"}
        </button>
        <button
          onClick={handleDownloadPng}
          className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400 shadow-sm transition-all"
        >
          <Download size={14} />
          Descargar PNG
        </button>
      </div>

      <div
        ref={slideRef}
        className="bg-white rounded-xl shadow-2xl"
        style={{
          width: "min(calc(100vw - 4rem), 1280px)",
          minHeight: "calc(min(calc(100vw - 4rem), 1280px) * 9 / 16)",
          fontFamily: "var(--font-geometria)",
        }}
      >
        <div className="flex flex-col" style={{ padding: "2.5% 3%" }}>
          <div className="flex items-start justify-between mb-[1.5%]">
            <div>
              <h1
                className="text-foreground"
                style={{ fontSize: "clamp(18px, 2.8vw, 34px)", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2 }}
              >
                {projectName}
              </h1>
              <p style={{ fontSize: "clamp(10px, 1.1vw, 14px)", color: "#888", marginTop: "0.3em", letterSpacing: "0.04em" }}>
                {dateRange}
              </p>
            </div>

            <div className="flex gap-[0.6%]">
              {[
                { label: "grupos", value: groups.length },
                { label: "actividades", value: totalActivities },
                { label: "sem. trabajo", value: uniqueWeeks.size },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center justify-center rounded-lg"
                  style={{
                    background: "#F4F6FA",
                    padding: "0.4em 1.1em",
                    minWidth: "clamp(54px, 6vw, 82px)",
                  }}
                >
                  <span style={{ fontSize: "clamp(14px, 1.8vw, 24px)", fontWeight: 700, color: "#111", lineHeight: 1 }}>
                    {s.value}
                  </span>
                  <span style={{ fontSize: "clamp(8px, 0.8vw, 11px)", color: "#888", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "0.2em", whiteSpace: "nowrap" }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "#E5E7EB", marginBottom: "1.2%" }} />

          <div className="flex-1 flex flex-col">
            {/* Month header */}
            <div className="flex" style={{ marginBottom: "0.2%" }}>
              <div style={{ flexShrink: 0, width: "17%" }} />
              <div className="flex flex-1">
                {monthGroups.map((mg, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center"
                    style={{
                      flex: mg.count,
                      fontSize: "clamp(8px, 0.85vw, 12px)",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#555",
                      borderLeft: idx > 0 ? "1px solid #E5E7EB" : undefined,
                      paddingBottom: "0.2em",
                    }}
                  >
                    {mg.month}
                  </div>
                ))}
              </div>
            </div>

            {/* Week number header — only shown when weeks fit without overlapping */}
            {showWeekLabels && (
              <div className="flex" style={{ marginBottom: "0.5%" }}>
                <div style={{ flexShrink: 0, width: "17%" }} />
                <div className="flex flex-1">
                  {weeks.map((w, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-center"
                      style={{
                        flex: 1,
                        fontSize: "clamp(7px, 0.7vw, 10px)",
                        fontWeight: todayWeekIndex === idx ? 700 : 400,
                        color: todayWeekIndex === idx ? "#374151" : "#BBB",
                        position: "relative",
                      }}
                    >
                      {w.label}
                      {todayWeekIndex === idx && (
                        <span
                          style={{
                            position: "absolute",
                            bottom: -3,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 3,
                            height: 3,
                            borderRadius: "50%",
                            background: "#EF4444",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* When week labels are hidden, add a thin tick row so "today" is still visible */}
            {!showWeekLabels && todayWeekIndex !== null && (
              <div className="flex" style={{ marginBottom: "0.5%" }}>
                <div style={{ flexShrink: 0, width: "17%" }} />
                <div className="flex flex-1">
                  {weeks.map((_, idx) => (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        height: 4,
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {todayWeekIndex === idx && (
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "#EF4444",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Groups & activities */}
            <div className="flex flex-col gap-[1.5%]">
              {visibleGroups.map((group, gIdx) => (
                <div key={group.id} className="flex flex-col" style={{ marginBottom: gIdx < visibleGroups.length - 1 ? "1%" : 0 }}>
                  <div className="flex items-center" style={{ marginBottom: "0.4%", paddingRight: "1.5%", position: "relative", zIndex: 1 }}>
                    <div
                      style={{
                        width: "clamp(7px, 0.6vw, 10px)",
                        height: "clamp(7px, 0.6vw, 10px)",
                        borderRadius: "50%",
                        backgroundColor: group.color,
                        flexShrink: 0,
                        marginRight: "0.4em",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "clamp(9px, 0.9vw, 13px)",
                        fontWeight: 700,
                        color: group.color,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {group.name}
                    </span>
                  </div>

                  {group.activities.map((activity) => {
                    const visibleSelected = activity.selectedWeeks.filter((w) => w < totalWeeks);
                    return (
                      <div key={activity.id} className="flex items-center" style={{ marginBottom: "0.5%" }}>
                        <div
                          style={{
                            width: "17%",
                            flexShrink: 0,
                            paddingRight: "1.5%",
                            fontSize: "clamp(9px, 0.95vw, 13px)",
                            color: "#374151",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            textAlign: "right",
                          }}
                        >
                          {activity.name}
                        </div>

                        <div className="flex flex-1" style={{ gap: "clamp(1px, 0.1vw, 2px)" }}>
                          {weeks.map((_, wIdx) => {
                            const isSelected = visibleSelected.includes(wIdx);
                            const isToday = todayWeekIndex === wIdx;

                            const prevSelected = visibleSelected.includes(wIdx - 1);
                            const nextSelected = visibleSelected.includes(wIdx + 1);
                            const isStart = isSelected && !prevSelected;
                            const isEnd = isSelected && !nextSelected;

                            const borderRadius = isSelected
                              ? `${isStart ? "4px" : "0"} ${isEnd ? "4px" : "0"} ${isEnd ? "4px" : "0"} ${isStart ? "4px" : "0"}`
                              : "3px";

                            return (
                              <div
                                key={wIdx}
                                style={{
                                  flex: 1,
                                  height: "clamp(10px, 1.1vw, 16px)",
                                  borderRadius,
                                  backgroundColor: isSelected
                                    ? group.color
                                    : isToday
                                    ? "rgba(239,68,68,0.06)"
                                    : wIdx % 2 === 0
                                    ? "#F9FAFB"
                                    : "#F3F4F6",
                                  outline: isToday && !isSelected ? "1px solid rgba(239,68,68,0.2)" : undefined,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {visibleGroups.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <p style={{ fontSize: "clamp(11px, 1.2vw, 15px)", color: "#BBB" }}>
                    Sin actividades planificadas
                  </p>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: "1.5%",
              borderTop: "1px solid #F0F0F0",
              paddingTop: "0.8%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div className="flex items-center" style={{ gap: "clamp(8px, 1vw, 16px)", flexWrap: "wrap" }}>
              {groups.map((g) => (
                <div key={g.id} className="flex items-center" style={{ gap: "0.35em" }}>
                  <div
                    style={{
                      width: "clamp(7px, 0.7vw, 10px)",
                      height: "clamp(7px, 0.7vw, 10px)",
                      borderRadius: 2,
                      backgroundColor: g.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: "clamp(8px, 0.8vw, 11px)", color: "#888", whiteSpace: "nowrap" }}>
                    {g.name}
                  </span>
                </div>
              ))}
            </div>

            {todayWeekIndex !== null && (
              <div className="flex items-center" style={{ gap: "0.4em" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }} />
                <span style={{ fontSize: "clamp(8px, 0.8vw, 11px)", color: "#999" }}>Hoy</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
