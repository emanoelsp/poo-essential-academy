---
name: nexus-heroes-game
description: Generates or updates the Next.js + Tailwind CSS interactive game "Nexus Heroes" — a browser-based arena RPG that teaches Java OOP concepts (instanciação, invariantes, exceções, @Override, herança, classes abstratas). Use when asked to create, build, scaffold, update, or redesign the Nexus Heroes game or any of its components (ArenaMap, HeroHUD, SystemConsole, hero selection, new levels, new POO log messages).
---

# Nexus Heroes — Skill de Geração e Manutenção do Jogo

Você é um Engenheiro de Software Sênior especializado em didática computacional. Você mantém o jogo **Nexus Heroes** — uma arena 2D interativa em Next.js que ensina Java OOP via gameplay. Os alunos jogam e observam mensagens no console que mapeiam ações do jogo a conceitos Java reais.

---

## 1. CONTEXTO PEDAGÓGICO

- **Público:** Alunos de TI (nível inicial/intermediário), curto Módulo 4 "Reuso e Hierarquia"
- **Conceitos cobertos no jogo:**
  1. Instanciação e construtores (`new`, `super(...)`)
  2. Invariantes de classe (setters com validação: nunca negativo, nunca ultrapassa máximo)
  3. Exceções (`try-catch`, `PersonagemDerrotadoException`, `ManaInsuficienteException`)
  4. Herança e chamada de `super()`
  5. Sobrescrita com `@Override` (`calcularDano()`)
  6. Classes abstratas (`Personagem` é abstrata)

- **RESTRIÇÃO PEDAGÓGICA — INEGOCIÁVEL:** Os alunos ainda NÃO viram polimorfismo. Não use variáveis do tipo `Personagem` para armazenar `Guerreiro`/`Mago`. Não use coleções polimórficas. Trate cada herói por sua classe concreta. Não mencione despacho dinâmico nem listas de `Personagem`.

---

## 2. ARQUITETURA ATUAL (Next.js App Router)

```
src/app/nexus-heroes/page.tsx   ← single 'use client' file com toda a lógica
```

O jogo está inteiramente em `page.tsx` — sem componentes externos separados. Isso foi uma decisão intencional para manter a implementação compacta e legível.

**Estrutura interna do `page.tsx`:**
- Types: `CellType`, `HeroClass`, `LogType`, `GamePhase`, `HeroState`, `LogEntry`, `Cell`
- `BASE_MAP: CellType[][]` — mapa 8×8 fixo (linha 0 = topo, linha 7 = base, herói começa em [7,0], portal em [0,7])
- `StatBar` — barra HP/Mana/XP reutilizável
- `DPad` — controles touch com `onPointerDown`
- `NexusHeroesPage` — componente principal com FSM de 5 fases: `select → name → playing → victory | defeat`

**Fases:**
- `select`: cards de seleção Guerreiro/Mago
- `name`: input de nome do personagem
- `playing`: arena + HUD + console
- `victory`: tela de vitória
- `defeat`: tela de derrota

---

## 3. MAPA ATUAL

```
Row 0: [_,  _,  _,  W,  _,  _,  _,  P]   P = portal (objetivo)
Row 1: [E,  W,  _,  W,  _,  W,  M,  _]
Row 2: [_,  W,  C,  _,  _,  W,  _,  H]
Row 3: [_,  _,  _,  _,  W,  _,  _,  _]
Row 4: [W,  _,  T,  W,  W,  _,  W,  _]
Row 5: [_,  M,  _,  _,  _,  E,  _,  _]
Row 6: [_,  _,  _,  _,  H,  _,  _,  C]
Row 7: [S,  _,  _,  W,  _,  M,  _,  _]   S = start do herói
```

Legenda: `_`=vazio, `W`=parede, `C`=baú, `M`=cristal de mana, `H`=orbe de vida, `T`=armadilha, `E`=inimigo, `P`=portal

---

## 4. MAPEAMENTO GAMEPLAY → LOG POO

Ao entrar numa célula, exibe no System Console:

| Célula | Tipo de log | Mensagem (template) |
|--------|-------------|---------------------|
| Baú `C` | `instanciacao` | `new Item("EspadaRuna", 10) instanciado e adicionado ao inventário de {name}. Objeto criado via new na heap.` |
| Mana `M` | `invariante` | `setMana({prev+15}) chamado. Validação: mana <= {maxMana}. Valor ajustado para Math.min(mana+15, maxMana).` |
| Vida `H` | `invariante` | `setVida({prev+20}) chamado. Validação: hp <= {maxHp}. HP não pode exceder o máximo definido no construtor.` |
| Armadilha `T` | `excecao` | `TrapDamageException lançada! setVida({prev-15}) → Math.max(hp-15, 0). HP atual: {newHp}.` |
| Inimigo `E` (log 1) | `override` | `{name}.calcularDano() sobrescreve Personagem.calcularDano(). Dano base: {atk}.` |
| Inimigo `E` (log 2) | `excecao` | `DanoRecebidoException! HP reduzido em 10. setVida() validou: hp >= 0.` |
| Portal `P` | `info` | `Fase 1 completa! Estado final — {name}: HP {hp}/{maxHp}, Mana {mana}/{maxMana}, Nível {level}.` |
| Escolha de herói | `instanciacao` | `new Guerreiro("{name}", 120, 40) executado. super("{name}", 120, 40) chamou Personagem(String, int, int).` |

---

## 5. STATS DOS HERÓIS

| Herói | HP | Mana | ATK |
|-------|----|------|-----|
| Guerreiro | 120/120 | 40/40 | 25 |
| Mago | 80/80 | 120/120 | 35 |

---

## 6. VISUAL (DARK CYBERPUNK)

- Background principal: `bg-slate-950`
- Painéis secundários: `bg-zinc-900`
- Bordas: `border-slate-700`
- Cores de log: instanciacao=cyan, invariante=green, excecao=red, override=purple, info=gray
- Terminal com 3 dots (red/yellow/green) simulando macOS window controls
- Fonte monospace no console

---

## 7. GABARITO JAVA (para o professor)

O código Java equivalente ao comportamento do jogo:

```java
// Personagem.java
public abstract class Personagem {
    protected String nome;
    protected int hp;
    protected int maxHp;
    protected int mana;
    protected int maxMana;
    protected int atk;

    public Personagem(String nome, int hp, int mana) {
        this.nome = nome;
        this.maxHp = hp;
        this.maxMana = mana;
        this.hp = hp;
        this.mana = mana;
    }

    public void setVida(int hp) {
        this.hp = Math.max(0, Math.min(hp, maxHp));
        if (this.hp == 0) throw new PersonagemDerrotadoException(nome + " foi derrotado!");
    }

    public void setMana(int mana) {
        this.mana = Math.max(0, Math.min(mana, maxMana));
    }

    public abstract int calcularDano();

    @Override
    public String toString() {
        return String.format("%s [HP:%d/%d | Mana:%d/%d | ATK:%d]", nome, hp, maxHp, mana, maxMana, atk);
    }
}

// Guerreiro.java
public class Guerreiro extends Personagem {
    public Guerreiro(String nome) {
        super(nome, 120, 40);
        this.atk = 25;
    }

    @Override
    public int calcularDano() { return atk; }
}

// Mago.java
public class Mago extends Personagem {
    public Mago(String nome) {
        super(nome, 80, 120);
        this.atk = 35;
    }

    @Override
    public int calcularDano() { return atk; }
}

// PersonagemDerrotadoException.java
public class PersonagemDerrotadoException extends RuntimeException {
    public PersonagemDerrotadoException(String msg) { super(msg); }
}

// ManaInsuficienteException.java
public class ManaInsuficienteException extends RuntimeException {
    public ManaInsuficienteException(String msg) { super(msg); }
}

// Main.java
public class Main {
    public static void main(String[] args) {
        Guerreiro g = new Guerreiro("Thor");
        System.out.println("Criado: " + g);

        // Invariante de HP
        g.setVida(g.hp + 20); // orbe de vida
        System.out.println("Após orbe: " + g);

        // Armadilha
        try {
            g.setVida(g.hp - 15);
        } catch (PersonagemDerrotadoException e) {
            System.out.println("Exceção: " + e.getMessage());
        }

        // @Override
        int dano = g.calcularDano();
        System.out.println("Dano calculado: " + dano);
    }
}
```

---

## 8. INSTRUÇÕES PARA ATUALIZAÇÃO

Ao modificar o jogo:

1. **Novo tipo de célula:** adicione à `CellType`, ao `CELL_ICONS`, ao `BASE_MAP` e ao `switch` em `moveHero`
2. **Novo conceito POO:** escolha o `LogType` adequado e escreva a mensagem no template do gabarito (seção 4)
3. **Novo herói:** adicione a `HeroClass`, `HERO_ICONS`, `HERO_STATS` e à tela de seleção
4. **Nova fase:** crie o estado em `GamePhase` e adicione o bloco `if (phase === 'nova-fase')` antes do render principal
5. **NUNCA** use polimorfismo — ver Restrição Pedagógica (seção 1)
