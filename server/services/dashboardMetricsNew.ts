import { db } from "../db";
import { sql } from "drizzle-orm";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getDashboardMetrics(now = new Date()) {
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  // 1) Alunos ativos
  const activeStudentsResult = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM students s
    JOIN users u ON u.id = s.user_id
    WHERE u.active = true
      AND u.role = 'student';
  `);
  const activeStudents = (activeStudentsResult.rows[0] as any)?.count || 0;

  // 2) Aulas realizadas (mês)
  const classesHeldResult = await db.execute(sql`
    SELECT COUNT(DISTINCT (a.class_id, DATE(a.date)))::int AS count
    FROM attendance a
    JOIN students s ON s.id = a.student_id
    JOIN users u ON u.id = s.user_id
    WHERE a.status IN ('present','late')
      AND a.date BETWEEN ${from} AND ${to};
  `);
  const classesHeld = (classesHeldResult.rows[0] as any)?.count || 0;

  // 3) Taxa de presença (mês)
  const attendanceRateResult = await db.execute(sql`
    WITH m AS (
      SELECT a.status
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      JOIN users u ON u.id = s.user_id
      WHERE a.date BETWEEN ${from} AND ${to}
    )
    SELECT CASE WHEN COUNT(*)=0 THEN 0
      ELSE SUM(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END)::float / COUNT(*)::float
    END AS rate,
    SUM(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END)::int AS total
    FROM m;
  `);
  const rate = (attendanceRateResult.rows[0] as any)?.rate || 0;
  const monthlyAttendanceCount = (attendanceRateResult.rows[0] as any)?.total || 0;

  // 4) Receita mensal
  const monthlyRevenueResult = await db.execute(sql`
    SELECT COALESCE(SUM(sp.amount),0)::int AS cents
    FROM student_payments sp
    JOIN students s ON s.id = sp.student_id
    JOIN users u ON u.id = s.user_id
    WHERE sp.status = 'paid'
      AND sp.paid_date BETWEEN ${from} AND ${to};
  `);
  const monthlyRevenue = (monthlyRevenueResult.rows[0] as any)?.cents || 0;

  // 5) Alunos em risco (attendance_rate < 60%)
  const frequencyThreshold = 60;
  const atRiskResult = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM students s
    JOIN users u ON u.id = s.user_id
    WHERE u.active = true
      AND u.role = 'student'
      AND s.attendance_rate < ${frequencyThreshold};
  `);
  const atRiskStudents = (atRiskResult.rows[0] as any)?.count || 0;

  // 6) Inadimplência
  const delinquencyResult = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM student_payments sp
    JOIN students s ON s.id = sp.student_id
    JOIN users u ON u.id = s.user_id
    WHERE sp.status = 'overdue'
      AND sp.due_date < NOW();
  `);
  const delinquency = (delinquencyResult.rows[0] as any)?.count || 0;

  // 7) Aprovações pendentes
  const pendingApprovalsResult = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM users u
    WHERE u.active = false
      AND u.status = 'pending'
      AND u.role = 'student';
  `);
  const pendingApprovals = (pendingApprovalsResult.rows[0] as any)?.count || 0;

  // 8) Tendência mensal — últimos 6 meses (presentes + confirmados)
  const trendResult = await db.execute(sql`
    SELECT
      TO_CHAR(DATE_TRUNC('month', date), 'Mon') AS mes,
      DATE_TRUNC('month', date) AS month_date,
      COUNT(*)::int AS presencas
    FROM attendance
    WHERE status IN ('present', 'late')
      AND date >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY month_date ASC;
  `);
  const trendRows = (trendResult.rows as any[]) || [];
  const trendMap: Record<string, number> = {};
  trendRows.forEach((r: any) => {
    trendMap[String(r.mes)] = Number(r.presencas);
  });
  const MONTHS_PT: Record<string, string> = {
    Jan: 'Jan', Feb: 'Fev', Mar: 'Mar', Apr: 'Abr',
    May: 'Mai', Jun: 'Jun', Jul: 'Jul', Aug: 'Ago',
    Sep: 'Set', Oct: 'Out', Nov: 'Nov', Dec: 'Dez',
  };
  const monthlyTrend: { mes: string; presencas: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const enMes = d.toLocaleString('en-US', { month: 'short' });
    const ptMes = MONTHS_PT[enMes] || enMes;
    monthlyTrend.push({ mes: ptMes, presencas: trendMap[enMes] || 0 });
  }

  // 9) Aulas de hoje
  const dowResult = await db.execute(sql`SELECT EXTRACT(DOW FROM NOW())::int AS dow;`);
  const dow = (dowResult.rows[0] as any)?.dow || 0;
  const todayClasses = await db.execute(sql`
    SELECT c.id, c.name, c.start_time, c.duration
    FROM classes c
    WHERE c.day_of_week = ${Number(dow)}
    ORDER BY c.start_time ASC;
  `);

  // 10) Aniversariantes de hoje
  const birthdays = await db.execute(sql`
    SELECT u.id AS user_id, (u.first_name || ' ' || u.last_name) AS name, u.birth_date
    FROM users u
    JOIN students s ON s.user_id = u.id
    WHERE u.role = 'student'
      AND to_char(u.birth_date, 'MM-DD') = to_char(NOW(), 'MM-DD');
  `);

  // 11) Faixas (adulto / infantil)
  const beltsAdult = await db.execute(sql`
    SELECT bl.level_key AS belt_key, bl.name AS belt_name, COUNT(*)::int AS count
    FROM students s
    JOIN users u ON u.id = s.user_id
    JOIN belt_levels bl ON bl.level_key = s.belt_level::text
    WHERE u.role = 'student'
      AND u.active = true
      AND (
        (u.birth_date IS NOT NULL AND AGE(NOW(), u.birth_date) >= INTERVAL '18 years')
        OR (u.birth_date IS NULL AND bl.category = 'adult')
      )
    GROUP BY bl.name, bl.order
    ORDER BY bl.order;
  `);
  const beltsKids = await db.execute(sql`
    SELECT bl.level_key AS belt_key, bl.name AS belt_name, COUNT(*)::int AS count
    FROM students s
    JOIN users u ON u.id = s.user_id
    JOIN belt_levels bl ON bl.level_key = s.belt_level::text
    WHERE u.role = 'student'
      AND u.active = true
      AND (
        (u.birth_date IS NOT NULL AND AGE(NOW(), u.birth_date) < INTERVAL '18 years')
        OR (u.birth_date IS NULL AND bl.category = 'child')
      )
    GROUP BY bl.name, bl.order
    ORDER BY bl.order;
  `);

  return {
    generatedAt: new Date().toISOString(),
    period: { type: "month" as const, from: from.toISOString(), to: to.toISOString() },
    metrics: {
      activeStudents: Number(activeStudents ?? 0),
      classesHeld: Number(classesHeld ?? 0),
      attendanceRate: Number(rate ?? 0),
      monthlyAttendanceCount: Number(monthlyAttendanceCount ?? 0),
      monthlyRevenue: Number(monthlyRevenue ?? 0),
      lowEngagement: Number(atRiskStudents ?? 0),
      atRiskStudents: Number(atRiskStudents ?? 0),
      delinquency: Number(delinquency ?? 0),
      pendingApprovals: Number(pendingApprovals ?? 0),
      monthlyTrend,
    },
    today: {
      classes: (todayClasses.rows as any[]) || [],
      birthdays: (birthdays.rows as any[]) || []
    },
    belts: {
      adult: Object.fromEntries(((beltsAdult.rows as any[]) || []).map(r => [r.belt_key, r.count])),
      kids:  Object.fromEntries(((beltsKids.rows as any[]) || []).map(r => [r.belt_key, r.count]))
    }
  };
}
