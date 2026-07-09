# ⚔️ Desafio do Módulo 4 — JOptionPane + Herança

> **Desafio Gamificado · 180 XP · até 180 POO Coins**

O Módulo 4 explorou generalização, especialização e classes abstratas. Neste desafio, você vai construir hierarquias reais onde o menu JOptionPane permite ao usuário escolher qual tipo de objeto instanciar — o polimorfismo já começa aqui.

---

## Task 1 — Menu de Seleção de Funcionário · 25 Coins · Básico

Use `showOptionDialog` para criar diferentes tipos de `Funcionario` e exibir sua ficha.

**Requisitos:**
- Classe abstrata `Funcionario` com `nome`, `id`, método abstrato `calcularSalario()`
- Subclasses: `Horista` (horas × valorHora), `Assalariado` (salario fixo), `Comissionado` (salarioBase + vendas × taxa)
- `fichaHtml()` comum na classe base: exibe nome, id, tipo (getClass().getSimpleName()) e salário calculado
- Menu JOptionPane com opções de tipo → captura dados específicos → exibe ficha

```java
import javax.swing.JOptionPane;

abstract class Funcionario {
    protected String nome;
    protected String id;

    Funcionario(String nome, String id) {
        this.nome = nome; this.id = id;
    }

    abstract double calcularSalario();

    String fichaHtml() {
        return String.format(
            "<html><b>Funcionário</b><br>Nome: %s<br>ID: %s<br>Tipo: %s<br>Salário: <b>R$ %.2f</b></html>",
            nome, id, getClass().getSimpleName(), calcularSalario()
        );
    }
}

class Horista extends Funcionario {
    private int horas;
    private double valorHora;

    Horista(String nome, String id, int horas, double valorHora) {
        super(nome, id);
        this.horas = horas; this.valorHora = valorHora;
    }

    @Override
    public double calcularSalario() {
        // TODO: retornar horas * valorHora
        return 0;
    }
}

// TODO: implementar Assalariado e Comissionado

public class SistemaFuncionarios {
    public static void main(String[] args) {
        String[] tipos = {"Horista", "Assalariado", "Comissionado", "Sair"};
        while (true) {
            int escolha = JOptionPane.showOptionDialog(null, "Tipo de funcionário:", "Novo Funcionário",
                JOptionPane.DEFAULT_OPTION, JOptionPane.QUESTION_MESSAGE, null, tipos, tipos[0]);

            if (escolha >= 3 || escolha == JOptionPane.CLOSED_OPTION) break;

            // TODO: capturar nome e id (comuns)
            // TODO: capturar dados específicos por tipo
            // TODO: criar objeto do tipo correto e exibir fichaHtml()
        }
    }
}
```

---

## Task 2 — Sistema Person → Aluno / Professor · 40 Coins · Intermediário

Crie uma hierarquia de pessoas e gerencie uma lista mista com menu JOptionPane.

**Requisitos:**
- Classe `Person` com `nome`, `cpf`, `dataNascimento` (String), método abstrato `perfil()`
- `Aluno` herda de Person: adiciona `matricula`, `curso`, `periodoAtual`
  - `perfil()` retorna HTML com dados de aluno
- `Professor` herda de Person: adiciona `departamento`, `titulacao` ("Mestre"/"Doutor"/"PhD"), `salario`
  - `perfil()` retorna HTML com dados do professor
- ArrayList misto com Alunos e Professores
- Menu: "Cadastrar Aluno", "Cadastrar Professor", "Listar Todos", "Filtrar por Tipo", "Sair"
- "Filtrar por Tipo" usa `showOptionDialog` para escolher Aluno ou Professor e lista apenas eles
- "Listar Todos" usa `instanceof` para identificar e exibir ícone diferente (👩‍🎓 aluno, 👩‍🏫 professor)

```java
import javax.swing.JOptionPane;
import java.util.ArrayList;

abstract class Person {
    protected String nome;
    protected String cpf;
    protected String dataNascimento;

    Person(String nome, String cpf, String dataNascimento) {
        this.nome = nome; this.cpf = cpf; this.dataNascimento = dataNascimento;
    }

    abstract String perfil();
}

class Aluno extends Person {
    // TODO: atributos e construtor
    // TODO: perfil() com HTML completo

    Aluno(String nome, String cpf, String dataNascimento, String matricula, String curso, int periodo) {
        super(nome, cpf, dataNascimento);
        // TODO: atribuir campos específicos
    }

    @Override
    public String perfil() {
        // TODO: HTML com todos os campos + ícone 👩‍🎓
        return "";
    }
}

// TODO: implementar Professor

public class SistemaUniversidade {
    static ArrayList<Person> pessoas = new ArrayList<>();

    public static void main(String[] args) {
        // TODO: menu loop
    }
}
```

---

## Task 3 — Folha de Pagamento Hierárquica · 50 Coins · Avançado

Crie um sistema completo de folha de pagamento usando herança, com relatório consolidado via JOptionPane.

**Requisitos:**
- Hierarquia: `Funcionario` (base) → `FuncionarioEfetivo` (CLT, tem 13º e férias) → `Horista`, `Assalariado`
- `FuncionarioPJ` herda direto de `Funcionario` — sem benefícios CLT
- `calcularSalarioBruto()`: abstrato em cada folha
- `calcularDescontos()`: INSS (11%) + IR (7.5%) para CLT; só IR (15%) para PJ
- `calcularSalarioLiquido()` = bruto - descontos
- `holerite()`: HTML detalhado com todos os cálculos
- Relatório final: soma todos os salários líquidos e exibe custo total da empresa

```java
import javax.swing.JOptionPane;
import java.util.ArrayList;

abstract class Funcionario {
    protected String nome;
    protected String regime; // "CLT" ou "PJ"

    Funcionario(String nome, String regime) {
        this.nome = nome; this.regime = regime;
    }

    abstract double calcularSalarioBruto();

    double calcularDescontos() {
        double bruto = calcularSalarioBruto();
        return "CLT".equals(regime)
            ? bruto * 0.11 + bruto * 0.075   // INSS + IR
            : bruto * 0.15;                   // só IR para PJ
    }

    double calcularSalarioLiquido() {
        return calcularSalarioBruto() - calcularDescontos();
    }

    String holerite() {
        double bruto    = calcularSalarioBruto();
        double desc     = calcularDescontos();
        double liquido  = bruto - desc;
        return String.format(
            "<html><b>Holerite — %s</b><br>Regime: %s<br>" +
            "Bruto: R$ %.2f<br>Descontos: <font color=red>- R$ %.2f</font><br>" +
            "<b>Líquido: <font color=green>R$ %.2f</font></b></html>",
            nome, regime, bruto, desc, liquido
        );
    }
}

// TODO: implementar FuncionarioEfetivo, Horista (CLT), Assalariado (CLT), FuncionarioPJ

public class FolhaDePagamento {
    static ArrayList<Funcionario> equipe = new ArrayList<>();

    public static void main(String[] args) {
        // TODO: loop — Adicionar CLT/PJ, Ver Holerites, Relatório Final
    }

    static void gerarRelatorio() {
        // TODO: somar calcularSalarioLiquido() de todos e exibir
        // TODO: breakdown por regime (CLT vs PJ)
    }
}
```

---

## Task 4 — Template Method + JOptionPane: Relatório por Tipo · 65 Coins · Expert

Implemente o padrão **Template Method** para gerar relatórios formatados diferentemente por tipo, com seleção via JOptionPane.

**Requisitos:**
- Classe abstrata `GeradorRelatorio` com template method `gerar()`:
  ```
  gerar() = cabecalho() + dados() + rodape()
  ```
- `cabecalho()` e `rodape()` são concretos e iguais para todos
- `dados()` é abstrato — cada subclasse formata diferente
- Subclasses: `RelatorioFuncionarios`, `RelatorioFinanceiro`, `RelatorioAcademico`
- Menu JOptionPane seleciona qual relatório gerar → captura os dados → exibe via `showMessageDialog`
- Cada subclasse deve usar um conjunto diferente de dados coletados via JOptionPane

```java
import javax.swing.JOptionPane;
import java.util.ArrayList;

abstract class GeradorRelatorio {
    protected String titulo;
    protected String empresa;

    GeradorRelatorio(String titulo, String empresa) {
        this.titulo = titulo; this.empresa = empresa;
    }

    // Template Method — NÃO sobrescreva este método
    final String gerar() {
        return cabecalho() + dados() + rodape();
    }

    private String cabecalho() {
        return String.format(
            "<html><h2>%s</h2><b>Empresa:</b> %s<br><hr><br>",
            titulo, empresa
        );
    }

    abstract String dados(); // cada subclasse define como exibir

    private String rodape() {
        return String.format(
            "<br><hr><small>Gerado em: %s | POO Academy</small></html>",
            new java.util.Date()
        );
    }
}

class RelatorioFuncionarios extends GeradorRelatorio {
    private ArrayList<String[]> funcionarios; // [nome, cargo, salario]

    RelatorioFuncionarios(String empresa) {
        super("Relatório de Funcionários", empresa);
        this.funcionarios = new ArrayList<>();
    }

    void addFuncionario(String nome, String cargo, double salario) {
        funcionarios.add(new String[]{nome, cargo, String.format("%.2f", salario)});
    }

    @Override
    String dados() {
        // TODO: HTML com tabela de funcionários
        // Dica: <table><tr><td>...</td></tr></table> funciona no JOptionPane
        return "";
    }
}

// TODO: implementar RelatorioFinanceiro e RelatorioAcademico

public class SistemaRelatorios {
    public static void main(String[] args) {
        String empresa = JOptionPane.showInputDialog("Nome da empresa:");
        if (empresa == null) return;

        String[] tipos = {"Funcionários", "Financeiro", "Acadêmico", "Sair"};
        while (true) {
            int tipo = JOptionPane.showOptionDialog(null, "Tipo de Relatório:", "Relatórios",
                JOptionPane.DEFAULT_OPTION, JOptionPane.QUESTION_MESSAGE, null, tipos, tipos[0]);

            if (tipo >= 3 || tipo == JOptionPane.CLOSED_OPTION) break;

            // TODO: criar o GeradorRelatorio correto, coletar dados, chamar gerar() e exibir
        }
    }
}
```

> **Dica para o Template Method:** O método `gerar()` é `final` — isso impede que subclasses alterem a estrutura do relatório. Só `dados()` pode ser sobrescrito. Este é o poder do padrão: o esqueleto do algoritmo é fixo, apenas os detalhes variam.

> **Gabarito esperado — dados() do RelatorioFuncionarios:**
> ```java
> @Override
> String dados() {
>     if (funcionarios.isEmpty()) return "<i>Nenhum funcionário cadastrado.</i><br>";
>     StringBuilder sb = new StringBuilder("<table border='1' cellpadding='4'>");
>     sb.append("<tr><th>Nome</th><th>Cargo</th><th>Salário</th></tr>");
>     double total = 0;
>     for (String[] f : funcionarios) {
>         sb.append(String.format("<tr><td>%s</td><td>%s</td><td>R$ %s</td></tr>", f[0], f[1], f[2]));
>         total += Double.parseDouble(f[2]);
>     }
>     sb.append(String.format("<tr><td colspan='2'><b>Total</b></td><td><b>R$ %.2f</b></td></tr>", total));
>     sb.append("</table><br>");
>     return sb.toString();
> }
> ```
