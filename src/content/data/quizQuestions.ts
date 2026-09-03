export interface QuizQuestion {
  question: string
  options: [string, string, string, string]
  correct: 0 | 1 | 2 | 3
}

export const QUIZ_BANK: Record<string, QuizQuestion[]> = {
  'excecoes-01': [
    {
      question: 'Qual dessas exceções é CHECKED?',
      options: ['NullPointerException', 'IllegalArgumentException', 'IOException', 'ArithmeticException'],
      correct: 2,
    },
    {
      question: 'O bloco finally executa:',
      options: ['Só quando não há exceção', 'Só quando há exceção', 'Sempre, com ou sem exceção', 'Apenas se um catch rodou'],
      correct: 2,
    },
    {
      question: 'Para usar try-with-resources, o recurso deve implementar:',
      options: ['Serializable', 'AutoCloseable', 'Runnable', 'Comparable'],
      correct: 1,
    },
    {
      question: 'Qual método retorna só o nome da classe sem o pacote?',
      options: ['e.getMessage()', 'e.getClass().getName()', 'e.getClass().getSimpleName()', 'e.getCause()'],
      correct: 2,
    },
    {
      question: 'IllegalArgumentException é unchecked porque:',
      options: ['O compilador a detecta', 'Ela herda de RuntimeException', 'Ela implementa AutoCloseable', 'Ela herda direto de Throwable'],
      correct: 1,
    },
    {
      question: 'Qual a ordem correta dos blocos catch?',
      options: ['Mais geral primeiro', 'Qualquer ordem funciona', 'Mais específico primeiro', 'Ordem alfabética'],
      correct: 2,
    },
    {
      question: 'No encapsulamento, as validações devem ficar:',
      options: ['No método main', 'Dentro da própria classe', 'Em arquivo .properties', 'Na camada de UI'],
      correct: 1,
    },
    {
      question: 'Multi-catch em Java 7+ usa qual símbolo entre os tipos?',
      options: ['&', ',', '|', '||'],
      correct: 2,
    },
  ],
}

export function getQuizQuestions(slug: string): QuizQuestion[] {
  return QUIZ_BANK[slug] ?? []
}
