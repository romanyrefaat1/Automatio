import Link from "next/link";
import { Plus, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function EmptyState() {
  return (
    <div
      className="
        relative overflow-hidden rounded-xl
        border border-dashed border-border
        bg-card px-6 py-20 text-center
      "
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary-bg))]">
        <Workflow className="h-7 w-7 text-[hsl(var(--primary-fg))]" />
      </div>

      <h3 className="mt-5 text-lg font-semibold">
        Create your first automation
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Build a browser workflow that handles repetitive tasks for you.
        Start with a blank automation and add steps from the builder.
      </p>

      <Button asChild className="mt-6">
        <Link href="/new-automation">
          <Plus className="mr-1.5 h-4 w-4" />
          New Automation
        </Link>
      </Button>
    </div>
  );
}