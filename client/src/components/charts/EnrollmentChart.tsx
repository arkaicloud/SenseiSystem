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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"

const chartConfig = {
  newStudents: {
    label: "Novas Matrículas",
    color: "hsl(221, 83%, 53%)", // Blue
  },
  totalStudents: {
    label: "Total de Alunos",
    color: "hsl(142, 76%, 36%)", // Green
  },
} satisfies ChartConfig

export function EnrollmentChart() {
  const [timeRange, setTimeRange] = React.useState("30d")

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['/api/enrollment-chart', timeRange],
    refetchInterval: 60000, // Auto-refresh every minute
  })

  const filteredData = React.useMemo(() => {
    // If we have real data from the API, use it
    if (chartData && Array.isArray(chartData) && chartData.length > 0) {
      return chartData;
    }
    
    // Otherwise show empty chart instead of fake data
    return [];
  }, [chartData, timeRange])

  if (isLoading) {
    return (
      <Card className="pt-0">
        <CardHeader>
          <CardTitle>Crescimento de Matrículas</CardTitle>
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
          <CardTitle>Crescimento de Matrículas</CardTitle>
          <CardDescription>
            Evolução do número de alunos matriculados
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
        {filteredData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">Nenhum dado de matrícula disponível</p>
              <p className="text-xs mt-1">Os dados aparecerão quando houver novas matrículas</p>
            </div>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillNewStudents" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-newStudents)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-newStudents)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillTotalStudents" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-totalStudents)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-totalStudents)"
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
                    `${value} ${name === 'newStudents' ? 'novas' : 'total'}`,
                    String(chartConfig[name as keyof typeof chartConfig]?.label || name)
                  ]}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="newStudents"
              type="natural"
              fill="url(#fillNewStudents)"
              stroke="var(--color-newStudents)"
              stackId="a"
            />
            <Area
              dataKey="totalStudents"
              type="natural"
              fill="url(#fillTotalStudents)"
              stroke="var(--color-totalStudents)"
              stackId="b"
            />
          </AreaChart>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}