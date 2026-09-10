# Roteiro de Aula — Generalização e Especialização: Herança I

> **Módulo 4 · Encontro 11**
> **Tempo total estimado:** 80–90 min
> **Pré-requisito do aluno:** Módulo 3 completo — encapsulamento, invariantes, exceções de domínio
> **Materiais:** projetor com a plataforma aberta no encontro-11, IDE (IntelliJ ou VS Code) com projeto Java em branco

---

## Abertura — 5 min

> 💬 **Fala do professor:**
>
> "Pessoal, olha pra mim. Vocês passaram o Módulo 3 inteiro aprendendo a proteger dados dentro de uma classe — atributos privados, getters, validação no construtor, invariantes. A classe sabe proteger a si mesma. Isso é ótimo.
>
> Mas agora a gente tem um problema diferente. E se a gente precisa de várias classes que compartilham a mesma estrutura? Pensa num sistema com três tipos de funcionário. Cada um tem nome, CPF, departamento. Mas cada um calcula o salário de um jeito diferente.
>
> O que você faz? Cria três classes separadas e copia os campos em cada uma? Hoje a gente vai ver por que isso é um problema — e como herança resolve."

---

## Etapa 1 — O Problema: Duplicação

> ⏱ ~10 min

### Demonstração ao vivo

Abra a IDE. Crie as três classes do zero, sem herança, digitando lentamente:

```java
class FuncionarioHorista {
    private String nome;
    private String cpf;
    private double valorHora;
    // ...
}

class FuncionarioAssalariado {
    private String nome;   // aqui de novo
    private String cpf;    // aqui de novo
    private double salarioFixo;
    // ...
}
```

Pare depois da segunda classe e pergunte:

> ❓ "Quantas vezes eu já escrevi `nome` e `cpf`? O que acontece quando eu precisar mudar o tipo de `cpf` para uma classe `CPF` dedicada?"
>
> *(Deixe a turma responder — a resposta é: precisa mudar em todos os lugares)*

> 💬 **Fala do professor:**
>
> "Exato. Mas tem um problema ainda pior. Como eu coloco esses três funcionários numa lista só? Não consigo. Um `FuncionarioHorista` não é um `FuncionarioAssalariado` — são tipos completamente separados para o compilador. Se quero processar a folha de pagamento, tenho que ter três loops, um para cada tipo.
>
> E se o RH decide que todo mundo ganha bônus de R$ 100 em dezembro? Implemento `darBonus()` três vezes.
>
> É aqui que entra a herança."

---

## Etapa 2 — A Relação É-UM: O Critério de Ouro

> ⏱ ~8 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Antes de sair escrevendo `extends`, tem uma pergunta que você precisa responder. É uma pergunta simples, mas a resposta determina se herança é a ferramenta certa.
>
> A pergunta é: **a subclasse É-UM tipo da superclasse?** No mundo real, faz sentido dizer isso?
>
> Horista É-UM Funcionario? Sim. Todo horista é um funcionário.
> Carro É-UM Veículo? Sim.
> Cachorro É-UM Animal? Sim.
>
> Mas Gerente É-UM Funcionario? Depende de como você modela. Em muitos contextos, Gerente *gerencia* funcionários — ele TEM-UM funcionário subordinado, não *é* um tipo especial de funcionário. Nesse caso, composição é a resposta certa, não herança."

### Armadilha clássica

> 💬 **Fala do professor:**
>
> "O erro mais comum de iniciante é usar herança para reaproveitar código quando não existe uma relação É-UM real. Você vê que duas classes têm os mesmos campos e pensa: 'vou herdar uma da outra pra não duplicar'. Mas se a relação É-UM não existe no domínio do problema, você vai criar uma hierarquia falsa que vai te dar problema mais tarde.
>
> A regra é: **herança é semântica primeiro, reuso de código segundo**. O reuso vem como consequência de uma hierarquia bem modelada. Se você inverte isso, cria problema."

> ❓ "Pilha É-UM ArrayList? Pensem antes de responder."
>
> *(Resposta esperada: não — Pilha usa ArrayList internamente, mas não é uma lista. Faz sentido chamar `get(5)` numa pilha? Não. Então não é É-UM, é TEM-UM — composição.)*

---

## Etapa 3 — `extends` na IDE: Construindo a Hierarquia

> ⏱ ~15 min

### Live coding — Superclasse primeiro

> 💬 **Fala do professor:**
>
> "Vamos construir ao vivo. Quando usamos herança, a primeira decisão é: o que é comum? O que vai para a superclasse?"

Escreva `Funcionario` na IDE, falando em voz alta cada decisão:

```java
public class Funcionario {
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

    public String getNome()         { return nome;         }
    public String getCpf()          { return cpf;          }
    public String getDepartamento() { return departamento; }

    @Override
    public String toString() {
        return String.format("[%s | CPF: %s | Depto: %s]", nome, cpf, departamento);
    }
}
```

Pare no `protected` e explique:

> 💬 **Fala do professor:**
>
> "Notaram que usei `protected` e não `private`? Vamos voltar nisso em detalhe daqui a pouco. Por ora: `protected` significa que as subclasses podem acessar diretamente. `private` elas não podem."

### Live coding — Subclasse

```java
public class Horista extends Funcionario {
    private double valorHora;
    private int horasTrabalhadas;

    public Horista(String nome, String cpf, String departamento, double valorHora) {
        super(nome, cpf, departamento); // ← chame aqui e explique
        if (valorHora <= 0)
            throw new IllegalArgumentException("Valor da hora deve ser positivo.");
        this.valorHora        = valorHora;
        this.horasTrabalhadas = 0;
    }

    public void registrarHoras(int horas) { horasTrabalhadas += horas; }

    public double calcularSalario() { return valorHora * horasTrabalhadas; }
}
```

Pare no `super()` e explique:

> 💬 **Fala do professor:**
>
> "Esse `super(nome, cpf, departamento)` chama o construtor de `Funcionario`. É obrigatório — e tem que ser a primeira linha. O Java garante que a parte herdada do objeto seja inicializada antes de qualquer coisa da subclasse. Se eu tentar colocar código antes do `super()`, o compilador não deixa.
>
> Pensa assim: o objeto `Horista` carrega a parte de `Funcionario` dentro dele. Antes de montar a parte de `Horista`, precisa que a parte de `Funcionario` esteja pronta."

### Teste na IDE

```java
Horista ana = new Horista("Ana", "111.222.333-44", "TI", 45.0);
ana.registrarHoras(160);
System.out.println(ana.getNome());      // herdado de Funcionario
System.out.println(ana.calcularSalario()); // próprio de Horista
```

> 💬 **Fala do professor:**
>
> "`getNome()` foi definido em `Funcionario`. Mas `Horista` herdou — é como se fosse dela. Isso é herança funcionando."

---

## Etapa 4 — O Que É Herdado: Memória e `protected`

> ⏱ ~10 min

### Visualizando o objeto na memória

> 💬 **Fala do professor:**
>
> "Quando você faz `new Horista(...)`, um único objeto é criado no Heap. Mas esse objeto tem duas partes: a parte que veio de `Funcionario` — nome, cpf, departamento — e a parte própria de `Horista` — valorHora, horasTrabalhadas. São dois blocos no mesmo objeto.
>
> Abram a plataforma — tem um diagrama que mostra isso visualmente. Não é magia: é literalmente como a JVM organiza a memória."

Abra o encontro-11 na plataforma e mostre o diagrama da seção 4.

### `protected` — tabela de visibilidade

> 💬 **Fala do professor:**
>
> "Vamos falar de `protected`. Olha a tabela na plataforma:"

Mostre a tabela de modificadores de acesso da seção 6.

> 💬 **Fala do professor:**
>
> "`private` — só a própria classe acessa. Se eu declaro `nome` como `private` em `Funcionario`, `Horista` não consegue acessar diretamente — mesmo sendo subclasse.
>
> `protected` — a própria classe, o mesmo pacote, e qualquer subclasse. É o modificador feito para herança.
>
> `public` — qualquer um.
>
> Qual eu uso nos atributos da superclasse? Na prática: prefiro deixar `private` e criar getters. `protected` em atributo expõe o estado interno para todas as subclasses. Se amanhã eu mudar o tipo de `nome` de `String` para uma classe `Nome` customizada, tenho que ajustar todas as subclasses. Com `private` + getter, só ajusto `Funcionario`."

> ❓ "Se eu tentar acessar `nome` diretamente em `Horista` e o campo é `private` em `Funcionario`, o que acontece?"
>
> *(Resposta: erro de compilação — `nome has private access in Funcionario`)*

---

## Etapa 5 — `@Override`: A Subclasse Redefine o Comportamento

> ⏱ ~12 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Vocês viram que `Horista` herdou `getNome()` de `Funcionario` — e usa exatamente o mesmo comportamento. Mas e quando a subclasse quer um comportamento *diferente* para um método que já existe na superclasse?
>
> É isso que se chama **sobrescrita** — *override*. A subclasse redefine o método. E a anotação `@Override` avisa o compilador que é isso que você está fazendo."

### Demonstração na IDE

Adicione `toString()` na classe `Horista`:

```java
@Override
public String toString() {
    return super.toString() + String.format(" | Horista | R$ %.2f/h | %dh | Sal: R$ %.2f",
        valorHora, horasTrabalhadas, calcularSalario());
}
```

Execute e mostre a saída. Destaque `super.toString()`:

> 💬 **Fala do professor:**
>
> "Duas coisas importantes aqui. Primeiro: `@Override` em cima do método. Segundo: `super.toString()` — estou chamando o `toString()` de `Funcionario` e acrescentando informações de `Horista`. Não estou reescrevendo tudo do zero. Estou estendendo.
>
> E isso é o que `super.método()` faz: chama a implementação da superclasse. Você pode usar isso para reaproveitar o que já existe e só adicionar o que é específico da subclasse."

### Por que `@Override` não é opcional

> 💬 **Fala do professor:**
>
> "Agora — por que eu disse que `@Override` não é opcional na prática, mesmo sendo opcional na linguagem? Porque ele te protege de um erro silencioso muito comum."

Mostre na IDE — escreva propositalmente errado, sem a anotação:

```java
// SEM @Override — compilador aceita sem reclamar
public String tostring() {  // 's' minúsculo
    return "...";
}
```

> 💬 **Fala do professor:**
>
> "Compilou. Sem nenhum erro. Mas eu não sobrescrevi `toString()` — eu criei um método NOVO chamado `tostring()` que nunca vai ser chamado automaticamente. Quando alguém imprimir o objeto, vai continuar usando o `toString()` de `Funcionario` — silenciosamente, sem aviso nenhum.
>
> Agora com `@Override`:"

```java
@Override
public String tostring() {  // compilador rejeita imediatamente
    return "...";
}
// Erro: method does not override or implement a method from a supertype
```

> 💬 **Fala do professor:**
>
> "O compilador viu o `@Override`, foi verificar se existe um método `tostring()` na superclasse — não encontrou — e rejeitou. O erro aparece na hora que você escreve, não na hora que o cliente usa o sistema em produção."

### A tabela — o que `@Override` protege

Escreva no quadro ou projete:

| Erro | Sem `@Override` | Com `@Override` |
|------|----------------|----------------|
| Typo no nome (`tostring`) | Cria método novo, bug silencioso | Erro de compilação imediato |
| Parâmetro a mais (`toString(int)`) | Cria sobrecarga, não sobrescrita | Erro de compilação imediato |
| Método inexistente na superclasse | Compila normalmente | Erro de compilação imediato |

> 💬 **Fala do professor:**
>
> "Em todos os três casos, sem `@Override` o código compila. O bug só aparece em runtime — ou pior, não aparece, só se comporta errado silenciosamente. Com `@Override`, o compilador pega na hora.
>
> Regra prática: todo método que você pretende sobrescrever leva `@Override`. Sem exceção."

> ❓ "Se eu tenho `@Override` em um método e mudo a superclasse removendo esse método, o que acontece?"
>
> *(Resposta: erro de compilação na subclasse — o `@Override` está tentando sobrescrever algo que não existe mais. Isso também é proteção: `@Override` avisa que a hierarquia mudou e você precisa revisar a subclasse.)*

---

## Etapa 6 — Upcasting e `instanceof`

> ⏱ ~12 min

### Upcasting — a lista heterogênea

> 💬 **Fala do professor:**
>
> "Lembram do problema lá no início? Não conseguíamos colocar os três tipos de funcionário numa lista só. Agora conseguimos — por causa do upcasting.
>
> Como `Horista` É-UM `Funcionario`, eu posso armazenar um `Horista` numa variável do tipo `Funcionario`. Isso é automático, sempre seguro — porque todo `Horista` é garantidamente um `Funcionario`."

Na IDE:

```java
Horista       ana   = new Horista("Ana",   "111", "TI",    45.0);
Assalariado   bob   = new Assalariado("Bob", "222", "RH", 3500.0);
Comissionado  carol = new Comissionado("Carol","333","Vendas",1500.0, 0.08);

ana.registrarHoras(160);

// Os três num array de Funcionario — upcasting implícito
Funcionario[] equipe = { ana, bob, carol };

for (Funcionario f : equipe) {
    System.out.println(f.getNome() + " — " + f.getDepartamento());
}
```

> 💬 **Fala do professor:**
>
> "Funciona. Os três tipos convivem no mesmo array. Isso é o poder do upcasting.
>
> Mas reparem: eu só consigo chamar métodos que existem em `Funcionario`. Se eu tentar `f.registrarHoras(8)` aqui dentro do loop — não compila. O compilador só vê a 'interface' de `Funcionario`. O objeto ainda é um `Horista` completo lá no heap — mas pelo tipo da variável, só enxergamos o que `Funcionario` oferece."

> ❓ "O objeto mudou quando eu fiz o upcasting?"
>
> *(Resposta: não — o objeto é o mesmo. O que muda é a visão que temos dele através do tipo da variável.)*

### `instanceof` — reconhecendo o tipo real

> 💬 **Fala do professor:**
>
> "E se eu precisar chamar `registrarHoras()` dentro do loop? Preciso saber se aquele `Funcionario` é na verdade um `Horista`. É aí que entra o `instanceof`."

```java
for (Funcionario f : equipe) {
    if (f instanceof Horista h) {       // Java 16+ — já declara a variável
        h.registrarHoras(8);            // seguro — sabemos que é Horista
    }
}
```

> 💬 **Fala do professor:**
>
> "O `instanceof` verifica o tipo real em tempo de execução. No Java 16 em diante, você pode combinar a verificação com a declaração da variável — `instanceof Horista h` já faz os dois: verifica e declara `h` do tipo correto. Não precisa de cast manual.
>
> Mas um aviso: `instanceof` em excesso dentro de um loop é sinal de que a abstração está quebrada. Se você fica precisando saber o tipo real o tempo todo, provavelmente o método que você quer chamar deveria estar na superclasse. No Encontro 13, quando chegarmos em classes abstratas, vão ver como eliminar quase todo `instanceof` de processamento de lista."

> ❓ "O que acontece se eu fizer o cast sem verificar antes: `Horista h = (Horista) f`, sendo que `f` é um `Assalariado`?"
>
> *(Resposta: `ClassCastException` em runtime — o programa quebra. Sempre use `instanceof` antes de fazer downcasting.)*

---

## Etapa 7 — Hierarquia Completa e Conexão com o Próximo Encontro

> ⏱ ~8 min

> 💬 **Fala do professor:**
>
> "Vamos fechar com a hierarquia completa rodando. Vou adicionar `Assalariado` e `Comissionado` — vocês já sabem como funciona, vou só mostrar o padrão."

Mostre ou adicione rapidamente na IDE o `Assalariado` e `Comissionado` seguindo o mesmo padrão de `Horista`. Execute o `main` com os três tipos.

> 💬 **Fala do professor:**
>
> "Percebam que no loop eu chamo `f.getNome()` e `f.getDepartamento()` — métodos de `Funcionario`. Mas eu *não consigo* chamar `f.calcularSalario()` ainda, mesmo que os três tipos implementem esse método.
>
> Por quê? Porque `Funcionario` não tem `calcularSalario()`. O compilador só deixa chamar o que existe no tipo da variável — que é `Funcionario`.
>
> Isso muda no Encontro 13, com classes abstratas. A gente vai transformar `Funcionario` em abstrata e declarar `calcularSalario()` como método abstrato — sem corpo, só a assinatura. Aí sim, o compilador vai saber que todo `Funcionario` tem `calcularSalario()`, independentemente do tipo concreto. E aquele `instanceof` no loop some."

---

## Fechamento — 5 min

> 💬 **Fala do professor:**
>
> "Resumindo o que construímos hoje:
>
> - Herança existe para eliminar duplicação quando existe uma relação É-UM real
> - `extends` define a hierarquia; `super()` inicializa a superclasse no construtor
> - O objeto herdado carrega as duas partes — herdada e própria — num único objeto no heap
> - `protected` é o nível de acesso para herança — acessível pelas subclasses
> - `@Override` protege contra bugs silenciosos de sobrescrita
> - Upcasting permite listas heterogêneas — todos os tipos convivem sob o tipo comum
> - `instanceof` permite identificar o tipo real quando necessário
>
> Agora façam os exercícios da plataforma. Os dois primeiros são conceituais — É-UM ou TEM-UM. Os demais são implementação. O exercício 4 é o mais próximo do que o Módulo 4 vai exigir na atividade prática."

---

## Notas do Professor

**Erros comuns — antecipe:**

1. **`super()` não é a primeira linha** — o Java não deixa compilar, mas o aluno tenta mesmo assim. Mostre o erro de compilação ao vivo: `"call to super must be first statement in constructor"`
2. **Usar `private` nos atributos da superclasse e tentar acessar na subclasse** — erro clássico na primeira hierarquia própria. O aluno escreve `nome = "X"` na subclasse e não entende por que não compila. Demonstre: mude `protected` para `private` ao vivo e mostre o erro
3. **Esquecer `@Override` e errar a assinatura** — mostre propositalmente o typo `tostring()` sem a anotação, compile, veja que funciona — e então mostre que o `toString()` original é chamado, não o deles
4. **Downcasting sem `instanceof`** — mostre o `ClassCastException` ao vivo. Alunos precisam ver o crash para lembrar da regra
5. **Achar que upcasting muda o objeto** — reforce: o objeto é o mesmo, só a visão muda. Use o diagrama de memória da plataforma

**Perguntas avançadas que podem surgir:**

- *"Posso sobrescrever um método `private`?"* — Não. `private` não é herdado, então não há o que sobrescrever. O que você cria na subclasse é um método novo com o mesmo nome, sem nenhuma relação.
- *"Posso herdar de mais de uma classe?"* — Em Java, não. Uma classe tem exatamente uma superclasse direta. Para múltiplas fontes de comportamento, Java usa interfaces — que veremos no Módulo 5.
- *"O que é `final` em uma classe?"* — Uma classe `final` não pode ser estendida. `String` é `final`. Bom para citar como curiosidade, mas não aprofunde agora.

**Se sobrar tempo:**
- Mostre o `toString()` padrão de `Object` (`Horista@4e50df2e`) antes de sobrescrever — impacto visual de por que `@Override toString()` é quase sempre necessário
- Pergunte à turma onde ficaria `calcularSalario()` se `Funcionario` não existisse — ajuda a consolidar o raciocínio de extração bottom-up do exercício 3

---

## Gabarito — Exercícios em Sala

---

### Exercício 1 — Hierarquia Simples

> 💬 **Condução sugerida:**
>
> Peça à turma para criar `Veiculo` primeiro (5 min). Depois `Carro` — provavelmente alguém vai esquecer o `super()` ou usar `private` nos atributos. Deixe o erro aparecer antes de mostrar a solução.

```java
public class Veiculo {
    protected String placa;
    protected String marca;
    protected int ano;

    public Veiculo(String placa, String marca, int ano) {
        this.placa = placa;
        this.marca = marca;
        this.ano   = ano;
    }

    public String getPlaca() { return placa; }
    public String getMarca() { return marca; }
    public int    getAno()   { return ano;   }

    @Override
    public String toString() {
        return String.format("[%s | %s | %d]", marca, placa, ano);
    }
}

public class Carro extends Veiculo {
    private int numeroPortas;

    public Carro(String placa, String marca, int ano, int numeroPortas) {
        super(placa, marca, ano);           // inicializa Veiculo
        this.numeroPortas = numeroPortas;
    }

    public double calcularIPVA() {
        double valorEstimado = ano * 50.0;  // ano está acessível — é protected
        return valorEstimado * 0.04;        // 4%
    }

    @Override
    public String toString() {
        return super.toString() + String.format(" | Carro | %d portas | IPVA: R$ %.2f",
            numeroPortas, calcularIPVA());
    }
}

public class Moto extends Veiculo {
    private int cilindrada;

    public Moto(String placa, String marca, int ano, int cilindrada) {
        super(placa, marca, ano);
        this.cilindrada = cilindrada;
    }

    public double calcularIPVA() {
        double valorEstimado = ano * 50.0;
        return valorEstimado * 0.02;        // 2%
    }

    @Override
    public String toString() {
        return super.toString() + String.format(" | Moto | %dcc | IPVA: R$ %.2f",
            cilindrada, calcularIPVA());
    }
}

// Main de demonstração
public class Main {
    public static void main(String[] args) {
        Carro c = new Carro("ABC-1234", "Toyota", 2020, 4);
        Moto  m = new Moto ("XYZ-9999", "Honda",  2022, 600);

        System.out.println(c);               // toString() de Carro via super.toString()
        System.out.println(m);
        System.out.printf("IPVA do carro: R$ %.2f%n", c.calcularIPVA()); // 2020*50*0.04 = R$ 4.040
        System.out.printf("IPVA da moto:  R$ %.2f%n", m.calcularIPVA()); // 2022*50*0.02 = R$ 2.022
    }
}
```

**Pontos para destacar ao mostrar a solução:**
- `ano` é acessado diretamente em `calcularIPVA()` porque é `protected` — se fosse `private`, não compilaria
- `super.toString()` em `Carro` e `Moto` reutiliza o formato de `Veiculo` sem reescrever
- `calcularIPVA()` não está em `Veiculo` porque `Veiculo` não sabe a alíquota — cada subclasse tem a sua. Pergunte: "faria sentido ter um `calcularIPVA()` em `Veiculo` que retorna zero?" — antecipa a discussão de classes abstratas do E13

---

### Exercício 2 — É-UM ou TEM-UM?

> 💬 **Condução sugerida:**
>
> Projete as 6 relações e peça para a turma votar levantando a mão antes de revelar. Deixe a discussão acontecer — especialmente no item 3 (Gerente/Funcionario), que divide opiniões.

| # | Relação | Classificação | Justificativa |
|---|---------|:-------------:|---------------|
| 1 | `ContaCorrente` e `ContaPoupanca` | **Herança** | Ambas são tipos de `Conta` — têm titular, saldo, operações básicas em comum |
| 2 | `Pedido` e `ItemPedido` | **Composição** | Um `Pedido` *contém* vários `ItemPedido` — não é um tipo de item |
| 3 | `Gerente` e `Funcionario` | **Composição** | `Gerente` *gerencia* funcionários; no domínio de RH, um gerente TEM dados funcionais, não É um tipo especial de funcionário |
| 4 | `Turma` e `Aluno` | **Composição** | Uma `Turma` *contém* alunos — não é um aluno |
| 5 | `Estudante` e `PessoaFisica` | **Herança** | Todo estudante É uma pessoa física — CPF, nome, data de nascimento são comuns |
| 6 | `Motor` e `Carro` | **Composição** | Um `Carro` *tem* um motor — motor não é um tipo de carro |

**Item 3 — onde a discussão fica interessante:**

> 💬 **Fala do professor:**
>
> "Gerente e Funcionario é o exemplo mais polêmico. Em alguns modelos de domínio, `Gerente extends Funcionario` faz sentido — o gerente também é um funcionário, tem CPF, salário, departamento.
>
> O problema aparece quando o modelo exige que um gerente *tenha* subordinados — e aí a classe começa a acumular responsabilidades de funcionário E de gestor. É o sinal para separar: `Gerente` tem os dados funcionais via composição e tem a lista de subordinados como atributo próprio.
>
> Não existe resposta única correta — existe a que faz mais sentido para o problema que você está modelando. A pergunta que guia: 'se eu usar herança aqui, vou herdar métodos que não fazem sentido para a subclasse?' Se sim, composição."
