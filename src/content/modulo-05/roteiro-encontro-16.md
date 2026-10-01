# Roteiro de Aula — Identificação de Tipos: Polimorfismo II

> **Módulo 5 · Encontro 16**  
> **Duração sugerida:** 80–90 min  
> **Foco:** `instanceof`, downcasting seguro, pattern matching e decisão de design  
> **Formato:** retomada do contrato → rastreamento → laboratório → refatoração

## Objetivo didático

Ao final, o aluno deve conseguir explicar por que uma referência `Funcionario` não acessa métodos exclusivos de `Horista`, proteger um downcasting com `instanceof` e justificar quando o teste de tipo deve ser substituído por polimorfismo ou por uma interface.

A aula não deve produzir a impressão de que `instanceof` é “errado”. O alvo é mais preciso: o aluno deve usar identificação de tipo como uma decisão local e consciente, reconhecendo quando a repetição indica uma abstração incompleta.

## Antes da aula

- Abra o Encontro 16 e deixe disponíveis as atividades `code-trace`, `bug-hunt` e `fill-table`.
- Tenha uma versão executável da hierarquia `Funcionario`, `Horista`, `Assalariado` e `Comissionado`.
- Confirme se o laboratório usa JDK 16 ou superior; caso não use, reserve a sintaxe tradicional de cast.
- Combine uma regra de trabalho: antes de executar, cada estudante registra o que espera que compile, falhe ou seja impresso.

## Roteiro minuto a minuto

### 0–10 min — Retomada: o contrato geral tem limites

Mostre as três chamadas do início do encontro:

```java
funcionario.calcularSalario();
funcionario.registrarHoras(160);
funcionario.registrarVenda(1000);
```

Peça que a turma classifique cada uma como “compila” ou “não compila” e justifique usando o tipo da referência, não o tipo que imagina existir em runtime.

**Pergunta-chave:**

> “O compilador pode assumir que todo `Funcionario` registra horas?”

**Sinal de aprendizagem:** o aluno diz que `Funcionario` pode apontar para vários subtipos e que apenas `calcularSalario()` pertence ao contrato geral.

### 10–22 min — `instanceof` como pergunta de compatibilidade

Execute a atividade `encontro-16-instanceof` somente depois das previsões. Explore os dois detalhes que costumam ser esquecidos:

1. um subtipo também é instância do seu tipo geral;
2. `null instanceof QualquerTipo` resulta em `false`.

Evite transformar a explicação em uma lista de exceções. Desenhe no quadro:

```text
referência Funcionario ─────► objeto real Horista
       o que compila              o que existe em runtime
```

### 22–38 min — Downcasting protegido

Faça a demonstração em três passos, apagando um passo de cada vez:

```java
if (funcionario instanceof Horista h) { // verificar
    h.registrarHoras(160);              // usar a visão específica
}
```

Depois mostre o cast cego para `Assalariado` e peça que a turma preveja o erro. Só então revele `ClassCastException` e compare com `NullPointerException`.

**Intervenção rápida:** se alguém disser que o cast “transforma” o objeto, peça para explicar o que acontece com os atributos de um `Assalariado`. A resposta esperada é que nenhum objeto é transformado; apenas a referência recebe uma visão compatível, se a verificação for verdadeira.

### 38–50 min — Pattern matching e escopo

Compare a forma tradicional com `instanceof Horista h`. Use a atividade de escopo e peça que os alunos expliquem por que `&&` mantém a garantia, enquanto `||` não permite usar `h` com segurança em qualquer caminho.

Se o ambiente não aceitar pattern matching, mantenha o mesmo raciocínio com a forma tradicional. A sintaxe é secundária; a ordem **verificar → converter → usar** é o conceito essencial.

### 50–65 min — Caso real: fechamento mensal

Divida a turma em pequenos grupos. Cada grupo analisa uma operação de `ProcessadorMensal`:

- registrar horas somente para horistas;
- distribuir vendas somente para comissionados;
- gerar relatório detalhado.

Cada grupo deve marcar:

1. onde o processamento continua polimórfico;
2. onde a capacidade específica justifica `instanceof`;
3. qual repetição faria a equipe revisar a abstração.

Faça uma rodada rápida de defesa: cada grupo tem 60 segundos para justificar seu cast.

### 65–78 min — Trilha de decisão

Peça que os alunos resolvam a tabela “qual ferramenta usar?” antes de abrir o laboratório. Para cada situação, eles devem escolher entre:

- polimorfismo;
- interface;
- `instanceof` localizado;
- revisão da abstração.

Insista nesta pergunta sempre que aparecer um `if` por tipo:

> “Esta rotina está tratando uma exceção local ou está compensando um contrato que deveria existir?”

### 78–90 min — Laboratório e bilhete de saída

Se houver uma aula prática completa, encaminhe os exercícios 1 e 2 durante o encontro e deixe os demais como extensão. Se o tempo for menor, use o exercício 2 como avaliação principal.

Antes de encerrar, peça duas frases:

1. “Eu uso `instanceof` quando...”
2. “Eu reviso a abstração quando...”

Resposta esperada:

> “Eu uso `instanceof` quando uma operação localizada precisa de uma capacidade específica. Eu reviso a abstração quando o mesmo teste se espalha ou quando o processador precisa conhecer todos os subtipos.”

## Erros previsíveis e intervenção

| Confusão | Intervenção curta |
|---|---|
| “Se o objeto é `Horista`, qualquer chamada compila.” | Separe tipo da referência e tipo real; o compilador só enxerga o contrato declarado. |
| “Cast transforma `Assalariado` em `Horista`.” | Mostre que o cast não cria nem altera objeto; a JVM apenas verifica compatibilidade. |
| “`instanceof` elimina todos os erros.” | Lembre que ele protege o cast, mas não valida regras de negócio nem corrige `null` em outras chamadas. |
| “Todo `instanceof` é código ruim.” | Volte ao fechamento mensal: a operação é específica e o teste está concentrado. |
| “Muitos `if`s são normais em qualquer processador.” | Pergunte qual novo subtipo exigiria editar a rotina e qual capacidade está faltando no contrato. |
| “`getClass() == Tipo.class` é igual a `instanceof`.” | Mostre que a primeira exclui subclasses e falha com `null`; a segunda verifica compatibilidade. |

## Critério de sucesso

Considere o encontro bem-sucedido quando a maioria da turma conseguir:

- prever corretamente os resultados de `instanceof` com herança e `null`;
- proteger um downcasting antes de acessar o método específico;
- identificar a origem de uma `ClassCastException`;
- explicar o escopo de uma variável criada por pattern matching;
- classificar uma situação como polimorfismo, interface, `instanceof` localizado ou revisão de abstração;
- escrever uma reflexão curta sobre por que o totalizador genérico não deve conhecer subtipos concretos.

Se a turma apenas repetir “use `instanceof` antes do cast”, retome o caso do fechamento mensal e o exercício de refatoração. O objetivo é justificar a existência do teste, não decorar a sua posição.

## Encerramento sugerido

> “Identificar um tipo não é voltar ao código procedural; é reconhecer uma necessidade específica dentro de um sistema que continua polimórfico. A maturidade está em manter o cast pequeno, protegido e justificável. No próximo encontro, vamos transformar capacidades recorrentes em interfaces, para que o contrato não dependa de uma única árvore de herança.”
