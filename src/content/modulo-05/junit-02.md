# Testando Contratos e Interfaces com JUnit 5

> **Conteúdo Complementar · Módulo 5 · 70 XP**

No módulo anterior você aprendeu a testar classes concretas. Agora vamos mais fundo: como testar polimorfismo, como verificar que **contratos de interfaces** são respeitados, como usar `@ParameterizedTest` para varrer cenários e como pensar em **testabilidade** desde o design.

---

## 1. Testando polimorfismo — o mesmo teste para tipos diferentes

Se `Circulo`, `Retangulo` e `Triangulo` implementam `Forma`, todos devem respeitar o contrato: `calcularArea()` deve ser sempre positiva e consistente com as dimensões fornecidas.

```java
interface Forma {
    double calcularArea();
    double calcularPerimetro();
}

class Circulo implements Forma {
    private final double raio;
    Circulo(double raio) {
        if (raio <= 0) throw new IllegalArgumentException("Raio deve ser positivo");
        this.raio = raio;
    }
    @Override public double calcularArea()      { return Math.PI * raio * raio; }
    @Override public double calcularPerimetro() { return 2 * Math.PI * raio; }
}

class Retangulo implements Forma {
    private final double base, altura;
    Retangulo(double base, double altura) {
        if (base <= 0 || altura <= 0) throw new IllegalArgumentException("Dimensões devem ser positivas");
        this.base = base; this.altura = altura;
    }
    @Override public double calcularArea()      { return base * altura; }
    @Override public double calcularPerimetro() { return 2 * (base + altura); }
}
```

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import static org.junit.jupiter.api.Assertions.*;
import java.util.stream.Stream;

class FormaTest {

    // Testa o CONTRATO da interface — qualquer Forma deve ter área positiva
    @Test
    void circulo_area_semprePositiva() {
        assertTrue(new Circulo(5).calcularArea() > 0);
    }

    @Test
    void retangulo_area_igualBasePorAltura() {
        assertEquals(20.0, new Retangulo(4, 5).calcularArea(), 0.001);
    }

    @Test
    void circulo_areaComRaio1_igualPi() {
        assertEquals(Math.PI, new Circulo(1).calcularArea(), 0.0001);
    }

    // Testa o contrato de invariante — raio inválido deve lançar
    @Test
    void circulo_raioZero_lancaException() {
        assertThrows(IllegalArgumentException.class, () -> new Circulo(0));
    }

    @Test
    void circulo_raioNegativo_lancaException() {
        assertThrows(IllegalArgumentException.class, () -> new Circulo(-1));
    }
}
```

---

## 2. @ParameterizedTest — um teste, muitos cenários

Em vez de duplicar o mesmo teste para 10 valores diferentes, use `@ParameterizedTest`:

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;

class CalculadoraTest {

    // @ValueSource: lista simples de valores
    @ParameterizedTest
    @ValueSource(doubles = {1.0, 10.0, 100.0, 0.5, 999.99})
    void depositar_qualquerValorPositivo_naoLancaException(double valor) {
        ContaBancaria conta = new ContaBancaria("001", 0.0);
        assertDoesNotThrow(() -> conta.depositar(valor));
    }

    @ParameterizedTest
    @ValueSource(doubles = {0.0, -1.0, -100.0, -0.01})
    void depositar_valorNaoPositivo_lancaIllegalArgument(double valor) {
        ContaBancaria conta = new ContaBancaria("001", 1000.0);
        assertThrows(IllegalArgumentException.class, () -> conta.depositar(valor));
    }

    // @CsvSource: múltiplos parâmetros por linha (entrada, saída esperada)
    @ParameterizedTest
    @CsvSource({
        "10.0, 2.0, 5.0",   // 10 / 2 = 5
        "7.0,  2.0, 3.5",   // 7 / 2 = 3.5
        "1.0,  3.0, 0.333", // 1 / 3 ≈ 0.333
        "-6.0, 2.0, -3.0",  // negativo
    })
    void dividir_parametrizado(double a, double b, double esperado) {
        Calculadora calc = new Calculadora();
        assertEquals(esperado, calc.dividir(a, b), 0.001);
    }

    // @MethodSource: dados gerados por um método estático
    static Stream<Arguments> cenariosSituacaoAluno() {
        return Stream.of(
            Arguments.of(10.0, 10.0, "Aprovado"),
            Arguments.of(7.0,  7.0,  "Aprovado"),
            Arguments.of(6.9,  6.9,  "Recuperação"),
            Arguments.of(5.0,  5.0,  "Recuperação"),
            Arguments.of(4.9,  4.9,  "Reprovado"),
            Arguments.of(0.0,  0.0,  "Reprovado")
        );
    }

    @ParameterizedTest
    @MethodSource("cenariosSituacaoAluno")
    void getSituacao_retornaCorreto(double nota1, double nota2, String situacaoEsperada) {
        Aluno aluno = new Aluno("Teste", "001", nota1, nota2);
        assertEquals(situacaoEsperada, aluno.getSituacao());
    }
}
```

---

## 3. Testando coleções

```java
class AgendaTest {
    private Agenda agenda;

    @BeforeEach
    void setUp() {
        agenda = new Agenda();
        agenda.adicionar(new Contato("Ana",    "111"));
        agenda.adicionar(new Contato("Bruno",  "222"));
        agenda.adicionar(new Contato("Carlos", "333"));
    }

    @Test
    void adicionar_novoContato_aumentaTamanho() {
        agenda.adicionar(new Contato("Diana", "444"));
        assertEquals(4, agenda.tamanho());
    }

    @Test
    void remover_contatoExistente_diminuiTamanho() {
        boolean removido = agenda.remover("Ana");
        assertTrue(removido);
        assertEquals(2, agenda.tamanho());
    }

    @Test
    void remover_contatoInexistente_retornaFalseESemErro() {
        boolean removido = agenda.remover("Inexistente");
        assertFalse(removido);
        assertEquals(3, agenda.tamanho()); // tamanho não muda
    }

    @Test
    void buscar_termoExistente_retornaResultados() {
        List<Contato> resultado = agenda.buscarPorNome("an");
        assertEquals(2, resultado.size()); // Ana + Bruno não — só "an" em Ana e "an" não está em Carlos
        // Correto: Ana tem "an", Carlos não, Bruno não — resultado deve ter 1
    }

    @Test
    void buscar_termoInexistente_retornaListaVazia() {
        List<Contato> resultado = agenda.buscarPorNome("xyz");
        assertNotNull(resultado);
        assertTrue(resultado.isEmpty());
    }

    @Test
    void listarOrdenado_retornaEmOrdemAlfabetica() {
        List<Contato> ordenados = agenda.listarOrdenado();
        assertEquals("Ana",    ordenados.get(0).nome);
        assertEquals("Bruno",  ordenados.get(1).nome);
        assertEquals("Carlos", ordenados.get(2).nome);
    }
}
```

---

## 4. Testando LSP — Princípio de Substituição

Um dos usos mais poderosos de testes: verificar que todas as implementações de uma interface respeitam o mesmo contrato.

```java
// Interface de desconto
interface Desconto {
    double calcular(double precoOriginal);
}

class DescontoPercentual implements Desconto {
    private final double pct;
    DescontoPercentual(double pct) { this.pct = pct; }
    @Override public double calcular(double preco) { return preco * (1 - pct / 100); }
}

class DescontoFixo implements Desconto {
    private final double valor;
    DescontoFixo(double valor) { this.valor = valor; }
    @Override public double calcular(double preco) { return Math.max(0, preco - valor); }
}

class SemDesconto implements Desconto {
    @Override public double calcular(double preco) { return preco; }
}

// Testa o CONTRATO da interface — qualquer Desconto deve:
// 1. Retornar valor não-negativo
// 2. Retornar valor <= precoOriginal (não aumenta o preço)
class DescontoContratoTest {

    @ParameterizedTest
    @MethodSource("todasAsImplementacoes")
    void calcular_resultadoNuncaNegativo(Desconto desconto) {
        assertTrue(desconto.calcular(100.0) >= 0);
        assertTrue(desconto.calcular(0.0)   >= 0);
    }

    @ParameterizedTest
    @MethodSource("todasAsImplementacoes")
    void calcular_resultadoNuncaMaiorQueOriginal(Desconto desconto) {
        double preco = 100.0;
        assertTrue(desconto.calcular(preco) <= preco);
    }

    @ParameterizedTest
    @MethodSource("todasAsImplementacoes")
    void calcular_precoZero_retornaZero(Desconto desconto) {
        assertEquals(0.0, desconto.calcular(0.0), 0.001);
    }

    static Stream<Arguments> todasAsImplementacoes() {
        return Stream.of(
            Arguments.of(new DescontoPercentual(10)),
            Arguments.of(new DescontoPercentual(50)),
            Arguments.of(new DescontoFixo(20.0)),
            Arguments.of(new DescontoFixo(200.0)), // maior que o preço — deve retornar 0
            Arguments.of(new SemDesconto())
        );
    }
}
```

Se qualquer implementação violar o contrato, o teste aponta exatamente qual — isso é LSP verificado automaticamente.

---

## 5. Testabilidade — design que facilita testes

Código difícil de testar é código com **dependências embutidas**. A solução é injetar dependências:

```java
// ❌ Difícil de testar — dependência embutida
class RelatorioService {
    void gerar() {
        // new dentro do método = não tem como substituir por teste
        DatabaseConnection db = new DatabaseConnection("jdbc:mysql://...");
        List<Aluno> alunos = db.query("SELECT * FROM alunos");
        // ...
    }
}

// ✅ Fácil de testar — dependência injetada
interface AlunoRepository {
    List<Aluno> buscarTodos();
}

class RelatorioService {
    private final AlunoRepository repository;

    // Construtor recebe a dependência — pode ser real ou fake
    RelatorioService(AlunoRepository repository) {
        this.repository = repository;
    }

    String gerar() {
        List<Aluno> alunos = repository.buscarTodos();
        // ...
    }
}

// No teste: implementação fake que não precisa de banco de dados
class AlunoRepositoryFake implements AlunoRepository {
    @Override
    public List<Aluno> buscarTodos() {
        return List.of(
            new Aluno("Ana",   "001", 9.0, 8.5),
            new Aluno("Bruno", "002", 5.0, 6.0)
        );
    }
}

class RelatorioServiceTest {
    @Test
    void gerar_comDoisAlunos_conteudoCorreto() {
        AlunoRepository fakeRepo = new AlunoRepositoryFake();
        RelatorioService service = new RelatorioService(fakeRepo);
        String relatorio = service.gerar();
        assertTrue(relatorio.contains("Ana"));
        assertTrue(relatorio.contains("Bruno"));
    }
}
```

---

## 6. Nested tests — agrupando testes relacionados

```java
@DisplayName("ContaBancaria")
class ContaBancariaTest {

    @Nested
    @DisplayName("Depósito")
    class DepositoTest {
        @Test void valorPositivo_aceito() { ... }
        @Test void valorZero_rejeitado()  { ... }
        @Test void valorNegativo_rejeitado() { ... }
    }

    @Nested
    @DisplayName("Saque")
    class SaqueTest {
        @Test void valorMenorQueSaldo_aceito()           { ... }
        @Test void valorIgualAoSaldo_aceito()            { ... }
        @Test void valorMaiorQueSaldo_lancaException()   { ... }
        @Test void valorNegativo_lancaException()        { ... }
    }

    @Nested
    @DisplayName("Transferência")
    class TransferenciaTest {
        @Test void contaValida_transfereCorreto()           { ... }
        @Test void contaDestinoNula_lancaException()        { ... }
        @Test void saldoInsuficiente_lancaException()       { ... }
    }
}
```

---

## Troubleshooting

```java
class AlunoTest {
    Aluno aluno = new Aluno("Ana", "001", 8.0, 7.0); // problema 1

    @Test
    void getSituacao_mediaAcimaDe7_retornaAprovado() {
        aluno = new Aluno("Ana", "001", 8.0, 7.0);
        assertEquals("Aprovado", aluno.getSituacao());
    }

    @Test
    void getMedia_duasNotas_calculaMediaAritmetica() {
        // problema 2
        assertEquals(7.5, aluno.getMedia());
    }

    @ParameterizedTest
    @ValueSource(doubles = {7.0, 8.0, 10.0})
    void getSituacao_mediasAprovadas(double media) {
        // problema 3
        aluno = new Aluno("X", "002", media, media);
        assertEquals("Aprovado", aluno.getSituacao());
    }
}
```

> **Gabarito:**
> 1. Estado compartilhado inicializado no campo — mas o primeiro teste também recria. O campo fica redundante. Melhor: `@BeforeEach void setUp() { aluno = new Aluno(...); }` e remover o campo inicializado
> 2. Sem tolerância para double: `assertEquals(7.5, aluno.getMedia())` pode falhar por precisão de ponto flutuante. Correto: `assertEquals(7.5, aluno.getMedia(), 0.001)`
> 3. Funciona, mas o teste não cobre a fronteira: média exatamente 7.0 deve ser Aprovado — inclua `7.0` no `@ValueSource` (já está) e adicione `6.9` num teste separado que verifica `Recuperação`

---

## Exercícios

**Exercício 1** — Escreva `@ParameterizedTest` com `@CsvSource` para todas as fronteiras de `getSituacao()`: exatamente 7.0 (aprovado), 6.99 (recuperação), exatamente 5.0 (recuperação), 4.99 (reprovado), 0.0 (reprovado), 10.0 (aprovado).

**Exercício 2** — Crie uma interface `Tributavel` com `calcularImposto(double valor)`. Implemente `ISSQNTributavel` (5%), `ICMSTributavel` (18%), `IsentoTributavel` (0%). Escreva testes que verificam o contrato para todas as implementações via `@MethodSource`.

**Exercício 3** — Escreva testes `@Nested` para `Biblioteca` do `excecoes-02` agrupando: `EmprestarTest` (livro disponível, indisponível, não encontrado) e `DevolverTest` (empréstimo existente, inexistente).

**Exercício 4** — Implemente `HistoricoTransacoesTest` que verifica: após depositar 3 vezes, o histórico tem 3 entradas; após sacar 1 vez, o histórico tem 4 entradas; cada entrada contém o valor e o tipo correto.

**Exercício 5** — Refatore `RelatorioService` para ser testável (injeção de dependência), crie um `AlunoRepositoryFake` e escreva 4 testes cobrindo: lista vazia, um aluno aprovado, um aluno reprovado, ordenação por nome.

> **Gabarito:**
> Exercício 1:
> ```java
> @ParameterizedTest
> @CsvSource({
>     "10.0, 10.0, Aprovado",
>     "7.0,  7.0,  Aprovado",
>     "7.0,  6.98, Recuperação",  // (7.0 + 6.98) / 2 = 6.99
>     "5.0,  5.0,  Recuperação",
>     "4.98, 5.0,  Reprovado",    // (4.98 + 5.0) / 2 = 4.99
>     "0.0,  0.0,  Reprovado",
>     "10.0, 10.0, Aprovado"
> })
> void getSituacao_fronteiras(double n1, double n2, String esperado) {
>     Aluno a = new Aluno("X", "001", n1, n2);
>     assertEquals(esperado, a.getSituacao());
> }
> ```
