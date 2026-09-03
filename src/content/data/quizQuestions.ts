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
      question: 'Checked exceptions representam:',
      options: ['Bugs de programação', 'Condições externas fora do controle', 'Erros fatais da JVM', 'Sintaxe inválida'],
      correct: 1,
    },
    {
      question: 'O bloco finally executa:',
      options: ['Só quando não há exceção', 'Só quando há exceção', 'Sempre, com ou sem exceção', 'Apenas se um catch rodou'],
      correct: 2,
    },
    {
      question: 'catch(Exception e) vem antes de um catch específico. O que acontece?',
      options: ['Funciona normalmente', 'O catch específico nunca executa — erro de compilação', 'Ambos os catch executam', 'Erro só em runtime'],
      correct: 1,
    },
    {
      question: 'Qual a ordem correta dos blocos catch?',
      options: ['Mais geral primeiro', 'Qualquer ordem funciona', 'Mais específico primeiro', 'Ordem alfabética'],
      correct: 2,
    },
    {
      question: 'Multi-catch em Java 7+ usa qual símbolo entre os tipos?',
      options: ['&', ',', '|', '||'],
      correct: 2,
    },
    {
      question: 'Multi-catch é indicado quando:',
      options: ['Há mais de 3 tipos de exceção possíveis', 'Dois tipos diferentes têm o mesmo tratamento', 'Sempre que possível para reduzir código', 'O catch genérico não funciona'],
      correct: 1,
    },
    {
      question: 'Para usar try-with-resources, o recurso deve implementar:',
      options: ['Serializable', 'AutoCloseable', 'Runnable', 'Comparable'],
      correct: 1,
    },
    {
      question: 'O que try-with-resources garante automaticamente ao sair do bloco?',
      options: ['Que não haverá exceção', 'O fechamento do recurso mesmo se houver exceção', 'Que o catch sempre executará', 'Performance máxima de I/O'],
      correct: 1,
    },
    {
      question: 'e.getMessage() retorna:',
      options: ['O nome completo da classe da exceção', 'O stack trace completo', 'A mensagem passada ao construtor', 'A exceção que causou esta'],
      correct: 2,
    },
    {
      question: 'e.getClass().getSimpleName() para uma NullPointerException retorna:',
      options: ['"java.lang.NullPointerException"', '"NullPointerException"', 'null', '"RuntimeException"'],
      correct: 1,
    },
    {
      question: 'Qual exception usar quando um argumento tem valor inválido?',
      options: ['RuntimeException', 'Exception', 'IllegalArgumentException', 'IllegalStateException'],
      correct: 2,
    },
    {
      question: 'IllegalStateException é lançada quando:',
      options: ['O argumento passado é inválido', 'O objeto está em estado inválido para a operação', 'O arquivo não foi encontrado', 'O índice está fora do intervalo'],
      correct: 1,
    },
    {
      question: 'No encapsulamento, as validações devem ficar:',
      options: ['No método main', 'Dentro da própria classe', 'Em arquivo .properties', 'Na camada de UI'],
      correct: 1,
    },
    {
      question: 'Qual o problema de validar o estado do objeto FORA da classe, no chamador?',
      options: ['Não há problema, funciona igual', 'Viola o encapsulamento: a regra de negócio vaza para fora', 'É mais eficiente', 'Evita o lançamento de exceções'],
      correct: 1,
    },
  ],
}

export function getQuizQuestions(slug: string): QuizQuestion[] {
  return QUIZ_BANK[slug] ?? []
}
