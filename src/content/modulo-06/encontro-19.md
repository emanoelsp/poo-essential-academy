# Encontro 19 — Trabalho Prático 3: Desenvolvimento Intensivo

> **Módulo 6 · 4 aulas · 150 XP · Avaliação**

---

## Objetivos da Sessão

- Implementar o sistema aprovado no Encontro 18
- Garantir aderência entre código e diagrama
- Aplicar boas práticas de organização e nomenclatura
- Resolver impedimentos técnicos com suporte do professor

---

## Implementação de Referência Completa

```java
// ──────────────────────────────────────────────────────────────────────────
// Interface
// ──────────────────────────────────────────────────────────────────────────
public interface Exportavel {
    String exportar();
}

// ──────────────────────────────────────────────────────────────────────────
// Musica — classe de domínio base
// ──────────────────────────────────────────────────────────────────────────
public class Musica {
    private final String titulo;
    private final int duracaoSeg;
    private final String genero;
    private final double royaltyPorPlay;

    public Musica(String titulo, int duracao, String genero, double royalty) {
        if (titulo == null || titulo.isBlank())
            throw new IllegalArgumentException("Título da música é obrigatório.");
        if (duracao <= 0)
            throw new IllegalArgumentException("Duração deve ser positiva.");
        if (royalty < 0)
            throw new IllegalArgumentException("Royalty não pode ser negativo.");

        this.titulo         = titulo;
        this.duracaoSeg     = duracao;
        this.genero         = genero;
        this.royaltyPorPlay = royalty;
    }

    public String getDuracaoFormatada() {
        return String.format("%d:%02d", duracaoSeg / 60, duracaoSeg % 60);
    }

    public String getTitulo()        { return titulo;         }
    public String getGenero()        { return genero;         }
    public double getRoyaltyPorPlay(){ return royaltyPorPlay; }
    public int    getDuracaoSeg()    { return duracaoSeg;     }

    @Override
    public String toString() {
        return String.format("  ♪ %-35s [%s] (%s)", titulo, genero, getDuracaoFormatada());
    }
}

// ──────────────────────────────────────────────────────────────────────────
// Album — abstrata
// ──────────────────────────────────────────────────────────────────────────
public abstract class Album implements Exportavel {
    protected final String titulo;
    protected final int anoLancamento;
    protected final Artista artista;
    protected Musica[] musicas;
    protected int totalMusicas;

    public Album(String titulo, int ano, Artista artista) {
        if (titulo == null || titulo.isBlank())
            throw new IllegalArgumentException("Título do álbum é obrigatório.");
        if (ano < 1877 || ano > 2030)
            throw new IllegalArgumentException("Ano de lançamento inválido.");
        if (artista == null)
            throw new IllegalArgumentException("Artista não pode ser nulo.");

        this.titulo         = titulo;
        this.anoLancamento  = ano;
        this.artista        = artista;
        this.musicas        = new Musica[100];
        this.totalMusicas   = 0;
    }

    public void adicionarMusica(Musica m) {
        if (m == null) throw new IllegalArgumentException("Música não pode ser nula.");
        musicas[totalMusicas++] = m;
    }

    public Musica[] getMusicas() {
        Musica[] copia = new Musica[totalMusicas];
        System.arraycopy(musicas, 0, copia, 0, totalMusicas);
        return copia;
    }

    public String getTitulo()    { return titulo;        }
    public int    getTotal()     { return totalMusicas;  }

    @Override
    public String toString() {
        return String.format("📀 %s (%d) — %d músicas", titulo, anoLancamento, totalMusicas);
    }
}

public class AlbumEstudio extends Album {
    private final String produtora;

    public AlbumEstudio(String titulo, int ano, Artista artista, String produtora) {
        super(titulo, ano, artista);
        this.produtora = produtora;
    }

    @Override
    public String exportar() {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("ÁLBUM DE ESTÚDIO: %s (%d) | Produtora: %s%n", titulo, anoLancamento, produtora));
        for (int i = 0; i < totalMusicas; i++) sb.append(musicas[i]).append("\n");
        return sb.toString();
    }
}

public class AlbumAoVivo extends Album {
    private final String local;
    private final String dataShow;

    public AlbumAoVivo(String titulo, int ano, Artista artista, String local, String data) {
        super(titulo, ano, artista);
        this.local    = local;
        this.dataShow = data;
    }

    @Override
    public String exportar() {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("ÁLBUM AO VIVO: %s | %s em %s%n", titulo, local, dataShow));
        for (int i = 0; i < totalMusicas; i++) sb.append(musicas[i]).append("\n");
        return sb.toString();
    }
}

// ──────────────────────────────────────────────────────────────────────────
// Artista — abstrata
// ──────────────────────────────────────────────────────────────────────────
public abstract class Artista {
    protected final String nome;
    protected final String genero;
    protected Album[] albums;
    protected int totalAlbums;

    public Artista(String nome, String genero) {
        if (nome == null || nome.isBlank())
            throw new IllegalArgumentException("Nome é obrigatório.");
        this.nome        = nome;
        this.genero      = genero;
        this.albums      = new Album[50];
        this.totalAlbums = 0;
    }

    public void adicionarAlbum(Album a) {
        if (a == null) throw new IllegalArgumentException("Álbum não pode ser nulo.");
        albums[totalAlbums++] = a;
    }

    public abstract double calcularRoyalties(long plays);

    public long totalMusicas() {
        long total = 0;
        for (int i = 0; i < totalAlbums; i++) total += albums[i].getTotal();
        return total;
    }

    public void relatorio() {
        System.out.printf("%n╔═══ %s (%s) ══╗%n", nome, genero);
        for (int i = 0; i < totalAlbums; i++) {
            System.out.println("  " + albums[i]);
        }
        System.out.printf("  Royalties (1M plays): R$ %.2f%n", calcularRoyalties(1_000_000));
    }

    public String getNome()  { return nome;  }
    public String getGenero(){ return genero;}
    public Album[] getAlbums(){ return albums;}
    public int getTotalAlbums(){ return totalAlbums;}
}

public class ArtistasSolo extends Artista {
    private final String nomeArtistico;
    private final String cpf;
    private static final double ROYALTY_BASE = 0.0001; // R$ 0,0001 por play

    public ArtistasSolo(String nome, String nomeArtistico, String cpf, String genero) {
        super(nome, genero);
        if (cpf == null || cpf.isBlank())
            throw new IllegalArgumentException("CPF é obrigatório para artista solo.");
        this.nomeArtistico = nomeArtistico;
        this.cpf           = cpf;
    }

    @Override
    public double calcularRoyalties(long plays) {
        return plays * ROYALTY_BASE; // 100% para o artista solo
    }

    public String getNomeArtistico() { return nomeArtistico; }
}

public class Banda extends Artista {
    private String[] membros;
    private int totalMembros;
    private static final double ROYALTY_BASE = 0.0001;

    public Banda(String nome, String genero) {
        super(nome, genero);
        this.membros      = new String[20];
        this.totalMembros = 0;
    }

    public void adicionarMembro(String membro) {
        if (membro == null || membro.isBlank())
            throw new IllegalArgumentException("Nome do membro não pode ser vazio.");
        membros[totalMembros++] = membro;
    }

    @Override
    public double calcularRoyalties(long plays) {
        if (totalMembros == 0) return 0;
        double totalRoyalty = plays * ROYALTY_BASE;
        return totalRoyalty / totalMembros; // dividido igualmente
    }

    public int getTotalMembros() { return totalMembros; }

    @Override
    public void relatorio() {
        super.relatorio();
        System.out.print("  Membros: ");
        for (int i = 0; i < totalMembros; i++) {
            System.out.print(membros[i] + (i < totalMembros - 1 ? ", " : ""));
        }
        System.out.println();
        System.out.printf("  Royalties por membro (1M plays): R$ %.2f%n",
            calcularRoyalties(1_000_000));
    }
}

// ──────────────────────────────────────────────────────────────────────────
// Playlist
// ──────────────────────────────────────────────────────────────────────────
public class Playlist implements Exportavel {
    private final String nome;
    private Musica[] musicas;
    private int totalMusicas;

    public Playlist(String nome) {
        if (nome == null || nome.isBlank())
            throw new IllegalArgumentException("Nome da playlist é obrigatório.");
        this.nome        = nome;
        this.musicas     = new Musica[200];
        this.totalMusicas = 0;
    }

    public void adicionar(Musica m) {
        if (m == null) throw new IllegalArgumentException("Música não pode ser nula.");
        musicas[totalMusicas++] = m;
    }

    public void remover(String titulo) {
        for (int i = 0; i < totalMusicas; i++) {
            if (musicas[i].getTitulo().equalsIgnoreCase(titulo)) {
                for (int j = i; j < totalMusicas - 1; j++) musicas[j] = musicas[j + 1];
                musicas[--totalMusicas] = null;
                System.out.println("Removida: " + titulo);
                return;
            }
        }
        System.out.println("Música não encontrada: " + titulo);
    }

    public int getDuracaoTotal() {
        int total = 0;
        for (int i = 0; i < totalMusicas; i++) total += musicas[i].getDuracaoSeg();
        return total;
    }

    public Musica[] buscarPorGenero(String genero) {
        int count = 0;
        for (int i = 0; i < totalMusicas; i++)
            if (musicas[i].getGenero().equalsIgnoreCase(genero)) count++;
        Musica[] resultado = new Musica[count];
        int j = 0;
        for (int i = 0; i < totalMusicas; i++)
            if (musicas[i].getGenero().equalsIgnoreCase(genero)) resultado[j++] = musicas[i];
        return resultado;
    }

    @Override
    public String exportar() {
        StringBuilder sb = new StringBuilder();
        int totalSeg = getDuracaoTotal();
        sb.append(String.format("▶ PLAYLIST: %s | %d músicas | %d:%02d total%n",
            nome, totalMusicas, totalSeg / 60, totalSeg % 60));
        sb.append("─".repeat(55)).append("\n");
        for (int i = 0; i < totalMusicas; i++) {
            sb.append(String.format("%3d. %s%n", i + 1, musicas[i]));
        }
        return sb.toString();
    }

    public String getNome() { return nome; }
}

// ──────────────────────────────────────────────────────────────────────────
// Main de demonstração
// ──────────────────────────────────────────────────────────────────────────
public class PlataformaStreaming {
    public static void main(String[] args) {
        // Criando artistas
        ArtistasSolo beyonce = new ArtistasSolo("Beyoncé Knowles", "Beyoncé", "111", "R&B/Pop");
        Banda coldplay = new Banda("Coldplay", "Alternative Rock");
        coldplay.adicionarMembro("Chris Martin");
        coldplay.adicionarMembro("Jonny Buckland");
        coldplay.adicionarMembro("Guy Berryman");
        coldplay.adicionarMembro("Will Champion");

        // Criando músicas
        Musica halo        = new Musica("Halo",             234, "R&B",  0.0001);
        Musica crazy       = new Musica("Crazy in Love",    235, "R&B",  0.0001);
        Musica thescientist= new Musica("The Scientist",    309, "Rock", 0.0001);
        Musica yellow      = new Musica("Yellow",           269, "Rock", 0.0001);
        Musica clocks      = new Musica("Clocks",           307, "Rock", 0.0001);

        // Criando álbuns
        AlbumEstudio dangerously = new AlbumEstudio("Dangerously in Love", 2003, beyonce, "Columbia");
        dangerously.adicionarMusica(halo);
        dangerously.adicionarMusica(crazy);

        AlbumEstudio parachutes = new AlbumEstudio("Parachutes", 2000, coldplay, "Parlophone");
        parachutes.adicionarMusica(yellow);
        parachutes.adicionarMusica(clocks);

        AlbumAoVivo coldplayLive = new AlbumAoVivo("Live in São Paulo", 2022, coldplay,
            "Estádio Nilton Santos", "20/10/2022");
        coldplayLive.adicionarMusica(thescientist);
        coldplayLive.adicionarMusica(yellow);

        beyonce.adicionarAlbum(dangerously);
        coldplay.adicionarAlbum(parachutes);
        coldplay.adicionarAlbum(coldplayLive);

        // Criando playlists
        Playlist minhaPlaylist = new Playlist("Favoritas 2025");
        minhaPlaylist.adicionar(halo);
        minhaPlaylist.adicionar(thescientist);
        minhaPlaylist.adicionar(yellow);
        minhaPlaylist.adicionar(crazy);
        minhaPlaylist.adicionar(clocks);

        // Processamento polimórfico
        Artista[] artistas = { beyonce, coldplay };
        System.out.println("=== RELATÓRIO DE ARTISTAS ===");
        for (Artista a : artistas) {
            a.relatorio(); // late binding — cada um mostra seu próprio relatório
        }

        // Exportar albums (Exportavel — interface)
        System.out.println("\n=== EXPORTAÇÃO DE ÁLBUNS ===");
        Exportavel[] exportaveis = { dangerously, parachutes, coldplayLive, minhaPlaylist };
        for (Exportavel e : exportaveis) {
            System.out.println(e.exportar());
        }

        // Busca por gênero
        System.out.println("=== MÚSICAS DO GÊNERO ROCK ===");
        Musica[] rocks = minhaPlaylist.buscarPorGenero("Rock");
        for (Musica m : rocks) System.out.println(m);
    }
}
```

---

## Boas Práticas de Clean Code

| Prática | Exemplo ruim | Exemplo correto |
|---------|-------------|-----------------|
| Nomenclatura | `a`, `x1`, `temp` | `artista`, `totalPlays`, `duracaoSeg` |
| Métodos curtos | método de 150 linhas | métodos de até 20 linhas |
| Responsabilidade única | `calcularEImprimir()` | `calcular()` separado de `imprimir()` |
| Sem comentários óbvios | `// incrementa i` | (sem comentário) |
| Constantes nomeadas | `0.0001` solto no código | `static final double ROYALTY_BASE = 0.0001` |
| Fail fast | validação no meio do método | validação no início do construtor |

---

### Troubleshooting de Revisão — 25 XP
**Diagnóstico: Bugs no Sistema de Streaming em Implementação**

Durante a sessão de code review do TP3, o professor apontou **3 bugs** no código de um colega. Para cada um: identifique o tipo de erro, explique a consequência e escreva a versão corrigida.

**Bug 1 — `buscarPorGenero` nunca encontra resultado:**
```java
public Musica[] buscarPorGenero(String genero) {
    int count = 0;
    for (int i = 0; i < totalMusicas; i++) {
        if (musicas[i].getGenero() == genero)  // BUG: == compara referências em Java!
            count++;
    }
    Musica[] resultado = new Musica[count];
    int j = 0;
    for (int i = 0; i < totalMusicas; i++) {
        if (musicas[i].getGenero() == genero)  // mesmo bug aqui
            resultado[j++] = musicas[i];
    }
    return resultado;
}
```

**Bug 2 — `calcularRoyalties` de Banda com divisão por zero:**
```java
public class Banda extends Artista {
    private String[] membros;
    private int totalMembros;

    @Override
    public double calcularRoyalties(long plays) {
        double totalRoyalty = plays * ROYALTY_BASE;
        return totalRoyalty / totalMembros;  // BUG: e se totalMembros == 0?
    }
}
```

**Bug 3 — `adicionarMusica` permite duplicatas sem verificar:**
```java
public void adicionarMusica(Musica m) {
    if (m == null) throw new IllegalArgumentException("Música não pode ser nula.");
    musicas[totalMusicas++] = m;
    // BUG: não verifica se a música já existe no álbum
    // Uma música pode ser adicionada múltiplas vezes ao mesmo álbum
}
```

> **Gabarito:** (1) Use `equals()` em vez de `==` para comparar Strings: `musicas[i].getGenero().equalsIgnoreCase(genero)`. (2) Adicione guarda: `if (totalMembros == 0) return 0;` — ou lança `IllegalStateException("Banda sem membros")`. (3) Antes de adicionar, percorra o array verificando se `musicas[i].getTitulo().equals(m.getTitulo())` — se já existir, ignore ou lance exceção.
