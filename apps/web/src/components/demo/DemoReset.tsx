"use client";

import { RotateCcw } from "lucide-react";
import { useDemoReset } from "../../hooks/useDemo";
import { Button } from "../ui/button";

export function DemoReset() {
  const reset = useDemoReset();
  return (
    <Button variant="secondary" isLoading={reset.isPending} onClick={() => reset.mutate()}>
      <RotateCcw className="size-4" aria-hidden />
      Reset the demo
    </Button>
  );
}
