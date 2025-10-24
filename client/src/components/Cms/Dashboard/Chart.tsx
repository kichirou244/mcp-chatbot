import React from "react";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import * as Recharts from "recharts";
import type { IOrderRevenue } from "@/types/Order";
import { Card, Spin } from "antd";

interface ChartProps {
  monthlyRevenue: IOrderRevenue[];
  loading: boolean;
}

const chartConfig = {
  revenue: {
    label: "Doanh thu (VNĐ)",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

export default function Chart({ monthlyRevenue, loading }: ChartProps) {
  const data = React.useMemo(() => {
    if (!monthlyRevenue || !monthlyRevenue.length) return [];

    return monthlyRevenue.map((m) => {
      return {
        period: m.period,
        revenue: m.totalRevenue * 1000,
        orders: m.orderCount,
      };
    });
  }, [monthlyRevenue]);

  if (!data.length) {
    return (
      <div className="mb-6 rounded bg-white p-4 shadow">
        <div className="text-sm text-muted-foreground">
          Không có dữ liệu doanh thu
        </div>
      </div>
    );
  }

  return (
    <>
      <Card
        title={<span>Doanh thu hàng tháng</span>}
        style={{ marginBottom: 24 }}
      >
        <Spin spinning={loading}>
          <ChartContainer config={chartConfig}>
            <Recharts.LineChart data={data}>
              <Recharts.CartesianGrid strokeDasharray="3 3" />
              <Recharts.XAxis dataKey="period" tickMargin={8} />
              <Recharts.YAxis
                tickMargin={8}
                tickFormatter={(v: number) =>
                  new Intl.NumberFormat("vi-VN", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(v)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      const parts = String(value).split(/\./);
                      const year = parts[0] ?? "";
                      const month = (parts[1] ?? "").padStart(2, "0");
                      return `${month} - ${year}`;
                    }}
                    formatter={(value) =>
                      `Doanh thu: ${Intl.NumberFormat("vi-VN", {
                        notation: "compact",
                        maximumFractionDigits: 3,
                      }).format(Number(value))}`
                    }
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Recharts.Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Doanh thu"
                fill="var(--color-revenue)"
              />
            </Recharts.LineChart>
          </ChartContainer>
        </Spin>
      </Card>
    </>
  );
}
