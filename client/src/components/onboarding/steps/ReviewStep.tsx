import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ReviewStep() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-green-700">Matrícula Realizada!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Sua conta foi criada e está aguardando aprovação. Você será notificado quando for ativada.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}