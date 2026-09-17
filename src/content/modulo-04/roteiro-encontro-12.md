# Roteiro de Aula — Mecânica de Herança: Herança II

> **Módulo 4 · Encontro 12**
> **Tempo total estimado:** 80–90 min
> **Pré-requisito do aluno:** Encontro 11 completo — `extends`, `super()`, `protected`, `@Override`, upcasting, `instanceof`
> **Materiais:** projetor com a plataforma aberta no encontro-12, IDE com as hierarquias do E11 salvas ou projeto Java em branco

---

## Abertura — 5 min

> 💬 **Fala do professor:**
>
> "No Encontro 11 vocês aprenderam o QUE é herança e QUANDO usá-la: a relação É-UM, o `extends`, o `protected`, o `@Override` e o upcasting. Hoje a gente vai descer um nível.
>
> A pergunta do dia não é 'o que herança faz' — é 'como herança funciona por dentro'. Quando você escreve `new Horista(...)`, o que acontece exatamente antes do objeto estar pronto? Em que ordem os construtores rodam? O que acontece quando você chama `super.toString()` no meio de um `@Override`? E por que sobrescrever `equals()` sem sobrescrever `hashCode()` pode quebrar um `HashSet` silenciosamente?
>
> Essas três perguntas são o programa de hoje."

### Atividade de aquecimento na plataforma

Antes de avançar, projete a plataforma e peça à turma para completar a atividade **"Aquecimento: revise o Encontro 11"** (fill-table). São 6 keywords do E11 — devem durar menos de 2 minutos.

Enquanto a turma responde, percorra as fileiras. Observe quem trava em `upcasting` — essa costuma ser a mais esquecida pelo nome formal.

**Após a atividade, revise em voz alta:**

| Situação | Resposta esperada | Se alguém errar... |
|----------|:-----------------:|---------------------|
| Declara herança | `extends` | "É a mesma palavra do inglês — a subclasse *estende* a superclasse" |
| Primeira instrução obrigatória no construtor | `super()` | "Hoje vamos entender POR QUE isso é obrigatório" |
| Acesso para subclasses, não para o mundo | `protected` | "Tabela de visibilidade — E11, seção 6" |
| Valida assinatura na sobrescrita | `@Override` | "Protege contra typo — vimos ao vivo no E11" |
| Tipo real em runtime | `instanceof` | "Operador, não método — sem parênteses" |
| Subclasse em variável de superclasse | `upcasting` | "Sobe na hierarquia — sempre implícito, sempre seguro" |

---

## Etapa 1 — A Cadeia de Construtores

> ⏱ ~12 min

### Fala de abertura

> 💬 **Fala do professor:**
>
> "Quero fazer uma pergunta antes de qualquer código. Quando você escreve `new Horista('Ana', '111', 'TI', 50.0)`, quantos construtores rodam?
>
> *(Deixe responderem — a resposta mais comum é 'um'.)*
>
> A resposta certa é: pelo menos três. O de `Horista`, o de `Funcionario`, e o de `Object` — a classe raiz de toda hierarquia Java. Eles formam uma cadeia. E a ordem em que rodam não é a que vocês podem estar esperando."

### Demonstração ao vivo — os printlns reveladores

Na IDE, adicione um `System.out.println` em cada construtor da hierarquia do E11:

```java
class Funcionario {
    protected String nome;
    protected String cpf;

    Funcionario(String nome, String cpf) {
        System.out.println("  >> Construtor de Funcionario executando");
        this.nome = nome;
        this.cpf  = cpf;
    }
}

class Horista extends Funcionario {
    private double valorHora;

    Horista(String nome, String cpf, double valorHora) {
        super(nome, cpf);
        System.out.println("  >> Construtor de Horista executando");
        this.valorHora = valorHora;
    }
}
```

Execute `new Horista("Ana", "111", 50.0)` e mostre a saída.

> 💬 **Fala do professor:**
>
> "Veja a ordem: Funcionario primeiro, Horista depois. Isso acontece porque `super()` é a primeira instrução — quando `Horista` chama `super(nome, cpf)`, o controle vai inteiro para o construtor de `Funcionario` e só volta para `Horista` quando ele termina.
>
> E antes de `Funcionario` ainda existe `Object` — o Java chama `super()` implicitamente em `Funcionario` porque toda classe herda de `Object`. Então a ordem real é sempre: **Object → Funcionario → Horista**. Do mais geral para o mais específico.
>
> Pensa numa matrioska, aquela boneca russa com bonecas dentro de bonecas. Você não consegue montar a menor sem antes ter preparado a maior. A JVM faz a mesma coisa: monta de fora para dentro, do mais geral para o mais específico."

### Por que `super()` obrigatoriamente primeiro?

> 💬 **Fala do professor:**
>
> "Por que o Java não deixa você colocar código antes do `super()`? Por uma razão de segurança muito específica: os atributos herdados ainda não existem até o construtor da superclasse rodar.
>
> Imagine que `Horista` tentasse usar `this.nome` antes do `super(nome, cpf)`. O campo `nome` ainda não foi inicializado — `Funcionario` ainda não rodou. Você estaria lendo memória suja. O Java proíbe isso em tempo de compilação, obrigando a superclasse a ser sempre inicializada primeiro."

Mostre ao vivo:

```java
Horista(String nome, String cpf, double valorHora) {
    System.out.println(this.nome); // ← tente colocar antes do super()
    super(nome, cpf);              // compilador rejeita: call to super must be first statement
    this.valorHora = valorHora;
}
```

> ❓ "Se eu não escrever `super()` explicitamente, o que acontece?"
>
> *(Resposta esperada: Java insere `super()` implícito — sem argumentos. Se a superclasse não tiver construtor sem parâmetros, não compila.)*

Demonstre o erro:

```java
class Animal {
    String nome;
    Animal(String nome) { this.nome = nome; } // só construtor com parâmetro
}

class Cachorro extends Animal {
    Cachorro() {
        // Java tenta inserir super() implícito — Animal não tem esse construtor
        // Erro: there is no default constructor available in 'Animal'
    }
}
```

### Hierarquia de três níveis — `super()` em cadeia

> 💬 **Fala do professor:**
>
> "Em hierarquias mais profundas, cada nível passa para cima só o que é sua responsabilidade. Abra a plataforma — tem o exemplo de `Veiculo → Carro → CarroEletrico` na seção 2. Cada construtor chama `super()` com os parâmetros que pertencem ao nível acima. `CarroEletrico` não precisa saber como `Veiculo` usa `placa` — só repassa."

Mostre o diagrama de sequência da seção 2 na plataforma. Destaque que o fluxo sobe até o topo antes de qualquer corpo ser executado.

> ❓ "Qual é o último construtor a terminar de executar quando você faz `new CarroEletrico(...)`?"
>
> *(Resposta: o de `CarroEletrico` — ele é o último a começar e o último a terminar. O objeto só está 'pronto' quando o construtor mais específico fecha.)*

### Atividade interativa na plataforma — fill-table

Abra a atividade **"Quem inicializa o quê na cadeia de construtores"** na plataforma.

> 💬 **Fala do professor:**
>
> "Olhem para o `new CarroEletrico(...)` que acabamos de ver. Cinco parâmetros entram pelo mesmo construtor — mas cada um vai parar em um nível diferente da hierarquia. Qual construtor fica responsável por `placa`? Qual fica com `autonomiaKm`? Preencham a tabela individualmente."

Dê 2 minutos. Depois revele em voz alta:

> 💬 **Fala do professor:**
>
> "`placa`, `marca` e `ano` são inicializados por `Veiculo` — são campos de `Veiculo`, então só o construtor de `Veiculo` pode atribuí-los. `Carro` recebe `portas` como parâmetro e o atribui em `this.numeroPortas`. `CarroEletrico` recebe `autonomia` e atribui em `this.autonomiaKm`.
>
> Essa é a divisão de responsabilidades que o `super()` implementa. Cada nível cuida do que é seu e delega o restante para cima. Se amanhã `Veiculo` precisar de um campo novo, só o construtor de `Veiculo` muda — `Carro` e `CarroEletrico` apenas repassam o parâmetro via `super()` sem saber o que ele faz."

---

## Etapa 2 — Sobrescrita em Profundidade e `super.método()`

> ⏱ ~12 min

### As regras de sobrescrita que o E11 não cobriu

> 💬 **Fala do professor:**
>
> "No E11 vimos que `@Override` protege contra typo. Hoje vamos ver as demais regras — algumas delas geram erros de compilação, outras geram bugs silenciosos que são difíceis de encontrar."

Escreva no quadro ou projete:

**Regra 1 — Visibilidade só pode aumentar, nunca diminuir**

```java
class Animal {
    public String emitirSom() { return "..."; }
}

class Cachorro extends Animal {
    @Override
    protected String emitirSom() { // ❌ não compila — public virou protected
        return "Au au!";
    }
}
```

> 💬 **Fala do professor:**
>
> "Por quê esse limite existe? Porque código que usa `Animal` pode chamar `emitirSom()` publicamente. Se a subclasse pudesse tornar o método `protected`, essa chamada pública quebraria quando o tipo real fosse `Cachorro`. O compilador proíbe para manter o contrato."

**Regra 2 — `final` bloqueia sobrescrita**

```java
class Conta {
    public final void debitar(double valor) { /* lógica crítica de segurança */ }
}

class ContaFraude extends Conta {
    @Override
    public void debitar(double valor) { /* ❌ não compila — método é final */ }
}
```

> 💬 **Fala do professor:**
>
> "`final` em método significa: 'esta implementação é definitiva, nenhuma subclasse pode alterar'. Útil quando a lógica é um invariante de segurança ou contrato que não pode ser subvertido."

**Regra 3 — `static` não é sobrescrito, é escondido (method hiding)**

> 💬 **Fala do professor:**
>
> "Isso é uma armadilha. Se você coloca `@Override` em um método `static`, o compilador não deixa — `static` não pode ser sobrescrito. O que você pode fazer é declarar um método `static` com o mesmo nome na subclasse, mas aí se chama *method hiding* — o comportamento é completamente diferente. Métodos normais: qual implementação roda depende do tipo do objeto. Métodos `static`: qual implementação roda depende do tipo da *variável*. Não vamos aprofundar agora — basta saber que `static + @Override` não compila."

### O padrão `super.método()` — estender, não substituir

> 💬 **Fala do professor:**
>
> "Vamos falar do padrão mais importante deste encontro. Quando você sobrescreve um método, você tem duas opções: substituir o comportamento inteiro, ou acrescentar comportamento em cima do que a superclasse já faz.
>
> Pensa numa pizza. A superclasse fez a massa. Você, na subclasse, pode jogar a massa fora e começar do zero — ou pode simplesmente colocar a cobertura em cima do que já existe. `super.método()` é o segundo caso: você pega o resultado do que a superclasse faz e acrescenta o que é específico de você."

Mostre o exemplo `toString()` em cadeia da seção 4 na plataforma:

```java
class Funcionario {
    @Override
    public String toString() {
        return String.format("[%s | %s]", nome, departamento);
    }
}

class Gerente extends Funcionario {
    @Override
    public String toString() {
        return super.toString()  // ← pega o que Funcionario já formatou
             + String.format(" | Gerente | %d subordinados", totalSubordinados);
    }
}
// Saída: "[Ana | TI] | Gerente | 5 subordinados"
//         ↑ super.toString()    ↑ acrescenta Gerente
```

> 💬 **Fala do professor:**
>
> "Duas coisas importantes aqui. Primeiro: se eu remover o `super.toString()` e reimplementar do zero, estou duplicando código. Se o formato de `Funcionario` mudar, `Gerente` não vai acompanhar.
>
> Segundo: `super.toString()` retorna o resultado **completo** do método da superclasse — não só a parte da superclasse. Se a hierarquia tiver três níveis, `super.toString()` dentro do terceiro nível retorna o resultado completo do segundo nível, que já inclui o primeiro. As camadas se acumulam automaticamente."

> ❓ "Se eu quero acrescentar comportamento antes e depois do comportamento da superclasse, como faço?"
>
> *(Resposta: chame `super.método()` no meio do seu código, coloque o que quiser antes e depois. Só para construtores a regra é diferente — `super()` obrigatoriamente primeiro.)*

Mostre o exemplo do cálculo com `ContaPremiada` da seção 4:

```java
class Conta {
    double calcularRendimento() {
        return saldo * 0.005;   // base: 0,5%
    }
}

class ContaPremiada extends Conta {
    @Override
    double calcularRendimento() {
        double base  = super.calcularRendimento(); // herda o cálculo de Conta
        double bonus = vip ? base * 0.5 : 0;       // acrescenta o bônus
        return base + bonus;
    }
}
```

> 💬 **Fala do professor:**
>
> "Percebam que `base` recebe exatamente o que `Conta.calcularRendimento()` retorna. Se amanhã o banco mudar a taxa base de 0,5% para 0,7%, eu altero em um só lugar — `Conta`. `ContaPremiada` vai pegar o novo valor automaticamente porque usa `super.calcularRendimento()`.
>
> Esse é o poder de usar `super.método()` em vez de duplicar: a superclasse vira a fonte de verdade do cálculo base. Você só adiciona o diferencial."

### Atividade interativa na plataforma — fill-table

Abra a atividade **"Trace as camadas: super.método() em ação"** na plataforma.

> 💬 **Fala do professor:**
>
> "Usando a `ContaPremiada` que acabamos de ver — saldo de R$ 1.000, conta VIP. Preencham as quatro etapas: qual é o valor base, o que `super.calcularRendimento()` retorna lá dentro, qual é o bônus e qual é o total. Façam individualmente."

Dê 2–3 minutos. Depois revele:

| Etapa | Conta | Cálculo | Resposta |
|-------|-------|---------|:--------:|
| Conta base | `saldo × 0,005` | `1000 × 0,005` | **5,0** |
| `super.calcularRendimento()` dentro de ContaPremiada | mesmo que Conta base | — | **5,0** |
| Bônus VIP | `base × 0,5` | `5,0 × 0,5` | **2,5** |
| Total de ContaPremiada | `base + bonus` | `5,0 + 2,5` | **7,5** |

> 💬 **Fala do professor:**
>
> "A linha 2 e a linha 1 têm o mesmo valor — e isso é intencional. `super.calcularRendimento()` retorna exatamente o que `Conta.calcularRendimento()` retorna para o mesmo saldo. Sem segredo. O que ContaPremiada faz é pegar esse resultado e acrescentar o bônus em cima.
>
> Se alguém colocou um valor diferente na linha 2, revejam: `super.método()` não é magia — é uma chamada normal de método, só que para a implementação da superclasse."

---

## Fechamento — 5 min

> 💬 **Fala do professor:**
>
> "Resumindo os dois pontos do dia:
>
> **Cadeia de construtores:** quando você cria um objeto, os construtores rodam de cima para baixo — `Object` primeiro, subclasse mais específica por último. `super()` obrigatoriamente primeiro porque os atributos herdados precisam existir antes de qualquer código da subclasse.
>
> **`super.método()`:** quando sobrescreve, você pode substituir o comportamento inteiro ou acrescentar em cima do que a superclasse faz. Usar `super.método()` evita duplicação e garante que mudanças na superclasse propagam automaticamente.
>
> Agora os exercícios. O 1 é prever saída — façam na mão antes de compilar. O 2 é a cadeia de toString() com super — três níveis. O 3 é cálculo composto com super usando impostos — aplica o mesmo padrão da ContaPremiada. O 4 é uma hierarquia maior com três níveis de status(). O 5 é troubleshooting com os três erros clássicos deste encontro."

---

## Notas do Professor

**Erros comuns — antecipe:**

1. **"O output do `new Z()` começa com `Z()`"** — erro de intuição muito comum. A turma sente que o que foi chamado por último deveria rodar por último. Reforce com a analogia da matrioska: você monta de fora para dentro, mas o interior só fica visível depois. Se necessário, mostre o diagrama de sequência da seção 2 na plataforma.

2. **Chamar `super()` em qualquer lugar que não a primeira linha** — o compilador já bloqueia com `call to super must be first statement in constructor`. Mostre o erro ao vivo se alguém tentar. Não pule: ver o erro de compilação é o que grava a regra.

3. **`@Override` em método `static`** — se alguém tentar, vai aparecer o erro `method does not override or implement a method from a supertype` (no IntelliJ) ou `static method cannot override instance method`. Aproveite o erro para explicar method hiding.

4. **Shadowing de atributos** — declarar um campo com o mesmo nome na subclasse que na superclasse cria dois campos distintos. O Exercício 5 tem exatamente esse bug. Se ninguém perceber, projete os dois campos no debugger para mostrar que existem dois `marca` no mesmo objeto.

**Conexão com o próximo encontro:**

No E12b, vamos ver `equals()` e `hashCode()` — o contrato que conecta os dois e por que quebrá-lo causa bugs silenciosos em `HashSet` e `HashMap`. No E13, `Funcionario` vai virar uma classe abstrata com `calcularSalario()` abstrato.

**Perguntas avançadas que podem surgir:**

- *"Por que `@Override` não pega o erro de shadowing?"* — `@Override` só valida que a assinatura do método é idêntica à da superclasse. Shadowing é um problema de campo (atributo), não de método — o compilador não reclama, mas o comportamento pode surpreender.

- *"E se eu não chamar `super()` em hipótese alguma no construtor?"* — Se a superclasse tem um construtor padrão (sem parâmetros), Java insere `super()` implícito. Se não tem, o compilador exige que você chame explicitamente `super(args)` — não compila sem isso.

**Se sobrar tempo:**

- Mostre no depurador o campo `Veiculo.marca` versus `Carro.marca` em um objeto que sofreu shadowing — os dois campos coexistem no mesmo objeto com valores diferentes
- Pergunte: "O que acontece se chamarmos `super.toString()` dentro de `Carro.toString()` quando há shadowing?" — `Veiculo.toString()` enxerga `Veiculo.marca`, não `Carro.marca`. A saída mostra o campo da superclasse, não o da subclasse.

---

## Gabarito — Atividades Interativas

---

### Atividade 1 — Aquecimento: revise o E11

| Situação ou regra | Resposta correta |
|-------------------|:----------------:|
| Palavra-chave que declara herança | `extends` |
| Primeira instrução no construtor da subclasse | `super()` |
| Modificador de acesso para herança | `protected` |
| Anotação de validação de sobrescrita | `@Override` |
| Operador de verificação de tipo em runtime | `instanceof` |
| Conversão de subclasse para superclasse | `upcasting` |

> 💡 **Condução:** o fill-table aceita variações de capitalização e espaço. `Super()` e `super()` são aceitos. Se alguém escreve `is-a` para upcasting, explique que upcasting é o mecanismo — a relação é É-UM, a operação é upcasting.

---

### Atividade 2 — Quem inicializa o quê na cadeia de construtores

**Gabarito:**

| Campo do objeto final | Construtor responsável |
|-----------------------|:---------------------:|
| `placa = "ABC-1"` | `Veiculo` |
| `marca = "Tesla"` | `Veiculo` |
| `ano = 2023` | `Veiculo` |
| `numeroPortas = 4` | `Carro` |
| `autonomiaKm = 500` | `CarroEletrico` |

**Por que essa divisão importa:**

Cada classe inicializa apenas os campos que ela própria declara. `Veiculo` não sabe o que é `autonomiaKm` — e não precisa. `CarroEletrico` não sabe como `Veiculo` usa `placa` — só repassa. O `super()` é o mecanismo de delegação: "eu cuido do que é meu e passo o restante para cima".

> 💡 **Se alguém colocou `CarroEletrico` para `placa`:** explique que `placa` é declarada como `protected String placa` em `Veiculo`. Quem declara o campo é quem o inicializa no construtor. `CarroEletrico` apenas repassa o valor via `super()` sem nenhuma atribuição direta.

---

### Atividade 3 — Trace as camadas: super.método() em ação

**Gabarito (saldo = 1000, vip = true):**

| O que está sendo calculado | Resposta |
|---------------------------|:--------:|
| `Conta.calcularRendimento()` (saldo × 0,005) | `5.0` |
| `super.calcularRendimento()` dentro de `ContaPremiada` | `5.0` |
| Bônus VIP (base × 0,5) | `2.5` |
| `ContaPremiada.calcularRendimento()` (base + bonus) | `7.5` |

**Por que as linhas 1 e 2 têm o mesmo valor:**

`super.calcularRendimento()` é exatamente a chamada do método de `Conta`. O resultado é idêntico ao de `Conta.calcularRendimento()` para o mesmo `saldo`. Não existe transformação no meio — é uma delegação direta.

> 💡 **Erro mais comum:** aluno coloca `2.5` na linha 2 porque "já está dentro de ContaPremiada". Isso indica confusão entre "o que super retorna" e "o que this calcula". Corrija: `super.calcularRendimento()` chama a implementação de `Conta`, não a de `ContaPremiada`. A variável `this` não influencia qual implementação é chamada quando você usa `super`.

---

---

## Gabarito — Exercícios Práticos

---

### Exercício 1 — Rastreando a cadeia de construtores

> 💬 **Condução sugerida:**
>
> Peça à turma que escreva as três respostas no papel antes de compilar. O item c) é o mais revelador — muita gente não percebe que `new Y()` ativa `X()` sem argumento, não `X(int)`.

**a) `new Z()`**

```
X(42)
Y(42)
Z()
```

| Ordem | O que acontece | Imprime |
|:-----:|---------------|:-------:|
| 1 | `Z()` → `super(42)` → `Y(42)` → `super(42)` → `X(int 42)` executa | `X(42)` |
| 2 | `X(42)` termina → `Y(42)` retoma e executa seu corpo | `Y(42)` |
| 3 | `Y(42)` termina → `Z()` retoma e executa seu corpo | `Z()` |

**b) `new Y(7)`**

```
X(7)
Y(7)
```

`Y(int n)` chama `super(n)` → entra em `X(int 7)` → imprime `X(7)`. `X(7)` termina → `Y(7)` imprime `Y(7)`. `Z` não participa — não foi chamado.

**c) `new Y()`**

```
X()
Y()
```

`Y()` sem argumento **não** tem `super()` explícito → Java insere `super()` implícito → entra em `X()` (sem argumento, não `X(int)`). `X()` imprime `X()`. `Y()` imprime `Y()`.

> 💡 **Por que c) é importante:** muita gente assume que `new Y()` vai chamar `X(int)` de alguma forma. Não — Java insere `super()` sem argumentos, que mapeia para `X()`, o construtor sem parâmetros. Se `X` não tivesse esse construtor, não compilaria.
>
> **Pergunta de aprofundamento:** "E se `Z()` fosse `Z() { System.out.println("Z()"); super(42); }`?" — não compila. `super()` deve ser a primeira instrução.

---

### Exercício 2 — Sobrescrevendo `toString()`

> 💬 **Condução sugerida:**
>
> Antes de mostrar o gabarito, pergunte: "Qual a saída esperada?" A turma deve responder `[Ser:Ana][Pessoa:111.111.111-11][Estudante:MAT001-Ciência da Computação]`. Se alguém der só `[Estudante:MAT001-CC]`, está sobrescrevendo sem chamar `super` — a parte `[Ser:...]` e `[Pessoa:...]` sumiu.

```java
class Ser {
    protected String nome;

    Ser(String nome) { this.nome = nome; }

    @Override
    public String toString() {
        return "[Ser:" + nome + "]";
    }
}

class Pessoa extends Ser {
    private String cpf;

    Pessoa(String nome, String cpf) {
        super(nome);
        this.cpf = cpf;
    }

    @Override
    public String toString() {
        return super.toString() + "[Pessoa:" + cpf + "]";
    }
}

class Estudante extends Pessoa {
    private String matricula;
    private String curso;

    Estudante(String nome, String cpf, String matricula, String curso) {
        super(nome, cpf);
        this.matricula = matricula;
        this.curso     = curso;
    }

    @Override
    public String toString() {
        return super.toString() + "[Estudante:" + matricula + "-" + curso + "]";
    }
}
```

**Saída de `new Estudante("Ana", "111.111.111-11", "MAT001", "Ciência da Computação").toString()`:**

```
[Ser:Ana][Pessoa:111.111.111-11][Estudante:MAT001-Ciência da Computação]
```

**Trace de execução:**

1. `Estudante.toString()` chama `super.toString()` → entra em `Pessoa.toString()`
2. `Pessoa.toString()` chama `super.toString()` → entra em `Ser.toString()`
3. `Ser.toString()` retorna `"[Ser:Ana]"`
4. `Pessoa.toString()` concatena: `"[Ser:Ana]" + "[Pessoa:111.111.111-11]"` → retorna
5. `Estudante.toString()` concatena: `"[Ser:Ana][Pessoa:111.111.111-11]" + "[Estudante:MAT001-Ciência da Computação]"` → retorna

> 💡 **Ponto para destacar:** `super.toString()` dentro de `Estudante` retorna o resultado **completo** de `Pessoa.toString()` — que já inclui a parte de `Ser`. Não é só a string que `Pessoa` adicionou. É tudo.

---

### Exercício 3 — Cálculo Composto com `super`

> 💬 **Condução sugerida:**
>
> Peça que calculem os valores para `base = 1000` na mão antes de implementar. Quem calcular `ICMSInterestadual` como `base * 0.13` (somando as alíquotas diretamente) está errado — não entendeu o encadeamento de `super`. O valor correto é `130.0`, mas o *caminho* importa.

```java
class Imposto {
    double calcular(double baseCalculo) {
        return baseCalculo * 0.10;
    }
}

class ICMS extends Imposto {
    @Override
    double calcular(double base) {
        return super.calcular(base) + base * 0.02;
        // super.calcular(1000) = 100.0
        // + 1000 * 0.02 = 20.0
        // total: 120.0
    }
}

class ICMSInterestadual extends ICMS {
    @Override
    double calcular(double base) {
        return super.calcular(base) + base * 0.01;
        // super.calcular(1000) chama ICMS.calcular → 120.0
        // + 1000 * 0.01 = 10.0
        // total: 130.0
    }
}
```

**Trace com `base = 1000`:**

| Objeto | `super.calcular(1000)` retorna | Adicionado | Total |
|--------|:-----------------------------:|:----------:|:-----:|
| `new Imposto()` | — | `1000 × 0,10 = 100` | **100,0** |
| `new ICMS()` | `100,0` (via Imposto) | `1000 × 0,02 = 20` | **120,0** |
| `new ICMSInterestadual()` | `120,0` (via ICMS) | `1000 × 0,01 = 10` | **130,0** |

**Main de demonstração:**

```java
public static void main(String[] args) {
    double base = 1000.0;

    Imposto          i  = new Imposto();
    ICMS             ic = new ICMS();
    ICMSInterestadual ii = new ICMSInterestadual();

    System.out.printf("Imposto:           R$ %.2f%n", i.calcular(base));  // 100,00
    System.out.printf("ICMS:              R$ %.2f%n", ic.calcular(base)); // 120,00
    System.out.printf("ICMSInterestadual: R$ %.2f%n", ii.calcular(base)); // 130,00
}
```

> 💡 **Erro a antecipar:** quem faz `ICMSInterestadual.calcular` retornar `base * 0.13` está ignorando o `super.calcular` e somando as taxas manualmente. Isso quebra a cadeia: se `ICMS` mudar sua alíquota interna, `ICMSInterestadual` não vai acompanhar.

---

### Exercício 4 — Hierarquia de Dispositivos

> 💬 **Condução sugerida:**
>
> Este exercício tem três níveis (`Dispositivo → Computador → Notebook` e `Computador → ServidorRack`). O ponto pedagógico é o `status()` encadeado — cada nível chama `super.status()` e acrescenta suas informações. Permita 15–20 minutos.

```java
public class Dispositivo {
    protected String  id;
    protected String  fabricante;
    protected boolean ligado;

    public Dispositivo(String id, String fabricante) {
        this.id         = id;
        this.fabricante = fabricante;
        this.ligado     = false;
    }

    public void ligar()    { ligado = true;  }
    public void desligar() { ligado = false; }

    public String status() {
        return String.format("[%s | %s | %s]",
            id, fabricante, ligado ? "LIGADO" : "DESLIGADO");
    }
}

public class Computador extends Dispositivo {
    private String processador;
    private int    ramGB;

    public Computador(String id, String fabricante, String processador, int ramGB) {
        super(id, fabricante);
        this.processador = processador;
        this.ramGB       = ramGB;
    }

    public void inicializarSistema() {
        if (!ligado) throw new IllegalStateException("Ligue o dispositivo primeiro.");
        System.out.println(id + " inicializando sistema operacional...");
    }

    @Override
    public String status() {
        return super.status()
             + String.format(" | CPU: %s | RAM: %dGB", processador, ramGB);
    }
}

public class Notebook extends Computador {
    private int bateriaPct;

    public Notebook(String id, String fabricante, String processador, int ramGB) {
        super(id, fabricante, processador, ramGB);
        this.bateriaPct = 100;
    }

    public void carregarBateria(int pct) {
        bateriaPct = Math.min(100, bateriaPct + pct);
    }

    @Override
    public String status() {
        return super.status()
             + String.format(" | Bateria: %d%%", bateriaPct);
    }
}

public class ServidorRack extends Computador {
    private int slots;
    private int slotsOcupados;

    public ServidorRack(String id, String fabricante, String processador, int ramGB, int slots) {
        super(id, fabricante, processador, ramGB);
        this.slots         = slots;
        this.slotsOcupados = 0;
    }

    public void adicionarDisco() {
        if (slotsOcupados >= slots)
            throw new IllegalStateException("Todos os slots ocupados.");
        slotsOcupados++;
    }

    @Override
    public String status() {
        return super.status()
             + String.format(" | Discos: %d/%d", slotsOcupados, slots);
    }
}
```

**Exemplo de saída (Notebook ligado, 80% de bateria):**

```
[NB-001 | Dell | LIGADO] | CPU: i7 | RAM: 16GB | Bateria: 80%
 ↑ Dispositivo.status()   ↑ Computador adiciona  ↑ Notebook adiciona
```

> 💡 **Ponto de discussão:** `inicializarSistema()` verifica `ligado` com `if (!ligado)`. O atributo `ligado` é `protected` em `Dispositivo` — acessível em `Computador` diretamente. Se fosse `private`, precisaria de um getter. Pergunte: "qual seria o getter adequado?" — `isLigado()` para boolean, não `getLigado()`.

---

### Exercício 5 — Diagnóstico: `super()`, `@Override` e Shadowing

> 💬 **Condução sugerida:**
>
> Este exercício tem três erros distintos. Peça que identifiquem um de cada vez. O erro 3 (shadowing) é o mais difícil — a maioria não percebe que existem dois campos `marca` no mesmo objeto sem ver no debugger.

**Os três erros e suas correções:**

---

**Erro 1 — `super()` não é a primeira linha**

```java
// ❌ Código com erro
Carro(String marca, int ano, String modelo) {
    this.marca = marca;   // ← tenta usar campo antes de super() — não compila
    super(marca, ano);    // ← super() deve ser a PRIMEIRA instrução
}

// ✅ Correto
Carro(String marca, int ano, String modelo) {
    super(marca, ano);    // ← primeiro inicializa Veiculo
    this.modelo = modelo; // ← só depois usa/inicializa o próprio Carro
}
```

**Conceito violado:** ordem da cadeia de construtores — a superclasse deve ser inicializada antes de qualquer uso de `this`.

---

**Erro 2 — `@Override` com assinatura errada (sobrecarga, não sobrescrita)**

```java
// ❌ Código com erro
@Override
public String toString(int formato) { // ← parâmetro extra → assinatura diferente
    return "[" + marca + "]";
    // Erro: method does not override or implement a method from a supertype
}

// ✅ Correto
@Override
public String toString() {           // ← assinatura idêntica à de Object
    return "[" + marca + "]";
}
```

**Conceito violado:** regra de sobrescrita — a assinatura (nome + parâmetros) deve ser idêntica à da superclasse. Adicionar `int formato` cria uma *sobrecarga*, não uma *sobrescrita*. `@Override` detecta a divergência e impede a compilação.

---

**Erro 3 — Shadowing de atributo**

```java
// ❌ Código com erro
class Carro extends Veiculo {
    private String marca;  // ← NOVO campo 'marca' — esconde o 'protected marca' de Veiculo
    // Agora existem DOIS campos 'marca': Veiculo.marca e Carro.marca
    // Veiculo.marca é inicializado pelo super(), Carro.marca nunca é inicializado → null
}

// ✅ Correto — remover a declaração duplicada
class Carro extends Veiculo {
    // 'marca' já existe como protected em Veiculo — use diretamente
    private String modelo; // campo próprio de Carro, não duplicata

    Carro(String marca, int ano, String modelo) {
        super(marca, ano);    // inicializa Veiculo.marca
        this.modelo = modelo; // inicializa o próprio campo de Carro
    }
}
```

**Conceito violado:** `protected` existe exatamente para esse caso — o atributo herdado já está disponível nas subclasses. Declarar outro campo com o mesmo nome cria dois campos separados, o que causa comportamento inesperado: `super.toString()` usa `Veiculo.marca` (correto), mas `Carro.marca` fica `null`.

**Demonstração no debugger:**

```
Objeto Carro na memória:
  ├─ [Veiculo] marca = "Toyota"    ← inicializado pelo super(marca, ano)
  ├─ [Veiculo] ano   = 2020
  └─ [Carro]   marca = null        ← campo shadow nunca inicializado!
```

> 💡 **Como mostrar ao vivo:** coloque um breakpoint no construtor de `Carro` após o `super(marca, ano)` e inspecione o objeto em `this`. O IntelliJ vai mostrar os dois campos `marca` separados por nível da hierarquia. Esse visual é mais impactante do que qualquer explicação verbal.
