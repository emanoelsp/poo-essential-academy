# ⚔️ Desafio do Módulo 2 — JOptionPane + POO

> **Desafio Gamificado · 140 XP · até 140 POO Coins**

Você dominou classes, objetos e modelagem. Agora crie sistemas orientados a objetos reais com JOptionPane. O desafio desta vez é construir programas onde cada classe tem responsabilidades claras e a entrada/saída usa diálogos gráficos.

---

## Task 1 — Classe Aluno com JOptionPane · 20 Coins · Básico

Crie uma classe `Aluno` e colete os dados via JOptionPane. Exiba a ficha formatada com HTML.

**Requisitos:**
- Atributos: `nome`, `matricula` (String), `nota1`, `nota2` (double)
- Método `getMedia()` retorna a média das duas notas
- Método `getSituacao()` retorna "Aprovado" (média ≥ 7), "Recuperação" (5–6.9), "Reprovado" (< 5)
- Método `fichaHtml()` retorna HTML completo com todos os dados e situação colorida
- Capturar todos os dados via `showInputDialog`; exibir ficha via `showMessageDialog`

```java
import javax.swing.JOptionPane;

class Aluno {
    private String nome;
    private String matricula;
    private double nota1;
    private double nota2;

    Aluno(String nome, String matricula, double nota1, double nota2) {
        this.nome = nome; this.matricula = matricula;
        this.nota1 = nota1; this.nota2 = nota2;
    }

    double getMedia() {
        // TODO: retornar média
        return 0;
    }

    String getSituacao() {
        // TODO: Aprovado / Recuperação / Reprovado
        return "";
    }

    String fichaHtml() {
        // TODO: HTML com todos os campos + cor da situação (green/orange/red)
        return "";
    }
}

public class CadastroAluno {
    public static void main(String[] args) {
        // TODO: coletar dados via showInputDialog
        // TODO: criar Aluno e exibir fichaHtml()
    }
}
```

> **Dica:** Para a cor da situação: `"Aprovado" → "green"`, `"Recuperação" → "orange"`, `"Reprovado" → "red"`. Use `String.format` com o HTML para embutir a cor dinamicamente.

---

## Task 2 — Agenda de Contatos · 35 Coins · Intermediário

Crie uma agenda de contatos usando array de objetos e menu JOptionPane.

**Requisitos:**
- Classe `Contato` com `nome`, `telefone`, `email`
- Método `toHtml()` formata os dados em HTML para exibição
- Array de até 50 contatos, gerenciado por contador `numContatos`
- Menu com `showOptionDialog`: "Adicionar", "Listar Todos", "Buscar por Nome", "Remover", "Sair"
- "Listar Todos" exibe todos em `showMessageDialog` com HTML, ou avisa se vazia
- "Buscar por Nome" usa `showInputDialog` e pesquisa case-insensitive com `toLowerCase().contains()`
- "Remover" busca pelo nome e pede confirmação com `showConfirmDialog`

```java
import javax.swing.JOptionPane;

class Contato {
    String nome;
    String telefone;
    String email;

    Contato(String nome, String telefone, String email) {
        this.nome = nome; this.telefone = telefone; this.email = email;
    }

    String toHtml() {
        return String.format("<b>%s</b> | Tel: %s | Email: %s", nome, telefone, email);
    }
}

public class AgendaContatos {
    static Contato[] contatos = new Contato[50];
    static int numContatos = 0;

    public static void main(String[] args) {
        // TODO: loop com showOptionDialog de 5 opções
    }

    static void adicionar() {
        // TODO: capturar nome, telefone, email
        // TODO: verificar se array está cheio
        // TODO: contatos[numContatos++] = new Contato(...)
    }

    static void listar() {
        // TODO: verificar se vazia
        // TODO: montar HTML com todos toHtml() e exibir
    }

    static void buscar() {
        // TODO: capturar termo de busca
        // TODO: percorrer array com contains()
        // TODO: exibir resultados ou "nenhum encontrado"
    }

    static void remover() {
        // TODO: buscar por nome exato
        // TODO: showConfirmDialog para confirmar
        // TODO: shift-left no array para preencher o espaço
    }
}
```

---

## Task 3 — Estacionamento por Tipo de Veículo · 40 Coins · Avançado

Crie um sistema de estacionamento que calcula tarifas diferentes por tipo de veículo.

**Requisitos:**
- Classe `Veiculo` com `placa`, `tipo` ("Carro", "Moto", "Caminhão"), `horaEntrada` (int)
- Tabela de tarifas:
  - Carro: R$ 5,00 + R$ 3,00/hora
  - Moto: R$ 2,00 + R$ 1,50/hora
  - Caminhão: R$ 10,00 + R$ 8,00/hora
- `calcularTarifa(int horaSaida)`: retorna valor a pagar
- `ticketHtml(int horaSaida)`: HTML completo com placa, tipo, horas, subtotais e total
- Menu: "Registrar Entrada", "Registrar Saída", "Listar Veículos no Pátio", "Sair"
- "Registrar Saída" busca por placa e exibe ticket com `showMessageDialog`

```java
import javax.swing.JOptionPane;
import java.util.ArrayList;

class Veiculo {
    String placa;
    String tipo;
    int horaEntrada;

    Veiculo(String placa, String tipo, int horaEntrada) {
        this.placa = placa; this.tipo = tipo; this.horaEntrada = horaEntrada;
    }

    double calcularTarifa(int horaSaida) {
        int horas = Math.max(1, horaSaida - horaEntrada); // mínimo 1 hora
        return switch (tipo) {
            case "Carro"    -> 5.00 + horas * 3.00;
            case "Moto"     -> 2.00 + horas * 1.50;
            case "Caminhão" -> 10.00 + horas * 8.00;
            default -> throw new IllegalStateException("Tipo desconhecido: " + tipo);
        };
    }

    String ticketHtml(int horaSaida) {
        // TODO: HTML com todos os dados e cálculo detalhado
        return "";
    }
}

public class SistemaEstacionamento {
    static ArrayList<Veiculo> patio = new ArrayList<>();

    public static void main(String[] args) {
        // TODO: menu loop com 4 opções
    }
}
```

> **Dica:** Para capturar a hora, use `showInputDialog("Hora de entrada (0-23):")` e converta com `Integer.parseInt`. Valide o range. No ticket HTML, mostre "Entrada: Xh | Saída: Yh | Total: Z horas" antes do valor.

---

## Task 4 — Mini-Banco com Saldo, Depósito e Saque · 45 Coins · Expert

Crie um mini-banco completo com múltiplas contas gerenciadas por menu JOptionPane.

**Requisitos:**
- Classe `Conta` com `numero` (String gerado automaticamente), `titular`, `saldo`, `tipo` ("Corrente"/"Poupança")
- Poupança tem rendimento de 0.5%/mês — método `renderJuros()` adiciona juros ao saldo
- Número da conta gerado automaticamente: "CC-0001", "CC-0002", etc. (use um contador estático)
- Operações via JOptionPane: Abrir Conta / Selecionar Conta / Depositar / Sacar / Transferir / Extrato / Sair
- "Transferir" pede conta origem e destino, valida saldo suficiente
- "Extrato" exibe histórico de operações (use `ArrayList<String>` dentro de Conta)

```java
import javax.swing.JOptionPane;
import java.util.ArrayList;

class Conta {
    private static int contador = 0;
    private String numero;
    private String titular;
    private double saldo;
    private String tipo;
    private ArrayList<String> historico;

    Conta(String titular, String tipo, double saldoInicial) {
        contador++;
        this.numero = String.format("CC-%04d", contador);
        this.titular = titular; this.tipo = tipo;
        this.saldo = saldoInicial;
        this.historico = new ArrayList<>();
        historico.add(String.format("Abertura: R$ %.2f", saldoInicial));
    }

    void depositar(double valor) {
        // TODO: validar valor > 0
        // TODO: saldo += valor; historico.add(...)
    }

    boolean sacar(double valor) {
        // TODO: validar valor > 0 e saldo suficiente
        // TODO: saldo -= valor; historico.add(...)
        // TODO: retornar true se sucesso
        return false;
    }

    boolean transferir(Conta destino, double valor) {
        // TODO: sacar desta e depositar na destino se sacar() == true
        return false;
    }

    void renderJuros() {
        // TODO: se tipo == "Poupança": saldo *= 1.005
        // TODO: registrar no historico
    }

    String extratoHtml() {
        // TODO: HTML com número, titular, tipo, saldo atual + lista do historico
        return "";
    }

    String getSumarioHtml() {
        // Para listagem: numero + titular + saldo
        return String.format("<b>%s</b> | %s | Tipo: %s | <b>R$ %.2f</b>", numero, titular, tipo, saldo);
    }

    String getNumero() { return numero; }
}

public class MiniBanco {
    static ArrayList<Conta> contas = new ArrayList<>();
    static Conta contaAtual = null;

    public static void main(String[] args) {
        // TODO: menu principal com todas as operações
    }
}
```

> **Dica:** Use dois níveis de menu — o principal para selecionar conta ou abrir uma nova, e o segundo para operar na conta selecionada. O `showOptionDialog` com botões personalizados é ideal para isso.

> **Gabarito esperado:**
> Estrutura do menu principal:
> ```java
> String[] menuPrincipal = {"Abrir Conta", "Selecionar Conta", "Listar Contas", "Sair"};
> String[] menuConta     = {"Depositar", "Sacar", "Transferir", "Render Juros", "Extrato", "Voltar"};
> ```
