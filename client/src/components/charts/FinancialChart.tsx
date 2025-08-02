"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"
import { formatCurrencyBRL } from "@/lib/utils"

const chartConfig = {
  received: {
    label: "Valores Recebidos",
    color: "hsl(142, 76%, 36%)", // Green
  },
  pending: {
    label: "Valores Pendentes", 
    color: "hsl(48, 96%, 53%)", // Yellow
  },
} satisfies ChartConfig

export function FinancialChart() {
  const [timeRange, setTimeRange] = React.useState("30d")

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['/api/financial-chart', timeRange],
  })

  const filteredData = React.useMemo(() => {
    if (!chartData || chartData.length === 0) {
      // Generate sample data for the last 30 days if no real data
      const data = []
      const today = new Date()
      const daysToShow = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
      
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        data.push({
          date: date.toISOString().split('T')[0],
          received: Math.floor(Math.random() * 500 + 100), // R$ 100-600
          pending: Math.floor(Math.random() * 300 + 50),   // R$ 50-350
        })
      }
      return data
    }
    return chartData
  }, [chartData, timeRange])

  if (isLoading) {
    return (
      <Card className="pt-0">
        <CardHeader>
          <CardTitle>Fluxo Financeiro</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Fluxo Financeiro</CardTitle>
          <CardDescription>
            Valores recebidos e pendentes dos alunos
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg"
            aria-label="Selecionar período"
          >
            <SelectValue placeholder="Últimos 30 dias" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Últimos 3 meses
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Últimos 30 dias
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Últimos 7 dias
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillReceived" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-received)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-received)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-pending)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-pending)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  formatter={(value, name) => [
                    formatCurrencyBRL(Number(value)),
                    chartConfig[name as keyof typeof chartConfig]?.label || name
                  ]}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="pending"
              type="natural"
              fill="url(#fillPending)"
              stroke="var(--color-pending)"
              stackId="a"
            />
            <Area
              dataKey="received"
              type="natural"
              fill="url(#fillReceived)"
              stroke="var(--color-received)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}