// client/src/services/api/students.ts
import axios from "axios";

export type StudentEditDTO = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  cpf: string | null;
  rg: string | null;
  contact: { phones: string[]; email: string | null };
  address: { street: string | null; number: string | null; district: string | null; city: string | null; state: string | null; zip: string | null };
  health: { notes: string | null };
  graduation: { beltLevel: string | null; graduationDate: string | null };
  guardian: { name: string | null; relation: string | null; phone: string | null; email: string | null };
};

export async function getStudentById(id: number) {
  const { data } = await axios.get(`/api/students/${id}?include=all`);
  return data as StudentEditDTO;
}

export async function updateStudent(id: number, payload: StudentEditDTO) {
  const { data } = await axios.patch(`/api/students/${id}`, payload);
  return data as StudentEditDTO;
}