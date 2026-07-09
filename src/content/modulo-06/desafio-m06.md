# ⚔️ Desafio Final — JOptionPane + SOLID Completo

> **Desafio Gamificado · 250 XP · até 250 POO Coins**

Este é o desafio mais ambicioso do curso. Você vai aplicar os 5 princípios SOLID com JOptionPane, construindo sistemas que são fáceis de estender, difíceis de quebrar. Complete cada task para provar que está pronto para o mercado de trabalho.

---

## Task 1 — OCP: Sistema de Pagamentos Extensível · 40 Coins · Intermediário

Implemente o **Open/Closed Principle** — adicione o método de pagamento Pix **sem modificar** a classe `ProcessadorPagamentos`.

**O código fornecido (NÃO modifique estas classes):**

```java
// Essas classes estão "fechadas" para modificação
interface MetodoPagamento {
    boolean processar(double valor);
    String getNome();
}

class ProcessadorPagamentos {
    // Esta classe NÃO pode ser modificada — está fechada para modificação
    public String executarPagamento(MetodoPagamento metodo, double valor) {
        boolean sucesso = metodo.processar(valor);
        return String.format("<html>Pagamento via <b>%s</b><br>Valor: R$ %.2f<br>Status: <font color='%s'>%s</font></html>",
            metodo.getNome(), valor, sucesso ? "green" : "red", sucesso ? "✅ Aprovado" : "❌ Recusado");
    }
}
```

**Sua missão:** Implemente os seguintes métodos de pagamento SEM modificar `ProcessadorPagamentos` ou `MetodoPagamento`:

- `PagamentoCartaoCredito`: valida que valor ≤ limite (solicitar via JOptionPane)
- `PagamentoCartaoDebito`: valida saldo suficiente
- `PagamentoPix`: valida chave Pix não vazia e valor > 0; simula delay de 1s (`Thread.sleep(1000)`)
- `PagamentoBoleto`: sempre aprovado, mas avisa que leva 3 dias úteis

```java
import javax.swing.JOptionPane;

// TODO: implementar as 4 classes acima

public class SistemaPagamentos {
    public static void main(String[] args) {
        ProcessadorPagamentos proc = new ProcessadorPagamentos();

        String[] metodos = {"Cartão Crédito", "Cartão Débito", "Pix", "Boleto", "Sair"};
        while (true) {
            int escolha = JOptionPane.showOptionDialog(null, "Método de pagamento:", "Pagamento",
                JOptionPane.DEFAULT_OPTION, JOptionPane.QUESTION_MESSAGE, null, metodos, metodos[0]);

            if (escolha >= 4 || escolha == JOptionPane.CLOSED_OPTION) break;

            try {
                String valorStr = JOptionPane.showInputDialog("Valor (R$):");
                if (valorStr == null) continue;
                double valor = Double.parseDouble(valorStr);

                MetodoPagamento metodo = criarMetodo(escolha);
                if (metodo == null) continue;

                String resultado = proc.executarPagamento(metodo, valor);
                JOptionPane.showMessageDialog(null, resultado, "Resultado", JOptionPane.INFORMATION_MESSAGE);

            } catch (NumberFormatException e) {
                JOptionPane.showMessageDialog(null, "Valor inválido!", "Erro", JOptionPane.ERROR_MESSAGE);
            }
        }
    }

    static MetodoPagamento criarMetodo(int tipo) {
        return switch (tipo) {
            case 0 -> {
                String limStr = JOptionPane.showInputDialog("Limite do cartão:");
                if (limStr == null) yield null;
                yield new PagamentoCartaoCredito(Double.parseDouble(limStr));
            }
            // TODO: cases 1, 2, 3
            default -> null;
        };
    }
}
```

---

## Task 2 — SRP + DIP: Folha de Pagamento Desacoplada · 55 Coins · Avançado

Refatore um sistema de folha de pagamento aplicando **SRP** (cada classe tem uma responsabilidade) e **DIP** (depender de abstrações, não implementações).

**O código inicial violando SRP e DIP:**

```java
// VIOLAÇÃO: uma classe fazendo tudo
class FolhaPagamento {
    void calcular() { /* cálculo de salário */ }
    void salvarEmArquivo() { /* persistência */ }
    void enviarEmail() { /* notificação */ }
    void gerarRelatorioExcel() { /* relatório */ }
    void calcularImposto() { /* fiscal */ }
}
```

**Sua missão:** Reestruture aplicando SRP e DIP:

```java
import javax.swing.JOptionPane;
import java.util.ArrayList;

// Abstrações (DIP — dependa destas, não das implementações)
interface CalculadorSalario   { double calcular(Funcionario f); }
interface Persistencia         { void salvar(Funcionario f); }
interface Notificador          { void notificar(Funcionario f, double salario); }
interface GeradorRelatorio     { String gerar(ArrayList<Funcionario> lista); }

// TODO: implementar Funcionario com campos básicos

// Implementações concretas
class CalculadorCLT implements CalculadorSalario {
    // TODO: calcula salário CLT (salário base - INSS 11% - IR 7.5%)
    @Override public double calcular(Funcionario f) { return 0; }
}

class NotificadorJOptionPane implements Notificador {
    @Override
    public void notificar(Funcionario f, double salario) {
        // TODO: showMessageDialog com holerite do funcionário
    }
}

class RelatorioSimples implements GeradorRelatorio {
    @Override
    public String gerar(ArrayList<Funcionario> lista) {
        // TODO: HTML com tabela de todos os funcionários e total da folha
        return "";
    }
}

class PersistenciaMemoria implements Persistencia {
    private ArrayList<Funcionario> base = new ArrayList<>();
    @Override public void salvar(Funcionario f) { base.add(f); }
    public ArrayList<Funcionario> getTodos() { return base; }
}

// Orquestrador — depende só de INTERFACES (DIP aplicado)
class ProcessadorFolha {
    private final CalculadorSalario calculador;
    private final Persistencia persistencia;
    private final Notificador notificador;
    private final GeradorRelatorio relatorio;

    ProcessadorFolha(CalculadorSalario calc, Persistencia pers, Notificador notif, GeradorRelatorio rel) {
        this.calculador = calc; this.persistencia = pers;
        this.notificador = notif; this.relatorio = rel;
    }

    void processarFuncionario(Funcionario f) {
        double salario = calculador.calcular(f);
        persistencia.salvar(f);
        notificador.notificar(f, salario);
    }

    void gerarRelatorioCompleto(ArrayList<Funcionario> lista) {
        String html = relatorio.gerar(lista);
        JOptionPane.showMessageDialog(null, html, "Relatório da Folha", JOptionPane.INFORMATION_MESSAGE);
    }
}

public class SistemaFolhaDIP {
    public static void main(String[] args) {
        PersistenciaMemoria bd = new PersistenciaMemoria();
        ProcessadorFolha proc = new ProcessadorFolha(
            new CalculadorCLT(),
            bd,
            new NotificadorJOptionPane(),
            new RelatorioSimples()
        );

        // TODO: menu — Adicionar Funcionário, Ver Relatório, Sair
    }
}
```

> **Por que isso é DIP?** `ProcessadorFolha` não conhece `CalculadorCLT`, `PersistenciaMemoria` ou `NotificadorJOptionPane` — conhece só as interfaces. Para mudar de CLT para PJ, trocar de memória para banco de dados, ou de JOptionPane para email: basta passar uma nova implementação no construtor.

---

## Task 3 — SOLID Audit: Identificar e Refatorar Violações · 70 Coins · Avançado

Você vai receber um código com 3 violações SOLID identificadas. Sua missão: refatorar cada uma justificando sua solução.

**Código original com violações (identifique e corrija):**

```java
// Código problemático — encontre e corrija as violações SOLID
import javax.swing.JOptionPane;
import java.util.ArrayList;

// ❌ Violação 1: qual princípio?
class Gerente {
    String nome;
    ArrayList<String> funcionarios = new ArrayList<>();

    void adicionarFuncionario(String nome) { funcionarios.add(nome); }
    void removerFuncionario(String nome) { funcionarios.remove(nome); }

    // Por que esta linha viola SOLID?
    void salvarNoArquivo(String caminho) {
        // simulação de persistência
        JOptionPane.showMessageDialog(null, "Salvando em " + caminho + "...");
    }

    void enviarEmail(String destinatario) {
        // simulação de envio de email
        JOptionPane.showMessageDialog(null, "Email enviado para " + destinatario);
    }
}

// ❌ Violação 2: qual princípio?
class Quadrado extends Retangulo {
    Quadrado(double lado) { super(lado, lado); }

    @Override
    public void setLargura(double l) { super.setAltura(l); super.setLargura(l); }

    @Override
    public void setAltura(double a) { super.setAltura(a); super.setLargura(a); }
}

class Retangulo {
    protected double largura;
    protected double altura;

    Retangulo(double largura, double altura) {
        this.largura = largura; this.altura = altura;
    }

    public void setLargura(double l) { this.largura = l; }
    public void setAltura(double a) { this.altura = a; }
    public double getArea() { return largura * altura; }
}

// Código que usa o Retangulo — quebra com Quadrado:
class CalculadorArea {
    void calcular(Retangulo r) {
        r.setLargura(5);
        r.setAltura(10);
        // Espera: 50. Com Quadrado, obtém: 100. LSP violado!
        JOptionPane.showMessageDialog(null, "Área: " + r.getArea());
    }
}

// ❌ Violação 3: qual princípio?
interface IGerenciador {
    void salvar();
    void deletar();
    void buscar();
    void exportarParaPDF();
    void exportarParaExcel();
    void enviarEmail();
    void gerarAuditoria();
}

// Implementação forçada a implementar tudo — mesmo o que não usa:
class GerenciadorSimples implements IGerenciador {
    @Override public void salvar() { /* ok */ }
    @Override public void deletar() { /* ok */ }
    @Override public void buscar() { /* ok */ }
    @Override public void exportarParaPDF() { throw new UnsupportedOperationException("Não suportado!"); }
    @Override public void exportarParaExcel() { throw new UnsupportedOperationException("Não suportado!"); }
    @Override public void enviarEmail() { throw new UnsupportedOperationException("Não suportado!"); }
    @Override public void gerarAuditoria() { throw new UnsupportedOperationException("Não suportado!"); }
}
```

**Suas respostas:**
1. Violação 1 é do princípio ___ porque ___. Correção: ___
2. Violação 2 é do princípio ___ porque ___. Correção: ___
3. Violação 3 é do princípio ___ porque ___. Correção: ___

Implemente as 3 versões corrigidas com JOptionPane para demonstrar que funcionam.

> **Gabarito esperado:**
> 1. **SRP** — `Gerente` faz gerenciamento, persistência E notificação. Corrigir: extrair `PersistenciaGerente` e `NotificadorGerente`
> 2. **LSP** — `Quadrado extends Retangulo` quebra o contrato da classe base. Corrigir: ambos implementam interface `Forma` (não herança)
> 3. **ISP** — `IGerenciador` é uma "fat interface". Corrigir: separar em `Persistivel`, `Exportavel`, `Notificavel`, `Auditavel`

---

## Task 4 — Projeto Livre SOLID + JOptionPane · 85 Coins · Expert

Crie um **sistema original** que demonstre todos os 5 princípios SOLID com JOptionPane.

**Requisitos obrigatórios:**
- Pelo menos 8 classes/interfaces
- Cada um dos 5 princípios SOLID aplicado e identificável
- JOptionPane para toda entrada e saída
- Pelo menos um padrão de design (Strategy, Template Method, Factory, Observer...)
- Relatório final exibido com HTML formatado

**Sugestões de domínio:**
- Sistema de biblioteca (livros, empréstimos, relatórios)
- Loja virtual (produtos, carrinho, pagamentos, notificações)
- Clínica médica (pacientes, consultas, receitas, convênios)
- Escola (alunos, professores, notas, boletins, relatórios)

**Entrega mínima esperada:**

```
📁 Seu sistema deve ter:
├── interfaces/
│   ├── (abstração principal)
│   ├── (contrato de persistência — DIP)
│   └── (contratos menores segregados — ISP)
├── modelos/
│   └── (classes de domínio — SRP, uma responsabilidade cada)
├── servicos/
│   ├── (implementação concreta de alguma interface — OCP: extensível)
│   └── (herança correta sem violar LSP)
└── Main.java (menu JOptionPane orquestrando tudo)
```

Ao concluir, execute seu programa e documente num comentário ao topo do `Main.java`:
```java
/*
 * SOLID aplicado:
 * SRP: [explique onde e como]
 * OCP: [explique onde e como]
 * LSP: [explique onde e como]
 * ISP: [explique onde e como]
 * DIP: [explique onde e como]
 * Padrão de design: [qual e onde]
 */
```

> **Dica:** Comece pelo domínio (o que o sistema gerencia), depois defina as interfaces (o que cada parte precisa fazer), depois implemente. Nunca comece pela implementação — você vai acabar sem SOLID.
