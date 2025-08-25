export type HealthAnswer = { 
  key: string; 
  question: string; 
  value: boolean | string | null;
};

// Chaves que indicam risco e necessidade de atestado médico
const RISK_KEYS = new Set([
  "hasHeartProblem",
  "hasChestPain", 
  "hasBreathingProblem",
  "hasBloodPressureProblem",
  "hasBoneProblem",
  "hasOtherHealthProblem",
  "takeMedication",
  "doctorRecommendation"
]);

export function isRisky(answers: HealthAnswer[]): boolean {
  for (const answer of answers) {
    if (RISK_KEYS.has(answer.key) && answer.value === "yes") {
      return true;
    }
  }
  return false;
}

export function getRiskyAnswers(answers: HealthAnswer[]): HealthAnswer[] {
  return answers.filter(answer => 
    RISK_KEYS.has(answer.key) && answer.value === "yes"
  );
}