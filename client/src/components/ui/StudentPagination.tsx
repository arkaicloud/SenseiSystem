import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

function rangeWithDots(total: number, current: number) {
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) pages.push(i);
  }
  // insert ellipses
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of pages) {
    if (typeof p === "number") {
      if (prev && p - prev > 1) out.push("…");
      out.push(p);
      prev = p;
    }
  }
  return out;
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, totalPages, onPage }: PaginationProps) {
  const pages = rangeWithDots(totalPages, page);
  const goto = (p: number) => onPage(Math.max(1, Math.min(totalPages, p)));

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => goto(page - 1)}
        disabled={page === 1}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`dots-${i}`} className="px-2 text-slate-400 text-sm">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            onClick={() => goto(p as number)}
            className="h-8 min-w-8 px-2"
          >
            {p}
          </Button>
        )
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => goto(page + 1)}
        disabled={page === totalPages}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}