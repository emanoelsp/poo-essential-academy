# Roteiro de Aula — Classes Abstratas

> **Módulo 4 · Encontro 13**
> **Tempo total estimado:** 80–90 min
> **Pré-requisito do aluno:** E11 (herança, extends, super(), protected, @Override, upcasting) + E12 (cadeia de construtores, super.método())
> **Materiais:** projetor com a plataforma aberta no encontro-13, IDE com hierarquia de Funcionario do E11

---

## Abertura — 5 min

> 💬 **Fala do professor:**
>
> "Nos dois últimos encontros você aprendeu como a herança funciona por dentro: a cadeia de construtores, `super()` obrigatório, `@Override`, `super.método()`. Hoje a herança dá um salto qualitativo.
>
> Antes de começar, uma pergunta. Na hierarquia do E11 — `Funcionario`, `Horista`, `Assalariado` — o que acontece se alguém fizer `new Funcionario('Carlos', '111', 'TI')`?
>
> *(Deixe a turma responder — a maioria vai dizer 'compila e roda'.)*
>
> Correto. Compila, roda, e retorna salário zero. Isso é um bug de design: um 'funcionário genérico' não deveria existir. Hoje vamos ver como o compilador pode nos ajudar a proibir isso."

---

## Etapa 1 — O Problema: Métodos Genéricos Vazios

> ⏱ ~10 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Vamos abrir a IDE com o `Funcionario` do E11. Olhem para o método `calcularSalario()`."

### Demonstração ao vivo — o problema concreto

Abra a IDE e mostre o `Funcionario` com a implementação atual:

```java
class Funcionario {
    protected String nome;
    protected String cpf;
    protected String departamento;

    Funcionario(String nome, String cpf, String departamento) {
        this.nome         = nome;
        this.cpf          = cpf;
        this.departamento = departamento;
    }

    // Implementação problemática:
    double calcularSalario() {
        return 0; // retorno falso — só para compilar
    }
}
```

Execute:

```java
Funcionario f = new Funcionario("Carlos", "111.111.111-11", "TI");
System.out.println("Salário: " + f.calcularSalario()); // → Salário: 0.0
```

> 💬 **Fala do professor:**
>
> "Dois problemas aqui. Primeiro: `calcularSalario()` retorna `0` — sem significado. Um funcionário genérico não tem regra de cálculo de salário. Segundo: ninguém deveria criar um `Funcionario` diretamente — 'funcionário' é um conceito abstrato que só existe para categorizar `Horista`, `Assalariado` e `Comissionado`.
>
> O que queremos: que o compilador bloqueie `new Funcionario(...)` e que o compilador obrigue cada subclasse concreta a implementar `calcularSalario()` corretamente.
>
> Isso é exatamente o que `abstract` faz."

---

## Etapa 2 — A Solução: Classe Abstrata

> ⏱ ~20 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Duas palavras-chave, dois papéis distintos:
>
> `abstract class` — a classe não pode ser instanciada diretamente.
> `abstract método()` — sem corpo, sem implementação. Define um **contrato**: toda subclasse concreta DEVE implementar este método.
>
> Importante: você pode ter `abstract class` sem `abstract method`. Mas se tem `abstract method`, a classe DEVE ser `abstract class`. Vamos ver ao vivo."

### Demonstração ao vivo — transformando Funcionario

Na IDE, adicione `abstract` à classe e ao método `calcularSalario()`:

```java
public abstract class Funcionario {
    protected String nome;
    protected String cpf;
    protected String departamento;

    public Funcionario(String nome, String cpf, String departamento) {
        if (nome == null || nome.isBlank())
            throw new IllegalArgumentException("Nome inválido.");
        this.nome         = nome;
        this.cpf          = cpf;
        this.departamento = departamento;
    }

    // Note: sem corpo {} — apenas assinatura + ponto e vírgula
    public abstract double calcularSalario();

    public String getNome()         { return nome;         }
    public String getDepartamento() { return departamento; }
}
```

Tente compilar `new Funcionario("Carlos", "111", "TI")`:

```java
// Funcionario f = new Funcionario("Carlos", "111", "TI");
// ERRO: 'Funcionario' is abstract; cannot be instantiated
```

> 💬 **Fala do professor:**
>
> "O compilador bloqueou. Pronto. Nunca mais vamos ter um funcionário genérico no sistema.
>
> Agora percebam uma coisa: `Funcionario` tem construtor. Uma classe abstrata CAN ter construtor — só não pode ser chamado com `new Funcionario(...)`. Ele só é chamado via `super()` dentro das subclasses. A cadeia de construtores que vocês aprenderam no E12 continua funcionando exatamente igual."

### Demonstração ao vivo — implementando Horista

Mostre que agora a IDE marca `Horista` com erro — ela precisa implementar `calcularSalario()`:

```java
public class Horista extends Funcionario {
    private double valorHora;
    private int horasTrabalhadas;

    public Horista(String nome, String cpf, String depto, double valorHora) {
        super(nome, cpf, depto); // chama o construtor de Funcionario — mesmo de antes
        this.valorHora        = valorHora;
        this.horasTrabalhadas = 0;
    }

    public void registrarHoras(int horas) {
        if (horas < 0) throw new IllegalArgumentException("Horas não podem ser negativas.");
        horasTrabalhadas += horas;
    }

    @Override
    public double calcularSalario() {
        return valorHora * horasTrabalhadas;
    }
}
```

> 💬 **Fala do professor:**
>
> "O `@Override` aqui não é opcional — é uma implementação de contrato. Se eu remover o `@Override`, o compilador ainda exige que o método exista. Se eu não implementar `calcularSalario()` em `Horista`, ela precisa ser declarada `abstract` também — e então não pode ser instanciada.
>
> Perguntem-se: quem garante que toda subclasse de `Funcionario` tem `calcularSalario()`? O compilador. Não a documentação. Não a convenção. O compilador."

Repita rapidamente para Assalariado e Comissionado:

```java
public class Assalariado extends Funcionario {
    private double salarioFixo;

    public Assalariado(String nome, String cpf, String depto, double salarioFixo) {
        super(nome, cpf, depto);
        this.salarioFixo = salarioFixo;
    }

    @Override
    public double calcularSalario() { return salarioFixo; }
}

public class Comissionado extends Funcionario {
    private double salarioBase;
    private double totalVendas;
    private double taxa;

    public Comissionado(String nome, String cpf, String depto,
                        double salarioBase, double taxa) {
        super(nome, cpf, depto);
        this.salarioBase = salarioBase;
        this.taxa        = taxa;
        this.totalVendas = 0;
    }

    public void registrarVenda(double valor) { totalVendas += valor; }

    @Override
    public double calcularSalario() { return salarioBase + totalVendas * taxa; }
}
```

### O poder do método concreto que chama o abstrato

Agora adicione `toString()` em `Funcionario`:

```java
// Ainda dentro de Funcionario.java:
@Override
public String toString() {
    return String.format("[%s | %s | Sal: R$ %.2f]",
        nome, departamento, calcularSalario()); // chama o método ABSTRATO
}
```

Execute:

```java
Funcionario h = new Horista("Ana", "111", "TI", 45.0);
((Horista) h).registrarHoras(160);
System.out.println(h); // [Ana | TI | Sal: R$ 7200,00]

Funcionario a = new Assalariado("Beto", "222", "RH", 5000.0);
System.out.println(a); // [Beto | RH | Sal: R$ 5000,00]
```

> 💬 **Fala do professor:**
>
> "Olhem o que aconteceu. `toString()` em `Funcionario` chama `calcularSalario()` — um método abstrato. Em tempo de execução, Java chama a implementação correta para cada tipo. `h.toString()` chama `Horista.calcularSalario()`. `a.toString()` chama `Assalariado.calcularSalario()`.
>
> Isso não é magia — é exatamente o mesmo polimorfismo de sobrescrita que vocês viram no E11. A diferença é que `Funcionario` não tem corpo em `calcularSalario()` — e mesmo assim pode usá-lo. O compilador garante que em runtime haverá sempre uma implementação concreta disponível."

---

## Etapa 3 — Regras e Variações

> ⏱ ~10 min

> 💬 **Fala do professor:**
>
> "Antes de continuar, quero deixar explícitas as três regras de ouro das classes abstratas. Vou mostrar cada uma ao vivo."

### Regra 1 — classe abstrata não pode ser instanciada

Já vimos. Apenas confirme.

### Regra 2 — `abstract method` não tem corpo

```java
// ❌ Contradição: abstract com corpo
public abstract double calcularSalario() {
    return 0; // ERRO de compilação: abstract method cannot have a body
}

// ✅ Correto: apenas assinatura + ponto e vírgula
public abstract double calcularSalario();
```

### Regra 3 — subclasse concreta DEVE implementar todos os métodos abstratos

```java
// Se Horista não implementar calcularSalario():
// ERRO: Horista is not abstract and does not override
//       abstract method calcularSalario() in Funcionario

// Alternativa: tornar Horista também abstract (perde a capacidade de instanciar)
public abstract class HoristaBase extends Funcionario { ... }
```

> 💬 **Fala do professor:**
>
> "E se a subclasse implementar só alguns métodos abstratos e deixar outros? Ela precisa ser abstrata também. A cadeia só quebra quando alguma classe implementa TODOS os métodos abstratos herdados.
>
> Um bom exercício mental: percorra a hierarquia de baixo para cima. A primeira classe concreta que encontrar deve ter implementado todos os `abstract` que não foram resolvidos acima dela."

### Comparação rápida — antes e depois

Projete a tabela:

| Situação | Sem `abstract` | Com `abstract` |
|----------|:-------------:|:--------------:|
| `new Funcionario(...)` | ✅ compila, `calcularSalario()` retorna 0 | ❌ erro de compilação |
| Horista sem `calcularSalario()` | ✅ compila (herda `return 0`) | ❌ erro de compilação |
| Segurança de design | Depende de convenção | Garantida pelo compilador |

> 💬 **Fala do professor:**
>
> "A mudança real é a última linha: de convenção para garantia do compilador. Isso é o que torna uma codebase profissional — não precisar confiar em que todo desenvolvedor vai ler a documentação."

---

## Etapa 4 — Template Method: abstract na prática

> ⏱ ~10 min

> 💬 **Fala do professor:**
>
> "Vamos ver um caso onde `abstract` e `final` trabalham juntos para garantir uma sequência de passos. Isso aparece na seção 4 da plataforma — vou mostrar ao vivo e vocês vão entender o padrão antes de ver o nome dele."

### Demonstração ao vivo — Relatório

```java
public abstract class RelatorioPDF {

    // final: subclasses NÃO podem mudar a ordem dos passos
    public final void gerar() {
        imprimirCabecalho();   // concreto — fixo para todos
        imprimirConteudo();    // abstrato — cada subclasse define o seu
        imprimirRodape();      // concreto — fixo para todos
    }

    private void imprimirCabecalho() {
        System.out.println("=== RELATÓRIO — " + java.time.LocalDate.now() + " ===");
    }
    private void imprimirRodape() {
        System.out.println("=== FIM ===");
    }

    protected abstract void imprimirConteudo();
}

class RelatorioVendas extends RelatorioPDF {
    private double totalVendas;
    RelatorioVendas(double total) { this.totalVendas = total; }

    @Override
    protected void imprimirConteudo() {
        System.out.printf("  Total de Vendas: R$ %.2f%n", totalVendas);
    }
}
```

Execute:

```java
new RelatorioVendas(15000.0).gerar();
// === RELATÓRIO — 2026-09-17 ===
//   Total de Vendas: R$ 15000,00
// === FIM ===
```

> 💬 **Fala do professor:**
>
> "Isso se chama Template Method. A superclasse define o esqueleto — a ordem dos passos. As subclasses preenchem as lacunas. `final` garante que ninguém pode mudar a ordem. `abstract` garante que toda subclasse preenche as lacunas.
>
> O padrão aparece mais no Módulo 5, mas a mecânica você acabou de ver. O que `abstract` permitiu aqui foi separar 'o que é fixo' de 'o que varia' de forma que o compilador garante os dois lados."

---

## Etapa 5 — Revisitando FormaGeometrica

> ⏱ ~8 min

> 💬 **Fala do professor:**
>
> "No E11, Exercício 5, vocês implementaram `FormaGeometrica` como classe concreta. Quem lembrar: o que estava errado nessa implementação?"
>
> *(Espere respostas — a resposta esperada é que `calcularArea()` retornava 0 ou estava vazia.)*
>
> "Exato. `FormaGeometrica` é um conceito abstrato — 'forma geométrica' não existe como objeto concreto. Um círculo existe. Um retângulo existe. Uma 'forma' genérica não existe. Vamos corrigir isso agora."

Mostre a versão corrigida com `abstract` — não precisa reescrever do zero. Destaque apenas as diferenças:

```java
// Antes (E11):                    // Depois (E13):
class FormaGeometrica {            abstract class FormaGeometrica {
    double calcularArea() {            abstract double calcularArea();
        return 0;                      abstract double calcularPerimetro();
    }
}                                      // exibir() continua concreto — igual ao E11
                                   }
```

Mostre que `exibir()` pode chamar os dois métodos abstratos — e no demo com array de formas, o polimorfismo funciona corretamente:

```java
FormaGeometrica[] formas = {
    new Circulo("Vermelho", 5.0),
    new Retangulo("Azul", 4.0, 6.0),
    new Circulo("Verde", 3.0),
};

for (FormaGeometrica f : formas) {
    f.exibir(); // cada objeto chama sua própria implementação de calcularArea()
}
```

> 💬 **Fala do professor:**
>
> "Notem que o array é do tipo `FormaGeometrica[]` — mas os objetos são `Circulo` e `Retangulo`. Isso é upcasting. O `for` trata todos como `FormaGeometrica`. Mas quando `exibir()` chama `calcularArea()`, Java usa a implementação real de cada objeto.
>
> Isso é polimorfismo. Vimos no E11, mas agora entendemos a mecânica: `abstract` garante que `calcularArea()` existe em toda subclasse concreta. O compilador rejeitou qualquer subclasse que tentou escapar."

---

## Fechamento — 5 min

> 💬 **Fala do professor:**
>
> "Resumindo o encontro:
>
> **Classe abstrata** — impede instanciação direta. Use quando o conceito só existe como categoria, nunca como objeto concreto. `Animal`, `Veiculo`, `FormaGeometrica`, `Conta` — todos exemplos clássicos.
>
> **Método abstrato** — sem corpo, só assinatura. Define um contrato: toda subclasse concreta deve implementar. O compilador garante isso — não a documentação.
>
> **O poder combinado** — a superclasse pode ter métodos concretos que chamam os abstratos. Isso permite que a superclasse coordene o comportamento sem saber os detalhes — como `toString()` chamando `calcularSalario()`, ou `gerar()` chamando `imprimirConteudo()`.
>
> Agora os exercícios. O 1 é decisão conceitual — abstract ou concreto? Justifiquem por escrito. O 2 é hierarquia simples de Bebida. O 3 é a folha de pagamento completa — o mais importante desta lista. O 4 é o Template Method. O 5 é o sistema de notificações com reenvio. O 6 é troubleshooting com três erros clássicos."

---

## Notas do Professor

**Erros comuns — antecipe:**

1. **"Classe abstrata não tem construtor"** — mito muito comum. Classes abstratas podem e frequentemente têm construtores. Eles são chamados via `super()` das subclasses. A única restrição é que não podem ser chamados diretamente com `new`. Mostre no código: `super(nome, cpf, depto)` em `Horista` chamando o construtor de `Funcionario abstract`.

2. **`abstract method` com chaves vazias `{}`** — erro de compilação. Um método abstrato não tem corpo — nem chaves. É só assinatura + `;`. A confusão vem de métodos concretos que retornam zero ou string vazia como placeholder — que é exatamente o padrão problemático que `abstract` substitui.

3. **Subclasse concreta que não implementa todos os abstratos** — erro de compilação com mensagem clara: `X is not abstract and does not override abstract method Y`. Muitas vezes o aluno esquece um segundo método abstrato. Peça que leia o erro e contabilize quantos métodos abstratos a superclasse tem.

4. **Confusão entre `abstract class` e Interface** — neste módulo ainda não falamos de interface formalmente. Se alguém perguntar a diferença, diga: "No Módulo 5. Por enquanto: classe abstrata é uma classe — pode ter estado (campos), construtores concretos, e mistura de métodos concretos e abstratos. Interface tem restrições diferentes — vemos no M5."

5. **`final` em método concreto de classe abstrata** — alguns alunos vão perguntar se podem sobrescrever `toString()` em `Funcionario`. A resposta é sim — a menos que seja marcado `final`. O Template Method usa `final` + `abstract` deliberadamente: `final` para travar a estrutura, `abstract` para exigir o conteúdo variável.

**Conexão com o próximo encontro:**

O E14 é o Trabalho Prático 2. Os alunos vão projetar e implementar uma hierarquia completa usando herança e classes abstratas — os conceitos dos últimos quatro encontros. No E13, o objetivo é que entendam a regra do compilador; no E14, vão aplicar a decisão de design.

**Perguntas avançadas que podem surgir:**

- *"Posso ter uma classe abstrata sem nenhum método abstrato?"* — Sim. Você usa `abstract class` apenas para impedir instanciação, mesmo que todos os métodos sejam concretos. É raro, mas válido. Exemplo: uma classe base com construtores complexos e lógica compartilhada que não faz sentido instanciar diretamente.

- *"Se uma subclasse de uma abstract também for abstract, ela precisa implementar os métodos abstratos herdados?"* — Não. Uma classe abstrata pode deixar os métodos abstratos para suas subclasses resolverem. Só a primeira classe concreta da cadeia precisa implementar tudo.

- *"O que acontece com `calcularSalario()` chamado dentro de `toString()` de `Funcionario` se o objeto for um `Horista` sem horas registradas?"* — Retorna `0.0`. Nenhum erro. `horasTrabalhadas` começa em 0 no construtor de `Horista`. O `toString()` vai mostrar `Sal: R$ 0,00` — correto por enquanto.

- *"Interface também pode ter métodos abstratos. Qual a diferença prática?"* — Classe abstrata herda `extends` (só uma). Interface implementa `implements` (várias). Além disso, desde Java 8, interfaces podem ter `default methods` concretos. Mas a diferença fundamental é que interface não pode ter estado (campos de instância) — classe abstrata pode. Isso é o foco do Módulo 5.

**Se sobrar tempo:**

- Pergunte: "Se `Comissionado` não registrar nenhuma venda, qual o salário? E se `Horista` não registrar horas?" — Obriga a turma a pensar sobre estado inicial e invariantes, conectando com o Módulo 3 (Encapsulamento).
- Mostre o erro de compilação ao vivo para uma classe com dois métodos abstratos onde a subclasse implementa só um — o erro aponta exatamente qual método falta.

---

## Gabarito — Exercícios Práticos

---

### Exercício 1 — Abstract ou Concreto?

> 💬 **Condução sugerida:**
>
> Peça à turma que decida em pares antes de ver o gabarito. A discussão sobre `Pessoa` e `Imposto` costuma ser a mais rica — dependem do domínio. Valide argumentos sólidos mesmo que a decisão seja diferente do gabarito.

| Classe | Decisão | Justificativa |
|--------|:-------:|---------------|
| `Animal` | **abstract** | "Animal" é categoria — ninguém cria um "animal" sem tipo específico |
| `Cachorro` | concreto | Existe como objeto — pode ser instanciado |
| `Veiculo` | **abstract** | "Veículo" é categoria — todo veículo real é carro, moto, caminhão... |
| `Carro` | concreto | Existe como objeto |
| `FormaGeometrica` | **abstract** | Nunca há uma "forma" sem tipo — sempre círculo, retângulo... |
| `Retangulo` | concreto | Existe como objeto |
| `Pessoa` | **abstract** (geralmente) | Em sistemas corporativos: toda Pessoa é Funcionario ou Cliente |
| `Estudante` | concreto | Tipo específico com atributos próprios |
| `Conta` | **abstract** | Toda conta bancária real é corrente, poupança... Nunca "conta genérica" |
| `ContaCorrente` | concreto | Tipo específico |
| `Imposto` | **abstract** | Depende do domínio — se sempre há tipo específico (ICMS, ISS...), abstract |
| `ICMS` | concreto | Tipo específico de imposto |

> 💡 **Para discutir com a turma:** a decisão `abstract vs concreto` é sempre uma decisão de domínio. A pergunta-guia é: "pode existir um objeto deste tipo sem ser um dos tipos mais específicos?" Se não pode, a classe deve ser abstrata.

---

### Exercício 2 — Primeiro Método Abstrato

> 💬 **Condução sugerida:**
>
> Exercício simples de aquecimento. Peça que testem com volumes variados. Destaque que `exibir()` chama `calcularCalorias()` — mesmo padrão de `toString()` em `Funcionario`.

```java
abstract class Bebida {
    protected String nome;
    protected double volume;

    Bebida(String nome, double volume) {
        this.nome   = nome;
        this.volume = volume;
    }

    abstract double calcularCalorias();

    void exibir() {
        System.out.printf("[%s | %.0f ml | %.1f kcal]%n",
            nome, volume, calcularCalorias());
    }
}

class Suco extends Bebida {
    Suco(String nome, double volume) { super(nome, volume); }

    @Override
    double calcularCalorias() { return 0.4 * volume; }
}

class Refrigerante extends Bebida {
    Refrigerante(String nome, double volume) { super(nome, volume); }

    @Override
    double calcularCalorias() { return 0.42 * volume; }
}

class Agua extends Bebida {
    Agua(double volume) { super("Água", volume); }

    @Override
    double calcularCalorias() { return 0; }
}
```

**Saída de demonstração:**

```java
new Suco("Laranja", 300).exibir();       // [Laranja | 300 ml | 120,0 kcal]
new Refrigerante("Cola", 350).exibir();  // [Cola | 350 ml | 147,0 kcal]
new Agua(500).exibir();                  // [Água | 500 ml | 0,0 kcal]
```

> 💡 **Ponto para destacar:** `exibir()` está em `Bebida` — uma classe abstrata. Ela chama `calcularCalorias()` sem saber como cada subclasse vai calculá-la. O polimorfismo garante o comportamento correto em runtime.

---

### Exercício 3 — Folha de Pagamento Completa

> 💬 **Condução sugerida:**
>
> Este é o exercício mais completo. Permita 20 minutos. Quem terminar rápido pode adicionar um método `gerarContracheque()` que imprime todos os detalhes. Destaque o `receberBonus()` — método concreto que usa `calcularSalario()` abstrato.

```java
public abstract class Funcionario {
    protected String nome;
    protected String cpf;
    protected String departamento;

    public Funcionario(String nome, String cpf, String departamento) {
        this.nome         = nome;
        this.cpf          = cpf;
        this.departamento = departamento;
    }

    public abstract double calcularSalario();

    // Método concreto que usa o abstrato — mesma mecânica do toString()
    public void receberBonus(double pct) {
        double salarioAtual = calcularSalario(); // usa o polimorfismo
        System.out.printf("[%s] Bônus de %.0f%%: + R$ %.2f (total: R$ %.2f)%n",
            nome, pct * 100, salarioAtual * pct, salarioAtual * (1 + pct));
    }

    @Override
    public String toString() {
        return String.format("[%s | %s | Sal: R$ %.2f]",
            nome, departamento, calcularSalario());
    }
}

public class Horista extends Funcionario {
    private double valorHora;
    private int horasTrabalhadas;

    public Horista(String nome, String cpf, String depto, double valorHora) {
        super(nome, cpf, depto);
        this.valorHora        = valorHora;
        this.horasTrabalhadas = 0;
    }

    public void registrarHoras(int horas) { horasTrabalhadas += Math.max(0, horas); }

    @Override
    public double calcularSalario() { return valorHora * horasTrabalhadas; }
}

public class Assalariado extends Funcionario {
    private double salarioFixo;

    public Assalariado(String nome, String cpf, String depto, double salarioFixo) {
        super(nome, cpf, depto);
        this.salarioFixo = salarioFixo;
    }

    @Override
    public double calcularSalario() { return salarioFixo; }
}

public class Comissionado extends Funcionario {
    private double salarioBase;
    private double totalVendas;
    private double taxa;

    public Comissionado(String nome, String cpf, String depto,
                        double salarioBase, double taxa) {
        super(nome, cpf, depto);
        this.salarioBase = salarioBase;
        this.taxa        = taxa;
        this.totalVendas = 0;
    }

    public void registrarVenda(double valor) { totalVendas += valor; }

    @Override
    public double calcularSalario() { return salarioBase + totalVendas * taxa; }
}
```

**Main de demonstração:**

```java
import java.util.ArrayList;
import java.util.Comparator;

public class FolhaDePagamento {
    public static void main(String[] args) {
        ArrayList<Funcionario> folha = new ArrayList<>();

        Horista h1 = new Horista("Ana", "111", "TI", 45.0);
        h1.registrarHoras(160);
        Horista h2 = new Horista("Beto", "222", "TI", 38.0);
        h2.registrarHoras(120);
        Assalariado a1 = new Assalariado("Carla", "333", "RH", 6500.0);
        Assalariado a2 = new Assalariado("Diego", "444", "Fin", 7200.0);
        Comissionado c1 = new Comissionado("Eva", "555", "Vendas", 2000.0, 0.05);
        c1.registrarVenda(80000.0);

        folha.add(h1); folha.add(h2);
        folha.add(a1); folha.add(a2); folha.add(c1);

        double totalFolha = 0;
        Funcionario maior = folha.get(0);
        Funcionario menor = folha.get(0);

        for (Funcionario f : folha) {
            System.out.println(f);
            totalFolha += f.calcularSalario();
            if (f.calcularSalario() > maior.calcularSalario()) maior = f;
            if (f.calcularSalario() < menor.calcularSalario()) menor = f;
        }

        System.out.printf("%nTotal da folha: R$ %.2f%n", totalFolha);
        System.out.println("Maior salário: " + maior.getNome()
            + " — R$ " + String.format("%.2f", maior.calcularSalario()));
        System.out.println("Menor salário: " + menor.getNome()
            + " — R$ " + String.format("%.2f", menor.calcularSalario()));
    }
}
```

**Saída esperada:**

```
[Ana | TI | Sal: R$ 7200,00]
[Beto | TI | Sal: R$ 4560,00]
[Carla | RH | Sal: R$ 6500,00]
[Diego | Fin | Sal: R$ 7200,00]
[Eva | Vendas | Sal: R$ 6000,00]

Total da folha: R$ 31460,00
Maior salário: Ana — R$ 7200,00  (ou Diego — empate)
Menor salário: Beto — R$ 4560,00
```

> 💡 **Ponto para discutir:** `receberBonus()` usa `calcularSalario()` internamente. Para `Comissionado`, se `totalVendas` mudar após o bônus ser calculado, qual é o comportamento? `receberBonus()` recalcula — não armazena o bônus. Isso é intencional: o salário é sempre calculado na hora da chamada.

---

### Exercício 4 — Template Method

> 💬 **Condução sugerida:**
>
> Destaque o `final` no método `processar()`. Se alguém perguntar "posso sobrescrever `processar()` em CSV?", a resposta é não — e por design. O Template Method usa `final` exatamente para garantir que a sequência nunca muda.

```java
public abstract class ProcessadorArquivo {

    // Template Method — final garante que a sequência não pode ser alterada
    public final void processar(String arquivo) {
        abrirArquivo(arquivo);
        validarFormato();
        processarConteudo();
        gerarRelatorio();
        fecharArquivo();
    }

    private void abrirArquivo(String arquivo) {
        System.out.println("[Sistema] Abrindo: " + arquivo);
    }

    private void fecharArquivo() {
        System.out.println("[Sistema] Arquivo fechado.");
    }

    // Os três passos variáveis — cada subclasse implementa o seu
    protected abstract void validarFormato();
    protected abstract void processarConteudo();
    protected abstract void gerarRelatorio();
}

class ProcessadorCSV extends ProcessadorArquivo {
    @Override
    protected void validarFormato() {
        System.out.println("[CSV] Verificando separador ','...");
    }
    @Override
    protected void processarConteudo() {
        System.out.println("[CSV] Lendo linhas e colunas...");
    }
    @Override
    protected void gerarRelatorio() {
        System.out.println("[CSV] Relatório: linhas processadas, erros de formato.");
    }
}

class ProcessadorJSON extends ProcessadorArquivo {
    @Override
    protected void validarFormato() {
        System.out.println("[JSON] Verificando estrutura { } e aspas...");
    }
    @Override
    protected void processarConteudo() {
        System.out.println("[JSON] Parseando campos e valores...");
    }
    @Override
    protected void gerarRelatorio() {
        System.out.println("[JSON] Relatório: objetos encontrados, campos ausentes.");
    }
}

class ProcessadorXML extends ProcessadorArquivo {
    @Override
    protected void validarFormato() {
        System.out.println("[XML] Verificando tags abertas e fechadas...");
    }
    @Override
    protected void processarConteudo() {
        System.out.println("[XML] Percorrendo nós do documento...");
    }
    @Override
    protected void gerarRelatorio() {
        System.out.println("[XML] Relatório: elementos processados, namespaces.");
    }
}
```

**Saída de `new ProcessadorCSV().processar("dados.csv")`:**

```
[Sistema] Abrindo: dados.csv
[CSV] Verificando separador ','...
[CSV] Lendo linhas e colunas...
[CSV] Relatório: linhas processadas, erros de formato.
[Sistema] Arquivo fechado.
```

> 💡 **O que `final` + `abstract` garantem juntos:** `final processar()` trava a sequência — nenhuma subclasse pode reordenar os passos. `abstract validarFormato()` etc. exigem que cada subclasse preencha as lacunas. A superclasse controla **quando** cada passo roda; a subclasse controla **o que** cada passo faz.

---

### Exercício 5 — Sistema de Notificações

> 💬 **Condução sugerida:**
>
> O método `reenviar()` é o ponto pedagógico deste exercício — usa `enviar()` (abstrato) internamente, adicionando lógica de estado. Peça que expliquem em palavras o que `reenviar()` faz antes de ler o código.

```java
public abstract class Notificacao {
    protected String  destinatario;
    protected String  mensagem;
    protected boolean enviada;

    public Notificacao(String destinatario, String mensagem) {
        this.destinatario = destinatario;
        this.mensagem     = mensagem;
        this.enviada      = false;
    }

    // Abstrato — cada tipo sabe como enviar
    public abstract void enviar();

    // Concreto — usa enviar() internamente
    public void reenviar() {
        if (enviada) {
            System.out.println("[Reenvio] " + destinatario + " já recebeu esta notificação. Reenviando mesmo assim...");
        }
        enviar(); // delega para a implementação concreta
    }

    public boolean isEnviada() { return enviada; }
}

public class NotificacaoEmail extends Notificacao {
    private String assunto;

    public NotificacaoEmail(String destinatario, String mensagem, String assunto) {
        super(destinatario, mensagem);
        this.assunto = assunto;
    }

    @Override
    public void enviar() {
        System.out.printf("[Email] Para: %s | Assunto: %s | Mensagem: %s%n",
            destinatario, assunto, mensagem);
        enviada = true;
    }
}

public class NotificacaoSMS extends Notificacao {
    private String numeroCelular;

    public NotificacaoSMS(String destinatario, String mensagem, String numeroCelular) {
        super(destinatario, mensagem);
        this.numeroCelular = numeroCelular;
    }

    @Override
    public void enviar() {
        System.out.printf("[SMS] %s → %s: %s%n", numeroCelular, destinatario, mensagem);
        enviada = true;
    }
}

public class NotificacaoPush extends Notificacao {
    private String appToken;
    private String prioridade;

    public NotificacaoPush(String destinatario, String mensagem,
                           String appToken, String prioridade) {
        super(destinatario, mensagem);
        this.appToken   = appToken;
        this.prioridade = prioridade;
    }

    @Override
    public void enviar() {
        System.out.printf("[Push] Token: %s | Prioridade: %s | %s: %s%n",
            appToken, prioridade, destinatario, mensagem);
        enviada = true;
    }
}
```

**Main de demonstração:**

```java
import java.util.ArrayList;

public class FilaDeNotificacoes {
    public static void main(String[] args) {
        ArrayList<Notificacao> fila = new ArrayList<>();
        fila.add(new NotificacaoEmail("ana@email.com", "Bem-vindo!", "Cadastro confirmado"));
        fila.add(new NotificacaoSMS("Beto", "Código: 4521", "+55 11 99999-0001"));
        fila.add(new NotificacaoPush("Carla", "Novo pedido disponível", "tok_abc123", "ALTA"));
        fila.add(new NotificacaoEmail("diego@email.com", "Fatura disponível", "Cobrança"));
        fila.add(new NotificacaoSMS("Eva", "Entrega hoje!", "+55 21 88888-0002"));

        System.out.println("=== Enviando todas ===");
        for (Notificacao n : fila) n.enviar();

        System.out.println("\n=== Reenviando as 3 primeiras ===");
        for (int i = 0; i < 3; i++) fila.get(i).reenviar();
    }
}
```

**Saída das três primeiras no reenvio:**

```
[Reenvio] ana@email.com já recebeu esta notificação. Reenviando mesmo assim...
[Email] Para: ana@email.com | Assunto: Cadastro confirmado | Mensagem: Bem-vindo!
[Reenvio] Beto já recebeu esta notificação. Reenviando mesmo assim...
[SMS] +55 11 99999-0001 → Beto: Código: 4521
[Reenvio] Carla já recebeu esta notificação. Reenviando mesmo assim...
[Push] Token: tok_abc123 | Prioridade: ALTA | Carla: Novo pedido disponível
```

> 💡 **Decisão de design para discutir:** `enviada = true` está dentro de `enviar()` em cada subclasse — o que é certo? Depende do contrato. Se `enviada` deveria sempre ser `true` após qualquer `enviar()`, poderia ser movido para a superclasse. Mas se uma subclasse pudesse falhar ao enviar (rede indisponível), faz sentido que cada uma controle quando seta `true`. Este é um exemplo de decisão de design sem resposta única.

---

### Exercício 6 — Diagnóstico: Classes Abstratas com Erros

> 💬 **Condução sugerida:**
>
> Peça que identifiquem os três erros antes de ver o gabarito. O erro 3 (esquecer de implementar método abstrato) é o mais sutil — muitos não percebem de imediato porque `calcularArea()` está implementada. O que falta é `calcularPerimetro()`.

**Os três erros e suas correções:**

---

**Erro 1 — `new Forma("azul")`: tentativa de instanciar classe abstrata**

```java
// ❌ Erro 1:
Forma f = new Forma("azul");
// Compilação: 'Forma' is abstract; cannot be instantiated

// ✅ Correto — instanciar uma subclasse concreta:
Forma f = new Circulo("azul", 5.0);
f.exibir(); // usa polimorfismo — funciona normalmente
```

**Conceito violado:** classes abstratas existem para ser herdadas, não instanciadas. Use sempre uma das subclasses concretas.

---

**Erro 2 — método `abstract` com corpo `{}`**

```java
// ❌ Erro 2:
public abstract double calcularArea() {
    return 0; // ERRO: abstract method cannot have a body
}

// ✅ Correto — apenas assinatura, sem corpo:
public abstract double calcularArea();
```

**Conceito violado:** um método abstrato define apenas o contrato — a assinatura que toda subclasse deve respeitar. Ele não tem implementação. A contradição (`abstract` + corpo) é um erro de compilação.

---

**Erro 3 — `Circulo` não implementa `calcularPerimetro()`**

```java
// ❌ Erro 3:
class Circulo extends Forma {
    private double raio;

    Circulo(String cor, double raio) { super(cor); this.raio = raio; }

    @Override
    public double calcularArea() { return Math.PI * raio * raio; }
    // FALTA: calcularPerimetro() — compilação:
    // 'Circulo' is not abstract and does not override abstract method
    // calcularPerimetro() in Forma
}

// ✅ Correto — implementar todos os métodos abstratos:
class Circulo extends Forma {
    private double raio;

    Circulo(String cor, double raio) { super(cor); this.raio = raio; }

    @Override
    public double calcularArea()      { return Math.PI * raio * raio; }

    @Override
    public double calcularPerimetro() { return 2 * Math.PI * raio;   }
}
```

**Conceito violado:** uma subclasse concreta deve implementar **todos** os métodos abstratos da hierarquia acima dela — não apenas alguns. Se deixar algum para trás, o compilador exige que a própria subclasse seja declarada `abstract`.

> 💡 **Mnemônico para a turma:** "abstract class = categoria. abstract method = contrato. Categoria não se instancia. Contrato não se ignora."
