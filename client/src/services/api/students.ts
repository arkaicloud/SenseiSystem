// client/src/services/api/students.ts
import axios from "axios";

export type StudentEditDTO = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string | null;       // ISO yyyy-mm-dd
  cpf: string | null;             // só dígitos
  rg: string | null;              // só dígitos
  sex: "M" | "F" | "O" | null;    // novo (O = outro/ND)
  contact: { email: string | null; phone: string | null };
  emergency: { name: string | null; phone: string | null };
  financialResponsible: { relation: string | null }; // "Eu mesmo(a)", Pai, Mãe, etc.
  billing: { planId: number | null; preferredDueDay: number | null };
  address: {
    zip: string | null; street: string | null; number: string | null;
    complement: string | null; district: string | null; city: string | null; state: string | null;
  };
  health: { notes: string | null };
  graduation: { beltLevel: string | null; graduationDate: string | null };
};

export async function getStudentById(id: number) {
  const { data } = await axios.get(`/api/students/${id}?include=all`, { headers: { "Cache-Control": "no-store" }});
  return data as StudentEditDTO;
}

export async function updateStudent(id: number, payload: StudentEditDTO) {
  const { data } = await axios.patch(`/api/students/${id}`, payload);
  return data as StudentEditDTO;
}

// planos para o select
export type BillingPlan = { id: number; name: string; amount: number; period: "MONTHLY"|"WEEKLY"|"YEARLY" };
export async function listBillingPlans() {
  const { data } = await axios.get(`/api/billing/plans`);
  return data as BillingPlan[];
}