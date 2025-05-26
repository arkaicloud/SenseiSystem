import React from "react";
import { Belt } from "@/components/ui/belt";

interface BeltCount {
  level: 'white' | 'blue' | 'purple' | 'brown' | 'black';
  count: number;
  percentage: number;
}

interface UpcomingTest {
  from: 'white' | 'blue' | 'purple' | 'brown';
  to: 'blue' | 'purple' | 'brown' | 'black';
  date: string;
}

interface BeltDistributionProps {
  distribution: BeltCount[];
  upcomingTests: UpcomingTest[];
}

const BeltDistribution: React.FC<BeltDistributionProps> = ({
  distribution,
  upcomingTests,
}) => {
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
                <span className="capitalize">{belt.level} Belt</span>
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
