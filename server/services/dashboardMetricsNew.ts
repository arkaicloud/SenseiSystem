import { db } from "../db";
import { sql } from "drizzle-orm";
import { students, users, attendance, studentPayments, classes } from "../../shared/schema";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getDashboardMetrics(now = new Date()) {
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  // 1) Alunos ativos (considera todos com active=true, independente de aprovação)
  const activeStudentsResult = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM students s
    JOIN users u ON u.id = s.user_id
    WHERE u.active = true
      AND u.role = 'student';
  `);
  const activeStudents = (activeStudentsResult.rows[0] as any)?.count || 0;

  // 2) Aulas realizadas (mês): sessões com presença (present/late) — proxy de realização
  const classesHeldResult = await db.execute(sql`
    SELECT COUNT(DISTINCT (a.class_id, DATE(a.date)))::int AS count
    FROM attendance a
    JOIN students s ON s.id = a.student_id
    JOIN users u ON u.id = s.user_id
    WHERE a.status IN ('present','late')
      AND a.date BETWEEN ${from} AND ${to};
  `);
  const classesHeld = (classesHeldResult.rows[0] as any)?.count || 0;

  // 3) Taxa de presença (mês) = presenças / (presenças + faltas)
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
    END AS rate
    FROM m;
  `);
  const rate = (attendanceRateResult.rows[0] as any)?.rate || 0;

  // 4) Receita mensal (centavos) — pagos no mês
  const monthlyRevenueResult = await db.execute(sql`
    SELECT COALESCE(SUM(sp.amount),0)::int AS cents
    FROM student_payments sp
    JOIN students s ON s.id = sp.student_id
    JOIN users u ON u.id = s.user_id
    WHERE sp.status = 'paid'
      AND sp.paid_date BETWEEN ${from} AND ${to};
  `);
  const monthlyRevenue = (monthlyRevenueResult.rows[0] as any)?.cents || 0;

  // 5) Engajamento em baixa (alunos sem presença > X dias) — renomeia card no front
  const riskDays = 21; // TODO: ler de settings
  const lowEngagementResult = await db.execute(sql`
    WITH last_att AS (
      SELECT s.id AS student_id, MAX(a.date) AS last_date
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.id
      JOIN users u ON u.id = s.user_id
      WHERE u.role = 'student' AND u.active = true
      GROUP BY s.id
    )
    SELECT COUNT(*)::int AS count
    FROM last_att
    WHERE (NOW()::date - COALESCE(last_date::date, DATE '1900-01-01')) > ${riskDays};
  `);
  const lowEngagement = (lowEngagementResult.rows[0] as any)?.count || 0;

  // 6) Inadimplência — títulos vencidos
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

  // 8) Aulas de hoje (lista com botão Acessar)
  const dowResult = await db.execute(sql`SELECT EXTRACT(DOW FROM NOW())::int AS dow;`);
  const dow = (dowResult.rows[0] as any)?.dow || 0;
  const todayClasses = await db.execute(sql`
    SELECT c.id, c.name, c.start_time, c.duration
    FROM classes c
    JOIN users u ON u.id = c.instructor_id
    WHERE c.day_of_week = ${Number(dow)}
    ORDER BY c.start_time ASC;
  `);

  // 9) Aniversariantes — SOMENTE hoje
  const birthdays = await db.execute(sql`
    SELECT u.id AS user_id, (u.first_name || ' ' || u.last_name) AS name, u.birth_date
    FROM users u
    JOIN students s ON s.user_id = u.id
    WHERE u.role = 'student'
      AND to_char(u.birth_date, 'MM-DD') = to_char(NOW(), 'MM-DD');
  `);

  // 10) Faixas (adulto 18+, infantil <18)
  const beltsAdult = await db.execute(sql`
    SELECT bl.name AS belt_name, COUNT(*)::int AS count
    FROM students s
    JOIN users u ON u.id = s.user_id
    JOIN belt_levels bl ON bl.level_key = s.belt_level::text
    WHERE AGE(NOW(), u.birth_date) >= INTERVAL '18 years'
      AND bl.category = 'adult'
      AND u.active = true
    GROUP BY bl.name, bl.order
    ORDER BY bl.order;
  `);
  const beltsKids = await db.execute(sql`
    SELECT bl.name AS belt_name, COUNT(*)::int AS count
    FROM students s
    JOIN users u ON u.id = s.user_id
    JOIN belt_levels bl ON bl.level_key = s.belt_level::text
    WHERE AGE(NOW(), u.birth_date) < INTERVAL '18 years'
      AND bl.category = 'child'
      AND u.active = true
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
      monthlyRevenue: Number(monthlyRevenue ?? 0),
      lowEngagement: Number(lowEngagement ?? 0),
      delinquency: Number(delinquency ?? 0),
      pendingApprovals: Number(pendingApprovals ?? 0)
    },
    today: {
      classes: (todayClasses.rows as any[]) || [],
      birthdays: (birthdays.rows as any[]) || []
    },
    belts: {
      adult: Object.fromEntries(((beltsAdult.rows as any[]) || []).map(r => [r.belt_name, r.count])),
      kids:  Object.fromEntries(((beltsKids.rows as any[]) || []).map(r => [r.belt_name, r.count]))
    }
  };
}