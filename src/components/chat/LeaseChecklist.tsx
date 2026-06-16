import { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "intro", title: "Introduce yourself", desc: "Share your daily routine, sleep schedule, and expectations." },
  { id: "call", title: "Schedule a virtual meet", desc: "A quick video call ensures you are a good match before meeting in person." },
  { id: "visit", title: "In-person visit", desc: "Check out the apartment together or meet at a cafe." },
  { id: "lease", title: "Review lease terms", desc: "Discuss bills, deposit, and sign the roommate agreement." },
];

export function LeaseChecklist() {
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("lease-checklist") || "[]");
    } catch {
      return [];
    }
  });

  const toggle = (id: string) => {
    const next = completed.includes(id) ? completed.filter((x) => x !== id) : [...completed, id];
    setCompleted(next);
    localStorage.setItem("lease-checklist", JSON.stringify(next));
  };

  const progress = Math.round((completed.length / STEPS.length) * 100);

  return (
    <div className="border-b border-border bg-accent/20">
      <button 
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium hover:bg-accent/40"
      >
        <div className="flex items-center gap-2">
          <span>Roommate Checklist</span>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-3 pt-1">
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="space-y-2">
            {STEPS.map((step) => {
              const isDone = completed.includes(step.id);
              return (
                <div 
                  key={step.id} 
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-md p-2 transition-colors hover:bg-accent/50",
                    isDone ? "opacity-60" : ""
                  )}
                  onClick={() => toggle(step.id)}
                >
                  <div className="mt-0.5 shrink-0 text-primary">
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className={cn("text-sm font-semibold", isDone && "line-through")}>{step.title}</div>
                    <div className="text-xs text-muted-foreground">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
