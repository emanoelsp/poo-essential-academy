# Nexus Heroes — Atividade Prática de POO

> **Módulo 4 · 100 XP**

## Sobre esta atividade

Você vai jogar **Nexus Heroes**, um jogo de arena 2D onde seu herói percorre um mapa coletando itens, enfrentando inimigos e ativando armadilhas. A cada interação, o console do jogo exibe mensagens que simulam o que aconteceria no Java real: construtores sendo chamados, setters validando invariantes, exceções sendo lançadas, métodos sobrescritos com `@Override`.

Sua missão: **observar essas mensagens, entender os conceitos que elas representam e depois reproduzir o código Java equivalente** no seu ambiente de desenvolvimento.

---

## Instruções de jogo

1. Clique no link abaixo para abrir o jogo
2. Escolha seu herói — **Guerreiro** (mais HP, menos Mana) ou **Mago** (menos HP, muito mais Mana)
3. Digite o nome do seu personagem e clique em **Iniciar Jogo**
4. Mova o herói pelo mapa usando as **setas do teclado** ou o **D-Pad** na lateral
5. Fique atento ao **System Console** — cada evento exibe uma mensagem com o conceito POO relacionado
6. Chegue ao portal 🌀 para vencer a fase

**Elementos do mapa:**

| Ícone | Elemento | O que acontece | Conceito POO |
|-------|----------|----------------|--------------|
| 📦 | Baú | Ganha XP | Instanciação (`new`) |
| 💎 | Cristal de Mana | +15 Mana | Invariante de `setMana()` |
| 🍀 | Orbe de Vida | +20 HP | Invariante de `setVida()` |
| ⚠️ | Armadilha | -15 HP | Exceção lançada |
| 👾 | Inimigo | Combate, -10 HP | `@Override calcularDano()` |
| 🧱 | Parede | Impassável | — |
| 🌀 | Portal | Vitória! | — |

> **Dica:** observe especialmente o que aparece no console ao escolher o herói (instanciação via `super()`), ao tocar em cristais de Mana ou orbes de Vida (invariantes), ao pisar em armadilhas (exceções) e ao enfrentar inimigos (`@Override`).

---

[🎮 Jogar Nexus Heroes](/nexus-heroes)

---

## O que implementar em Java

Após explorar o jogo, você vai criar o equivalente em Java. O jogo mostra o comportamento — você escreve o código que o produz.

**Hierarquia de classes:**

```
Personagem (abstrata)
├── Guerreiro
└── Mago
```

Baseie-se no que o console do jogo exibiu para identificar:
- Quais atributos `Personagem` possui e com que visibilidade (`protected`/`private`)
- O que os construtores recebem como parâmetro
- Quais validações os setters fazem (invariantes de classe)
- Que exceções são lançadas e onde
- Quais métodos são sobrescritos com `@Override`

---

## Checklist de entrega

Antes de enviar, confirme que seu projeto Java contém:

- [ ] Classe abstrata `Personagem` com atributos `protected` (nome, hp, mana, maxHp, maxMana, atk)
- [ ] Construtor de `Personagem` recebendo `String nome, int hp, int mana`
- [ ] Setter `setVida(int hp)` com invariante: `hp` nunca negativo e nunca ultrapassa `maxHp`
- [ ] Setter `setMana(int mana)` com invariante: `mana` nunca negativo e nunca ultrapassa `maxMana`
- [ ] Exceção personalizada `PersonagemDerrotadoException` (quando HP chega a zero)
- [ ] Exceção personalizada `ManaInsuficienteException` (quando não há mana suficiente)
- [ ] Subclasse `Guerreiro` com `super(nome, 120, 40)` no construtor
- [ ] Subclasse `Mago` com `super(nome, 80, 120)` no construtor
- [ ] Método `calcularDano()` em cada subclasse com `@Override`
- [ ] Classe `Main` simulando ao menos 3 eventos do jogo com blocos `try-catch`

---

## Envio

Suba seu projeto no GitHub e cole o link abaixo.

```github-submit
LABEL: Cole o link do seu repositório GitHub
PLACEHOLDER: https://github.com/seu-usuario/nexus-heroes-java
```
