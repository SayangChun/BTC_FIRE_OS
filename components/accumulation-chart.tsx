"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBtc, formatCurrency } from "@/lib/calculations";
import type { Translation } from "@/lib/i18n";
import type { AccumulationPoint } from "@/lib/types";

type AccumulationChartProps = {
  data: AccumulationPoint[];
  t: Translation["chart"];
};

export function AccumulationChart({ data, t }: AccumulationChartProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-bitcoin" aria-hidden="true" />
          <CardTitle>{t.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="btcValue" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#F7931A" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#F7931A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                stroke="#A3A3A3"
                tick={{ fill: "#A3A3A3", fontSize: 12 }}
                tickFormatter={(value) => t.months[value as keyof typeof t.months]}
                tickLine={false}
              />
              <YAxis
                stroke="#A3A3A3"
                tick={{ fill: "#A3A3A3", fontSize: 12 }}
                tickFormatter={(value) => `$${Number(value) / 1000}k`}
                tickLine={false}
                width={48}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }

                  const point = payload[0].payload as AccumulationPoint;

                  return (
                    <div className="rounded-md border border-border bg-background p-3 text-sm shadow-soft">
                      <div className="font-semibold text-foreground">
                        {t.months[label as keyof typeof t.months]}
                      </div>
                      <div className="mt-1 text-muted">
                        {formatBtc(point.btc)}
                      </div>
                      <div className="text-bitcoin">
                        {formatCurrency(point.value)}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                dataKey="value"
                fill="url(#btcValue)"
                stroke="#F7931A"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
