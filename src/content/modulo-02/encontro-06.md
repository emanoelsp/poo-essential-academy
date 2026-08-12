# Encontro 06 — Atividade Prática 1: Sistema de Reservas de Hotel

> **Módulo 2 · 4 aulas · 150 XP · Avaliação**

---

## Enunciado da Atividade

Você recebeu a seguinte especificação de negócio:

> *"O HotelPOO precisa de um sistema para gerenciar suas reservas. O hotel possui quartos de diferentes categorias (Standard, Superior e Luxo), cada um com número, andar e diária. Um hóspede tem nome, CPF e e-mail. Uma reserva associa um hóspede a um quarto por um período determinado (check-in e check-out em dias), calcula o valor total e pode ser cancelada. O sistema deve conseguir listar todas as reservas ativas e calcular a receita total do período."*

---

## Etapa 1 — Modelagem UML (obrigatória antes de codificar)

### 1.1 Extração dos candidatos

**Substantivos → Classes / Atributos**

A tabela abaixo lista os substantivos encontrados no enunciado. Preencha a coluna **Papel** para cada um.

```fill-table
COL1: Substantivo
COL2: Papel
LEGEND: Preencha o papel de cada substantivo. Use: "Classe", "Atributos de Quarto", "Atributos de Hóspede", "Atributos de Reserva" ou "Contexto do sistema".
HotelPOO | Contexto do sistema
quarto | Classe
número, andar, diária, categoria | Atributos de Quarto
hóspede | Classe
nome, CPF, e-mail | Atributos de Hóspede
reserva | Classe
check-in, check-out, valor total | Atributos de Reserva
```

**Verbos → Métodos**

A tabela abaixo lista as ações descritas no enunciado. Preencha a coluna **Método** com a assinatura Java correspondente.

```fill-table
COL1: Verbo (ação)
COL2: Método Java
LEGEND: Escreva o nome do método no formato NomeClasse.nomeMetodo(). Exemplo: "exibir quarto" → Quarto.exibir()
calcular valor total | Reserva.calcularTotal()
cancelar reserva | Reserva.cancelar()
listar reservas ativas | Hotel.listarReservas()
calcular receita | Hotel.calcularReceita()
```

### 1.2 Diagrama de Classes — preencha os campos em branco

Complete o diagrama abaixo com os nomes de classes, atributos e métodos que estão faltando.

```fill-uml
CLASS:Hotel
ATTR:nome : String
ATTR:___:reservas : Reserva[]
ATTR:totalReservas : int
METHOD:___:fazerReserva(h, q, dias) Reserva
METHOD:cancelarReserva(numero) void
METHOD:listarReservas() void
METHOD:___:calcularReceita() double

CLASS:___:Quarto
ATTR:numero : int
ATTR:andar : int
ATTR:categoria : String
ATTR:___:diaria : double
ATTR:disponivel : boolean
METHOD:exibir() void

CLASS:Hospede
ATTR:nome : String
ATTR:___:cpf : String
ATTR:email : String
METHOD:exibir() void

CLASS:___:Reserva
ATTR:numero : int
ATTR:hospede : Hospede
ATTR:quarto : Quarto
ATTR:___:dias : int
ATTR:ativa : boolean
METHOD:calcularTotal() double
METHOD:___:cancelar() void
METHOD:exibir() void
```

### 1.3 Diagrama de Classes — referência completa

```mermaid
classDiagram
    class Hotel {
        + nome : String
        + reservas : Reserva[]
        + totalReservas : int
        + fazerReserva(h: Hospede, q: Quarto, dias: int) Reserva
        + cancelarReserva(numero: int) void
        + listarReservas() void
        + calcularReceita() double
    }
    class Quarto {
        + numero : int
        + andar : int
        + categoria : String
        + diaria : double
        + disponivel : boolean
        + exibir() void
    }
    class Hospede {
        + nome : String
        + cpf : String
        + email : String
        + exibir() void
    }
    class Reserva {
        + numero : int
        + hospede : Hospede
        + quarto : Quarto
        + dias : int
        + ativa : boolean
        + calcularTotal() double
        + cancelar() void
        + exibir() void
    }
    Hotel *-- Reserva : gerencia
    Reserva --> Hospede : pertence a
    Reserva --> Quarto : ocupa
```

---

## Etapa 2 — Implementação de Referência

> **Dica:** Estude o código abaixo com atenção antes de escrever o seu. Os comentários `// TODO` marcam os trechos que você deve implementar por conta própria.

```java
// ──────────────────────────────────────────────────────
// Classe Quarto
// ──────────────────────────────────────────────────────
class Quarto {
    int numero;
    int andar;
    String categoria; // "Standard", "Superior", "Luxo"
    double diaria;
    boolean disponivel;

    Quarto(int numero, int andar, String categoria, double diaria) {
        this.numero     = numero;
        this.andar      = andar;
        this.categoria  = categoria;
        this.diaria     = diaria;
        this.disponivel = true;
    }

    void exibir() {
        // TODO: imprima número, categoria, andar, diária e status (Disponível/Ocupado)
        //       usando System.out.printf com formatação adequada
        throw new UnsupportedOperationException("implemente exibir()");
    }
}

// ──────────────────────────────────────────────────────
// Classe Hospede
// ──────────────────────────────────────────────────────
class Hospede {
    String nome;
    String cpf;
    String email;

    Hospede(String nome, String cpf, String email) {
        this.nome  = nome;
        this.cpf   = cpf;
        this.email = email;
    }

    void exibir() {
        // TODO: imprima nome, CPF e e-mail do hóspede
        throw new UnsupportedOperationException("implemente exibir()");
    }
}

// ──────────────────────────────────────────────────────
// Classe Reserva
// ──────────────────────────────────────────────────────
class Reserva {
    static int contadorNumero = 1;

    int numero;
    Hospede hospede;
    Quarto quarto;
    int dias;
    boolean ativa;

    Reserva(Hospede hospede, Quarto quarto, int dias) {
        this.numero  = contadorNumero++;
        this.hospede = hospede;
        this.quarto  = quarto;
        this.dias    = dias;
        this.ativa   = true;
        // TODO: marque o quarto como não disponível ao criar a reserva
    }

    double calcularTotal() {
        // TODO: retorne o valor total (diária do quarto × número de dias)
        throw new UnsupportedOperationException("implemente calcularTotal()");
    }

    void cancelar() {
        // TODO: verifique se a reserva já está cancelada (imprima aviso e retorne)
        //       caso contrário: marque como inativa e libere o quarto (disponivel = true)
        throw new UnsupportedOperationException("implemente cancelar()");
    }

    void exibir() {
        String status = ativa ? "ATIVA" : "CANCELADA";
        System.out.println("┌── Reserva #" + numero + " [" + status + "] ──────────────────────");
        System.out.println("│ Hóspede: " + hospede.nome + " | CPF: " + hospede.cpf);
        System.out.printf( "│ Quarto: %03d (%s) | %d dias | Total: R$ %.2f%n",
            quarto.numero, quarto.categoria, dias, calcularTotal());
        System.out.println("└─────────────────────────────────────────────────");
    }
}

// ──────────────────────────────────────────────────────
// Classe Hotel
// ──────────────────────────────────────────────────────
class Hotel {
    String nome;
    Reserva[] reservas;
    int totalReservas;

    Hotel(String nome, int capacidadeReservas) {
        this.nome          = nome;
        this.reservas      = new Reserva[capacidadeReservas];
        this.totalReservas = 0;
    }

    Reserva fazerReserva(Hospede hospede, Quarto quarto, int dias) {
        // TODO: valide se o quarto está disponível — imprima aviso e retorne null se não estiver
        // TODO: valide se dias > 0 — imprima aviso e retorne null se inválido
        // TODO: crie a Reserva, armazene no array e incremente totalReservas
        // TODO: imprima confirmação e retorne a reserva criada
        throw new UnsupportedOperationException("implemente fazerReserva()");
    }

    void cancelarReserva(int numero) {
        // TODO: percorra o array de reservas procurando pelo número informado
        //       se encontrar, chame cancelar(); se não encontrar, imprima aviso
        throw new UnsupportedOperationException("implemente cancelarReserva()");
    }

    void listarReservas() {
        System.out.println("\n╔═══ RESERVAS DO " + nome.toUpperCase() + " ═══╗");
        int ativas = 0;
        for (int i = 0; i < totalReservas; i++) {
            if (reservas[i].ativa) {
                reservas[i].exibir();
                ativas++;
            }
        }
        if (ativas == 0) System.out.println("Nenhuma reserva ativa.");
        System.out.println("╚══════════════════════════════╝\n");
    }

    double calcularReceita() {
        // TODO: some o total de todas as reservas ATIVAS e retorne o valor
        throw new UnsupportedOperationException("implemente calcularReceita()");
    }
}

// ──────────────────────────────────────────────────────
// Classe de Teste (Main)
// ──────────────────────────────────────────────────────
public class HotelPOO {
    public static void main(String[] args) {
        Hotel hotel = new Hotel("HotelPOO", 50);

        // Cadastro de quartos
        Quarto q101 = new Quarto(101, 1, "Standard", 180.0);
        Quarto q201 = new Quarto(201, 2, "Superior", 280.0);
        Quarto q301 = new Quarto(301, 3, "Luxo",     450.0);

        // Cadastro de hóspedes
        Hospede alice = new Hospede("Alice Silva",   "111.111.111-11", "alice@email.com");
        Hospede bob   = new Hospede("Bob Marley",    "222.222.222-22", "bob@email.com");
        Hospede carol = new Hospede("Carol Danvers", "333.333.333-33", "carol@email.com");

        // Fazendo reservas
        Reserva r1 = hotel.fazerReserva(alice, q101, 3);
        Reserva r2 = hotel.fazerReserva(bob,   q301, 5);
        Reserva r3 = hotel.fazerReserva(carol, q201, 2);

        // Tentando reservar quarto já ocupado (deve falhar)
        hotel.fazerReserva(alice, q101, 1);

        hotel.listarReservas();

        // Cancelando e re-reservando
        hotel.cancelarReserva(r1.numero);
        Reserva r4 = hotel.fazerReserva(carol, q101, 1);

        hotel.listarReservas();
        System.out.printf("Receita total das reservas ativas: R$ %.2f%n", hotel.calcularReceita());

        System.out.println("\n=== STATUS DOS QUARTOS ===");
        q101.exibir();
        q201.exibir();
        q301.exibir();
    }
}
```

---

## Critérios de Avaliação

| Critério | Pontuação |
|----------|-----------|
| Diagrama de Classes correto e completo | 25 pts |
| Precisão diagrama ↔ código | 20 pts |
| Construtores parametrizados em todas as classes | 15 pts |
| Regras de negócio implementadas corretamente | 20 pts |
| Código limpo, organizado e sem duplicação | 10 pts |
| Teste no `main` cobrindo todos os cenários | 10 pts |

**Total: 100 pontos**

---

## Extensão Desafio (bônus)

Implemente as seguintes melhorias no seu sistema:

1. **Busca de quarto disponível** — dado uma categoria, retorna o primeiro quarto disponível nessa categoria
2. **Histórico do hóspede** — dado um CPF, lista todas as reservas (ativas e canceladas) daquele hóspede
3. **Relatório por categoria** — imprime quantos quartos de cada categoria estão ocupados e quantos estão livres

---

### Troubleshooting de Revisão — 25 XP
**Diagnóstico: Bugs no Sistema de Hotel**

Antes de submeter sua atividade, um colega revisou o código e encontrou **3 bugs críticos**. Analise cada trecho, identifique o problema e escreva a correção.

**Bug 1 — Reserva criada sem verificar disponibilidade do quarto:**
```java
public void fazerReserva(Hospede hospede, Quarto quarto, String entrada, String saida) {
    Reserva r = new Reserva(hospede, quarto, entrada, saida);
    quarto.setOcupado(true);
    reservas[totalReservas++] = r;
    // BUG: e se o quarto já estiver ocupado?
}
```

**Bug 2 — Cancelamento sem restaurar o estado do quarto:**
```java
public void cancelarReserva(String codigo) {
    for (int i = 0; i < totalReservas; i++) {
        if (reservas[i].getCodigo().equals(codigo)) {
            reservas[i].setCancelada(true);
            // BUG: o quarto continua marcado como ocupado!
            return;
        }
    }
}
```

**Bug 3 — Cálculo de diárias com lógica errada:**
```java
public double calcularTotal(String dataEntrada, String dataSaida) {
    int diarias = (int)(dataSaida.length() - dataEntrada.length()); // BUG: lógica errada
    return diarias * quarto.getPrecoDiaria();
}
```

> **Dicas:** (1) Sempre verifique pré-condições antes de executar operações — use `IllegalStateException` para estado inválido. (2) Cancelar uma reserva deve reverter todos os efeitos colaterais que a criação causou. (3) Nunca calcule datas pela diferença de `length()` de Strings — use uma lógica real de datas ou um campo inteiro `numeroDiarias` no construtor.
