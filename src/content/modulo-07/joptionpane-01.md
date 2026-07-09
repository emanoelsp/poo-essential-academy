# JOptionPane — Do Console à Interface Gráfica

> **Módulo Bônus · Conteúdo Extra · 80 XP**

O `JOptionPane` é a forma mais simples de criar interfaces gráficas em Java puro — sem frameworks, sem dependências, sem configuração. Com ele você substitui o `Scanner` e o `System.out.println` por caixas de diálogo profissionais que rodam em qualquer JVM com suporte gráfico.

---

## O que é JOptionPane?

`JOptionPane` é uma classe da biblioteca **Swing** (`javax.swing`) que oferece caixas de diálogo pré-prontas para os 4 casos mais comuns:

| Método | Finalidade | Retorna |
|---|---|---|
| `showMessageDialog` | Exibir uma mensagem | `void` |
| `showInputDialog` | Capturar texto do usuário | `String` (ou `null`) |
| `showConfirmDialog` | Perguntar Sim/Não/Cancelar | `int` (constante) |
| `showOptionDialog` | Botões personalizados | `int` (índice) |

**Import necessário:**

```java
import javax.swing.JOptionPane;
```

---

## 1. showMessageDialog — Exibir Mensagens

Substitui o `System.out.println` por uma janela gráfica.

```java
// Sintaxe completa:
// JOptionPane.showMessageDialog(parent, message, title, messageType)

// Mais simples (parent null = centralizado na tela)
JOptionPane.showMessageDialog(null, "Olá, Mundo!");

// Com título e ícone de informação
JOptionPane.showMessageDialog(
    null,
    "Bem-vindo ao sistema!",
    "POO Academy",
    JOptionPane.INFORMATION_MESSAGE
);

// Com ícone de aviso
JOptionPane.showMessageDialog(
    null,
    "Saldo insuficiente!",
    "Erro",
    JOptionPane.WARNING_MESSAGE
);

// Com ícone de erro
JOptionPane.showMessageDialog(
    null,
    "Arquivo não encontrado.",
    "Erro crítico",
    JOptionPane.ERROR_MESSAGE
);
```

**Tipos de ícone disponíveis:**

| Constante | Ícone |
|---|---|
| `INFORMATION_MESSAGE` | ℹ️ informação |
| `WARNING_MESSAGE` | ⚠️ aviso |
| `ERROR_MESSAGE` | ❌ erro |
| `QUESTION_MESSAGE` | ❓ pergunta |
| `PLAIN_MESSAGE` | sem ícone |

---

## 2. showInputDialog — Capturar Entrada

Substitui o `Scanner.nextLine()` — abre uma janela com campo de texto.

```java
// Forma simples — retorna String ou null (se cancelou)
String nome = JOptionPane.showInputDialog("Qual é o seu nome?");

// Forma completa — com título e tipo de mensagem
String idadeStr = JOptionPane.showInputDialog(
    null,
    "Digite sua idade:",
    "Cadastro",
    JOptionPane.QUESTION_MESSAGE
);
```

> **Atenção:** `showInputDialog` retorna `null` se o usuário clicar em Cancelar. Sempre verifique antes de usar a String!

```java
String nomeStr = JOptionPane.showInputDialog("Digite seu nome:");

// Verificação defensiva OBRIGATÓRIA
if (nomeStr == null) {
    JOptionPane.showMessageDialog(null, "Operação cancelada.");
    return; // ou System.exit(0)
}

// Verificar também string vazia
if (nomeStr.trim().isEmpty()) {
    JOptionPane.showMessageDialog(null, "Nome não pode ser vazio!", "Erro", JOptionPane.WARNING_MESSAGE);
    return;
}

System.out.println("Nome: " + nomeStr);
```

---

## 3. Convertendo Tipos

O `showInputDialog` sempre retorna `String`. Para trabalhar com números, converta explicitamente:

```java
// String → int
String idadeStr = JOptionPane.showInputDialog("Digite sua idade:");
int idade = Integer.parseInt(idadeStr);

// String → double
String salarioStr = JOptionPane.showInputDialog("Digite o salário:");
double salario = Double.parseDouble(salarioStr);

// Protegendo contra NumberFormatException
try {
    String notaStr = JOptionPane.showInputDialog("Digite a nota (0-10):");
    double nota = Double.parseDouble(notaStr);

    if (nota < 0 || nota > 10) {
        JOptionPane.showMessageDialog(null, "Nota inválida!", "Erro", JOptionPane.ERROR_MESSAGE);
    } else {
        JOptionPane.showMessageDialog(null, "Nota registrada: " + nota);
    }
} catch (NumberFormatException e) {
    JOptionPane.showMessageDialog(null, "Digite apenas números!", "Formato inválido", JOptionPane.ERROR_MESSAGE);
} catch (NullPointerException e) {
    // usuário clicou em Cancelar
    JOptionPane.showMessageDialog(null, "Operação cancelada.");
}
```

---

## 4. showConfirmDialog — Sim / Não / Cancelar

```java
// Retorna: JOptionPane.YES_OPTION (0), NO_OPTION (1), CANCEL_OPTION (2), CLOSED_OPTION (-1)
int resposta = JOptionPane.showConfirmDialog(
    null,
    "Deseja salvar as alterações?",
    "Confirmar",
    JOptionPane.YES_NO_CANCEL_OPTION
);

if (resposta == JOptionPane.YES_OPTION) {
    System.out.println("Salvando...");
} else if (resposta == JOptionPane.NO_OPTION) {
    System.out.println("Descartando alterações.");
} else {
    System.out.println("Operação cancelada.");
}
```

**Opções de botões:**

| Constante | Botões exibidos |
|---|---|
| `YES_NO_OPTION` | Sim / Não |
| `YES_NO_CANCEL_OPTION` | Sim / Não / Cancelar |
| `OK_CANCEL_OPTION` | OK / Cancelar |

---

## 5. showOptionDialog — Botões Personalizados

Quando você precisa de mais de 3 opções ou quer textos específicos nos botões:

```java
String[] opcoes = {"Horista", "Assalariado", "Comissionado", "Cancelar"};

int escolha = JOptionPane.showOptionDialog(
    null,
    "Selecione o tipo de funcionário:",
    "Tipo de Funcionário",
    JOptionPane.DEFAULT_OPTION,
    JOptionPane.QUESTION_MESSAGE,
    null,       // ícone personalizado (null = padrão)
    opcoes,     // array de botões
    opcoes[0]   // botão padrão (pré-selecionado)
);

switch (escolha) {
    case 0 -> System.out.println("Criando Horista...");
    case 1 -> System.out.println("Criando Assalariado...");
    case 2 -> System.out.println("Criando Comissionado...");
    default -> System.out.println("Operação cancelada.");
}
```

---

## 6. Formatando Saída com HTML

O JOptionPane aceita HTML simples nas mensagens — ótimo para formatar resultados:

```java
double salario = 4500.0;
String nome    = "Ana Silva";
String cargo   = "Engenheira";

String mensagem = String.format(
    "<html><b>Ficha do Funcionário</b><br>" +
    "<hr>" +
    "Nome: <b>%s</b><br>" +
    "Cargo: %s<br>" +
    "Salário: <b>R$ %.2f</b></html>",
    nome, cargo, salario
);

JOptionPane.showMessageDialog(null, mensagem, "Resultado", JOptionPane.INFORMATION_MESSAGE);
```

---

## 7. Exemplo Completo — Calculadora com JOptionPane

Veja como a calculadora do módulo 1 fica com interface gráfica:

```java
import javax.swing.JOptionPane;

public class CalculadoraGUI {

    public static void main(String[] args) {
        while (true) {
            // Menu principal com botões personalizados
            String[] ops = {"+", "-", "×", "÷", "Sair"};
            int operacao = JOptionPane.showOptionDialog(
                null,
                "Escolha a operação:",
                "Calculadora POO",
                JOptionPane.DEFAULT_OPTION,
                JOptionPane.QUESTION_MESSAGE,
                null, ops, ops[0]
            );

            if (operacao == 4 || operacao == JOptionPane.CLOSED_OPTION) break;

            try {
                String aStr = JOptionPane.showInputDialog(null, "Primeiro número:", "Entrada", JOptionPane.QUESTION_MESSAGE);
                if (aStr == null) continue;
                double a = Double.parseDouble(aStr);

                String bStr = JOptionPane.showInputDialog(null, "Segundo número:", "Entrada", JOptionPane.QUESTION_MESSAGE);
                if (bStr == null) continue;
                double b = Double.parseDouble(bStr);

                double resultado = calcular(a, b, operacao);

                // Exibir resultado formatado com HTML
                String simbolo = ops[operacao];
                JOptionPane.showMessageDialog(
                    null,
                    String.format("<html><font size=5><b>%.2f %s %.2f = <font color=blue>%.2f</font></b></font></html>",
                                  a, simbolo, b, resultado),
                    "Resultado",
                    JOptionPane.INFORMATION_MESSAGE
                );

            } catch (NumberFormatException e) {
                JOptionPane.showMessageDialog(null, "Entrada inválida! Use apenas números.", "Erro", JOptionPane.ERROR_MESSAGE);
            } catch (ArithmeticException e) {
                JOptionPane.showMessageDialog(null, e.getMessage(), "Erro Matemático", JOptionPane.ERROR_MESSAGE);
            }
        }
    }

    static double calcular(double a, double b, int operacao) {
        return switch (operacao) {
            case 0 -> a + b;
            case 1 -> a - b;
            case 2 -> a * b;
            case 3 -> {
                if (b == 0) throw new ArithmeticException("Divisão por zero não é permitida.");
                yield a / b;
            }
            default -> throw new IllegalArgumentException("Operação inválida");
        };
    }
}
```

---

## 8. JOptionPane + Classes e Objetos

Veja como integrar JOptionPane num sistema orientado a objetos:

```java
import javax.swing.JOptionPane;

class Produto {
    private String nome;
    private double preco;
    private int estoque;

    Produto(String nome, double preco, int estoque) {
        if (nome == null || nome.isBlank())  throw new IllegalArgumentException("Nome inválido");
        if (preco <= 0)                       throw new IllegalArgumentException("Preço deve ser positivo");
        if (estoque < 0)                      throw new IllegalArgumentException("Estoque não pode ser negativo");
        this.nome = nome; this.preco = preco; this.estoque = estoque;
    }

    // Factory method que usa JOptionPane para coletar dados
    static Produto criarViaDialogo() {
        String nome = JOptionPane.showInputDialog(null, "Nome do produto:", "Novo Produto", JOptionPane.QUESTION_MESSAGE);
        if (nome == null) return null;

        String precoStr = JOptionPane.showInputDialog(null, "Preço (R$):", "Novo Produto", JOptionPane.QUESTION_MESSAGE);
        if (precoStr == null) return null;

        String estoqueStr = JOptionPane.showInputDialog(null, "Quantidade em estoque:", "Novo Produto", JOptionPane.QUESTION_MESSAGE);
        if (estoqueStr == null) return null;

        try {
            return new Produto(nome, Double.parseDouble(precoStr), Integer.parseInt(estoqueStr));
        } catch (NumberFormatException e) {
            JOptionPane.showMessageDialog(null, "Valor inválido!", "Erro", JOptionPane.ERROR_MESSAGE);
            return null;
        }
    }

    void exibirDetalhes() {
        JOptionPane.showMessageDialog(null,
            String.format("<html><b>Produto:</b> %s<br><b>Preço:</b> R$ %.2f<br><b>Estoque:</b> %d unidades</html>",
                nome, preco, estoque),
            "Detalhes do Produto",
            JOptionPane.INFORMATION_MESSAGE
        );
    }

    @Override
    public String toString() {
        return String.format("%s (R$ %.2f) — %d un.", nome, preco, estoque);
    }
}

public class Main {
    public static void main(String[] args) {
        Produto p = Produto.criarViaDialogo();
        if (p != null) p.exibirDetalhes();
    }
}
```

---

## 9. Padrão de Loop com Menu

O padrão mais comum em sistemas com JOptionPane é o loop de menu:

```java
import javax.swing.JOptionPane;

public class SistemaMenu {
    public static void main(String[] args) {
        while (true) {
            String[] opcoes = {"1. Cadastrar", "2. Listar", "3. Buscar", "4. Sair"};

            int escolha = JOptionPane.showOptionDialog(
                null, "O que deseja fazer?", "Menu Principal",
                JOptionPane.DEFAULT_OPTION, JOptionPane.QUESTION_MESSAGE,
                null, opcoes, opcoes[0]
            );

            switch (escolha) {
                case 0 -> cadastrar();
                case 1 -> listar();
                case 2 -> buscar();
                case 3, JOptionPane.CLOSED_OPTION -> {
                    int conf = JOptionPane.showConfirmDialog(
                        null, "Tem certeza que deseja sair?", "Confirmar saída", JOptionPane.YES_NO_OPTION
                    );
                    if (conf == JOptionPane.YES_OPTION) {
                        JOptionPane.showMessageDialog(null, "Até logo!", "Encerrado", JOptionPane.INFORMATION_MESSAGE);
                        System.exit(0);
                    }
                }
            }
        }
    }

    static void cadastrar() { JOptionPane.showMessageDialog(null, "Implementar cadastro..."); }
    static void listar()    { JOptionPane.showMessageDialog(null, "Implementar listagem..."); }
    static void buscar()    { JOptionPane.showMessageDialog(null, "Implementar busca..."); }
}
```

---

## 10. Console vs JOptionPane — Comparação

| Operação | Console (Scanner) | JOptionPane |
|---|---|---|
| Ler String | `scanner.nextLine()` | `showInputDialog(...)` |
| Ler int | `Integer.parseInt(scanner.nextLine())` | `Integer.parseInt(showInputDialog(...))` |
| Exibir mensagem | `System.out.println(...)` | `showMessageDialog(...)` |
| Confirmar ação | Não existe padrão | `showConfirmDialog(...)` |
| Menu de opções | `if/else` ou `switch` com `scanner` | `showOptionDialog(...)` |
| Erro/Aviso | `System.err.println(...)` | `showMessageDialog(..., ERROR_MESSAGE)` |

---

## Exercícios

**Exercício 1** — Adapte o seguinte código de console para usar JOptionPane:

```java
Scanner sc = new Scanner(System.in);
System.out.print("Nome: ");
String nome = sc.nextLine();
System.out.print("Nota 1: ");
double n1 = sc.nextDouble();
System.out.print("Nota 2: ");
double n2 = sc.nextDouble();
double media = (n1 + n2) / 2;
System.out.println("Média de " + nome + ": " + media);
System.out.println(media >= 7 ? "Aprovado!" : "Recuperação.");
```

> **Dica:** Use `showInputDialog` para cada campo e `showMessageDialog` com HTML para exibir o resultado formatado.

**Exercício 2** — Crie uma classe `Aluno` com `nome`, `matricula` e lista de notas. Use JOptionPane para:
1. Cadastrar um aluno (nome + matrícula)
2. Adicionar até 4 notas via loop com showInputDialog
3. Calcular e exibir a média com aprovação/reprovação em cores (HTML)

**Exercício 3** — Menu de cadastro de produtos usando o padrão de loop do item 9.

**Exercício 4** — Reimplemente o sistema bancário do Módulo 3 com JOptionPane.

**Exercício 5** — Crie um menu polimórfico com `showOptionDialog` para selecionar tipo de funcionário e calcular salário (use a hierarquia do Módulo 4).

**Exercício 6** — Jogo da memória numérica: gere 5 números aleatórios, exiba-os por 3 segundos (`Thread.sleep(3000)`), feche e peça para o usuário digitá-los um a um.

> **Dica:** Use `JOptionPane.showMessageDialog` para exibir os números e depois `showInputDialog` para cada resposta.

> **Gabarito:**
> Exercício 1 completo:
> ```java
> String nome = JOptionPane.showInputDialog("Nome:");
> double n1 = Double.parseDouble(JOptionPane.showInputDialog("Nota 1:"));
> double n2 = Double.parseDouble(JOptionPane.showInputDialog("Nota 2:"));
> double media = (n1 + n2) / 2;
> String cor = media >= 7 ? "green" : "red";
> String status = media >= 7 ? "✅ Aprovado!" : "⚠️ Recuperação";
> JOptionPane.showMessageDialog(null,
>     String.format("<html><b>%s</b><br>Média: <font color=%s><b>%.1f</b></font><br>%s</html>",
>         nome, cor, media, status),
>     "Resultado", JOptionPane.INFORMATION_MESSAGE);
> ```
