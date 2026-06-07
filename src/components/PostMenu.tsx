import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export function PostMenu({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!canEdit && !canDelete) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Post menu"
        className="grid h-8 w-8 place-items-center rounded-full text-foreground/60 hover:bg-muted/40 hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="glass absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-border/40 py-1 text-sm shadow-lg">
          {canEdit && (
            <button
              onClick={() => { setOpen(false); onEdit(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/40"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit post
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-muted/40"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete post
            </button>
          )}
        </div>
      )}
    </div>
  );
}