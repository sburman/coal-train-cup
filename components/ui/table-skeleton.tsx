import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const LEADERBOARD_COLUMNS = [
  "Position",
  "Username",
  "Tips made",
  "Coal Train Cup points",
  "Accumulated margin",
] as const;

export function TableSkeleton({
  rows = 8,
  columns = LEADERBOARD_COLUMNS,
  "aria-label": ariaLabel = "Loading table",
}: {
  rows?: number;
  columns?: readonly string[];
  "aria-label"?: string;
}) {
  return (
    <div role="status" aria-label={ariaLabel} className="w-full">
      <p className="mb-2 text-sm text-white/70">Loading table…</p>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, i) => (
              <TableHead
                key={col}
                className={i >= 2 ? "text-right" : undefined}
              >
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((_, cellIndex) => (
                <TableCell
                  key={cellIndex}
                  className={cellIndex >= 2 ? "text-right" : undefined}
                >
                  <Skeleton className="h-5 w-full min-w-[2rem]" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
