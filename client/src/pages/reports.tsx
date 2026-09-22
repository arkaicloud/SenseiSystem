import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeltWithLabel } from "@/components/ui/belt";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateShort, formatCurrency } from "@/lib/utils";
import { sanitizeHTML } from "@/lib/htmlUtils";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { parseCalendarDateAsLocal } from "@shared/calendarDates";

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [periodFilter, setPeriodFilter] = useState("month");
  const [systemLogHours, setSystemLogHours] = useState("168");

  // Fetch activity logs
  const { data: activityLogsData, isLoading: activityLogsLoading } = useQuery<{ logs: any[] }>({
    queryKey: ['/api/activity-logs'],
    refetchInterval: false,
  });

  const { data: systemLogsAccess } = useQuery<{ canView: boolean }>({
    queryKey: ['/api/system-logs/access'],
    refetchInterval: false,
  });
  const canViewSystemLogs = systemLogsAccess?.canView === true;

  const {
    data: systemLogsData,
    isLoading: systemLogsLoading,
    refetch: refetchSystemLogs,
  } = useQuery<{ logs: any[] }>({
    queryKey: ['/api/system-logs', { hours: systemLogHours, level: 'error', limit: 200 }],
    enabled: canViewSystemLogs,
    refetchInterval: false,
  });

  // Fetch students data
  const { data: studentsData, isLoading: studentsLoading } = useQuery<{ students: any[] }>({
    queryKey: ['/api/students'],
    refetchInterval: false,
  });

  // Fetch attendance data
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery<{ attendances: any[] }>({
    queryKey: ['/api/attendance'],
    refetchInterval: false,
  });

  // Fetch payments data
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<{ payments: any[] }>({
    queryKey: ['/api/student-payments'],
    refetchInterval: false,
  });

  const activityLogs = activityLogsData?.logs || [];
  const systemLogs = systemLogsData?.logs || [];
  const students = studentsData?.students || [];
  const attendanceRecords = attendanceData?.attendances || [];
  const payments = paymentsData?.payments || [];

  // Calculate belt distribution
  const beltDistribution = students.reduce((acc: any, student: any) => {
    if (!acc[student.beltLevel]) {
      acc[student.beltLevel] = 0;
    }
    acc[student.beltLevel]++;
    return acc;
  }, {});

  // Format belt distribution for display
  const beltStats = Object.entries(beltDistribution).map(([belt, count]: [string, any]) => ({
    belt,
    count,
    percentage: Math.round((count / students.length) * 100) || 0
  }));

  // Calculate financial metrics
  const totalRevenue = payments
    .filter((payment: any) => payment.status === 'paid')
    .reduce((sum: number, payment: any) => sum + payment.amount, 0);

  const pendingRevenue = payments
    .filter((payment: any) => payment.status === 'pending')
    .reduce((sum: number, payment: any) => sum + payment.amount, 0);

  const overdueRevenue = payments
    .filter((payment: any) => payment.status === 'overdue')
    .reduce((sum: number, payment: any) => sum + payment.amount, 0);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-primary">{t('reports')}</h1>
          <p className="text-secondary-foreground">Analytics and activity tracking</p>
        </div>
        <div className="mt-4 md:mt-0 flex">
          <Button
            variant="outline"
            className="mr-2"
            onClick={() => window.print()}
          >
            <span className="material-icons mr-1 text-sm">print</span>
            Print Report
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              alert("Export functionality will be implemented in a future update.");
            }}
          >
            <span className="material-icons mr-1 text-sm">download</span>
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="activities">
        <TabsList className="mb-4">
          <TabsTrigger value="activities">Activity Log</TabsTrigger>
          {canViewSystemLogs && (
            <TabsTrigger value="system-errors">Erros do Sistema</TabsTrigger>
          )}
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="finance">Financial</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLogsLoading ? (
                <div className="text-center py-8">Loading activity logs...</div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No activity logs found</div>
              ) : (
                <div className="space-y-4">
                  {activityLogs.map((log: any) => {
                    const date = new Date(log.timestamp);

                    return (
                      <div key={log.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-start">
                          <div className="flex-none">
                            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                              <span className="material-icons text-accent-foreground">info</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-foreground" dangerouslySetInnerHTML={{ __html: sanitizeHTML(log.activity) }} />
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDate(date)} at {date.toLocaleTimeString()}
                            </p>
                            {log.entityType && (
                              <div className="mt-2">
                                <span className="inline-block bg-muted rounded-full px-3 py-1 text-xs text-secondary-foreground">
                                  {log.entityType}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canViewSystemLogs && (
        <TabsContent value="system-errors">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Erros técnicos
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Exceções e respostas HTTP 500 registradas automaticamente.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={systemLogHours}
                    onChange={(event) => setSystemLogHours(event.target.value)}
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="24">Últimas 24 horas</option>
                    <option value="168">Últimos 7 dias</option>
                    <option value="720">Últimos 30 dias</option>
                    <option value="2160">Últimos 90 dias</option>
                  </select>
                  <Button variant="outline" size="sm" onClick={() => refetchSystemLogs()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {systemLogsLoading ? (
                <div className="py-8 text-center">Carregando logs...</div>
              ) : systemLogs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhum erro registrado neste período.
                </div>
              ) : (
                <div className="space-y-4">
                  {systemLogs.map((entry: any) => (
                    <div key={entry.id} className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/20">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold uppercase text-red-700 dark:bg-red-900 dark:text-red-200">
                          {entry.level}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">{entry.requestId || `log-${entry.id}`}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <p className="mt-3 font-medium text-foreground dark:text-foreground">{entry.message}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary-foreground dark:text-muted-foreground">
                        {entry.method && <span>{entry.method} {entry.path}</span>}
                        {entry.statusCode && <span>Status: {entry.statusCode}</span>}
                        {entry.durationMs !== null && <span>Duração: {entry.durationMs} ms</span>}
                        {entry.userId && <span>Usuário ID: {entry.userId}</span>}
                        {entry.source && <span>Origem: {entry.source}</span>}
                      </div>
                      {entry.stack && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-medium text-secondary-foreground dark:text-secondary-foreground">
                            Ver detalhes técnicos
                          </summary>
                          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-background p-3 text-xs text-muted-foreground">
                            {entry.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        <TabsContent value="attendance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="text-center py-8">Loading attendance data...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-muted-foreground">Period:</div>
                      <div className="flex border rounded-md overflow-hidden">
                        <button 
                          className={`px-3 py-1 text-sm ${periodFilter === 'week' ? 'bg-primary text-primary-foreground' : 'bg-card dark:bg-muted text-secondary-foreground dark:text-secondary-foreground'}`}
                          onClick={() => setPeriodFilter('week')}
                        >
                          Week
                        </button>
                        <button 
                          className={`px-3 py-1 text-sm ${periodFilter === 'month' ? 'bg-primary text-primary-foreground' : 'bg-card dark:bg-muted text-secondary-foreground dark:text-secondary-foreground'}`}
                          onClick={() => setPeriodFilter('month')}
                        >
                          Month
                        </button>
                        <button 
                          className={`px-3 py-1 text-sm ${periodFilter === 'year' ? 'bg-primary text-primary-foreground' : 'bg-card dark:bg-muted text-secondary-foreground dark:text-secondary-foreground'}`}
                          onClick={() => setPeriodFilter('year')}
                        >
                          Year
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-accent p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-accent-foreground">
                          {attendanceRecords.length}
                        </div>
                        <div className="text-sm text-secondary-foreground">Total Check-ins</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-green-600">76%</div>
                        <div className="text-sm text-secondary-foreground">Avg. Attendance Rate</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-secondary-foreground mb-2">Attendance by Belt Level</h3>
                      <div className="space-y-2">
                        {beltStats.map((stat: any) => (
                          <div key={stat.belt} className="flex items-center">
                            <BeltWithLabel level={stat.belt as any} size="sm" className="min-w-16" />
                            <div className="ml-2 w-full">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className={`${
                                    stat.belt === 'white' ? 'bg-secondary' :
                                    stat.belt === 'blue' ? 'bg-primary' :
                                    stat.belt === 'purple' ? 'bg-purple-600' :
                                    stat.belt === 'brown' ? 'bg-yellow-800' :
                                    'bg-black'
                                  } h-2 rounded-full`}
                                  style={{ width: `${stat.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="ml-2 text-sm text-secondary-foreground min-w-10 text-right">
                              {stat.percentage}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-20 text-muted-foreground">
                  Attendance trend charts coming soon
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Students with Low Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="text-center py-8">Loading student data...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-background">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Belt Level
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Attendance Rate
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Last Class
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Contact
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card dark:bg-card divide-y divide-border dark:divide-border">
                      {students
                        .filter((student: any) => (student.attendanceRate || 0) < 50)
                        .slice(0, 5)
                        .map((student: any) => (
                          <tr key={student.id} className="hover:bg-background dark:hover:bg-muted">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted dark:bg-muted flex items-center justify-center">
                                  <span className="font-medium text-sm text-secondary-foreground dark:text-foreground">
                                    {student.user.firstName.charAt(0)}
                                    {student.user.lastName.charAt(0)}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-foreground dark:text-foreground">
                                    {student.user.firstName} {student.user.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                                    {student.user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <BeltWithLabel level={student.beltLevel} size="sm" />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-24 bg-muted dark:bg-muted rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-status-danger h-2 rounded-full" 
                                    style={{ width: `${student.attendanceRate || 30}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm">{student.attendanceRate || 30}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                              2 weeks ago
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button className="text-secondary hover:text-secondary-dark">
                                  <span className="material-icons">mail</span>
                                </button>
                                <button className="text-primary hover:text-primary-dark">
                                  <span className="material-icons">phone</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">All time paid payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Pending Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-status-warning">
                  {formatCurrency(pendingRevenue)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Awaiting payment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Overdue Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-status-danger">
                  {formatCurrency(overdueRevenue)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Past due date</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Payment Plan Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-20 text-muted-foreground">
                Payment plan distribution charts coming soon
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="text-center py-8">Loading payment data...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border dark:divide-border">
                    <thead className="bg-background dark:bg-muted">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                          Plan
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card dark:bg-card divide-y divide-border dark:divide-border">
                      {payments.slice(0, 10).map((payment: any) => (
                        <tr key={payment.id} className="hover:bg-background dark:hover:bg-muted">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-foreground dark:text-foreground">
                              {payment.student.user.firstName} {payment.student.user.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-foreground dark:text-foreground">{payment.plan.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-foreground dark:text-foreground">
                              {formatCurrency(payment.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payment.status === 'paid' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' :
                              payment.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300' :
                              'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                            }`}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                            {payment.status === 'paid' && payment.paidDate 
                              ? formatDateShort(new Date(payment.paidDate))
                               : formatDateShort(parseCalendarDateAsLocal(payment.dueDate))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-20 text-muted-foreground">
                  Student demographic charts coming soon
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Belt Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-secondary-foreground mb-2">Belt Distribution</h3>
                  <div className="space-y-4">
                    {beltStats.map((stat: any) => (
                      <div key={stat.belt} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <BeltWithLabel level={stat.belt as any} size="md" />
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">{stat.count}</span>
                            <span className="ml-2 text-sm text-muted-foreground">({stat.percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`${
                              stat.belt === 'white' ? 'bg-secondary' :
                              stat.belt === 'blue' ? 'bg-primary' :
                              stat.belt === 'purple' ? 'bg-purple-600' :
                              stat.belt === 'brown' ? 'bg-yellow-800' :
                              'bg-black'
                            } h-2 rounded-full`}
                            style={{ width: `${stat.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <h3 className="text-sm font-medium text-secondary-foreground mb-2">Upcoming Belt Tests</h3>
                    <div className="space-y-2">
                      <div className="p-3 border rounded-lg flex justify-between items-center">
                        <div>
                          <div className="flex items-center">
                            <BeltWithLabel level="white" size="sm" />
                            <span className="mx-2">→</span>
                            <BeltWithLabel level="blue" size="sm" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">5 students eligible</p>
                        </div>
                        <div className="text-sm font-medium">Nov 15, 2023</div>
                      </div>

                      <div className="p-3 border rounded-lg flex justify-between items-center">
                        <div>
                          <div className="flex items-center">
                            <BeltWithLabel level="blue" size="sm" />
                            <span className="mx-2">→</span>
                            <BeltWithLabel level="purple" size="sm" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">3 students eligible</p>
                        </div>
                        <div className="text-sm font-medium">Dec 05, 2023</div>
                      </div>

                      <div className="p-3 border rounded-lg flex justify-between items-center">
                        <div>
                          <div className="flex items-center">
                            <BeltWithLabel level="purple" size="sm" />
                            <span className="mx-2">→</span>
                            <BeltWithLabel level="brown" size="sm" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">2 students eligible</p>
                        </div>
                        <div className="text-sm font-medium">Jan 10, 2024</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Reports;