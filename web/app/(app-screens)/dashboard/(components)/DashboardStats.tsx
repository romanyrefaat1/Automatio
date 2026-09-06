import {
  Activity,
  CheckCircle2,
  PlayCircle,
  ArrowUpRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface DashboardStatsProps {
  total: number;
  active: number;
  runsToday: number;
}

export default function DashboardStats({
  total,
  active,
  runsToday,
}: DashboardStatsProps) {
  const stats = [
    {
      label: "Total automations",
      value: total,
      icon: Activity,
      bg: "bg-[hsl(var(--secondary-bg))]",
      fg: "text-[hsl(var(--secondary-fg))]",
    },
    {
      label: "Active automations",
      value: active,
      icon: CheckCircle2,
      bg: "bg-[hsl(var(--success-bg))]",
      fg: "text-[hsl(var(--success-fg))]",
    },
    {
      label: "Runs today",
      value: runsToday,
      icon: PlayCircle,
      bg: "bg-[hsl(var(--info-bg))]",
      fg: "text-[hsl(var(--info-fg))]",
    },
  ];

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card
            key={stat.label}
            className="
              border-border bg-card shadow-xs
              transition-shadow duration-200
              hover:shadow-md
            "
          >
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`
                    flex h-11 w-11 shrink-0 items-center
                    justify-center rounded-xl
                    ${stat.bg}
                  `}
                >
                  <Icon className={`h-5 w-5 ${stat.fg}`} />
                </div>

                <div>
                  <p className="text-2xl font-semibold leading-none tracking-tight">
                    {stat.value}
                  </p>

                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </div>

              <ArrowUpRight className="h-4 w-4 text-muted-foreground/50" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}