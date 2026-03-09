import { addWeeks, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";

interface RoadmapHeaderProps {
  startDate: Date;
  totalWeeks: number;
  cellWidth: number;
}

export function RoadmapHeader({ startDate, totalWeeks, cellWidth }: RoadmapHeaderProps) {
  const weeks: { weekLabel: string; month: string; monthIndex: number }[] = [];
  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });

  for (let i = 0; i < totalWeeks; i++) {
    const date = addWeeks(weekStart, i);
    const month = format(date, "MMM yyyy", { locale: es });
    const monthIndex = date.getMonth() + date.getFullYear() * 12;
    weeks.push({
      weekLabel: `S${i + 1}`,
      month,
      monthIndex,
    });
  }

  // Group consecutive weeks by month
  const monthGroups: { month: string; count: number }[] = [];
  for (const week of weeks) {
    if (monthGroups.length > 0 && monthGroups[monthGroups.length - 1].month === week.month) {
      monthGroups[monthGroups.length - 1].count++;
    } else {
      monthGroups.push({ month: week.month, count: 1 });
    }
  }

  return (
    <div>
      {/* Month row */}
      <div className="flex">
        {monthGroups.map((group, idx) => (
          <div
            key={idx}
            className={`border-b border-border bg-primary text-primary-foreground text-center truncate flex items-center justify-center ${
              idx < monthGroups.length - 1 ? "border-r-2 border-r-primary-foreground/25" : "border-r border-r-border"
            }`}
            style={{ width: group.count * cellWidth, minWidth: group.count * cellWidth, height: 29 }}
          >
            <span className="text-xs uppercase tracking-wider">{group.month}</span>
          </div>
        ))}
      </div>
      {/* Week row */}
      <div className="flex">
        {weeks.map((week, idx) => (
          <div
            key={idx}
            className="border-b border-r border-border bg-muted text-muted-foreground text-center flex items-center justify-center"
            style={{ width: cellWidth, minWidth: cellWidth, height: 29 }}
          >
            <span className="text-xs">{week.weekLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
