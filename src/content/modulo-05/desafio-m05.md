# ⚔️ Desafio do Módulo 5 — JOptionPane + Polimorfismo

> **Desafio Gamificado · 200 XP · até 200 POO Coins**

Módulo 5 tratou de polimorfismo, interfaces como contratos e o princípio de Liskov. Neste desafio, você vai criar coleções de tipos variados, processar todos uniformemente e usar interfaces para desacoplar comportamentos — com JOptionPane orquestrando tudo.

---

## Task 1 — Calculadora de Áreas Geométricas · 30 Coins · Básico

Use polimorfismo para calcular a área de diferentes formas, selecionadas via JOptionPane.

**Requisitos:**
- Interface `Forma` com método `calcularArea()` e método default `nomeFigura()` retornando `getClass().getSimpleName()`
- Implementações: `Circulo` (raio), `Retangulo` (base, altura), `Triangulo` (base, altura), `Trapezio` (baseM, basem, altura)
- Menu `showOptionDialog` para selecionar a forma
- Capturar as dimensões via `showInputDialog` (perguntas dinâmicas por tipo)
- Exibir resultado com HTML: nome da figura, dimensões informadas, área calculada com 2 casas

```java
import javax.swing.JOptionPane;

interface Forma {
    double calcularArea();
    default String nomeFigura() { return getClass().getSimpleName(); }

    default String resultadoHtml() {
        return String.format(
            "<html><b>%s</b><br>Área: <font color=blue><b>%.2f</b></font> unidades²</html>",
            nomeFigura(), calcularArea()
        );
    }
}

class Circulo implements Forma {
    private double raio;
    Circulo(double raio) { this.raio = raio; }

    @Override
    public double calcularArea() {
        // TODO: π × r²
        return 0;
    }
}

// TODO: implementar Retangulo, Triangulo, Trapezio

public class CalculadoraFormas {
    public static void main(String[] args) {
        String[] formas = {"Círculo", "Retângulo", "Triângulo", "Trapézio", "Sair"};
        while (true) {
            int escolha = JOptionPane.showOptionDialog(null, "Escolha a forma:", "Calculadora de Áreas",
                JOptionPane.DEFAULT_OPTION, JOptionPane.QUESTION_MESSAGE, null, formas, formas[0]);

            if (escolha >= 4 || escolha == JOptionPane.CLOSED_OPTION) break;

            Forma f = criarForma(escolha);
            if (f != null) JOptionPane.showMessageDialog(null, f.resultadoHtml(), "Resultado", JOptionPane.INFORMATION_MESSAGE);
        }
    }

    static Forma criarForma(int tipo) {
        try {
            return switch (tipo) {
                case 0 -> {
                    double r = Double.parseDouble(JOptionPane.showInputDialog("Raio:"));
                    yield new Circulo(r);
                }
                // TODO: cases 1, 2, 3
                default -> null;
            };
        } catch (NumberFormatException | NullPointerException e) {
            JOptionPane.showMessageDialog(null, "Entrada inválida!", "Erro", JOptionPane.ERROR_MESSAGE);
            return null;
        }
    }
}
```

---

## Task 2 — Interface Notificavel com 3 Implementações · 45 Coins · Intermediário

Crie uma interface `Notificavel` e implemente 3 tipos diferentes de notificação. O sistema deve ser facilmente extensível.

**Requisitos:**
- Interface `Notificavel` com: `enviar(String mensagem)` e `String getTipo()`
- Implementações:
  - `NotificacaoEmail`: exibe `showMessageDialog` com ícone de envelope (HTML), simula "enviando para email@..."
  - `NotificacaoSMS`: exibe tamanho da mensagem e aviso se > 160 caracteres (campo SMS)
  - `NotificacaoApp`: exibe notificação "push" com timestamp e badge de prioridade (Alta/Normal/Baixa)
- `CentralDeAlertas` gerencia uma lista de `Notificavel` e dispara todas com um clique
- Menu: "Adicionar Canal", "Enviar Alerta", "Listar Canais", "Remover Canal", "Sair"

```java
import javax.swing.JOptionPane;
import java.util.ArrayList;

interface Notificavel {
    void enviar(String mensagem);
    String getTipo();
}

class NotificacaoEmail implements Notificavel {
    private String enderecoEmail;

    NotificacaoEmail(String email) { this.enderecoEmail = email; }

    @Override
    public void enviar(String mensagem) {
        JOptionPane.showMessageDialog(null,
            String.format("<html>📧 <b>Email enviado para:</b> %s<br><br>%s</html>", enderecoEmail, mensagem),
            "Email", JOptionPane.INFORMATION_MESSAGE);
    }

    @Override
    public String getTipo() { return "Email → " + enderecoEmail; }
}

// TODO: NotificacaoSMS com validação de 160 chars
// TODO: NotificacaoApp com prioridade e timestamp

class CentralDeAlertas {
    private ArrayList<Notificavel> canais = new ArrayList<>();

    void adicionar(Notificavel canal) { canais.add(canal); }

    void remover(int indice) {
        if (indice >= 0 && indice < canais.size()) canais.remove(indice);
    }

    void dispararAlerta(String mensagem) {
        // TODO: percorrer canais e chamar enviar() em cada um
        // TODO: mostrar resumo: "Alerta enviado para X canal(is)"
    }

    String listarHtml() {
        // TODO: HTML numerado com getTipo() de cada canal
        return "";
    }

    int quantidadeCanais() { return canais.size(); }
}

public class SistemaAlertas {
    public static void main(String[] args) {
        CentralDeAlertas central = new CentralDeAlertas();
        // TODO: menu loop com as 5 operações
    }
}
```

> **Dica:** A força do polimorfismo aqui é que `dispararAlerta` chama `canal.enviar(msg)` sem saber se é Email, SMS ou App — cada objeto sabe como se notificar. Para adicionar um 4° canal no futuro, basta criar uma nova classe que implementa `Notificavel`.

---

## Task 3 — Coleção Polimórfica com instanceof Defensivo · 55 Coins · Avançado

Crie um sistema onde uma coleção mista de diferentes tipos de `Veiculo` é processada polimorficamente, com downcasting seguro para acessar comportamentos específicos.

**Requisitos:**
- Hierarquia: `Veiculo` (abstrato: `getVelocidadeMaxima()`, `getFicha()`) → `Carro`, `Moto`, `Caminhao`, `Onibus`
- Comportamentos específicos (não na classe base):
  - `Carro`: método `abrirPortaMala()`
  - `Caminhao`: método `getCapacidadeCarga()` (toneladas)
  - `Onibus`: método `getNumeroPassageiros()`
  - `Moto`: método `isCapacete()` (boolean — retorna se capacete está incluído)
- Menu principal: "Adicionar Veículo", "Listar Frota", "Ação Específica", "Relatório de Velocidade", "Sair"
- "Ação Específica" filtra por tipo via `instanceof` e exibe ação específica de cada um

```java
import javax.swing.JOptionPane;
import java.util.ArrayList;

abstract class Veiculo {
    protected String placa;
    protected String marca;
    protected int ano;

    Veiculo(String placa, String marca, int ano) {
        this.placa = placa; this.marca = marca; this.ano = ano;
    }

    abstract int getVelocidadeMaxima();

    String getFicha() {
        return String.format("<b>%s</b> %s (%d) | Vmáx: %d km/h",
            marca, getClass().getSimpleName(), ano, getVelocidadeMaxima());
    }
}

class Carro extends Veiculo {
    private int tamanhoPoraMala; // litros

    Carro(String placa, String marca, int ano, int tamanhoPortaMala) {
        super(placa, marca, ano);
        this.tamanhoPoraMala = tamanhoPortaMala;
    }

    @Override public int getVelocidadeMaxima() { return 220; }

    void abrirPortaMala() {
        JOptionPane.showMessageDialog(null,
            String.format("🚗 Porta-malas do %s aberto! Capacidade: %dL", marca, tamanhoPoraMala),
            "Porta-malas", JOptionPane.INFORMATION_MESSAGE);
    }
}

// TODO: Moto, Caminhao, Onibus

public class SistemaFrota {
    static ArrayList<Veiculo> frota = new ArrayList<>();

    public static void main(String[] args) {
        // TODO: menu loop
    }

    static void acaoEspecifica() {
        if (frota.isEmpty()) {
            JOptionPane.showMessageDialog(null, "Frota vazia!", "Aviso", JOptionPane.WARNING_MESSAGE);
            return;
        }
        // Filtrar por tipo com instanceof e executar ação específica
        for (Veiculo v : frota) {
            if (v instanceof Carro carro)           carro.abrirPortaMala();
            else if (v instanceof Caminhao caminhao) { /* TODO */ }
            else if (v instanceof Onibus onibus)     { /* TODO */ }
            else if (v instanceof Moto moto)         { /* TODO */ }
        }
    }
}
```

---

## Task 4 — Strategy + JOptionPane: Ordenação Configurável · 70 Coins · Expert

Implemente o padrão **Strategy** para permitir que o usuário escolha o critério de ordenação de uma lista de produtos em tempo de execução.

**Requisitos:**
- Interface `EstrategiaOrdenacao<T>` com método `ordenar(ArrayList<T>)`
- Produto com `nome` (String), `preco` (double), `estoque` (int), `avaliacao` (double, 0-5)
- 4 estratégias de ordenação:
  - `OrdenarPorNome` — alfabética crescente
  - `OrdenarPorPreco` — menor para maior
  - `OrdenarPorEstoque` — maior estoque primeiro
  - `OrdenarPorAvaliacao` — maior avaliação primeiro
- `ListaDeProdutos` tem um atributo `EstrategiaOrdenacao` que pode ser trocado sem modificar a classe
- Menu JOptionPane: "Adicionar Produto", "Trocar Estratégia de Ordenação", "Listar (com ordenação atual)", "Sair"
- Ao listar, exiba qual estratégia está ativa no cabeçalho

```java
import javax.swing.JOptionPane;
import java.util.ArrayList;
import java.util.Comparator;

interface EstrategiaOrdenacao<T> {
    void ordenar(ArrayList<T> lista);
    String getNome(); // ex.: "Por Preço (crescente)"
}

class Produto {
    String nome;
    double preco;
    int estoque;
    double avaliacao;

    Produto(String nome, double preco, int estoque, double avaliacao) {
        this.nome = nome; this.preco = preco;
        this.estoque = estoque; this.avaliacao = avaliacao;
    }

    String toHtml() {
        return String.format(
            "<tr><td>%s</td><td>R$ %.2f</td><td>%d</td><td>%.1f ⭐</td></tr>",
            nome, preco, estoque, avaliacao
        );
    }
}

class OrdenarPorPreco implements EstrategiaOrdenacao<Produto> {
    @Override
    public void ordenar(ArrayList<Produto> lista) {
        lista.sort(Comparator.comparingDouble(p -> p.preco));
    }

    @Override
    public String getNome() { return "Por Preço (crescente)"; }
}

// TODO: OrdenarPorNome, OrdenarPorEstoque, OrdenarPorAvaliacao

class ListaDeProdutos {
    private ArrayList<Produto> produtos = new ArrayList<>();
    private EstrategiaOrdenacao<Produto> estrategia;

    ListaDeProdutos(EstrategiaOrdenacao<Produto> estrategiaInicial) {
        this.estrategia = estrategiaInicial;
    }

    void setEstrategia(EstrategiaOrdenacao<Produto> novaEstrategia) {
        // TODO: atribuir nova estratégia (Strategy pattern: troca em tempo de execução)
    }

    void adicionar(Produto p) { produtos.add(p); }

    String listarHtml() {
        if (produtos.isEmpty()) return "<i>Lista vazia</i>";
        ArrayList<Produto> copia = new ArrayList<>(produtos); // não mexer na lista original
        estrategia.ordenar(copia);
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("<html><b>Estratégia ativa: %s</b><br>", estrategia.getNome()));
        sb.append("<table border='1' cellpadding='4'>");
        sb.append("<tr><th>Nome</th><th>Preço</th><th>Estoque</th><th>Avaliação</th></tr>");
        for (Produto p : copia) sb.append(p.toHtml());
        sb.append("</table></html>");
        return sb.toString();
    }
}

public class CatalogoProdutos {
    public static void main(String[] args) {
        ListaDeProdutos catalogo = new ListaDeProdutos(new OrdenarPorPreco());

        // Pré-popular com alguns produtos para testar
        catalogo.adicionar(new Produto("Teclado Mecânico", 350.0, 15, 4.8));
        catalogo.adicionar(new Produto("Mouse Gamer",       120.0, 30, 4.5));
        catalogo.adicionar(new Produto("Monitor 24\"",      900.0,  8, 4.9));
        catalogo.adicionar(new Produto("Headset USB",       200.0, 20, 4.2));

        // TODO: menu loop — adicionar, trocar estratégia, listar, sair
    }
}
```

> **Dica:** O poder do Strategy é que `ListaDeProdutos` não sabe QUAL estratégia está ativa — ela apenas chama `estrategia.ordenar(copia)`. Para adicionar uma 5ª estratégia ("por nome decrescente"), basta criar uma nova classe sem tocar em `ListaDeProdutos`.

> **Gabarito esperado — OrdenarPorAvaliacao:**
> ```java
> class OrdenarPorAvaliacao implements EstrategiaOrdenacao<Produto> {
>     @Override
>     public void ordenar(ArrayList<Produto> lista) {
>         lista.sort((a, b) -> Double.compare(b.avaliacao, a.avaliacao)); // maior primeiro
>     }
>     @Override
>     public String getNome() { return "Por Avaliação (maior primeiro)"; }
> }
> ```
