import { Button } from "@/components/ui/button";

interface TabItem {
  value: string;
  label: string;
  badge?: number;
}

interface TabsFilterProps {
  value: string;
  onChange: (value: string) => void;
  items: TabItem[];
}

export function TabsFilter({ value, onChange, items }: TabsFilterProps) {
  return (
    <div className="flex gap-2 mb-3">
      {items.map((item) => (
        <Button
          key={item.value}
          variant={value === item.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(item.value)}
          className="h-8"
        >
          {item.label}
          {typeof item.badge === "number" && (
            <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-700 rounded px-1">
              {item.badge}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}