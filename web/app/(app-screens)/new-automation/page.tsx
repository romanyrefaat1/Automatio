"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { AnimatedButton } from "@/components/ui/animated-button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import createNewAutomation from "@/actions/createNewAutomation";
import { useRouter } from "next/navigation";

export default function NewAutomation() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter()

  const handleContinue = async () => {
    if (!name.trim()) return;

    setIsCreating(true);

    try {
      const automation = await createNewAutomation({
        name: name.trim(),
        description: description.trim() || null,
      });

      console.log("Created automation:", automation);

      router.push(`/builder/${automation.id}`);
    } catch (error) {
      console.error("Failed to create automation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:flex md:items-center md:justify-center md:p-8">
      <Card className="w-full max-w-2xl border-0 shadow-none md:border md:p-8 md:shadow-sm">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Create automation
            </p>

            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Create a new automation
            </h1>

            <p className="text-muted-foreground">
              Give your automation a name and describe what it should do.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium"
              >
                Name
              </label>

              <Input
                id="name"
                placeholder="e.g. Create GitHub issue"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-sm font-medium"
              >
                Description
              </label>

              <Textarea
                id="description"
                placeholder="Describe what this automation does..."
                rows={4}
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                disabled={isCreating}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <AnimatedButton
              type="button"
              variant="default"
              size="default"
              icon={<ArrowRight />}
              loadingIcon={<Loader2 className="animate-spin" />}
              loading={isCreating}
              disabled={!name.trim() || isCreating}
              onClick={handleContinue}
            >
              {isCreating ? "Creating..." : "Continue"}
            </AnimatedButton>
          </div>
        </div>
      </Card>
    </div>
  );
}