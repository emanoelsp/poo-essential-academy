# Atividade prática — Nexus dos Heróis: O Contrato Final

> **Módulo 5 · integração das aulas 1–17 · 150 XP**

## O que mudou nesta versão

O **Nexus dos Heróis original** continua disponível no encontro do Módulo 4 e não foi alterado. Ele continua sendo a atividade de descoberta de classes, objetos, métodos, construtores, encapsulamento, invariantes, herança, exceções e classes abstratas.

Esta é uma **cópia evoluída**, criada para depois da Aula 17. Ela retoma os mesmos princípios e acrescenta os dois contratos que faltavam:

- **polimorfismo:** uma chamada feita pelo tipo geral encontra a implementação do objeto real;
- **interface:** o código cliente depende de uma capacidade/contrato, e não da classe concreta.

O jogo agora tem uma finalidade dupla: vencer o labirinto e sair com um conjunto de evidências que permita construir o diagrama de classes sem inventar relações. A arena evoluída usa a escala do Nexus original, ocupa a tela inteira e mantém o **System Console fixo ao lado**.

```game-launch
URL: /nexus-heroes-evolution
TITLE: Nexus dos Heróis — O Contrato Final
DESCRIPTION: Explore o labirinto, leia o System Console e abra o Codex de Evidências. Cada descoberta vira uma pista para o seu diagrama de classes.
BUTTON: 🎮 Iniciar a evolução
```

---

## 1. A história: o Contrato Primordial foi quebrado

Depois da primeira aventura, o Nexus passou a funcionar com vários tipos de heróis e inimigos. O problema é que o núcleo do jogo começou a conhecer detalhes demais: perguntava a classe de cada personagem, alterava HP diretamente e criava regras diferentes para cada habilidade.

Então surgiu a entidade **Acoplamento**. Ela roubou o **Contrato Primordial** e dividiu sua energia em quatro fragmentos:

1. **Estado protegido:** ninguém pode alterar HP e Mana de qualquer jeito;
2. **Regra de substituição:** todo `Personagem` deve poder cumprir o comportamento prometido;
3. **Resposta polimórfica:** a mesma solicitação pode produzir comportamentos diferentes;
4. **Contrato de habilidade:** o usuário de uma habilidade não precisa conhecer sua classe concreta.

Os fragmentos estão escondidos no labirinto. Os guardiões também foram modelados como objetos diferentes, então não basta decorar o nome deles. Você precisa observar qual mensagem foi chamada, qual objeto respondeu e qual regra foi preservada.

> **Missão narrativa:** recupere os quatro fragmentos, alcance o portal e entregue o Codex de Evidências para a equipe que vai desenhar a próxima versão do jogo.

---

## 2. Como jogar com intenção de modelagem

Faça uma partida completa e mantenha o **Codex de Evidências** aberto. O mapa é maior, dividido em quatro alas e usa a mesma escala de exploração do Nexus original; cada símbolo tem uma função pedagógica.

| Símbolo | Descoberta no jogo | Evidência que você deve registrar |
|---|---|---|
| 📦 | Baú de relíquia | Quem é criado? Qual classe pode representar o item? Qual método adiciona ao inventário? |
| 💎 | Cristal de Mana | Qual atributo está protegido? Qual método altera o estado? Qual invariante é preservada? |
| ⚠️ | Armadilha | Qual exceção representa o evento? O setter ou método permite HP negativo? |
| 👾 🗿 🌑 | Guardiões | Qual é a superclasse? Qual tipo concreto respondeu à chamada? Onde aparece `@Override`? |
| 🔗 | Fragmento de interface | Qual é o contrato? Quem o implementa? O cliente conhece as classes concretas? |
| 🌀 | Portal | Por que a vitória depende das evidências, e não apenas de chegar à saída? |

### As quatro alas e os portões

O mapa foi dividido em quatro regiões fechadas. Cada portão tem uma linguagem visual própria e só abre quando a quest correspondente é respondida no pergaminho. A pista da resposta precisa ser encontrada no próprio ambiente: conversa com NPC, baú, cristal, armadilha, inimigo derrotado ou fragmento escondido.

| Região | Portão | Quest | Fontes de pista |
|---|---|---|---|
| Ala do Molde | Ferro | Classes e objetos | NPC, baú e inimigo de tipos |
| Câmara do Estado | Bronze | Encapsulamento e invariantes | Cristal, armadilha e console |
| Forja da Linhagem | Pedra | Herança e classe abstrata | Guardião derrotado e placa da forja |
| Observatório dos Contratos | Nexus | Polimorfismo e interface | Fragmento escondido, interface e Sombra do Cast |

O estudante não atravessa um portão por tentativa aleatória: primeiro encontra a pista, depois associa o conceito à explicação correta no pergaminho. Ao concluir as quatro quests, o portal final fica acessível.

### Roteiro de investigação

1. Na tela inicial, escolha um **Guerreiro**, **Mago** ou **Sentinela**. Observe que os três são variações de `Personagem`, mas têm valores e comportamentos próprios.
2. Ao iniciar, localize no console o `new`, o construtor e a chamada a `super(...)`. Registre a classe concreta e os atributos que nascem com o objeto.
3. Explore a primeira ala, converse com o NPC ou abra o baú e vá até o portão de ferro. Leia o pergaminho e associe **Classe × Objeto**.
4. Na segunda ala, visite o cristal e a armadilha. Compare o que o código cliente pede com o que o próprio objeto permite fazer com seu estado. Use a pista para resolver o portão de bronze.
5. Derrote o guardião da Forja da Linhagem e leia a placa. A resposta do portão de pedra deve relacionar `Personagem` abstrata com os tipos concretos.
6. Encontre o fragmento escondido, interaja com a interface e observe a Sombra do Cast. No último pergaminho, associe a mesma chamada à resposta do objeto real e ao contrato `Habilidade`.
7. Abra o Codex antes de ir ao portal. Verifique quais evidências ainda faltam. Só depois conclua a missão.

> **Regra de ouro:** não copie apenas o texto do console. Para cada evidência, escreva: **quem solicita**, **qual contrato é conhecido**, **qual objeto responde** e **qual regra é protegida**.

---

## 3. O mapa vira um modelo de objetos

O jogo não é um diagrama pronto. Ele é uma fonte de requisitos. Transforme cada descoberta em uma ficha:

| Ficha | Perguntas para responder |
|---|---|
| Objeto | Que entidade existe no jogo? Qual é o seu nome e estado? |
| Classe | Quais objetos compartilham estrutura e comportamento? |
| Atributo | O que precisa ser guardado? Qual visibilidade faz sentido? |
| Método | Que ação esse objeto sabe executar? Quem é responsável por ela? |
| Construtor | O que precisa ser válido no instante do `new`? |
| Invariante | Que regra deve ser verdadeira antes e depois de cada operação? |
| Herança | Existe relação **é-um**? O subtipo pode substituir o tipo geral? |
| Polimorfismo | Qual chamada é feita pelo tipo geral e qual implementação responde? |
| Interface | Qual capacidade atravessa classes diferentes? Qual promessa o cliente usa? |

Preencha esta tabela durante ou logo após a partida:

```fill-table
COL1: Elemento observado
COL2: Sua evidência
LEGEND: Não escreva só o nome. Registre a relação e a responsabilidade descoberta no jogo.
Herói escolhido — classe concreta e superclasse | 
Estado protegido — atributo e método responsável | 
Invariante de HP ou Mana | 
Guardião — chamada geral e implementação concreta | 
Interface — nome do contrato e classes que podem implementá-lo | 
Item — classe, objeto e método de inventário | 
Exceção — evento e regra protegida | 
```

---

## 4. A ponte entre a ação e o Java

### 4.1 Encapsulamento não é apenas `private`

O console mostra `private mana`, mas o aprendizado importante é a responsabilidade: o código de fora pede `restaurarMana(35)`; ele não escreve `heroi.mana = 999`.

```java
public abstract class Personagem {
    private int hp;
    private final int maxHp;

    protected Personagem(int hpInicial) {
        if (hpInicial <= 0) throw new IllegalArgumentException("HP inicial inválido");
        this.hp = hpInicial;
        this.maxHp = hpInicial;
    }

    public final void receberDano(int valor) {
        if (valor < 0) throw new IllegalArgumentException("Dano não pode ser negativo");
        this.hp = Math.max(0, this.hp - valor);
    }

    public int getHp() {
        return hp;
    }
}
```

Pergunte ao grupo: o que seria quebrado se `hp` fosse público? O método `receberDano()` é apenas um setter com outro nome ou ele protege uma regra do domínio?

### 4.2 Herança cria uma família, não um comportamento único

```java
public abstract class Personagem {
    public abstract int calcularDano();
}

public final class Guerreiro extends Personagem {
    @Override
    public int calcularDano() { return 26; }
}

public final class Mago extends Personagem {
    @Override
    public int calcularDano() { return 34; }
}
```

O console deixa uma evidência real de `@Override`: a chamada é `calcularDano()`, mas a resposta muda conforme o objeto real.

### 4.3 Onde está o polimorfismo nesta atividade?

Ele está no momento em que o jogo faz uma chamada por uma referência geral:

```java
List<Personagem> grupo = List.of(
    new Guerreiro("Ayla"),
    new Mago("Nilo"),
    new Sentinela("Iara")
);

for (Personagem personagem : grupo) {
    int dano = personagem.calcularDano();
    System.out.println(dano);
}
```

O `for` não precisa de `if (personagem instanceof Guerreiro)` para calcular o dano. A chamada é a mesma; a JVM seleciona a implementação sobrescrita do objeto real. No jogo, essa evidência aparece no console como:

> `List<Personagem> grupo → personagem.calcularDano() → implementação de Guerreiro/Mago/Sentinela`

**O que ele faz aqui?** Ele permite que o combate seja ampliado com um novo tipo de personagem sem modificar o código que percorre e solicita o dano. O processamento depende de `Personagem`; a variação fica nas subclasses.

### 4.4 Onde está a interface?

O botão **Usar contrato** não precisa conhecer a classe concreta do herói. Ele trabalha com uma capacidade:

```java
public interface Habilidade {
    void usar(Personagem alvo);
}

public final class ExplosaoArcana implements Habilidade {
    @Override
    public void usar(Personagem alvo) {
        alvo.receberDano(48);
    }
}

public final class PosturaGuardia implements Habilidade {
    @Override
    public void usar(Personagem alvo) {
        // outra implementação do mesmo contrato
    }
}
```

**O que a interface faz aqui?** Ela separa “uma coisa que pode ser usada como habilidade” da hierarquia dos personagens. O botão, o processador ou uma futura classe `Inimigo` podem depender de `Habilidade` sem conhecer `ExplosaoArcana`, `PosturaGuardiã` ou suas classes irmãs.

| Pergunta | Polimorfismo por herança | Interface |
|---|---|---|
| O que varia? | A implementação de um comportamento em uma família de `Personagem`. | Uma capacidade/contrato que pode atravessar famílias diferentes. |
| Exemplo no jogo | `Personagem.calcularDano()` responde diferente. | `Habilidade.usar()` é chamado pelo botão. |
| Relação no UML | Generalização: `Guerreiro` —|> `Personagem`. | Realização: `ExplosaoArcana` ..|> `Habilidade`. |
| Pergunta de projeto | “Este objeto é um tipo de Personagem?” | “Este objeto sabe cumprir o contrato Habilidade?” |

---

## 5. Antes de desenhar: confira se você sabe nomear as peças

O diagrama de verdade vai para uma ferramenta externa — mas antes de abrir o draw.io ou o Lucidchart, confirme aqui se você já sabe nomear classes, atributos e métodos sem olhar o console. Preencha os campos tracejados; o quadro corrige na hora.

```fill-uml
CLASS:Personagem
ATTR:nome : String
ATTR:___:hp : int
ATTR:maxHp : int
METHOD:___:receberDano(int) void
METHOD:calcularDano() int

CLASS:___:Guerreiro
METHOD:calcularDano() int

CLASS:___:Habilidade
METHOD:___:usar(Personagem) void

CLASS:ExplosaoArcana
METHOD:usar(Personagem) void
```

> **Dica:** se travar em algum campo, volte à seção 4 — cada resposta apareceu em um bloco de código ali em cima.

---

## 6. Construa o diagrama de classes a partir do Codex

Agora desenhe o primeiro modelo do jogo. Comece com os nomes que você realmente encontrou; só depois acrescente atributos e métodos.

### Passo 1 — classes e interface

Liste as classes `Personagem`, `Guerreiro`, `Mago`, `Sentinela`, `Inimigo`, `Goblin`, `Golem`, `Sombra`, `Item`, `Reliquia` e a interface `Habilidade`. Não coloque tudo em uma única classe `Jogo`.

### Passo 2 — relações

- use generalização quando houver relação **é-um**;
- use realização quando uma classe **implementa** `Habilidade`;
- use associação quando `Jogo` mantém ou utiliza objetos;
- indique multiplicidade quando o jogo mostrar um ou vários objetos;
- não transforme todo uso momentâneo em herança.

Pratique o reconhecimento do tipo de relação nos vínculos que `Jogo` mantém com os outros objetos (generalização e realização ficam combinadas no esqueleto abaixo — aqui o foco é associação × agregação):

```relationship-uml
CLASS:Jogo
CLASS:Personagem
CLASS:Habilidade
REL:Jogo->Personagem:aggregation:coordena
REL:Jogo->Habilidade:association:aciona
```

### Passo 3 — responsabilidades

Para cada classe, escolha no máximo os atributos e métodos que ela realmente precisa. Uma pista útil:

- `Personagem` protege estado comum e declara `calcularDano()`;
- cada subtipo de personagem define sua própria forma de calcular dano;
- `Habilidade` declara o contrato `usar(...)`;
- `Jogo` coordena o fluxo, mas não deve conhecer a fórmula interna de cada herói;
- `Item` representa o objeto coletável; o inventário decide como armazená-lo.

### Esqueleto para completar

```mermaid
classDiagram
    class Personagem {
        <<abstract>>
        -String nome
        -int hp
        -int maxHp
        +receberDano(int) void
        +getHp() int
        +calcularDano() int
    }
    class Guerreiro
    class Mago
    class Sentinela
    class Habilidade {
        <<interface>>
        +usar(Personagem) void
    }
    class Jogo {
        -List~Personagem~ participantes
        +mover() void
        +atacar() void
    }
    Personagem <|-- Guerreiro
    Personagem <|-- Mago
    Personagem <|-- Sentinela
    Jogo o-- Personagem : coordena
```

Complete o diagrama com as classes de inimigo, os itens e pelo menos duas implementações de `Habilidade`. Depois escreva uma justificativa curta para cada seta.

### Passo 4 — leve o esqueleto para o draw.io ou o Lucidchart

O esqueleto acima é só o ponto de partida. O diagrama que você entrega precisa ser desenhado em uma ferramenta de verdade — não em markdown.

1. Abra o [draw.io](https://app.diagrams.net/) (gratuito, sem login — "Device" → "Create New Diagram" → template em branco) **ou** o [Lucidchart](https://lucid.app/) (login com Google funciona).
2. Procure a forma **UML Class** na paleta de formas à esquerda (em ambas as ferramentas existe uma categoria "UML").
3. Para cada classe do Passo 1, crie uma caixa com três compartimentos: nome, atributos, métodos — copie os nomes exatos que você já validou na seção 5.
4. Trace as setas seguindo a notação:

| Relação | Como desenhar | Onde aparece aqui |
|---|---|---|
| Generalização (herança) | seta com ponta **triangular vazada**, apontando para a superclasse | `Guerreiro`/`Mago`/`Sentinela` → `Personagem` |
| Realização (interface) | seta **tracejada** com ponta triangular vazada | `ExplosaoArcana`/`PosturaGuardia` → `Habilidade` |
| Associação/Agregação | linha simples ou com losango vazado, conforme você praticou no Passo 2 | `Jogo` → `Personagem`, `Jogo` → `Habilidade` |

5. Marque `Personagem` e `Habilidade` com o estereótipo `<<abstract>>` / `<<interface>>` (as ferramentas têm um campo específico para isso na caixa UML).
6. Exporte como PNG ou PDF (`File → Export as`) e salve dentro do seu repositório — é esse arquivo que entra no checklist abaixo.

---

## 7. Entrega da atividade

Suba um repositório no GitHub contendo:

- [ ] narrativa resumida e objetivo do jogo;
- [ ] tabela de evidências preenchida a partir do console;
- [ ] identificação de classe, objeto, atributo, método e construtor;
- [ ] pelo menos duas invariantes e a visibilidade escolhida para protegê-las;
- [ ] explicação de onde ocorre herança e onde ocorre polimorfismo;
- [ ] explicação de onde está a interface e qual acoplamento ela reduz;
- [ ] **arquivo do diagrama de classes** exportado do draw.io/Lucidchart (PNG ou PDF), com `Personagem` abstrata, subclasses e `Habilidade`;
- [ ] três chamadas do console transcritas e traduzidas para Java;
- [ ] **código Java** que implementa as classes e relações do diagrama (pacote compilável, com `Main` simulando os três eventos transcritos);
- [ ] uma proposta de extensão: adicionar um novo herói ou habilidade sem alterar o processador do jogo.

```github-submit
LABEL: Cole o link do seu repositório GitHub
PLACEHOLDER: https://github.com/seu-usuario/nexus-heroes-contrato-final
```

### Perguntas de defesa oral

1. Se `Guerreiro` é um `Personagem`, por que uma variável `Personagem` pode apontar para um `Guerreiro`?
2. Em qual linha do exemplo existe polimorfismo? O que decide a implementação executada?
3. Por que `Habilidade` não precisa ser uma subclasse de `Personagem`?
4. Qual é a diferença entre “o objeto é um `Mago`” e “o objeto implementa `Habilidade`”?
5. Que mudança você faria para adicionar `Arqueiro` sem editar o `for` que calcula dano?
6. Qual atributo não deveria ser público? Qual operação deve preservar sua invariante?

<!-- gabarito-start -->
## Gabarito de orientação para o professor

O núcleo do modelo esperado é:

```mermaid
classDiagram
    class Personagem {
        <<abstract>>
        -String nome
        -int hp
        -int maxHp
        +receberDano(int) void
        +calcularDano() int
    }
    class Guerreiro
    class Mago
    class Sentinela
    class Inimigo {
        <<abstract>>
        -int hp
        +contraAtacar(Personagem) void
    }
    class Goblin
    class Golem
    class Sombra
    class Habilidade {
        <<interface>>
        +usar(Personagem) void
    }
    class ExplosaoArcana
    class PosturaGuardia
    class Jogo {
        -List~Personagem~ participantes
        -List~Habilidade~ habilidades
        +atacar() void
        +usarHabilidade() void
    }
    Personagem <|-- Guerreiro
    Personagem <|-- Mago
    Personagem <|-- Sentinela
    Inimigo <|-- Goblin
    Inimigo <|-- Golem
    Inimigo <|-- Sombra
    Habilidade <|.. ExplosaoArcana
    Habilidade <|.. PosturaGuardia
    Jogo o-- Personagem
    Jogo o-- Habilidade
```

Aceite outras decomposições quando preservarem as responsabilidades e justificarem as relações. O ponto indispensável é que o polimorfismo apareça em uma coleção ou parâmetro do tipo geral e que a interface seja usada como contrato por um cliente que não depende das implementações concretas.
<!-- gabarito-end -->
