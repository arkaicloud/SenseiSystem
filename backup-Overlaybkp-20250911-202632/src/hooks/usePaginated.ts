import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { apiRequest } from "@/lib/queryClient";

type Opts = {
  key: string;
  endpoint: string; // ex: "/api/students"
};

export function usePaginated<T>({ key, endpoint }: Opts) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("createdAt:desc");

  const query = useQuery({
    queryKey: [key, page, pageSize, status, q, sort],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        page: String(page), 
        pageSize: String(pageSize), 
        status, 
        q, 
        sort 
      });
      const res = await apiRequest('GET', `${endpoint}?${params.toString()}`);
      return res.json() as Promise<{ 
        items: T[]; 
        page: number; 
        pageSize: number; 
        total: number; 
        totalPages: number; 
      }>;
    },
    staleTime: 15_000,
  });

  const setParam = (key: string, value: string | number) => {
    if (key === "page") {
      setPage(Number(value));
    } else if (key === "pageSize") {
      setPageSize(Number(value));
      setPage(1); // Reset page when changing page size
    } else if (key === "status") {
      setStatus(String(value));
      setPage(1); // Reset page when changing filters
    } else if (key === "q") {
      setQ(String(value));
      setPage(1); // Reset page when searching
    } else if (key === "sort") {
      setSort(String(value));
      setPage(1); // Reset page when changing sort
    }
  };

  return {
    ...query,
    setParam,
    page,
    pageSize,
    status,
    q,
    sort,
  };
}