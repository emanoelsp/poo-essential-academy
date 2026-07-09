# ⚔️ Desafio do Módulo 3 — JOptionPane + Encapsulamento

> **Desafio Gamificado · 160 XP · até 160 POO Coins**

Módulo 3 cobriu encapsulamento, modificadores de acesso e invariantes de classe. Agora você vai criar sistemas onde a proteção dos dados é a protagonista — qualquer violação de regra de negócio deve ser detectada, rejeitada e comunicada ao usuário via JOptionPane.

---

## Task 1 — Conta Bancária com Invariantes · 25 Coins · Básico

Crie uma `ContaBancaria` que protege o saldo e exibe erros via `showMessageDialog`.

**Requisitos:**
- Atributo `saldo` privado, nunca acessível diretamente
- `depositar(double)`: rejeitar valores ≤ 0 com `WARNING_MESSAGE`
- `sacar(double)`: rejeitar se saldo insuficiente com `ERROR_MESSAGE`
- `getSaldo()` retorna saldo formatado como String "R$ x,xx"
- Menu JOptionPane: Depositar / Sacar / Ver Saldo / Sair

```java
import javax.swing.JOptionPane;

class ContaBancaria {
    private double saldo;

    ContaBancaria(double saldoInicial) {
        // TODO: validar saldoInicial >= 0
        this.saldo = saldoInicial;
    }

    void depositar(double valor) {
        // TODO: rejeitar <= 0 com showMessageDialog(WARNING)
        // TODO: saldo += valor
    }

    void sacar(double valor) {
        // TODO: rejeitar <= 0 com showMessageDialog(WARNING)
        // TODO: rejeitar valor > saldo com showMessageDialog(ERROR)
        // TODO: saldo -= valor
    }

    String getSaldoFormatado() {
        return String.format("R$ %.2f", saldo);
    }
}

public class Main {
    public static void main(String[] args) {
        ContaBancaria conta = new ContaBancaria(100.0);
        // TODO: loop de menu com as 4 opções
    }
}
```

> **Dica:** O `showMessageDialog(WARNING)` e `ERROR_MESSAGE` são usados DENTRO dos métodos da classe — não no main. Isso mantém a lógica de validação encapsulada com a classe, não espalhada pelo código cliente.

---

## Task 2 — Produto com Preço Protegido · 35 Coins · Intermediário

Crie um `Produto` onde o preço nunca pode ser negativo e o desconto tem limite.

**Requisitos:**
- Atributos privados: `nome`, `preco`, `desconto` (%)
- `setPreco(double)`: rejeitar valores ≤ 0 (aviso via JOptionPane)
- `setDesconto(double)`: rejeitar > 50% (aviso: "Desconto máximo é 50%")
- `getPrecoFinal()`: retorna `preco * (1 - desconto/100)`
- CRUD básico via JOptionPane: "Novo Produto", "Alterar Preço", "Aplicar Desconto", "Ver Ficha", "Sair"

```java
import javax.swing.JOptionPane;

class Produto {
    private String nome;
    private double preco;
    private double desconto; // percentual 0-50

    Produto(String nome, double preco) {
        this.nome = nome;
        setPreco(preco);
        this.desconto = 0;
    }

    void setPreco(double novoPreco) {
        // TODO: validar e atribuir com aviso JOptionPane se inválido
    }

    void setDesconto(double pct) {
        // TODO: validar 0 <= pct <= 50 com aviso JOptionPane
        // TODO: atribuir
    }

    double getPrecoFinal() {
        // TODO: calcular
        return 0;
    }

    String fichaHtml() {
        // TODO: retornar HTML com nome, preço original, desconto e preço final
        return "";
    }
}

public class GerenciadorProdutos {
    public static void main(String[] args) {
        // TODO: criar produto e loop de menu
    }
}
```

---

## Task 3 — Sistema de Senha com Tentativas Limitadas · 45 Coins · Avançado

Crie um `SistemaAutenticacao` com encapsulamento completo e bloqueio por tentativas.

**Requisitos:**
- Senha armazenada como hash (`String.valueOf(senha.hashCode())`) — nunca exposta
- Máximo de 3 tentativas antes do bloqueio (`bloqueado = true`)
- Após bloqueio, todas as operações retornam `ERROR_MESSAGE` "Sistema bloqueado"
- Método `redefinirSenha(String senhaAtual, String novaSenha)`: só funciona com senha correta
- Contar tentativas corretas/erradas e exibir estatística ao final

```java
import javax.swing.JOptionPane;

class SistemaAutenticacao {
    private String senhaHash;
    private int tentativasRestantes;
    private boolean bloqueado;
    private String usuario;

    SistemaAutenticacao(String usuario, String senhaInicial) {
        this.usuario = usuario;
        this.senhaHash = hashear(senhaInicial);
        this.tentativasRestantes = 3;
        this.bloqueado = false;
    }

    private String hashear(String senha) {
        return String.valueOf(senha.hashCode());
    }

    boolean autenticar(String senha) {
        // TODO: verificar bloqueio antes de tudo
        // TODO: comparar hash
        // TODO: decrementar tentativas e bloquear quando chegar a 0
        // TODO: retornar true/false
        return false;
    }

    boolean redefinirSenha(String senhaAtual, String novaSenha) {
        // TODO: autenticar primeiro, depois trocar hash
        return false;
    }

    String statusHtml() {
        // TODO: retornar HTML com usuario, tentativas restantes, status (ativo/bloqueado)
        return "";
    }
}

public class AppLogin {
    public static void main(String[] args) {
        SistemaAutenticacao auth = new SistemaAutenticacao("admin", "1234");
        // TODO: loop — "Login", "Redefinir Senha", "Status", "Sair"
    }
}
```

> **Dica:** Nunca armazene a senha em texto simples — use sempre o hash. Compare `hashear(senhaDigitada).equals(senhaHash)` e se tentar usar `==` vai sempre ser false mesmo com a senha certa.

---

## Task 4 — Mini Estoque com Invariante de Mínimo · 55 Coins · Expert

Crie um sistema de estoque onde a quantidade nunca pode cair abaixo de um mínimo configurado.

**Requisitos:**
- Classe `ItemEstoque` com `nome`, `quantidade`, `quantidadeMinima`, `preco`
- `retirar(int qtd)`: rejeitar se `quantidade - qtd < quantidadeMinima` com aviso específico: "Não é possível retirar X unidades. Mínimo de segurança: Y"
- `adicionar(int qtd)`: validar quantidade positiva
- `precisaReposicao()`: retorna true se `quantidade <= quantidadeMinima * 1.5`
- Menu completo: "Adicionar ao Estoque", "Retirar do Estoque", "Ver Status", "Relatório", "Sair"
- "Relatório" exibe todos os itens do estoque com alerta visual em vermelho para itens abaixo do mínimo

```java
import javax.swing.JOptionPane;
import java.util.ArrayList;

class ItemEstoque {
    private String nome;
    private int quantidade;
    private int quantidadeMinima;
    private double preco;

    ItemEstoque(String nome, int qtdInicial, int qtdMinima, double preco) {
        if (qtdInicial < qtdMinima)
            throw new IllegalArgumentException("Quantidade inicial abaixo do mínimo de segurança!");
        this.nome = nome; this.quantidade = qtdInicial;
        this.quantidadeMinima = qtdMinima; this.preco = preco;
    }

    void adicionar(int qtd) {
        // TODO: validar qtd > 0
        // TODO: quantidade += qtd
    }

    void retirar(int qtd) {
        // TODO: verificar se quantidade - qtd >= quantidadeMinima
        // TODO: showMessageDialog(WARNING) com mensagem específica se não puder retirar
        // TODO: quantidade -= qtd
    }

    boolean precisaReposicao() {
        // TODO: retornar true se quantidade <= quantidadeMinima * 1.5
        return false;
    }

    String statusHtml() {
        // TODO: retornar HTML com nome, qtd, mínimo, preço unitário, valor total em estoque
        // Use cor vermelha se precisaReposicao() for true
        return "";
    }

    @Override
    public String toString() {
        return nome + " (qtd: " + quantidade + ", mín: " + quantidadeMinima + ")";
    }
}

public class SistemaEstoque {
    static ArrayList<ItemEstoque> estoque = new ArrayList<>();
    static ItemEstoque itemAtual = null;

    public static void main(String[] args) {
        // Estoque pré-populado para testar
        estoque.add(new ItemEstoque("Caneta Azul",    50, 10, 1.50));
        estoque.add(new ItemEstoque("Papel A4 (500)", 20, 5,  25.00));
        estoque.add(new ItemEstoque("Toner Impressora", 8, 3, 120.00));

        // TODO: menu loop: Selecionar Item, Adicionar, Retirar, Status, Relatório, Sair
    }
}
```

> **Dica:** No relatório, percorra o `ArrayList<ItemEstoque>` e concatene os `statusHtml()` de cada item, destacando em vermelho (`<font color='red'>`) os que precisam de reposição. Inclua o valor total do estoque no final.

> **Gabarito esperado:**
> Método `retirar` completo:
> ```java
> void retirar(int qtd) {
>     if (qtd <= 0) {
>         JOptionPane.showMessageDialog(null, "Quantidade deve ser positiva!", "Erro", JOptionPane.WARNING_MESSAGE);
>         return;
>     }
>     int novaQtd = quantidade - qtd;
>     if (novaQtd < quantidadeMinima) {
>         JOptionPane.showMessageDialog(null,
>             String.format("Não é possível retirar %d unidades de '%s'.\nQuantidade atual: %d | Mínimo de segurança: %d\nMáximo retirada possível: %d",
>                 qtd, nome, quantidade, quantidadeMinima, quantidade - quantidadeMinima),
>             "Restrição de Estoque", JOptionPane.WARNING_MESSAGE);
>         return;
>     }
>     quantidade = novaQtd;
>     JOptionPane.showMessageDialog(null,
>         String.format("Retirada de %d unidades. Saldo: %d", qtd, quantidade),
>         "OK", JOptionPane.INFORMATION_MESSAGE);
> }
> ```
