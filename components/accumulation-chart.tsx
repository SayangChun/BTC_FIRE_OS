"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/calculations";
import type { Translation } from "@/lib/i18n";
import type { PricePoint } from "@/lib/types";
import { cn } from "@/lib/utils";

type RangeKey = "ALL" | "5Y" | "3Y" | "1Y" | "6M" | "3M" | "1M";

type BtcPriceChartProps = {
  data: PricePoint[];
  loading: boolean;
  error: boolean;
  t: Translation["chart"];
  language: string;
};

function fmtDate(dateStr: string, locale: string) {
  const d = new Date(dateStr + "T00:00:00Z");
  return new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" }).format(d);
}

function fmtTooltip(dateStr: string, locale: string) {
  const d = new Date(dateStr + "T00:00:00Z");
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(d);
}

const RANGE_DAYS: Record<RangeKey, number | null> = {
  ALL: null, "5Y": 1825, "3Y": 1095, "1Y": 365, "6M": 183, "3M": 91, "1M": 30,
};

const RANGES: RangeKey[] = ["ALL", "5Y", "3Y", "1Y", "6M", "3M", "1M"];

export function BtcPriceChart({ data, loading, error, t, language }: BtcPriceChartProps) {
  const [range, setRange] = useState<RangeKey>("ALL");

  const filtered = useMemo(() => {
    const days = RANGE_DAYS[range];
    if (days === null) return data;
    const cutoff = Date.now() - days * 86400000;
    return data.filter((d) => new Date(d.date + "T00:00:00Z").getTime() >= cutoff);
  }, [data, range]);

  const locale = language === "zhTW" ? "zh-TW" : language === "en" ? "en-US" : "zh-CN";
  const currentPrice = data.length > 0 ? data[data.length - 1].price : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-bitcoin" aria-hidden="true" />
          <CardTitle>{t.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-2xl font-semibold text-foreground">
            {loading ? "--" : formatCurrency(currentPrice)}
          </span>
          {!loading && (
            <div className="flex flex-wrap gap-1.5">
              {RANGES.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    "h-7 rounded px-2.5 text-xs font-semibold transition-colors",
                    range === key
                      ? "bg-bitcoin text-black"
                      : "bg-background text-muted hover:text-foreground",
                  )}
                  onClick={() => setRange(key)}
                >
                  {t[`range${key}` as keyof typeof t] as string}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-72 w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              {t.loading}
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm text-negative">
              {t.error}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filtered} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="btcPrice" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#F7931A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F7931A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  stroke="#A3A3A3"
                  tick={{ fill: "#A3A3A3", fontSize: 11 }}
                  tickFormatter={(v) => fmtDate(v, locale)}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis
                  stroke="#A3A3A3"
                  tick={{ fill: "#A3A3A3", fontSize: 12 }}
                  tickFormatter={(v) => `$${Number(v) / 1000}k`}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as PricePoint;
                    return (
                      <div className="rounded-md border border-border bg-background p-3 text-sm shadow-soft">
                        <div className="font-semibold text-foreground">
                          {fmtTooltip(p.date, locale)}
                        </div>
                        <div className="mt-1 text-bitcoin">
                          {formatCurrency(p.price)}
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  dataKey="price"
                  fill="url(#btcPrice)"
                  stroke="#F7931A"
                  strokeWidth={2}
                  type="monotone"
                />
                <Brush
                  dataKey="date"
                  height={20}
                  stroke="#F7931A"
                  fill="#1C1C1C"
                  travellerWidth={8}
                  gap={0.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
