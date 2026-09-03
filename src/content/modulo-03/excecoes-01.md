# Hierarquia de Exceções — checked vs unchecked

> **Conteúdo Complementar · Módulo 3 · 60 XP**

Encapsulamento protege os dados. Exceções comunicam quando essa proteção foi violada. Entender a hierarquia de exceções do Java é fundamental para construir sistemas que falham de forma previsível, legível e controlável.

---

## A hierarquia

```mermaid
graph TD
    T["🔴 Throwable"] --> ER["💥 Error\nnão capture"]
    T --> EX["⚠️ Exception"]
    ER --> OOM["OutOfMemoryError"]
    ER --> SOF["StackOverflowError"]
    EX --> IO["IOException\n✅ checked"]
    EX --> SQL["SQLException\n✅ checked"]
    EX --> RE["RuntimeException\n⚡ unchecked"]
    RE --> NPE["NullPointerException"]
    RE --> IAE["IllegalArgumentException"]
    RE --> IOOB["IndexOutOfBoundsException"]
    RE --> AE["ArithmeticException"]
    RE --> NFE["NumberFormatException"]
    RE --> CCE["ClassCastException"]

    style T fill:#b91c1c,color:#fff
    style ER fill:#7f1d1d,color:#fff
    style EX fill:#92400e,color:#fff
    style RE fill:#1e3a5f,color:#fff
    style IO fill:#14532d,color:#fff
    style SQL fill:#14532d,color:#fff
    style OOM fill:#3f1f1f,color:#ccc
    style SOF fill:#3f1f1f,color:#ccc
```

> **Regra de ouro**: `Error` → nunca capture. `RuntimeException` → unchecked, sem obrigação. O restante de `Exception` → checked, compilador exige tratamento.

---

## 1. Checked vs Unchecked — a diferença prática

```mermaid
flowchart TD
    A["Você lança ou usa\numa exceção"] --> B{"Herda de\nRuntimeException?"}
    B -- "Sim" --> C["⚡ UNCHECKED\nCompilador não exige tratamento\nExemplo: NullPointerException"]
    B -- "Não" --> D{"Herda de\nException?"}
    D -- "Sim" --> E["✅ CHECKED\nCompilador OBRIGA\ntry-catch ou throws\nExemplo: IOException"]
    D -- "Não" --> F["💥 ERROR\nProblema da JVM\nNunca capture"]

    style C fill:#1e3a5f,color:#fff
    style E fill:#14532d,color:#fff
    style F fill:#7f1d1d,color:#fff
```

**Checked** (`Exception` e subclasses, exceto `RuntimeException`):
- O compilador **obriga** você a tratar ou declarar com `throws`
- Representa condições externas que o código não controla: arquivo não encontrado, conexão caiu, banco indisponível

**Unchecked** (`RuntimeException` e subclasses):
- O compilador **não obriga** tratamento
- Representa bugs de programação: null pointer, índice inválido, argumento ilegal

```java
// Checked — compilador obriga tratamento:
import java.io.FileReader;
import java.io.IOException;

// Opção A: tratar com try-catch
try {
    FileReader f = new FileReader("dados.txt");
} catch (IOException e) {
    System.err.println("Arquivo não encontrado: " + e.getMessage());
}

// Opção B: propagar com throws
public void lerArquivo(String path) throws IOException {
    FileReader f = new FileReader(path); // quem chamar este método DEVE tratar
}

// Unchecked — compilador não exige nada (mas pode explodir em runtime):
String s = null;
s.length(); // NullPointerException — não precisa de try-catch mas vai travar
```

---

## 2. try-catch-finally

```mermaid
flowchart TD
    A["🟢 Bloco try\nexecuta"] --> B{"Exceção\nlançada?"}
    B -- "Não" --> C["Continua\nnormalmente"]
    B -- "Sim" --> D{"Catch\ncorresponde\nao tipo?"}
    D -- "Sim" --> E["🔴 Bloco catch\nexecuta"]
    D -- "Não" --> F["Exceção sobe\nao chamador"]
    E --> G["🔵 Bloco finally\nSEMPRE executa"]
    C --> G
    F --> G
    G --> H["Fim"]

    style A fill:#14532d,color:#fff
    style E fill:#7f1d1d,color:#fff
    style G fill:#1e3a5f,color:#fff
    style F fill:#92400e,color:#fff
```

> **Importante**: o `finally` executa **sempre** — com ou sem exceção, com ou sem `return` no bloco anterior.

```java
try {
    // código que pode lançar exceção
    int[] arr = new int[5];
    arr[10] = 42; // ArrayIndexOutOfBoundsException

} catch (ArrayIndexOutOfBoundsException e) {
    // captura exceção específica
    System.err.println("Índice inválido: " + e.getMessage());

} catch (NullPointerException e) {
    // múltiplos catch: do mais específico para o mais geral
    System.err.println("Referência nula: " + e.getMessage());

} catch (Exception e) {
    // catch genérico — evite usar sozinho (esconde o tipo real do erro)
    System.err.println("Erro inesperado: " + e.getMessage());

} finally {
    // SEMPRE executa — com ou sem exceção, com ou sem return
    System.out.println("Bloco finally executado.");
}
```

```mermaid
flowchart LR
    subgraph Ordem["Ordem obrigatória dos catch"]
        C1["catch ArrayIndexOutOfBoundsException\n(mais específico)"]
        C2["catch RuntimeException\n(menos específico)"]
        C3["catch Exception\n(mais geral — sempre por último)"]
        C1 --> C2 --> C3
    end
```

> **Regra**: ordene os `catch` do mais específico ao mais geral. Se colocar `catch (Exception e)` primeiro, os demais blocos nunca executam (erro de compilação).

---

## 3. Multi-catch — Java 7+

```mermaid
flowchart TD
    A["Bloco try"] --> B{"Qual exceção\nfoi lançada?"}
    B -- "NumberFormatException" --> C["catch\nNumberFormatException | NullPointerException"]
    B -- "NullPointerException" --> C
    B -- "OutroTipo" --> D["Exceção não\ntratada — sobe"]
    C --> E["Mesma lógica\nde tratamento"]

    style C fill:#1e3a5f,color:#fff
    style D fill:#7f1d1d,color:#fff
```

Use multi-catch quando **dois tipos de exceção têm o mesmo tratamento**:

```java
try {
    String s = null;
    int n = Integer.parseInt(s); // NumberFormatException (s é null)
    System.out.println(s.length()); // NullPointerException

} catch (NumberFormatException | NullPointerException e) {
    // trata dois tipos com a mesma lógica
    System.err.println("Entrada inválida: " + e.getClass().getSimpleName());
}
```

---

## 4. try-with-resources — Java 7+

Recursos que implementam `AutoCloseable` (Scanner, FileReader, conexões de banco) são fechados automaticamente, mesmo em caso de exceção:

```mermaid
flowchart TD
    subgraph Antigo["❌ Sem try-with-resources"]
        A1["Abrir recurso\nmanualmente"] --> A2["Usar recurso"]
        A2 --> A3{"Exceção?"}
        A3 -- "Sim" --> A4["catch executa"]
        A3 -- "Não" --> A5["Fim do try"]
        A4 --> A6["finally:\nfechar manualmente\nse não nulo"]
        A5 --> A6
        A6 --> A7["⚠️ Esqueceu o finally?\nVazamento de recurso"]
    end

    subgraph Novo["✅ Com try-with-resources"]
        B1["try (Recurso r = new ...)"] --> B2["Usar recurso"]
        B2 --> B3{"Exceção?"}
        B3 -- "Sim" --> B4["catch executa"]
        B3 -- "Não" --> B5["Fim do bloco"]
        B4 --> B6["r.close() automático\nguarantido pela JVM"]
        B5 --> B6
    end

    style A7 fill:#7f1d1d,color:#fff
    style B6 fill:#14532d,color:#fff
```

```java
import java.io.*;

// Sem try-with-resources: precisa de finally para fechar
BufferedReader br = null;
try {
    br = new BufferedReader(new FileReader("arquivo.txt"));
    System.out.println(br.readLine());
} catch (IOException e) {
    e.printStackTrace();
} finally {
    if (br != null) try { br.close(); } catch (IOException e) { /* ignorar */ }
}

// Com try-with-resources: fecha automaticamente
try (BufferedReader br = new BufferedReader(new FileReader("arquivo.txt"))) {
    System.out.println(br.readLine());
} catch (IOException e) {
    System.err.println("Erro ao ler arquivo: " + e.getMessage());
}
// br.close() é chamado automaticamente aqui — mesmo se houve exceção
```

---

## 5. getMessage(), getClass(), printStackTrace()

Quando você captura uma exceção, o objeto `e` carrega informações sobre o que aconteceu:

| Método | O que retorna | Exemplo de saída |
|--------|--------------|-----------------|
| `e.getMessage()` | A mensagem passada ao construtor | `"/ by zero"` |
| `e.getClass().getName()` | Nome completo com pacote | `"java.lang.ArithmeticException"` |
| `e.getClass().getSimpleName()` | Só o nome da classe | `"ArithmeticException"` |
| `e.printStackTrace()` | Stack trace completo no stderr | veja abaixo |
| `e.getCause()` | A exceção que originou esta | útil em exception chaining |

```mermaid
graph LR
    EX["Objeto Exception e"] --> GM["e.getMessage()\n'/ by zero'"]
    EX --> GCN["e.getClass().getName()\n'java.lang.ArithmeticException'"]
    EX --> GCS["e.getClass().getSimpleName()\n'ArithmeticException'"]
    EX --> PT["e.printStackTrace()\nstack trace no stderr"]
    EX --> GC["e.getCause()\nexceção de origem\n(pode ser null)"]

    style EX fill:#1e3a5f,color:#fff
```

```java
try {
    int resultado = 10 / 0;
} catch (ArithmeticException e) {
    e.getMessage();              // "/ by zero"
    e.getClass().getName();      // "java.lang.ArithmeticException"
    e.getClass().getSimpleName();// "ArithmeticException"
    e.printStackTrace();         // imprime stack trace completo no stderr
    
    // Para logar em String (útil para sistemas reais):
    StringWriter sw = new StringWriter();
    e.printStackTrace(new PrintWriter(sw));
    String stackTrace = sw.toString();
}
```

---

## 6. throw — lançando exceções manualmente

```mermaid
flowchart TD
    A["Método recebe chamada"] --> B{"Validar\nargumento"}
    B -- "valor negativo\nou inválido" --> C["throw new\nIllegalArgumentException(msg)"]
    B -- "estado do objeto\ninconsistente" --> D["throw new\nIllegalStateException(msg)"]
    B -- "Argumento nulo" --> E["throw new\nNullPointerException(msg)\nou verificar antes"]
    B -- "✅ Tudo válido" --> F["Executa a\nlógica de negócio"]
    C --> G["Exceção sobe\nao chamador"]
    D --> G
    E --> G
    F --> H["Retorna resultado"]

    style C fill:#92400e,color:#fff
    style D fill:#92400e,color:#fff
    style E fill:#92400e,color:#fff
    style F fill:#14532d,color:#fff
```

```java
public void setIdade(int idade) {
    if (idade < 0 || idade > 150) {
        throw new IllegalArgumentException("Idade inválida: " + idade);
        // IllegalArgumentException é unchecked — não precisa de throws na assinatura
    }
    this.idade = idade;
}

public void lerArquivoCritico(String path) throws IOException {
    if (path == null || path.isBlank()) {
        throw new IllegalArgumentException("Caminho não pode ser nulo ou vazio");
    }
    // IOException é checked — precisa do "throws IOException"
    BufferedReader br = new BufferedReader(new FileReader(path));
    // ...
}
```

> **Quando usar qual?**
>
> | Situação | Exception recomendada |
> |----------|----------------------|
> | Argumento com valor inválido | `IllegalArgumentException` |
> | Objeto em estado inválido para a operação | `IllegalStateException` |
> | Parâmetro que não deveria ser null | `NullPointerException` ou verificar antes |
> | Índice fora do intervalo | `IndexOutOfBoundsException` |
> | Operação não suportada | `UnsupportedOperationException` |

---

## 7. Relação com Encapsulamento

Exceções são a **voz do encapsulamento**. Quando uma invariante de classe é violada, a classe comunica isso através de uma exceção.

```mermaid
sequenceDiagram
    participant C as Chamador
    participant CB as ContaBancaria
    participant JVM as JVM / Runtime

    C->>CB: sacar(valor=200.0)
    CB->>CB: if (valor <= 0) → ok
    CB->>CB: if (valor > saldo) → TRUE (saldo=100)
    CB-->>JVM: throw IllegalStateException("Saldo insuficiente...")
    JVM-->>C: propaga a exceção
    C->>C: catch IllegalStateException
    C->>C: exibe mensagem ao usuário
```

```mermaid
flowchart LR
    subgraph Errado["❌ Sem encapsulamento"]
        E1["Chamador verifica\nif (conta.saldo >= valor)\nantes de chamar"] --> E2["Regra de negócio\nvazou para fora\nda classe"]
    end
    subgraph Certo["✅ Com encapsulamento + exceção"]
        C1["Chamador chama\nconta.sacar(valor)"] --> C2["ContaBancaria\nverifica internamente"]
        C2 -- "inválido" --> C3["throw\nIllegalStateException"]
        C2 -- "válido" --> C4["saldo -= valor"]
    end

    style E2 fill:#7f1d1d,color:#fff
    style C3 fill:#92400e,color:#fff
    style C4 fill:#14532d,color:#fff
```

```java
class ContaBancaria {
    private double saldo;
    private static final double SALDO_MINIMO = 0.0;

    public void sacar(double valor) {
        // Guarda o encapsulamento: a regra de negócio vive AQUI, não no chamador
        if (valor <= 0) {
            throw new IllegalArgumentException("Valor de saque deve ser positivo. Recebido: " + valor);
        }
        if (valor > saldo) {
            throw new IllegalStateException(
                String.format("Saldo insuficiente. Saldo: R$%.2f | Saque solicitado: R$%.2f", saldo, valor)
            );
        }
        saldo -= valor;
    }
}

// No chamador — duas abordagens:
ContaBancaria conta = new ContaBancaria(100.0);

// Abordagem 1: deixar propagar (quando o chamador não sabe como tratar)
conta.sacar(200.0); // IllegalStateException sobe até quem sabe lidar

// Abordagem 2: tratar localmente
try {
    conta.sacar(200.0);
} catch (IllegalStateException e) {
    System.err.println("Operação negada: " + e.getMessage());
} catch (IllegalArgumentException e) {
    System.err.println("Entrada inválida: " + e.getMessage());
}
```

---

## Troubleshooting

O código abaixo tem **4 problemas** relacionados a exceções. Identifique cada um:

```java
public class Processador {

    // problema 1
    public void processar(String entrada) throws Exception {
        if (entrada == null) throw new Exception("Entrada nula");
        System.out.println(entrada.toUpperCase());
    }

    // problema 2
    public double dividir(double a, double b) {
        try {
            return a / b;
        } catch (Exception e) {
            return 0;
        }
    }

    // problema 3
    public void lerDados() {
        try {
            BufferedReader br = new BufferedReader(new FileReader("dados.txt"));
            System.out.println(br.readLine());
        } catch (IOException e) {
            // problema 4
        }
    }
}
```

> **Gabarito:**
> 1. Usar `throws Exception` genérico obriga todos os chamadores a tratar `Exception`, que é amplo demais. Use `throws IllegalArgumentException` (unchecked, nem precisa de throws) ou uma exception específica
> 2. `a / b` com double **não lança** `ArithmeticException` — divide por zero retorna `Infinity`. O try-catch é desnecessário. Divisão inteira (`int a, int b`) sim lança. Além disso, retornar 0 silenciosamente esconde o problema
> 3. `BufferedReader br` não é fechado se houver exceção antes de `readLine()`. Use try-with-resources
> 4. Catch vazio silencia o erro completamente — o código continua como se nada tivesse acontecido. Sempre no mínimo: `e.printStackTrace()` ou `throw new RuntimeException("Falha ao ler dados", e)`

---

## Exercícios

**Exercício 1** — Converta o seguinte código para usar try-with-resources e trate `IOException` adequadamente (não silenciosamente):

```java
Scanner sc = new Scanner(new File("entrada.txt"));
while (sc.hasNextLine()) System.out.println(sc.nextLine());
sc.close();
```

**Exercício 2** — Refatore a classe `ContaBancaria` do Módulo 3 para lançar `IllegalArgumentException` em vez de usar JOptionPane nas validações. Qual abordagem tem melhor separação de responsabilidades?

**Exercício 3** — Crie um método `parseNotaSegura(String input)` que: retorna o double se válido (0–10), lança `NumberFormatException` (já existe no Java) se não for número, lança `IllegalArgumentException("Nota deve estar entre 0 e 10")` se fora do range.

**Exercício 4** — Identifique quais das exceções a seguir são checked e quais são unchecked, e quando cada uma seria lançada: `FileNotFoundException`, `NullPointerException`, `SQLException`, `IndexOutOfBoundsException`, `ClassNotFoundException`, `ArithmeticException`.

**Exercício 5** — Implemente um parser de arquivo CSV simples que usa multi-catch para tratar `IOException` (arquivo não lido) e `NumberFormatException` (valor não é número) com mensagens de erro distintas.

> **Gabarito:**
> Exercício 4:
> - **Checked**: `FileNotFoundException`, `SQLException`, `ClassNotFoundException` — representam condições externas
> - **Unchecked**: `NullPointerException`, `IndexOutOfBoundsException`, `ArithmeticException` — representam bugs de programação
