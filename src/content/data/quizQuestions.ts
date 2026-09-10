export interface QuizQuestion {
  question: string
  options: [string, string, string, string]
  correct: 0 | 1 | 2 | 3
}

export const QUIZ_BANK: Record<string, QuizQuestion[]> = {
  'encontro-10': [
    {
      question: 'Em Java, declarar um atributo como `private` significa que:',
      options: ['Ele não pode ser alterado após a criação do objeto', 'Só pode ser acessado dentro da própria classe', 'É compartilhado entre todas as instâncias', 'Não pode ser usado em subclasses'],
      correct: 1,
    },
    {
      question: 'O que é uma invariante de classe?',
      options: ['Um método que nunca muda de comportamento', 'Uma condição que deve ser sempre verdadeira para o objeto existir em estado válido', 'Um atributo declarado como final', 'Um construtor sem parâmetros'],
      correct: 1,
    },
    {
      question: 'Qual o principal objetivo de um setter com validação?',
      options: ['Tornar o código mais lento', 'Garantir que o atributo nunca receba um valor que viole as regras de negócio', 'Expor o atributo privado', 'Substituir o construtor'],
      correct: 1,
    },
    {
      question: 'O princípio "Tell, Don\'t Ask" diz que:',
      options: ['Devemos sempre verificar o estado do objeto antes de usá-lo', 'Devemos mandar o objeto executar uma ação em vez de perguntar seu estado e decidir fora', 'Nunca devemos usar getters', 'Toda validação deve ficar no main'],
      correct: 1,
    },
    {
      question: 'Por que criar uma `SaldoInsuficienteException` em vez de usar `RuntimeException("saldo insuficiente")`?',
      options: ['Não há diferença, são equivalentes', 'Custom exceptions nomeadas revelam o vocabulário do domínio e permitem catch seletivo', 'RuntimeException é mais rápida', 'Custom exceptions são sempre checked'],
      correct: 1,
    },
    {
      question: 'Exceções de domínio devem herdar de `RuntimeException` (unchecked) porque:',
      options: ['Unchecked são mais seguras', 'Violações de regra de negócio não são condições externas — não faz sentido obrigar try-catch em todo lugar', 'O compilador exige isso', 'Checked exceptions foram removidas no Java 17'],
      correct: 1,
    },
    {
      question: 'Guard clause com `throw` no início do método serve para:',
      options: ['Aumentar a performance do método', 'Eliminar aninhamento — cada validação que falha encerra o método, deixando a lógica real no nível zero', 'Substituir o bloco finally', 'Evitar o uso de try-catch'],
      correct: 1,
    },
    {
      question: '`Objects.requireNonNull(titular, "Titular não pode ser nulo")` no construtor garante:',
      options: ['Que o atributo será final', 'Que o objeto nunca é criado com o campo nulo — invariante protegida desde a construção', 'Que o compilador emite erro', 'Que o garbage collector age imediatamente'],
      correct: 1,
    },
    {
      question: 'Quando usar `Optional<T>` em vez de lançar exception?',
      options: ['Sempre — Optional é mais moderno', 'Quando a ausência do valor é um comportamento normal e esperado (ex: busca sem resultado)', 'Quando a ausência é um erro do chamador', 'Apenas em coleções'],
      correct: 1,
    },
    {
      question: 'Na hierarquia de exceptions de domínio, qual a vantagem de ter uma exception-raiz como `SistemaBancarioException`?',
      options: ['Elimina a necessidade de catch específicos', 'Permite capturar qualquer erro do domínio com um único catch, mas ainda permite catch seletivo quando necessário', 'Melhora a performance em runtime', 'É exigida pelo compilador para custom exceptions'],
      correct: 1,
    },
  ],
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
