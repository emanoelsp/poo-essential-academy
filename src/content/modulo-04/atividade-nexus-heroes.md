# Atividade Prática — Nexus Heroes

> **Módulo 4 · 100 XP**

## O que é esta atividade

Nexus Heroes é um jogo de arena onde seu herói percorre um mapa coletando itens, enfrentando inimigos e ativando armadilhas. A cada evento, um **System Console** exibe mensagens que simulam o que aconteceria em Java real: construtores sendo chamados, setters validando invariantes, exceções sendo lançadas, métodos sobrescritos com `@Override`.

**O jogo não entrega o código Java — ele mostra o comportamento. Você escreve o código.**

```game-launch
URL: /nexus-heroes
TITLE: Iniciar sua Jornada — Nexus Heroes
DESCRIPTION: Entre na arena, explore o mapa inteiro e leia cada mensagem do console com atenção. Você vai precisar dessas informações para implementar o sistema em Java.
BUTTON: 🎮 Entrar na Arena
```

---

## Antes de programar: documente o que você viu

Jogue pelo menos uma partida completa até o portal. Depois responda — **sem consultar nenhuma fonte externa** — com base apenas no que o console mostrou:

**1. Sobre a criação do herói:**
Quando você escolheu o herói, o console exibiu uma mensagem de `[INSTANCIAÇÃO]`. O que ela revela sobre o construtor? Quais parâmetros foram passados? Qual classe foi chamada antes do construtor do herói?

**2. Sobre os cristais de Mana e orbes de Vida:**
O console exibiu mensagens de `[INVARIANTE]` ao coletar esses itens. O que o setter estava validando? O que acontece se o valor calculado ultrapassar o limite? E se ficar abaixo de zero?

**3. Sobre as armadilhas:**
O console exibiu uma `[EXCEÇÃO]` ao pisar em armadilha. Que tipo de exceção foi lançada? O que acontece com o HP após o lançamento — o setter permite valor negativo?

**4. Sobre os inimigos:**
O console exibiu `[OVERRIDE]` ao enfrentar um inimigo. Qual método foi sobrescrito? De qual classe ele veio originalmente? O que o herói retorna nesse método?

---

## Sua missão: implementar o sistema em Java

Com base no que você observou, crie um projeto Java que reproduza o comportamento do jogo. A hierarquia tem uma classe abstrata no topo e duas subclasses concretas — você viu isso no console ao escolher o herói.

**Regras para implementar:**

- A classe do topo da hierarquia deve ser **abstrata** — você não pode instanciá-la diretamente
- Os atributos de estado (HP, Mana e seus máximos) devem ser **protegidos** — visíveis nas subclasses, ocultos fora delas
- Os **setters** devem aplicar as mesmas regras que o console mostrou — sem valores negativos, sem ultrapassar o máximo
- Cada herói deve **sobrescrever** o método de cálculo de dano com `@Override`
- As **exceções** lançadas no jogo devem existir como classes Java separadas
- A classe `Main` deve simular ao menos 3 eventos do jogo usando `try-catch`

---

## Checklist de entrega

Antes de enviar, verifique se seu projeto contém:

- [ ] Classe abstrata no topo da hierarquia com o construtor correto
- [ ] Atributos de estado com a visibilidade adequada
- [ ] Setter de HP com a invariante que o console demonstrou
- [ ] Setter de Mana com a invariante que o console demonstrou
- [ ] Exceção para personagem derrotado (HP zero)
- [ ] Exceção para mana insuficiente
- [ ] Subclasse Guerreiro com `super(...)` e `@Override`
- [ ] Subclasse Mago com `super(...)` e `@Override`
- [ ] Classe `Main` com `try-catch` cobrindo ao menos 3 cenários

---

## Envio

Suba seu projeto no GitHub e cole o link abaixo.

```github-submit
LABEL: Cole o link do seu repositório GitHub
PLACEHOLDER: https://github.com/seu-usuario/nexus-heroes-java
```
