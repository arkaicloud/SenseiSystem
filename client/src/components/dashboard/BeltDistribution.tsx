import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Belt } from "@/components/ui/belt";

interface BeltCount {
  level: 'white' | 'blue' | 'purple' | 'brown' | 'black';
  name: string;
  count: number;
  percentage: number;
}

interface UpcomingTest {
  from: 'white' | 'blue' | 'purple' | 'brown';
  to: 'blue' | 'purple' | 'brown' | 'black';
  date: string;
}

const BeltDistribution: React.FC = () => {
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['/api/students'],
  });

  const students = studentsData?.students || [];

  // Mapeamento dos nomes das faixas em português
  const beltNames = {
    white: 'Faixa Branca',
    blue: 'Faixa Azul', 
    purple: 'Faixa Roxa',
    brown: 'Faixa Marrom',
    black: 'Faixa Preta'
  };

  // Contar estudantes por faixa
  const beltCounts = {
    white: 0,
    blue: 0,
    purple: 0,
    brown: 0,
    black: 0
  };

  students.forEach((student: any) => {
    if (student.beltLevel && beltCounts.hasOwnProperty(student.beltLevel)) {
      beltCounts[student.beltLevel as keyof typeof beltCounts]++;
    }
  });

  const totalStudents = students.length;

  // Criar array de distribuição
  const distribution: BeltCount[] = Object.entries(beltCounts).map(([level, count]) => ({
    level: level as BeltCount['level'],
    name: beltNames[level as keyof typeof beltNames],
    count,
    percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
  }));

  // Próximas promoções (dados fictícios por enquanto)
  const upcomingTests: UpcomingTest[] = [
    { from: 'white', to: 'blue', date: '15 Jan' },
    { from: 'blue', to: 'purple', date: '22 Jan' }
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-montserrat font-bold">Distribuição de Faixas</h3>
        </div>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  const getBeltBarColor = (level: string) => {
    switch (level) {
      case 'white': return 'bg-gray-300';
      case 'blue': return 'bg-blue-500';
      case 'purple': return 'bg-purple-600';
      case 'brown': return 'bg-yellow-800';
      case 'black': return 'bg-gray-900';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-montserrat font-bold">Distribuição de Faixas</h3>
      </div>
      <div className="p-4">
        {distribution.map((belt) => (
          <div key={belt.level} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Belt level={belt.level} className="mr-2" />
                <span>{belt.name}</span>
              </div>
              <span className="font-medium">{belt.count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${getBeltBarColor(belt.level)} h-2 rounded-full`}
                style={{ width: `${belt.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-200">
        <h4 className="font-medium mb-2">Upcoming Belt Tests</h4>
        <div className="text-sm">
          {upcomingTests.map((test, index) => (
            <div
              key={index}
              className={`mb-2 pb-2 ${
                index < upcomingTests.length - 1 ? 'border-b border-gray-100' : ''
              } flex justify-between`}
            >
              <span className="capitalize">
                {test.from} to {test.to}
              </span>
              <span className="font-medium">{test.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BeltDistribution;
