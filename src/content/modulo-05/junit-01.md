# Testes Unitários com JUnit 5 — Fundamentos

> **Conteúdo Complementar · Módulo 5 · 70 XP**

Você escreveu uma `ContaBancaria` com encapsulamento correto, invariantes protegidas e exceptions de domínio. Mas como garantir que ela continua funcionando depois que um colega modificar o código? Com testes unitários. JUnit 5 é o framework padrão da indústria Java para isso.

---

## Por que testar?

```
Sem testes: modificar código = torcer para nada quebrar
Com testes:  modificar código = rodar testes = saber exatamente o que quebrou
```

Um teste unitário verifica que **uma unidade de código** (método, classe) se comporta corretamente de forma **isolada**. Se o teste passa, o comportamento está correto. Se falhar, o nome do teste te diz exatamente o que quebrou.

---

## 1. Configuração no Maven (pom.xml)

```xml
<dependencies>
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>5.10.2</version>
        <scope>test</scope>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.2.5</version>
        </plugin>
    </plugins>
</build>
```

**Estrutura de diretórios:**
```
src/
├── main/java/       ← código da aplicação
│   └── ContaBancaria.java
└── test/java/       ← testes (mesmo pacote, diretório separado)
    └── ContaBancariaTest.java
```

---

## 2. Anatomia de um teste JUnit 5

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class ContaBancariaTest {

    private ContaBancaria conta;

    // Executa ANTES de cada teste — cria estado limpo
    @BeforeEach
    void setUp() {
        conta = new ContaBancaria("0001", 1000.0);
    }

    // Cada método @Test é um caso de teste independente
    @Test
    void depositar_valorPositivo_aumentaSaldo() {
        conta.depositar(500.0);
        assertEquals(1500.0, conta.getSaldo(), 0.001); // esperado, real, tolerância
    }

    @Test
    void getSaldo_semOperacoes_retornaSaldoInicial() {
        assertEquals(1000.0, conta.getSaldo(), 0.001);
    }

    // Executa APÓS cada teste (útil para limpar recursos)
    @AfterEach
    void tearDown() {
        // ex: fechar conexões, limpar arquivos temporários
    }

    // Executa UMA VEZ antes de todos os testes da classe
    @BeforeAll
    static void setUpClass() {
        System.out.println("Iniciando testes de ContaBancaria");
    }
}
```

---

## 3. Assertions — o coração do teste

```java
// assertEqual: verifica igualdade
assertEquals(1500.0, conta.getSaldo(), 0.001); // com tolerância para double
assertEquals("Ana", usuario.getNome());
assertEquals(3, lista.size());

// assertNotEquals: verifica diferença
assertNotEquals(0.0, conta.getSaldo(), 0.001);

// assertTrue / assertFalse
assertTrue(conta.isAtiva());
assertFalse(lista.isEmpty());

// assertNull / assertNotNull
assertNull(repositorio.buscar("inexistente"));
assertNotNull(conta.getNumero());

// assertSame / assertNotSame (mesma referência de objeto)
assertSame(singleton1, singleton2);

// assertAll: executa todos os asserts mesmo se um falhar
assertAll("dados do aluno",
    () -> assertEquals("Ana", aluno.getNome()),
    () -> assertEquals("2024001", aluno.getMatricula()),
    () -> assertTrue(aluno.getMedia() >= 0)
);

// Mensagem customizada no assert (aparece quando o teste falha)
assertEquals(1500.0, conta.getSaldo(), 0.001,
    "Após depositar R$500 numa conta com R$1000, o saldo deveria ser R$1500");
```

---

## 4. Testando exceptions

```java
@Test
void sacar_valorMaiorQueSaldo_lancaSaldoInsuficienteException() {
    // assertThrows verifica que a exceção correta é lançada
    SaldoInsuficienteException ex = assertThrows(
        SaldoInsuficienteException.class,
        () -> conta.sacar(5000.0) // lambda executa o código que deve lançar
    );
    // Pode também verificar a mensagem da exception
    assertTrue(ex.getMessage().contains("5000"));
}

@Test
void depositar_valorNegativo_lancaIllegalArgumentException() {
    assertThrows(
        IllegalArgumentException.class,
        () -> conta.depositar(-100.0)
    );
}

@Test
void sacar_valorExatamenteIgualAoSaldo_naoLancaException() {
    // assertDoesNotThrow verifica que NENHUMA exceção é lançada
    assertDoesNotThrow(() -> conta.sacar(1000.0));
    assertEquals(0.0, conta.getSaldo(), 0.001);
}
```

---

## 5. Convenção de nomenclatura

O nome do teste deve descrever **o que está sendo testado, em qual cenário, e qual resultado esperado**:

```
metodo_cenario_resultadoEsperado
```

```java
// ✅ Bons nomes — autoexplicativos quando falham
void depositar_valorPositivo_aumentaSaldo()
void sacar_saldoInsuficiente_lancaException()
void getSaldo_contaRecemCriada_retornaZero()
void transferir_contaDestinoInexistente_lancaContaNaoEncontrada()

// ❌ Nomes ruins — não dizem o que foi testado
void testeDeposito()
void teste1()
void shouldWork()
```

---

## 6. @Disabled, @DisplayName, testes de regressão

```java
@Test
@DisplayName("Saque exato ao saldo zera a conta sem exception")
void sacar_valorExatoAoSaldo_zeraSaldo() {
    conta.sacar(1000.0);
    assertEquals(0.0, conta.getSaldo(), 0.001);
}

@Test
@Disabled("Bug #42 ainda não corrigido — remover quando corrigir")
void funcionalidadeQuebrada() {
    // teste documentando comportamento esperado mas não implementado
}
```

---

## 7. Exemplo completo — testando ContaBancaria

```java
// Classe a ser testada
class ContaBancaria {
    private final String numero;
    private double saldo;
    private boolean ativa = true;

    ContaBancaria(String numero, double saldoInicial) {
        if (saldoInicial < 0) throw new IllegalArgumentException("Saldo inicial não pode ser negativo");
        this.numero = numero;
        this.saldo  = saldoInicial;
    }

    void depositar(double valor) {
        if (valor <= 0) throw new IllegalArgumentException("Valor de depósito deve ser positivo");
        saldo += valor;
    }

    void sacar(double valor) {
        if (valor <= 0) throw new IllegalArgumentException("Valor de saque deve ser positivo");
        if (valor > saldo) throw new SaldoInsuficienteException(saldo, valor);
        saldo -= valor;
    }

    double getSaldo()  { return saldo;  }
    String getNumero() { return numero; }
    boolean isAtiva()  { return ativa;  }
}

// Arquivo ContaBancariaTest.java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class ContaBancariaTest {
    private ContaBancaria conta;

    @BeforeEach
    void setUp() { conta = new ContaBancaria("0001", 1000.0); }

    // ── Depósito ──────────────────────────────────────────────────
    @Test
    void depositar_valorPositivo_aumentaSaldo() {
        conta.depositar(500.0);
        assertEquals(1500.0, conta.getSaldo(), 0.001);
    }

    @Test
    void depositar_zero_lancaIllegalArgument() {
        assertThrows(IllegalArgumentException.class, () -> conta.depositar(0));
    }

    @Test
    void depositar_valorNegativo_lancaIllegalArgument() {
        assertThrows(IllegalArgumentException.class, () -> conta.depositar(-50.0));
    }

    // ── Saque ─────────────────────────────────────────────────────
    @Test
    void sacar_valorMenorQueSaldo_reduzSaldo() {
        conta.sacar(300.0);
        assertEquals(700.0, conta.getSaldo(), 0.001);
    }

    @Test
    void sacar_valorExatoAoSaldo_zeraSaldo() {
        conta.sacar(1000.0);
        assertEquals(0.0, conta.getSaldo(), 0.001);
    }

    @Test
    void sacar_valorMaiorQueSaldo_lancaSaldoInsuficiente() {
        SaldoInsuficienteException ex = assertThrows(
            SaldoInsuficienteException.class,
            () -> conta.sacar(2000.0)
        );
        assertNotNull(ex.getMessage());
    }

    @Test
    void sacar_valorNegativo_lancaIllegalArgument() {
        assertThrows(IllegalArgumentException.class, () -> conta.sacar(-100.0));
    }

    // ── Construtor ────────────────────────────────────────────────
    @Test
    void construtor_saldoNegativo_lancaIllegalArgument() {
        assertThrows(IllegalArgumentException.class,
            () -> new ContaBancaria("9999", -100.0));
    }

    // ── Sequências de operações ───────────────────────────────────
    @Test
    void depositar_e_sacar_sequencialmente_saldoCorreto() {
        conta.depositar(500.0);  // 1500
        conta.sacar(200.0);      // 1300
        conta.depositar(100.0);  // 1400
        assertEquals(1400.0, conta.getSaldo(), 0.001);
    }
}
```

---

## Troubleshooting

Identifique os problemas nos testes abaixo:

```java
class ProdutoTest {

    @Test  // problema 1
    void testTudo() {
        Produto p = new Produto("Mouse", 80.0);
        assertEquals("Mouse", p.getNome());
        assertEquals(80.0, p.getPreco(), 0.001);
        p.setPreco(-10.0);
        assertEquals(-10.0, p.getPreco(), 0.001); // espera que aceite preço negativo?
        p.setPreco(0.0);
        assertEquals(0.0, p.getPreco(), 0.001);
    }

    Produto produto = new Produto("Teclado", 250.0); // problema 2

    @Test
    void preco_valorPositivo_aceito() {
        produto.setPreco(300.0);
        assertEquals(300.0, produto.getPreco(), 0.001);
    }

    @Test
    void preco_valorNegativo_aceito() { // problema 3
        produto.setPreco(-50.0);
        assertEquals(-50.0, produto.getPreco(), 0.001);
    }
}
```

> **Gabarito:**
> 1. Um teste testando 4 comportamentos distintos. Quando falhar, não saberá qual dos 4 quebrou. Separe em `getNome_retornaNomeCorreto`, `setPreco_valorPositivo_aceito`, `setPreco_negativo_lancaException`, `setPreco_zero_lancaException`
> 2. Estado compartilhado entre testes — se `preco_valorPositivo_aceito` rodar antes, `produto.preco` já é 300.0 no próximo teste. Use `@BeforeEach` para criar instância limpa em cada teste
> 3. O nome diz "aceito" mas se a classe estiver correta (`setPreco` valida preço), deveria lançar exception. O teste documenta um bug como se fosse comportamento esperado

---

## Exercícios

**Exercício 1** — Escreva a classe `Calculadora` com métodos `somar`, `subtrair`, `multiplicar`, `dividir`. Depois escreva `CalculadoraTest` com pelo menos 3 testes por método (incluindo valores negativos, zero, divisão por zero).

**Exercício 2** — Escreva `ContaBancariaTest` completo para a `ContaBancaria` do Módulo 3, cobrindo todos os branches do código (incluindo todos os caminhos de if/else). Meta: 10 testes.

**Exercício 3** — Escreva testes para a classe `Aluno` (com `getMedia()` e `getSituacao()`): média exata de 7.0, média exata de 5.0, 0.0, 10.0, e valores entre as fronteiras.

**Exercício 4** — Escreva testes para a `Agenda` com `ArrayList<Contato>`: adicionar um contato, remover existente, remover inexistente (não deve lançar exception), buscar por termo parcial, lista vazia.

**Exercício 5** — Refatore os exercícios anteriores para usar `@BeforeEach` e `assertAll` onde fizer sentido.

**Exercício 6** — Escreva testes para as exceções de domínio do `excecoes-02`: `Biblioteca.emprestar()` com livro indisponível, `Biblioteca.devolver()` com empréstimo inexistente.

> **Gabarito:**
> Exercício 1 — divisão por zero:
> ```java
> @Test
> void dividir_divisorZero_lancaArithmeticException() {
>     Calculadora calc = new Calculadora();
>     ArithmeticException ex = assertThrows(ArithmeticException.class,
>         () -> calc.dividir(10.0, 0.0));
>     assertTrue(ex.getMessage().toLowerCase().contains("zero"));
> }
> ```
