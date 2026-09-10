# Roteiro de Aula — Exceções de Domínio e Custom Exceptions

> **Módulo 3 · Conteúdo Complementar · 60 XP**
> **Tempo total estimado:** 80–90 min
> **Pré-requisito do aluno:** ter lido `excecoes-01` (hierarquia, checked/unchecked, try-catch, try-with-resources)
> **Materiais:** projetor com a plataforma aberta em excecoes-02, IDE com projeto Java do sistema bancário

---

## Abertura — 5 min

> 💬 **Fala do professor:**
>
> "No encontro anterior a gente aprendeu que exceções são a voz do encapsulamento. A classe grita quando alguém tenta violar suas regras. Mas aí vem o próximo nível: que exceção a classe grita?
>
> `IllegalStateException` com a mensagem 'saldo insuficiente' funciona. Mas não comunica nada sobre o **domínio** do sistema. Um desenvolvedor novo lendo aquele catch não sabe se é um problema de conta bancária, de estoque, de pedido. É como o médico dizer 'você está com dor' sem dizer onde.
>
> Hoje a gente vai aprender a criar exceções que falam a linguagem do negócio. Uma `SaldoInsuficienteException` não só descreve o erro — ela **documenta o domínio** do sistema. É Orientação a Objetos aplicada ao tratamento de erros."

---

## Etapa 1 — Criando a primeira exception customizada — 10 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Criar uma exception customizada é mais simples do que parece. É só uma classe Java normal que herda de `RuntimeException` ou de `Exception`. Herdar de `RuntimeException` a torna unchecked — como a gente viu no encontro anterior, isso significa que o compilador não vai ficar te pedindo try-catch em todo lugar.
>
> Para exceções de domínio — violações de regras do negócio — unchecked é a escolha certa. O Spring, o Hibernate, todo framework moderno usa isso. Checked fica pra falhas externas: arquivo, rede, banco de dados."

### Demonstração

Abra a IDE. Crie uma nova classe:

```java
public class SaldoInsuficienteException extends RuntimeException {

    public SaldoInsuficienteException(String message) {
        super(message);
    }

    // Construtor com causa — para exception chaining
    public SaldoInsuficienteException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

> 💬 **Fala do professor:**
>
> "Isso é tudo que você precisa. Uma classe, um `extends`, dois construtores. O `super(message)` passa a mensagem pro `RuntimeException`, que guarda pra quando alguém chamar `getMessage()`.
>
> Mas reparem: agora o tipo da exceção **carrega informação sozinho**. `SaldoInsuficienteException` no stack trace já conta a história. Quem fizer o catch consegue reagir especificamente a esse cenário.
>
> Agora vamos usar ela — coloquem na `ContaBancaria`:"

```java
public void sacar(double valor) {
    if (valor <= 0) throw new IllegalArgumentException("Valor inválido: " + valor);
    if (valor > saldo)
        throw new SaldoInsuficienteException(
            String.format("Saldo insuficiente. Disponível: R$%.2f | Solicitado: R$%.2f", saldo, valor)
        );
    saldo -= valor;
}
```

### Pergunta para a turma

> ❓ "Por que a mensagem da `SaldoInsuficienteException` inclui os dois valores — saldo disponível e valor solicitado — em vez de só dizer 'saldo insuficiente'?"
>
> *(Resposta: a mensagem deve carregar contexto suficiente para debug sem precisar reproduzir o cenário. Um log com os dois valores resolve o problema direto.)*

---

## Etapa 2 — Exceptions com dados estruturados — 10 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Mensagem é bom. Mas às vezes quem captura a exceção precisa de **dados**, não de texto. Imagina que a tela vai mostrar a mensagem de erro com os valores formatados de um jeito específico — em vermelho, em moeda, com ícone. Ela não quer parsear uma string. Ela quer os números.
>
> Uma custom exception é um objeto Java. Você pode colocar atributos nela."

### Demonstração

```java
public class EstoqueInsuficienteException extends RuntimeException {
    private final int quantidadeSolicitada;
    private final int quantidadeDisponivel;

    public EstoqueInsuficienteException(int solicitado, int disponivel) {
        super(String.format("Estoque insuficiente. Solicitado: %d | Disponível: %d",
              solicitado, disponivel));
        this.quantidadeSolicitada = solicitado;
        this.quantidadeDisponivel = disponivel;
    }

    public int getQuantidadeSolicitada() { return quantidadeSolicitada; }
    public int getQuantidadeDisponivel() { return quantidadeDisponivel; }
}
```

> 💬 **Fala do professor:**
>
> "Agora a camada de apresentação pode fazer isso:"

```java
try {
    estoque.retirar(produto, quantidade);
} catch (EstoqueInsuficienteException e) {
    // sem parsear string — acessa os dados diretamente
    JOptionPane.showMessageDialog(null,
        String.format("Solicitado: %d unidades\nDisponível: %d unidades",
            e.getQuantidadeSolicitada(), e.getQuantidadeDisponivel()),
        "Estoque insuficiente", JOptionPane.WARNING_MESSAGE);
}
```

> 💬 **Fala do professor:**
>
> "Exception com campos estruturados é o padrão que APIs REST usam: quando o backend lança a exceção, o handler central serializa os campos em JSON pro frontend. Vocês vão ver isso muito quando chegarem em Spring."

### Pergunta para a turma

> ❓ "Por que os campos `quantidadeSolicitada` e `quantidadeDisponivel` são declarados como `final`?"
>
> *(Resposta: uma exceção não deve mudar após ser criada. `final` garante que os valores que descrevem o erro são imutáveis — coerente com o fato de que o erro já aconteceu.)*

---

## Etapa 3 — Hierarquia de exceptions de domínio — 15 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Até agora criamos exceções soltas. Em sistemas maiores você vai querer **organizar** essas exceções em hierarquia — exatamente como o Java faz com a hierarquia de `Throwable`, `Exception`, `RuntimeException`.
>
> A ideia é criar uma exception raiz do domínio — chamada às vezes de domain exception ou base exception — e todas as exceptions específicas do sistema herdam dela. Isso dá ao chamador flexibilidade: quer ser específico? Captura o tipo exato. Quer capturar qualquer coisa do domínio? Captura a raiz."

### Demonstração

Mostre a hierarquia completa do sistema bancário:

```java
// Raiz do domínio
public class SistemaBancarioException extends RuntimeException {
    public SistemaBancarioException(String message) { super(message); }
    public SistemaBancarioException(String message, Throwable cause) { super(message, cause); }
}

// Filhos específicos
public class ContaNaoEncontradaException extends SistemaBancarioException {
    public ContaNaoEncontradaException(String numeroConta) {
        super("Conta não encontrada: " + numeroConta);
    }
}

public class SaldoInsuficienteException extends SistemaBancarioException {
    public SaldoInsuficienteException(double saldo, double valor) {
        super(String.format("Saldo insuficiente. Saldo: R$%.2f | Saque: R$%.2f", saldo, valor));
    }
}

public class ContaBloqueadaException extends SistemaBancarioException {
    public ContaBloqueadaException(String motivo) {
        super("Conta bloqueada: " + motivo);
    }
}
```

> 💬 **Fala do professor:**
>
> "Agora mostrem o poder disso na hora de capturar. Vocês podem ser cirúrgicos ou abrangentes:"

```java
try {
    banco.sacar("0001", 5000.0);
} catch (ContaNaoEncontradaException e) {
    // tela de erro: conta inválida
} catch (ContaBloqueadaException e) {
    // tela de erro: operação bloqueada — sugere contato com suporte
} catch (SaldoInsuficienteException e) {
    // tela de erro: saldo — sugere recarga
} catch (SistemaBancarioException e) {
    // captura qualquer erro bancário não tratado acima
    // útil em logging centralizado
}
```

> 💬 **Fala do professor:**
>
> "Reparem na ordem: específico antes do geral. Sempre. É a mesma regra que vimos no encontro anterior com `NullPointerException` antes de `RuntimeException`. Se colocarem `SistemaBancarioException` antes, os blocos específicos nunca são alcançados.
>
> E qual é o valor disso arquiteturalmente? Imagina que amanhã aparece uma nova regra de negócio: `LimiteTransferenciaExcedidoException`. Vocês a criam herdando de `SistemaBancarioException`. O catch geral já existe e já vai capturar. O sistema não quebra."

### Demonstração visual

Desenhe no quadro ou mostre um diagrama:

```
RuntimeException
    └── SistemaBancarioException
            ├── ContaNaoEncontradaException
            ├── SaldoInsuficienteException
            └── ContaBloqueadaException
```

### Pergunta para a turma

> ❓ "Se eu fizer `catch (SistemaBancarioException e)` antes de `catch (SaldoInsuficienteException e)`, o que acontece?"
>
> *(Resposta: o compilador dá erro — `SaldoInsuficienteException` é subclasse de `SistemaBancarioException`, portanto o catch específico nunca seria alcançado. O compilador detecta isso.)*

---

## Etapa 4 — Onde jogar, onde capturar — 12 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Existe uma regra simples que resolve 90% das dúvidas sobre onde colocar um `throw` e onde colocar um `catch`:
>
> **Jogue onde a regra é violada. Capture onde você sabe o que fazer.**
>
> Vamos traduzir isso em camadas."

### Demonstração — as três camadas

> 💬 **Fala do professor:**
>
> "Pensem num sistema com três camadas: Domínio, Serviço e Apresentação."

Mostre o código completo com as três camadas:

```java
// CAMADA DE DOMÍNIO — joga, não captura
// Sabe as regras, não sabe como apresentar pro usuário
class ContaBancaria {
    public void sacar(double valor) {
        if (valor > saldo) throw new SaldoInsuficienteException(saldo, valor);
        saldo -= valor;
    }
}

// CAMADA DE SERVIÇO — propaga
// Coordena operações, não sabe como apresentar pro usuário
class BancoService {
    public void realizarTransferencia(String origem, String destino, double valor) {
        Conta co = encontrarConta(origem); // pode lançar ContaNaoEncontradaException
        Conta cd = encontrarConta(destino);
        co.sacar(valor);    // pode lançar SaldoInsuficienteException
        cd.depositar(valor);
        // Não captura aqui — propaga pra cima
    }
}

// CAMADA DE APRESENTAÇÃO — captura
// Sabe como mostrar o erro pro usuário
public class Main {
    public static void main(String[] args) {
        try {
            bancoService.realizarTransferencia("0001", "0002", 1000.0);
            JOptionPane.showMessageDialog(null, "Transferência realizada!");
        } catch (SaldoInsuficienteException e) {
            JOptionPane.showMessageDialog(null, e.getMessage(), "Erro", JOptionPane.WARNING_MESSAGE);
        } catch (ContaNaoEncontradaException e) {
            JOptionPane.showMessageDialog(null, e.getMessage(), "Erro", JOptionPane.ERROR_MESSAGE);
        }
    }
}
```

> 💬 **Fala do professor:**
>
> "O `BancoService` não captura porque não sabe o que fazer — não vai mostrar JOptionPane no meio de um serviço. Ele deixa a exceção subir até quem sabe lidar com ela.
>
> Isso tem um nome: **separação de responsabilidades**. A regra é do domínio, a apresentação é da interface, e quem faz a ponte é o serviço — mas sem misturar as responsabilidades.
>
> Uma regra prática: se você abrir um catch e a única coisa que sabe fazer é `System.out.println(e.getMessage())`, você está no lugar errado. Propaga."

### Pergunta para a turma

> ❓ "Por que é um problema capturar `SaldoInsuficienteException` dentro do método `sacar()` da própria `ContaBancaria`?"
>
> *(Resposta: a classe lançaria e capturaria sua própria exception — o erro seria silenciado internamente. O chamador nunca ficaria sabendo que a operação falhou. Viola o princípio de que quem sabe o que fazer captura.)*

---

## Etapa 5 — Guard clauses e `Objects.requireNonNull` — 12 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Agora um padrão que muda a **geometria** do código. Quando você usa `throw` para validar no início do método, cada validação que falha encerra o método imediatamente. Isso elimina aninhamento.
>
> O padrão se chama **guard clause** — guarda. Cada verificação inválida é uma guarda que barra a execução antes de chegar na lógica real."

### Demonstração — antes e depois

Mostre os dois exemplos lado a lado:

```java
// ❌ Ifs aninhados — lógica real no 4º nível de indentação
public String emprestar(String isbn, String usuario) {
    if (isbn != null) {
        if (!isbn.isBlank()) {
            Livro livro = acervo.get(isbn);
            if (livro != null) {
                if (livro.disponivel) {
                    // lógica real — 4º nível
                    livro.disponivel = false;
                    return "EMP-" + System.currentTimeMillis();
                }
            }
        }
    }
    return null; // chamador não sabe o que deu errado
}

// ✅ Guard clauses — lógica real no nível zero
public String emprestar(String isbn, String usuario) {
    Objects.requireNonNull(isbn, "ISBN não pode ser nulo");
    if (isbn.isBlank())    throw new IllegalArgumentException("ISBN não pode ser vazio");
    Livro livro = acervo.get(isbn);
    if (livro == null)     throw new LivroNaoEncontradoException(isbn);
    if (!livro.disponivel) throw new LivroIndisponivelException(livro.titulo);

    // lógica real — nível zero, sem aninhamento
    livro.disponivel = false;
    return "EMP-" + System.currentTimeMillis();
}
```

> 💬 **Fala do professor:**
>
> "Comparem os dois. No primeiro, pra chegar na lógica do empréstimo você tem que decifrar 4 níveis de `if`. No segundo, as guardas estão no topo, são explícitas, e a lógica real fica limpa no final.
>
> E `Objects.requireNonNull` — isso é o idioma Java para null check. É mais expressivo que um `if` manual e é o que todo código profissional usa. Passei isso pro construtor?"

```java
public class ContaBancaria {
    private final String titular;
    private double saldo;

    public ContaBancaria(String titular, double saldo) {
        this.titular = Objects.requireNonNull(titular, "Titular não pode ser nulo");
        if (saldo < 0) throw new IllegalArgumentException("Saldo inicial não pode ser negativo: " + saldo);
        this.saldo = saldo;
    }
    // Garantia: se o objeto existe, titular != null e saldo >= 0
}
```

> 💬 **Fala do professor:**
>
> "No construtor, isso é especialmente poderoso. Se o objeto foi criado com sucesso, você tem garantia de que está em estado válido. Não existe `ContaBancaria` com titular nulo no sistema — o Java não deixa.
>
> **Princípio**: faça o código falhar cedo, claro e rápido. Um `NullPointerException` na linha 3 do construtor é mil vezes melhor que um `NullPointerException` na linha 300 quando você tenta usar o objeto."

### Pergunta para a turma

> ❓ "Por que é melhor lançar no construtor do que validar em cada método que usa o campo?"
>
> *(Resposta: o erro está perto da causa. Se validar em cada método, você detecta o problema tarde e em N lugares diferentes. No construtor, detecta uma vez, na origem, e garante que estados inválidos não existem.)*

---

## Etapa 6 — `Optional<T>` vs Exception — quando não lançar — 8 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Uma pergunta que sempre aparece: quando uso `Optional` e quando uso exception? São ferramentas diferentes para semânticas diferentes.
>
> Exception significa: 'algo deu errado, um contrato foi violado'.
> Optional significa: 'pode ter ou não ter — e os dois casos são normais'.
>
> A pergunta que resolve: **a ausência do valor é um erro de quem chamou?**"

### Demonstração

```java
class Biblioteca {

    // buscar — é NORMAL não encontrar → Optional
    public Optional<Livro> buscar(String isbn) {
        return Optional.ofNullable(acervo.get(isbn));
    }

    // emprestar — o livro DEVE existir → exception
    public String emprestar(String isbn, String usuario) {
        Livro livro = acervo.get(isbn);
        if (livro == null) throw new LivroNaoEncontradoException(isbn);
        // ...
    }
}
```

> 💬 **Fala do professor:**
>
> "Quando o usuário pesquisa um livro pelo ISBN na barra de busca, pode ser que não exista. Isso é normal. `Optional` força o chamador a pensar nos dois casos — compilador não deixa esquecer.
>
> Quando o sistema tenta emprestar um ISBN que foi passado pelo usuário e não existe, isso é um bug no fluxo — alguém mandou um ISBN inválido. Exception.
>
> E se você está num contexto onde a ausência vira erro, converta na hora certa:"

```java
// Optional para consulta normal:
biblioteca.buscar("978-01").ifPresent(l -> System.out.println(l.titulo));

// Convertendo Optional em exception quando necessário:
Livro livro = biblioteca.buscar("978-01")
    .orElseThrow(() -> new LivroNaoEncontradoException("978-01"));
```

### Pergunta para a turma

> ❓ "Um método `buscarPorNome(String nome)` deve retornar `Optional<Usuario>` ou lançar `UsuarioNaoEncontradoException`? E um método `autenticar(String email, String senha)`?"
>
> *(Resposta: `buscarPorNome` → `Optional` — nome pode não existir, é busca. `autenticar` → exception — se o email não existe, é violação de contrato. Pode lançar `CredenciaisInvalidasException`.)*

---

## Etapa 7 — Boas práticas e erros comuns — 8 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Antes dos exercícios, um blitz de boas práticas. São padrões que separam código profissional do código de quem acabou de aprender exceptions."

### Demonstração — compare os pares

Mostre cada par e peça à turma pra identificar o problema antes de revelar:

```java
// ❌ Exception vaga
throw new RuntimeException("Erro");

// ✅ Exception específica com contexto
throw new SaldoInsuficienteException(saldo, valorSolicitado);
```

```java
// ❌ Silenciar — o pior pecado
try { operacao(); } catch (Exception e) { }

// ✅ Tratar ou relançar com contexto
try { operacao(); } catch (Exception e) {
    throw new ServicoException("Falha na operação X", e); // encadeia a causa
}
```

```java
// ❌ Exception como controle de fluxo normal
try {
    return lista.get(indice);
} catch (IndexOutOfBoundsException e) {
    return null;
}

// ✅ Verificação direta
if (indice < lista.size()) return lista.get(indice);
return null;
```

> 💬 **Fala do professor:**
>
> "Exception tem custo — criar um stack trace é caro. Usar exception para controle de fluxo normal é como usar ambulância para fazer compra. Funciona, mas é errado.
>
> E nunca — jamais — capturem `Throwable` ou `Error`. `OutOfMemoryError` e `StackOverflowError` são problemas da JVM. Se vocês capturam e silenciam, o programa continua rodando num estado corrompido. É pior do que deixar explodir."

---

## Exercício em dupla — 10 min

> 💬 **Fala do professor:**
>
> "Vamos ao código. Em duplas, 10 minutos. Peguem a `ContaBancaria` que vocês construíram nos encontros anteriores e façam as seguintes mudanças:
>
> 1. Criem a hierarquia `BancoException` → `SaldoInsuficienteException`, `ValorInvalidoException`
> 2. Refatorem `sacar()` e `depositar()` para usar guard clauses com `Objects.requireNonNull` e lançar as exceptions específicas
> 3. Movam todos os `JOptionPane.showMessageDialog` para o `main` — a classe `ContaBancaria` não deve saber de interface gráfica
>
> A regra: se o teste `new ContaBancaria(null, 100)` não lançar imediatamente, está errado."

*Circule pela sala. Pontos de atenção:*
- *Verificar se os `JOptionPane` saíram da classe de domínio*
- *Verificar se a hierarquia está correta (`extends BancoException`)*
- *Verificar se `Objects.requireNonNull` está no construtor*

---

## Fechamento e conexão com os exercícios — 5 min

> 💬 **Fala do professor:**
>
> "Então, o que aprendemos hoje:
>
> - Custom exceptions = OO aplicado a erros. Uma classe, um `extends`, pronto.
> - Coloque campos estruturados quando a camada de apresentação precisa de dados, não de texto.
> - Organize em hierarquia: exception raiz do domínio → exceptions específicas. Facilita manutenção e catch seletivo.
> - Regra de ouro: jogue onde a regra é violada, capture onde você sabe o que fazer. Camada de domínio joga, apresentação captura, serviço propaga.
> - Guard clauses eliminam aninhamento. `Objects.requireNonNull` no construtor garante estado válido desde o nascimento.
> - `Optional` para ausência normal, exception para violação de contrato. A pergunta: 'a ausência é um erro de quem chamou?'
>
> A plataforma tem 5 exercícios. O exercício 2 é o que vocês acabaram de fazer — vai rápido. O 4 e o 5 são os mais ricos: exception com campos estruturados e leitura de CSV. Se ficarem travados no 5, comecem pelos dois primeiros `catch` — arquivo não encontrado e formato inválido — e tratam o range depois.
>
> Qualquer dúvida, chama."

---

## Notas do Professor

**Erros comuns nos exercícios:**

1. Herdar de `Exception` em vez de `RuntimeException` — o compilador vai pedir `throws` em todo método que usa. Pergunte: "a violação de uma regra de negócio é uma falha externa ou um bug?"
2. Criar exceptions genéricas como `BancoException("saldo insuficiente")` em vez de tipos específicos — perde toda a vantagem de captura seletiva
3. No exercício 2, deixar `JOptionPane` dentro da `ContaBancaria` — isso é mistura de domínio com apresentação
4. No exercício 4, montar a mensagem no construtor da exception e não expor os getters — o exercício pede dados estruturados acessíveis
5. No exercício 5, usar um catch genérico `catch (Exception e)` para tudo — o objetivo é tratar os três cenários separadamente

**Conexão com próximos tópicos:**

- Herança (Módulo 4) vai tornar a hierarquia de exceptions ainda mais natural — os alunos já viram isso em ação hoje
- Quando chegarem em Spring (fora da Academia), vão ver `@ControllerAdvice` capturando as domain exceptions pelo tipo — a hierarquia que criaram hoje é exatamente o padrão que o Spring espera

**Se sobrar tempo:**

- Mostre o Troubleshooting da plataforma: três bugs clássicos — `ArithmeticException` que não acontece com `double`, `throw new Exception` não declarado, e exception relançada sem preservar a causa. Peça pra turma identificar os problemas antes de revelar o gabarito
- Discuta: em sistemas com API REST, quem é a "camada de apresentação"? *(O controller, que serializa a exception em JSON)*
