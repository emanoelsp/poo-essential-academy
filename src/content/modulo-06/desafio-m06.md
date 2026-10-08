# ⚔️ Desafio Final — SOLID no seu Projeto de Streaming

> **Desafio Gamificado · 250 XP · até 250 POO Coins**

> **Etapa 4 de 4 do seu Trabalho Final de UC.** Este desafio não é um sistema novo — é o **mesmo** sistema de streaming musical que você desenhou no Encontro 18, implementou no Encontro 19 e defendeu no Encontro 20. Agora você volta a ele e aplica os 5 princípios SOLID para torná-lo extensível de verdade. A entrega deste desafio é a entrega oficial do seu Trabalho Final de UC.

---

## Antes de começar

Tenha em mãos o código do seu TP3: `Artista` (abstrata), `ArtistasSolo`, `Banda`, `Album` (abstrata), `AlbumEstudio`, `AlbumAoVivo`, `Musica`, `Playlist`, a interface `Exportavel` e a classe que orquestra tudo (`PlataformaStreaming` ou equivalente). Se alguma dessas classes ainda não existe ou não compila, finalize o TP3 primeiro — as quatro tasks abaixo partem exatamente desse código, não de um projeto do zero.

---

## Task 1 — OCP: um novo tipo sem tocar no que já existe · 40 Coins · Intermediário

Aplique o **Open/Closed Principle**: adicione uma nova forma de artista — uma **colaboração entre múltiplos artistas, com divisão de royalties por percentual** — sem modificar `Artista`, `ArtistasSolo`, `Banda` nem o laço que já calcula o total de royalties da plataforma.

**O que já existe (NÃO modifique):**

```java
public abstract class Artista {
    protected final String nome;
    protected final String genero;
    protected Album[] albums;
    protected int totalAlbums;

    public Artista(String nome, String genero) { /* ... já implementado no TP3 ... */ }
    public void adicionarAlbum(Album a) { /* ... */ }

    // Contrato — cada tipo de artista decide como dividir seus royalties
    public abstract double calcularRoyalties(long plays);

    public String getNome()   { return nome;   }
    public String getGenero() { return genero; }
}

// Este laço já existe na sua plataforma e NÃO pode ser alterado:
public void calcularTotalRoyalties(Artista[] artistas, long plays) {
    double total = 0;
    for (Artista a : artistas) {
        total += a.calcularRoyalties(plays); // chamada polimórfica — não sabe o tipo concreto
    }
    System.out.printf("TOTAL: R$ %.2f%n", total);
}
```

**Sua missão:** crie `Colaboracao extends Artista`, representando dois ou mais artistas dividindo royalties por percentual combinado (ex: 60%/40%), SEM alterar nenhuma das classes acima.

```java
import javax.swing.JOptionPane;

public class Colaboracao extends Artista {
    private String[] parceiros;
    private double[] percentuais; // deve somar 1.0 (100%)

    public Colaboracao(String nomeDaFaixa, String genero, String[] parceiros, double[] percentuais) {
        super(nomeDaFaixa, genero);
        // TODO: valide que parceiros.length == percentuais.length
        // TODO: valide que a soma de percentuais é 1.0 (± tolerância de 0.001)
        this.parceiros   = parceiros;
        this.percentuais = percentuais;
    }

    @Override
    public double calcularRoyalties(long plays) {
        // TODO: aplica a mesma base de royalty por play do TP3,
        // mas retorna o total dividido já é a soma — a divisão por parceiro
        // acontece em um método auxiliar, não no contrato calcularRoyalties()
        return 0;
    }

    public String relatorioPorParceiro(long plays) {
        // TODO: monta uma String "Parceiro X: R$ Y (40%)" para cada parceiro
        return "";
    }
}

public class SistemaColaboracoes {
    public static void main(String[] args) {
        // TODO: use JOptionPane para coletar nome da faixa, número de parceiros,
        // nome e percentual de cada um (valide a soma = 100% antes de criar o objeto)

        // TODO: adicione a Colaboracao criada a um Artista[] junto de
        // ArtistasSolo e Banda já existentes, e chame o MESMO
        // calcularTotalRoyalties(Artista[], long) acima sem alterá-lo —
        // essa é a prova de que o OCP foi respeitado.
    }
}
```

> **Checklist desta task:** se você precisou editar `Artista`, `ArtistasSolo`, `Banda` ou `calcularTotalRoyalties` para a `Colaboracao` funcionar, o OCP foi violado — volte e revise.

---

## Task 2 — SRP + DIP: separe o que sua plataforma está fazendo junto · 55 Coins · Avançado

No TP3, é comum que a classe que orquestra tudo (`PlataformaStreaming` ou o `main`) acabe calculando royalties, "persistindo" dados e exibindo relatórios no mesmo lugar. Separe essas responsabilidades em interfaces e faça o orquestrador depender só delas.

```java
import javax.swing.JOptionPane;
import java.util.ArrayList;

// Abstrações (DIP — o orquestrador depende destas, nunca das implementações)
interface Persistencia        { void salvar(Artista a); }
interface Notificador         { void notificar(Artista a, double royalties); }
interface GeradorRelatorio    { String gerar(ArrayList<Artista> artistas, long plays); }

// Implementações concretas
class PersistenciaMemoria implements Persistencia {
    private ArrayList<Artista> base = new ArrayList<>();
    @Override public void salvar(Artista a) { base.add(a); }
    public ArrayList<Artista> getTodos() { return base; }
}

class NotificadorJOptionPane implements Notificador {
    @Override
    public void notificar(Artista a, double royalties) {
        // TODO: showMessageDialog avisando o artista do valor de royalties calculado
    }
}

class RelatorioHTML implements GeradorRelatorio {
    @Override
    public String gerar(ArrayList<Artista> artistas, long plays) {
        // TODO: monta uma tabela HTML (como em exportar()) com nome, gênero e
        // royalties de cada artista, mais o total — exibida depois com
        // JOptionPane.showMessageDialog(..., JOptionPane.INFORMATION_MESSAGE)
        return "";
    }
}

// Orquestrador — depende só de INTERFACES (DIP aplicado)
class ProcessadorStreaming {
    private final Persistencia persistencia;
    private final Notificador notificador;
    private final GeradorRelatorio relatorio;

    ProcessadorStreaming(Persistencia pers, Notificador notif, GeradorRelatorio rel) {
        this.persistencia = pers;
        this.notificador  = notif;
        this.relatorio    = rel;
    }

    void cadastrar(Artista a) {
        persistencia.salvar(a);
    }

    void processarRoyalties(Artista a, long plays) {
        double royalties = a.calcularRoyalties(plays); // polimórfico, vindo do TP3
        notificador.notificar(a, royalties);
    }

    void exibirRelatorioCompleto(ArrayList<Artista> artistas, long plays) {
        String html = relatorio.gerar(artistas, plays);
        JOptionPane.showMessageDialog(null, html, "Relatório da Plataforma", JOptionPane.INFORMATION_MESSAGE);
    }
}

public class SistemaStreamingDIP {
    public static void main(String[] args) {
        PersistenciaMemoria bd = new PersistenciaMemoria();
        ProcessadorStreaming proc = new ProcessadorStreaming(
            bd,
            new NotificadorJOptionPane(),
            new RelatorioHTML()
        );

        // TODO: menu JOptionPane — Cadastrar Artista, Processar Royalties, Ver Relatório, Sair
        // reaproveite ArtistasSolo, Banda e a Colaboracao da Task 1 aqui
    }
}
```

> **Por que isso é SRP + DIP?** `ProcessadorStreaming` não calcula royalties sozinho, não sabe como persistir e não sabe como formatar um relatório — ele só orquestra chamadas às interfaces. Trocar de memória para banco de dados, ou de JOptionPane para e-mail, significa passar uma nova implementação no construtor — nenhuma linha de `ProcessadorStreaming` muda.

---

## Task 3 — SOLID Audit: encontre as 3 violações no seu próprio domínio · 70 Coins · Avançado

O código abaixo é uma versão (propositalmente malfeita) de partes do seu sistema de streaming. Há **uma violação de um princípio diferente** em cada bloco. Identifique cada uma, nomeie o princípio e proponha a correção — depois implemente pelo menos 2 das correções com JOptionPane.

```java
// ❌ Violação 1: qual princípio?
class PlataformaStreaming {
    ArrayList<Artista> artistas = new ArrayList<>();

    void cadastrar(Artista a) { artistas.add(a); }

    double calcularTotalRoyalties(long plays) {
        double total = 0;
        for (Artista a : artistas) total += a.calcularRoyalties(plays);
        return total;
    }

    // Por que estas duas linhas abaixo são um problema?
    void salvarEmArquivo(String caminho) {
        // lógica de I/O misturada com a orquestração de royalties
    }

    void enviarRelatorioPorEmail(String destinatario) {
        // lógica de e-mail misturada com a orquestração de royalties
    }
}

// ❌ Violação 2: qual princípio?
abstract class Artista {
    // CONTRATO IMPLÍCITO: calcularRoyalties() sempre retorna valor >= 0
    public abstract double calcularRoyalties(long plays);
}

class ArtistaConvidado extends Artista {
    @Override
    public double calcularRoyalties(long plays) {
        throw new UnsupportedOperationException("Convidados não recebem royalties diretamente!");
        // Qualquer loop polimórfico que espera um double >= 0 quebra sem aviso!
    }
}

// ❌ Violação 3: qual princípio?
interface IGerenciavelDeConteudo {
    void tocar();
    void baixarOffline();
    void compartilharRedeSocial();
    void gerarLetra();
    void gerarPartitura();
}

// Musica só faz sentido tocar e baixar — é obrigada a implementar o resto vazio:
class Musica implements IGerenciavelDeConteudo {
    @Override public void tocar()               { /* ok */ }
    @Override public void baixarOffline()       { /* ok */ }
    @Override public void compartilharRedeSocial() { /* não implementado */ }
    @Override public void gerarLetra()          { /* não implementado */ }
    @Override public void gerarPartitura()      { /* não implementado */ }
}
```

**Suas respostas:**
1. Violação 1 é do princípio ___ porque ___. Correção: ___
2. Violação 2 é do princípio ___ porque ___. Correção: ___
3. Violação 3 é do princípio ___ porque ___. Correção: ___

> **Gabarito esperado:**
>
> **Violação 1 — SRP** (`salvarEmArquivo` e `enviarRelatorioPorEmail` dentro de `PlataformaStreaming`): a classe tem três eixos de mudança — orquestrar royalties, persistir dados e enviar e-mail. Corrigir extraindo `PersistenciaService` e `NotificacaoService` (como na Task 2).
>
> **Violação 2 — LSP** (`ArtistaConvidado.calcularRoyalties()` lança exceção): qualquer código que itera `Artista[]` chamando `calcularRoyalties()` — incluindo o próprio `calcularTotalRoyalties` do TP3 — quebra de forma inesperada ao encontrar um `ArtistaConvidado`. Um subtipo nunca pode enfraquecer o contrato da superclasse. Correção: `ArtistaConvidado` retorna `0.0` (contrato honrado) em vez de lançar exceção.
>
> ```java
> class ArtistaConvidado extends Artista {
>     @Override
>     public double calcularRoyalties(long plays) {
>         return 0.0; // convidado não recebe, mas o contrato continua válido
>     }
> }
> ```
>
> **Violação 3 — ISP** (`IGerenciavelDeConteudo` com 5 métodos): `Musica` não usa `compartilharRedeSocial()`, `gerarLetra()` nem `gerarPartitura()`, mas é obrigada a implementá-los vazios. Correção: segregar em `Tocavel`, `Compartilhavel`, `Letrado`, `Partiturado` — `Musica` implementa só `Tocavel`.

---

## Task 4 — Extensão final: uma funcionalidade nova, com os 5 princípios · 85 Coins · Expert

Adicione **uma funcionalidade completa e nova** ao seu sistema de streaming, aplicando os 5 princípios SOLID de forma identificável. Não é um domínio novo — é uma extensão real do mesmo projeto.

**Sugestões de extensão (escolha uma, ou proponha a sua):**
- Sistema de **assinatura** (Free/Premium) controlando limite de pulos de faixa e qualidade de áudio
- Sistema de **avaliações** de álbuns (nota + comentário) com média calculada
- Sistema de **recomendação** por gênero mais ouvido pelo usuário
- Sistema de **shows ao vivo**: artistas anunciam eventos, usuários compram ingresso

**Requisitos obrigatórios:**
- Pelo menos **uma nova interface central** da qual o restante do sistema dependa (DIP)
- A extensão deve plugar em `Artista`, `Album`, `Musica`, `Playlist` ou `Usuario` **sem modificá-los** (OCP) — se precisar alterar alguma dessas classes, repense o design
- Cada nova classe com uma única responsabilidade clara (SRP)
- Se você criar uma nova hierarquia, toda subclasse deve honrar o contrato da superclasse (LSP)
- Se houver mais de um tipo de operação na extensão, interfaces segregadas por capacidade (ISP)
- JOptionPane para toda entrada e saída de dados
- Pelo menos um padrão de design (Strategy, Template Method, Factory, Observer...) identificável

**Documente no topo do seu `Main.java`:**

```java
/*
 * SOLID aplicado na extensão:
 * SRP: [explique onde e como]
 * OCP: [explique onde e como — e por que nenhuma classe do TP3 foi modificada]
 * LSP: [explique onde e como]
 * ISP: [explique onde e como]
 * DIP: [explique onde e como]
 * Padrão de design: [qual e onde]
 */
```

> **Dica:** comece pela interface central da extensão (o que ela precisa fazer), não pela implementação. Se a primeira coisa que você escrever for uma classe concreta, é provável que o DIP já tenha sido deixado de lado.

---

## Entrega final do Trabalho de UC

Suba o repositório completo — TP3 (Encontros 18-19) **e** a extensão SOLID deste desafio, no mesmo projeto — contendo:

- [ ] Diagrama de classes final do TP3 (Encontro 18), refletindo o código entregue
- [ ] Código Java do TP3 completo e funcional (Encontro 19)
- [ ] `Colaboracao` da Task 1, provando OCP sem alterar classes existentes
- [ ] Interfaces `Persistencia`/`Notificador`/`GeradorRelatorio` da Task 2, com `ProcessadorStreaming` dependendo só delas
- [ ] As 3 respostas da Task 3 (SOLID Audit) com pelo menos 2 correções implementadas
- [ ] A extensão completa da Task 4, com o comentário de rastreio dos 5 princípios no `Main`
- [ ] Interface 100% em JOptionPane nas tasks que pedem interação

```github-submit
LABEL: Cole o link do seu repositório GitHub — Trabalho Final de UC
PLACEHOLDER: https://github.com/seu-usuario/plataforma-streaming-final
```
