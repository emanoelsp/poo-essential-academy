# Roteiro de Aula — Hierarquia de Exceções: checked vs unchecked

> **Módulo 3 · Encontro Complementar**
> **Tempo total estimado:** 80–90 min
> **Pré-requisito do aluno:** ter lido os encontros 7 e 8 (Encapsulamento I e II)
> **Materiais:** projetor com a plataforma aberta na aula excecoes-01, IDE (IntelliJ ou VS Code) com projeto Java em branco

---

## Abertura — 5 min

> 💬 **Fala do professor:**
>
> "Pessoal, nos encontros anteriores a gente aprendeu a proteger os dados de uma classe com encapsulamento — atributos privados, getters e setters com validação. Mas aí surge uma pergunta: quando uma validação falha, o que acontece? A gente retorna `false`? Retorna `null`? Imprime uma mensagem no console?
>
> A resposta do Java é: a gente **lança uma exceção**. Exceção é a forma que o Java escolheu para dizer 'algo deu errado e precisa ser tratado'. Hoje a gente vai entender como esse mecanismo funciona de ponta a ponta — desde a hierarquia de classes até a relação direta com o encapsulamento que vocês já conhecem."

---

## Etapa 1 — A Hierarquia e Checked vs Unchecked

> ⏱ ~12 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Antes de qualquer código, olha esse diagrama. No topo de tudo temos `Throwable` — é o pai de toda coisa lançável em Java. Ele tem dois filhos: `Error` e `Exception`.
>
> `Error` vocês podem esquecer por hoje. `OutOfMemoryError`, `StackOverflowError` — são problemas internos da JVM, não tem nada que o seu código possa fazer sobre isso. Nunca capture um `Error`.
>
> O que importa pra gente é `Exception`. E dentro de `Exception` tem uma divisão crucial: existe `RuntimeException` e existe tudo que não é `RuntimeException`.
>
> As que herdam de `RuntimeException` são chamadas de **unchecked**. As outras são **checked**. Essa distinção muda completamente como o compilador te trata."

### Demonstração

Abra a IDE. Crie um método que tenta ler um arquivo:

```java
public void lerArquivo(String path) {
    FileReader f = new FileReader(path);
}
```

> 💬 **Fala do professor:**
>
> "Notem que o IntelliJ já sublinha em vermelho. Por quê? Porque `FileReader` pode lançar `IOException`, que é uma **checked exception** — ela herda de `Exception` mas não de `RuntimeException`. O compilador está te dizendo: 'você TEM que lidar com isso'. Você tem duas saídas: ou envolve com try-catch, ou declara `throws IOException` na assinatura do método."

Mostre as duas soluções. Depois faça:

```java
String s = null;
s.length(); // NullPointerException
```

> 💬 **Fala do professor:**
>
> "Agora isso aqui — o compilador não reclama nada. `NullPointerException` é **unchecked**, herda de `RuntimeException`. O compilador não te obriga a tratar. Mas vai explodir em runtime da mesma forma.
>
> A lógica por trás é: checked exceptions representam situações externas que o programa não controla — arquivo que não existe, rede fora, banco de dados indisponível. Unchecked representam bugs do programador — você passou null onde não devia, acessou índice inválido. O compilador não te força a tratar seus próprios bugs."

### Pergunta para a turma

> ❓ "Se eu criar um método que divide dois números e o divisor for zero, qual exceção vai ser lançada? E ela é checked ou unchecked?"
>
> *(Resposta esperada: `ArithmeticException`, unchecked — herda de `RuntimeException`)*

---

## Etapa 2 — try-catch-finally

> ⏱ ~15 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Beleza. Sabemos que exceções existem e sabemos quando o compilador nos obriga a tratar. Mas como a gente trata na prática? Com o bloco `try-catch-finally`.
>
> A lógica é simples: dentro do `try` vai o código que pode explodir. Se explodir, a execução pula direto pro `catch` correspondente — o código que vem depois da linha que lançou dentro do `try` não executa. Depois do `catch` — ou mesmo se não houve exceção — o `finally` executa. **Sempre**. Isso não é negociável."

### Demonstração com rastreamento

Mostre o diagrama de fluxo na plataforma, depois escreva na IDE:

```java
public static void testar(int[] arr, int indice) {
    try {
        System.out.println("tentando acessar arr[" + indice + "]");
        int valor = arr[indice];
        System.out.println("valor = " + valor); // só executa se não lançar
    } catch (ArrayIndexOutOfBoundsException e) {
        System.err.println("catch: " + e.getMessage());
    } finally {
        System.out.println("finally sempre executa");
    }
    System.out.println("código depois do try-catch continua normalmente");
}
```

Execute com índice válido e depois com inválido. Mostre o output em cada caso.

### O gotcha do finally com return

> 💬 **Fala do professor:**
>
> "Tem um comportamento que pega muita gente de surpresa. Quem aqui acha que `finally` executa mesmo quando tem um `return` dentro do `try`?"
>
> *(pause para respostas)*
>
> "Executa. O `return` não escapa do `finally`. O Java executa o `finally` antes de realmente retornar. Olhem:"

```java
public static int gotcha() {
    try {
        System.out.println("try");
        return 42;
    } finally {
        System.out.println("finally executa ANTES do return!");
    }
}
```

> 💬 **Fala do professor:**
>
> "Por isso nunca coloquem `return` dentro do `finally`. Se fizerem isso, ele substitui o return do `try` — e se havia uma exceção em andamento, ela é engolida silenciosamente. Isso é um dos bugs mais difíceis de encontrar."

### A ordem dos catch

> 💬 **Fala do professor:**
>
> "Outra regra importante: quando você tem múltiplos `catch`, o Java testa na ordem em que aparecem. Se colocar o mais geral primeiro, os específicos nunca são alcançados — e o compilador vai reclamar. Sempre do mais específico para o mais geral."

### Pergunta para a turma

> ❓ "Se eu tenho `catch (NullPointerException e)` e `catch (RuntimeException e)` — qual vem primeiro?"
>
> *(Resposta: NullPointerException — é mais específica)*

---

## Etapa 3 — Multi-catch

> ⏱ ~8 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Às vezes você tem dois tipos de exceção que você quer tratar exatamente da mesma forma. Em vez de duplicar o bloco catch, o Java 7 introduziu o multi-catch — você junta os tipos com uma barra vertical, igual ao operador OR."

### Demonstração

```java
try {
    String input = JOptionPane.showInputDialog("Digite um número:");
    int numero = Integer.parseInt(input); // NumberFormatException se não for número
    System.out.println(input.toUpperCase()); // NullPointerException se clicar em cancelar
} catch (NumberFormatException | NullPointerException e) {
    JOptionPane.showMessageDialog(null, "Entrada inválida: " + e.getClass().getSimpleName());
}
```

> 💬 **Fala do professor:**
>
> "Usem multi-catch quando o tratamento é idêntico. Se os tratamentos forem diferentes — mensagens diferentes, ações diferentes — aí use catch separados. O objetivo é reduzir repetição sem esconder informação."

### Pergunta para a turma

> ❓ "Posso usar multi-catch com `IOException | RuntimeException`? Por quê sim ou por quê não?"
>
> *(Resposta: sim, sintaticamente funciona, mas é uma combinação estranha — IOException é checked, RuntimeException é pai de muitas coisas. Na prática evite misturar hierarquias muito distantes)*

---

## Etapa 4 — try-with-resources

> ⏱ ~10 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Vamos falar de um problema clássico em Java antes do Java 7: vazamento de recursos. Quando você abre um arquivo, uma conexão de banco, um socket — você precisa fechar. Se esquecer de fechar, o recurso fica preso até o garbage collector resolver ou até o programa morrer.
>
> O `finally` resolve isso — você fecha no `finally` e garante que fecha mesmo se houver exceção. Mas o código fica feio e propenso a erro. Olhem como era antes:"

Mostre o exemplo feio com `finally` manual, depois mostre o `try-with-resources` limpo.

> 💬 **Fala do professor:**
>
> "O `try-with-resources` garante o fechamento automaticamente. Qualquer classe que implemente `AutoCloseable` pode ser usada — e o Java chama o `close()` pra você ao sair do bloco, com ou sem exceção.
>
> E mais — você pode declarar múltiplos recursos. A abertura é na ordem que você declarou, o fechamento é na ordem inversa. Isso faz sentido: você abre A, depois B, então fecha B antes de fechar A."

### Demonstração

Mostre o exemplo de copiar arquivo com dois recursos. Pergunte à turma antes de executar qual recurso fecha primeiro.

### Pergunta para a turma

> ❓ "Por que faz sentido fechar os recursos na ordem inversa da abertura?"
>
> *(Resposta: o recurso aberto por último pode depender do anterior — ex: writer depende da conexão de rede — faz sentido fechar o dependente antes)*

---

## Etapa 5 — Inspecionando a Exceção

> ⏱ ~10 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Quando você captura uma exceção, você recebe um objeto. Esse objeto carrega informações sobre o que aconteceu. Vamos ver o que dá pra extrair."

Mostre a tabela de métodos: `getMessage()`, `getClass().getName()`, `getClass().getSimpleName()`, `printStackTrace()`, `getCause()`.

### Lendo um stack trace

> 💬 **Fala do professor:**
>
> "Esse ponto é prático demais pra pular: como vocês leem um stack trace? Porque na vida real vocês vão ver isso o tempo todo e muita gente se perde.
>
> Vamos dissecar um stack trace real:"

```
Exception in thread "main"
java.lang.ArithmeticException: / by zero
    at Calculadora.dividir(Calculadora.java:12)
    at Calculadora.calcular(Calculadora.java:7)
    at Main.main(Main.java:3)
```

> 💬 **Fala do professor:**
>
> "Linha 1: qual thread explodiu — pra aplicações simples sempre é `main`.
>
> Linha 2: o tipo da exceção e a mensagem. Isso já diz 80% do que aconteceu.
>
> As linhas seguintes são a pilha de chamadas — quem chamou quem. Leia **de cima pra baixo**: a primeira linha é onde a exceção foi lançada. No nosso caso, foi no método `dividir`, na linha 12 do arquivo `Calculadora.java`.
>
> Na prática: procure a primeira linha que é do **seu código** — não de biblioteca, não de framework — e comece a investigar por ali."

Deliberadamente crie um `NullPointerException` na IDE e mostre como encontrar a linha do problema no stack trace.

### Pergunta para a turma

> ❓ "Se o stack trace mostra 10 linhas e as primeiras 7 são de `java.util.*` e `sun.reflect.*`, onde vocês começam a olhar?"
>
> *(Resposta: na primeira linha do seu próprio pacote)*

---

## Etapa 6 — throw e Exception Chaining

> ⏱ ~12 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Até agora a gente só capturou exceções que o Java lança. Mas você pode lançar suas próprias. E em muitos casos você **deve** — porque é assim que as classes comunicam que uma invariante foi violada."

### Quando usar qual exception

Mostre a tabela de quando usar `IllegalArgumentException`, `IllegalStateException`, `NullPointerException`, `IndexOutOfBoundsException`.

> 💬 **Fala do professor:**
>
> "A regra de ouro: seja específico. Quanto mais específica a exceção, mais informação o chamador tem sobre o que deu errado e como reagir. Lançar `Exception` genérica é como ir ao médico e ele dizer 'você está doente' sem mais detalhes."

### Exception chaining

> 💬 **Fala do professor:**
>
> "Tem um padrão que vocês vão usar muito em sistemas reais e que muita gente erra na primeira vez: o exception chaining — encadeamento de exceções.
>
> O cenário: você está em uma camada de serviço que chama um repositório que tenta ler um arquivo. O repositório lança `IOException`. A camada de serviço não sabe como tratar `IOException` — não é responsabilidade dela — então ela relança como `RuntimeException`. Mas aí o desenvolvedor que debugar vai ver só `RuntimeException` e não vai saber que foi um problema de I/O.
>
> A solução: passe a exceção original como segundo argumento."

```java
// ❌ Errado — perde a causa
throw new RuntimeException("Falha ao carregar configuração");

// ✅ Certo — preserva a causa
throw new RuntimeException("Falha ao carregar configuração", e);
```

> 💬 **Fala do professor:**
>
> "Quando alguém capturar essa `RuntimeException`, pode chamar `e.getCause()` e recuperar o `IOException` original com o stack trace original. Informação preservada. Debug possível."

### Pergunta para a turma

> ❓ "Por que `IllegalArgumentException` não precisa de `throws` na assinatura do método, mas `IOException` precisa?"
>
> *(Resposta: `IllegalArgumentException` é unchecked — herda de `RuntimeException` — o compilador não obriga declaração. `IOException` é checked — o compilador exige que o chamador saiba que pode acontecer)*

---

## Etapa 7 — Relação com Encapsulamento e "Tell, Don't Ask"

> ⏱ ~12 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Chegamos na etapa mais importante — a que amarra tudo com o que vocês aprenderam nos encontros 7 e 8.
>
> Exceções não são um recurso isolado. Elas são a **voz do encapsulamento**. Quando você tem uma classe com atributos privados e invariantes — regras que o objeto nunca pode violar — a exceção é a forma que o objeto usa pra comunicar quando alguém tentou violar essas regras."

### Diagrama e código

Mostre o diagrama de sequência do `sacar()`. Depois mostre o exemplo de código completo.

> 💬 **Fala do professor:**
>
> "Olhem onde a validação está: dentro do método `sacar()`, na própria classe. Não no `main`. Não em quem chama. A `ContaBancaria` é a única que sabe quais são as regras da `ContaBancaria`.
>
> Isso nos leva a um princípio de design chamado **'Tell, Don't Ask'** — Diga, não pergunte."

### Tell, Don't Ask

Mostre os dois exemplos lado a lado:

```java
// ❌ "Ask" — chamador pergunta o estado e decide
if (conta.getSaldo() >= valor) {
    conta.sacar(valor);
}

// ✅ "Tell" — chamador manda, a classe valida
try {
    conta.sacar(valor);
} catch (IllegalStateException e) {
    System.err.println(e.getMessage());
}
```

> 💬 **Fala do professor:**
>
> "No primeiro exemplo, a regra 'saldo deve ser suficiente' está no chamador. Imagina que amanhã a regra muda — saldo mínimo de R$10. Onde você vai mudar? Em todo lugar que chama `getSaldo()` antes de sacar. Pode ter 50 lugares no sistema.
>
> No segundo exemplo, a regra está dentro de `sacar()`. Você muda em um único lugar. É isso que 'fonte única de verdade' significa na prática.
>
> Exceção é o mecanismo que torna o 'Tell, Don't Ask' possível. Sem exceção, o método `sacar()` teria que retornar `false` ou `null` — e o chamador ainda precisaria verificar o retorno. Com exceção, o contrato é claro: se não lançou, funcionou."

### Pergunta final para a turma

> ❓ "Se a `ContaBancaria` tivesse um método `boolean podeSacar(double valor)` público, o que isso violaria?"
>
> *(Resposta: o encapsulamento — expõe a lógica interna e convida o chamador a usar 'Ask' em vez de 'Tell'. Além disso, cria condição de corrida em sistemas concorrentes: o estado pode mudar entre o `podeSacar()` e o `sacar()`)*

---

## Fechamento e conexão com o Quiz — 5 min

> 💬 **Fala do professor:**
>
> "Então, pra resumir o que vimos hoje:
>
> - `Throwable` é o pai de tudo. `Error` não capture. `Exception` é o que importa.
> - Checked = condição externa, compilador obriga tratamento. Unchecked = bug seu, compilador não obriga.
> - `finally` sempre executa. Nunca coloque `return` lá dentro.
> - `try-with-resources` fecha recursos automaticamente — use sempre que puder.
> - Leia stack traces de cima pra baixo, procure a primeira linha do seu código.
> - Quando relançar, encadeie a causa original.
> - Exceções são a voz do encapsulamento. 'Tell, Don't Ask'.
>
> Agora vamos fixar isso com o Quiz Interativo. Eu vou abrir a sala — código vai aparecer na tela. Entrem com o apelido de vocês e vamos ver quem absorveu o conteúdo hoje."

---

## Notas do Professor

**Erros comuns dos alunos — antecipe:**

1. Confundir `throw` com `throws` — `throw` lança a exceção; `throws` declara que um método pode lançar
2. Achar que `catch (Exception e)` é boa prática — é uma armadilha: esconde o tipo real e força o chamador a tratar `Exception`
3. Deixar o bloco `catch` vazio — silencia o erro completamente, nunca faça
4. Não encadear a causa ao relançar — perde o stack trace original
5. Colocar lógica de negócio no `finally` — `finally` é só para limpeza

**Se sobrar tempo:**
- Mostre o `StackOverflowError` na prática com um método que chama a si mesmo sem condição de parada
- Discuta quando faz sentido criar uma exception customizada (próximo encontro: excecoes-02)
