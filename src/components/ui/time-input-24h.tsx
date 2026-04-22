import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TimeInput24hProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const minutes = ["00", "15", "30", "45"];

const timeOptions = hours.flatMap(h => minutes.map(m => `${h}:${m}`));

const TimeInput24h = ({ value, onChange, className }: TimeInput24hProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("", className)}>
        <SelectValue placeholder="Välj tid" />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {timeOptions.map(t => (
          <SelectItem key={t} value={t}>{t}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export { TimeInput24h };
