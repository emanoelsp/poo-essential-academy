# Roteiro de Aula — O Princípio da Substituição: Polimorfismo I

> **Módulo 5 · Encontro 15**  
> **Duração sugerida:** 80–90 min  
> **Foco:** polimorfismo, ligação tardia, LSP e mapa do SOLID  
> **Formato:** demonstração curta → decisão em dupla → laboratório → prática

## Objetivo didático

Ao final, o aluno deve conseguir justificar, usando o código, por que uma coleção de `Funcionario` pode receber subtipos e por que `f.calcularSalario()` escolhe a implementação do objeto real. A aula não deve terminar em uma definição decorada: o aluno precisa detectar quando uma herança quebra o contrato.

## Antes da aula

- Abra o Encontro 15 da plataforma e deixe o diagrama de classes disponível.
- Tenha uma versão executável da hierarquia `Funcionario`, `Horista` e `Assalariado`.
- Combine que ninguém executa o código dos exercícios antes de registrar uma previsão.
- Use votação rápida por mãos, enquete ou cartões: **“o processador deve conhecer os tipos concretos?”**

## Roteiro minuto a minuto

### 0–8 min — Gancho: o custo do `if/else`

Mostre apenas o primeiro código da seção “O problema”. Não apresente a definição de LSP ainda.

Pergunte:

> “Se amanhã entrar `Estagiario`, quantos arquivos serão alterados?”

Peça que cada dupla circule no código os lugares que precisariam mudar. Colete duas respostas diferentes antes de mostrar a versão polimórfica.

**Sinal de aprendizagem:** o aluno aponta o acoplamento ao tipo concreto, não apenas diz “fica maior”.

### 8–20 min — Contrato comum

Apresente `Funcionario` abstrato e as duas subclasses. Faça a turma completar oralmente:

```text
List<Funcionario> pode receber um Horista porque __________________.
```

Resposta esperada: `Horista` é um `Funcionario` e implementa o contrato necessário. Aproveite para recuperar herança, `abstract` e `@Override` do Módulo 4.

Evite explicar todos os modificadores novamente; retome apenas o que for necessário para a decisão atual.

### 20–32 min — Laboratório de ligação tardia

Peça que os alunos preencham o rastreador da aula antes de executar.

Faça três perguntas, nesta ordem:

1. O que o compilador enxerga em `f`?
2. Que objeto foi criado depois do `new`?
3. Por que a chamada não procura uma implementação aleatória?

Só depois revele a execução. Se houver confusão, desenhe no quadro:

```text
f : Funcionario  ─────────►  objeto Horista
        contrato                 comportamento real
```

### 32–45 min — LSP como teste de contrato

Apresente o caso `Retangulo`/`Quadrado`. Não diga imediatamente que está errado. Peça:

> “Qual frase o método `conferir(Retangulo)` promete? O `Quadrado` consegue cumprir essa frase?”

Depois, use a tabela de pré-condição, pós-condição, invariantes e exceções. O ponto central é mostrar que LSP é observável pelo cliente; não é um detalhe filosófico sobre diagramas UML.

**Frase para fixar:** “subtipo não é apenas uma classe que compila; é uma classe que preserva as expectativas do cliente”.

### 45–57 min — SOLID como mapa, não como lista

Projete a tabela do SOLID e faça a conexão com os módulos:

- Módulo 2: classes e responsabilidades → **S**;
- Módulo 3: encapsulamento e invariantes → **S/L**;
- Módulo 4: herança e abstração → pré-requisito para **O/L**;
- Encontro 15: coleção polimórfica → principalmente **O/L**;
- Encontro 17: interfaces → **I/D**;
- Módulo 6: aplicação integrada no projeto.

Peça um exemplo de cada princípio usando a classe `ProcessadorFolha`. Corrija respostas genéricas perguntando: “qual linha do código demonstra isso?”.

### 57–72 min — Exercícios 1 e 2

O Exercício 1 deve ser feito individualmente por 5 minutos e discutido em dupla por 3 minutos. A execução vem depois da previsão.

No Exercício 2, peça primeiro o contrato de `Entrega`, depois uma implementação concreta. Circule procurando `instanceof` no totalizador. Se aparecer, pergunte:

> “Qual comportamento está faltando no contrato para que o totalizador não precise conhecer este tipo?”

### 72–84 min — Exercício 3 e defesa rápida

Divida os três bugs entre grupos. Cada grupo deve defender uma correção em até 60 segundos, respondendo:

1. qual promessa foi quebrada;
2. quem é surpreendido;
3. qual desenho alternativo reduz a obrigação.

Não aceite apenas “trocar herança por interface” sem que o grupo explique qual contrato será mantido.

### 84–90 min — Saída da aula

Faça um “bilhete de saída” com duas frases:

1. “Polimorfismo acontece quando...”
2. “Eu desconfio de uma violação do LSP quando...”

Use as respostas para decidir se o Encontro 16 começa com downcasting ou com uma revisão de contratos.

## Erros previsíveis e intervenção

| Confusão | Intervenção curta |
|---|---|
| “Polimorfismo é só herança” | Mostre que o ponto central é o contrato usado pelo cliente e o comportamento escolhido em runtime. |
| “O tipo da variável muda” | Reforce que a referência continua `Funcionario`; quem varia é o objeto real apontado. |
| “LSP significa toda subclasse ter os mesmos atributos” | Volte ao cliente `conferir`: o teste é comportamento observável, não formato da classe. |
| “SOLID é decorar cinco siglas” | Peça uma linha concreta do código que exemplifique cada princípio. |
| “Se compila, está correto” | Use `Quadrado`: compila, mas quebra a expectativa de quem recebe `Retangulo`. |

## Critério de sucesso

Considere o encontro bem-sucedido quando a maioria da turma conseguir:

- prever a saída do Exercício 1 antes de executar;
- explicar referência versus objeto real sem usar apenas a palavra “mágica”;
- implementar o totalizador do Exercício 2 sem `instanceof`;
- apontar a promessa quebrada em pelo menos dois bugs do Exercício 3.

Se a turma apenas repetir a definição de LSP, mas não localizar a linha que quebra o contrato, retome o caso `Quadrado` antes de avançar para identificação de tipos.

## Encerramento sugerido

> “Hoje vocês não aprenderam uma forma mais elegante de escrever `for`. Aprenderam a mover a decisão para o objeto que possui a regra. Quando uma nova classe entra e o processador continua igual, o design está absorvendo mudança. No próximo encontro veremos o que fazer quando o contrato geral não expõe um comportamento específico.”
