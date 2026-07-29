// Configuração da UC de POO.
// O início do curso é individual: conta a partir do createdAt de cada aluno.
// O fim é fixo para toda a turma.
export const COURSE_END_DATE = '2026-12-10'

// Penalidade de XP por semana decorrida sem presença registrada.
export const WEEKLY_MISS_XP_PENALTY = 50

// Pesos da nota final (0–10): atividades vs presença semanal.
export const GRADE_WEIGHTS = {
  activities: 0.7,
  presence:   0.3,
} as const
