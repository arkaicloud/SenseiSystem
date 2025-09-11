import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PaymentPanel from '@/components/student/PaymentPanel';
import { CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Pagamentos</h1>
        </div>
        
        <PaymentPanel />
      </div>
    </div>
  );
}