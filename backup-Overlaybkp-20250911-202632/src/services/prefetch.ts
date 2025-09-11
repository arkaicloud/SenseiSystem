type PrefetchOpts = { onStep?: (p: number) => void };

export async function prefetchDashboard(opts?: PrefetchOpts) {
  const step = (p: number) => opts?.onStep?.(p);
  
  try {
    // Pré-carregar dados essenciais do dashboard
    step(55);
    
    // Buscar informações do usuário
    await fetch('/api/user', { credentials: 'include' });
    step(65);
    
    // Buscar métricas do dashboard
    await fetch('/api/dashboard/metrics', { credentials: 'include' });
    step(75);
    
    // Buscar configurações da escola
    await fetch('/api/school-config', { credentials: 'include' });
    step(85);
    
    // Buscar estatísticas financeiras
    await fetch('/api/financial-stats', { credentials: 'include' });
    step(90);
    
  } catch (error) {
    console.warn('Erro no prefetch do dashboard:', error);
    // Não falhar o loading por erro de prefetch
  }
}