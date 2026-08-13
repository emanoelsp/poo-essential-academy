/**
 * Simulação completa de um aluno resolvendo o Encontro 06.
 *
 * IMPORTANTE: todos os inputs usam .first() em vez de .nth(i) porque
 * FillCell/FillInput removem o <input> do DOM quando a resposta está correta.
 * Usar índices fixos quebraria assim que o primeiro campo fosse acertado.
 *
 * Execute com: pnpm e2e:ui
 */
import { test, expect, type Page } from '@playwright/test'

const URL = '/test-preview'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Preenche os próximos N campos "Sua resposta…" sequencialmente com .first() */
async function fillNext(
  page: Page,
  answers: string[],
  placeholder = 'Sua resposta…',
  delay = 100
) {
  const inputs = page.locator(`input[placeholder="${placeholder}"]`)
  for (const answer of answers) {
    const inp = inputs.first()
    await inp.scrollIntoViewIfNeeded()
    await inp.fill(answer)
    await inp.blur()
    await page.waitForTimeout(delay)
  }
}

/** RelChallenge cards: "rounded-xl border-2" (CodeTrace usa "rounded-xl border border-border") */
function relCard(page: Page, n: number) {
  return page.locator('.rounded-xl.border-2').nth(n - 1)
}

async function solveRel(
  page: Page,
  cardN: number,
  wrongType: string | null,
  rightType: string,
  label: string
) {
  const card = relCard(page, cardN)
  await card.scrollIntoViewIfNeeded()
  if (wrongType) {
    await card.getByText(wrongType).click()
    await page.waitForTimeout(400)
  }
  await card.getByText(rightType).click()
  await page.waitForTimeout(300)
  if (label) {
    const inp = card.locator('input[placeholder="ex: gerencia"]')
    await inp.fill(label)
    await inp.blur()
    await page.waitForTimeout(200)
  }
}

// ── Teste principal ────────────────────────────────────────────────────────────

test('Aluno resolve o Encontro 06 completo', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto(URL)
  // Force CodeTrace preset 1 (diaria=180.0, dias=3, total=540.0) for reproducible test
  await page.evaluate(() => {
    localStorage.setItem('poo:/test-preview:hotel-reserva-trace:preset', '1')
  })
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)

  // ── Fase 0: Story Points ──────────────────────────────────────────────────
  await test.step('Fase 0 — Estima Story Points', async () => {
    await page.getByRole('heading', { name: /Fase 0/i }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await fillNext(page, ['2', '3', '3', '2', '1', '5', '8', '3'])
  })

  // ── 1.1 Análise ───────────────────────────────────────────────────────────
  await test.step('1.1 — Extração de classes e métodos do enunciado', async () => {
    await page.getByRole('heading', { name: /1\.1/i }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await fillNext(page, [
      'Contexto do sistema', 'Classe', 'Atributos de Quarto',
      'Classe', 'Atributos de Hóspede', 'Classe', 'Atributos de Reserva',
      // verbos
      'Reserva.calcularTotal()', 'Reserva.cancelar()',
      'Hotel.listarReservas()', 'Hotel.calcularReceita()',
    ])
  })

  // ── 1.2 Relações ─────────────────────────────────────────────────────────
  await test.step('1.2 — Identifica relações (com erros intencionais)', async () => {
    await page.getByRole('heading', { name: /1\.2/i }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)

    await test.step('Hotel→Reserva: tenta Associação (X), depois Composição (✓)', async () =>
      solveRel(page, 1, 'Associação', 'Composição', 'gerencia'))

    await test.step('Hotel→Quarto: tenta Composição (X), depois Agregação (✓)', async () =>
      solveRel(page, 2, 'Composição', 'Agregação', 'possui'))

    await test.step('Reserva→Hospede: Associação direto (✓)', async () =>
      solveRel(page, 3, null, 'Associação', 'pertence a'))

    await test.step('Reserva→Quarto: Associação direto (✓)', async () =>
      solveRel(page, 4, null, 'Associação', 'ocupa'))
  })

  // ── 1.3 Fill-in UML ──────────────────────────────────────────────────────
  await test.step('1.3 — Completa diagrama UML com campos em branco', async () => {
    await page.getByRole('heading', { name: /1\.3/i }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)
    // FillInput também remove o <input> do DOM quando correto → .first() obrigatório
    await fillNext(page, [
      'reservas : Reserva[]',
      'fazerReserva(h, q, dias) Reserva',
      'calcularReceita() double',
      'Quarto',
      'diaria : double',
      'cpf : String',
      'Reserva',
      'dias : int',
      'cancelar() void',
    ], '___', 250)
  })

  // ── 1.4 Gabarito oculto ──────────────────────────────────────────────────
  await test.step('1.4 — Confirma gabarito bloqueado pelo professor', async () => {
    await page.getByRole('heading', { name: /1\.4/i }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await expect(page.getByText('Gabarito oculto pelo professor.').first()).toBeVisible()
  })

  // ── Etapa 2: Code Trace ───────────────────────────────────────────────────
  await test.step('Etapa 2 — Rastreamento de execução passo a passo', async () => {
    await page.getByRole('heading', { name: /Etapa 2/i }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)
    // Todos os "___" do fill-uml viraram spans → os restantes são do code trace
    await fillNext(page, [
      '101', '180.0', 'true',           // new Quarto(101, 1, "Standard", 180.0)
      'HotelPOO', '0',                  // new Hotel("HotelPOO", 50)
      'Alice Silva', '111.111.111-11',  // new Hospede(...)
      '1', 'true', '3', 'false', '1',  // fazerReserva(alice, q101, 3) — sucesso
      'null', '1', 'false',             // fazerReserva(alice, q101, 1) — quarto ocupado
      'false', 'true',                  // cancelarReserva(r1.numero)
      '540.0',                          // r1.calcularTotal()
    ], '___', 180)
  })

  // ── 2.2 Casos extremos ───────────────────────────────────────────────────
  await test.step('2.2 — Prevê comportamento em casos-limite', async () => {
    await page.getByText('Preveja o comportamento').scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await fillNext(page, [
      'retorna null + imprime aviso de dias inválido',
      'retorna null + imprime aviso de dias inválido',
      'retorna null + imprime aviso de quarto indisponível',
      'imprime aviso de reserva não encontrada',
      'segunda chamada imprime aviso e retorna sem alterar',
    ])
  })

  // ── Etapa 4: Bugs ─────────────────────────────────────────────────────────
  await test.step('Etapa 4 — Diagnostica os 3 bugs críticos', async () => {
    await page.getByRole('heading', { name: /Etapa 4/i }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await fillNext(page, [
      'Não valida se o quarto está disponível antes de criar a reserva — aceita reservas duplicadas',
      'Não restaura quarto.disponivel = true ao cancelar — quarto fica permanentemente bloqueado',
      'Subtrai o comprimento das strings de data em vez de calcular a diferença real de dias',
    ])
  })

  // ── Etapa 5: Retrospectiva ────────────────────────────────────────────────
  await test.step('Etapa 5 — Retrospectiva: SP real vs estimado', async () => {
    await page.getByRole('heading', { name: /5\.1/i }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await fillNext(page, [
      'ok', 'foi mais complexo', 'ok', 'ok', 'ok',
      'muito mais complexo — cancelamento era sutil',
      'muito mais complexo — Hotel orquestra tudo', 'ok',
    ])
  })

  await test.step('Etapa 5 — Auto-avaliação técnica (0-10)', async () => {
    await page.getByRole('heading', { name: /5\.2/i }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await fillNext(page, ['9', '10', '8', '9', '10', '8', '9', '9'])
  })

  // ── Screenshot final ──────────────────────────────────────────────────────
  await test.step('Screenshot: topo da página preenchida', async () => {
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(600)
    await page.screenshot({ path: 'e2e/screenshots/final-topo.png' })
  })
})

// ── RelationshipUML — feedback visual ────────────────────────────────────────

test('RelationshipUML — feedback de erro e acerto visual', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByRole('heading', { name: /1\.2/i }).scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)

  await test.step('Clica Agregação (errado) — botão fica vermelho + mensagem de erro', async () => {
    const card = relCard(page, 1)
    await card.getByText('Agregação').click()
    await page.waitForTimeout(600)
    const btn = card.getByText('Agregação').locator('xpath=ancestor::button')
    await expect(btn).toHaveClass(/border-red/)
    await expect(card.getByText('Não é Agregação. Tente outro tipo!')).toBeVisible()
  })

  await test.step('Clica Composição (correto) — campo de label aparece', async () => {
    const card = relCard(page, 1)
    await card.getByText('Composição').click()
    await page.waitForTimeout(600)
    await expect(card.locator('input[placeholder="ex: gerencia"]')).toBeVisible()
  })

  await test.step('Preenche label "gerencia" — hint de conclusão aparece', async () => {
    const card = relCard(page, 1)
    const inp = card.locator('input[placeholder="ex: gerencia"]')
    await inp.fill('gerencia')
    await inp.blur()
    await page.waitForTimeout(500)
    await expect(card.getByText(/Relação todo-parte forte/)).toBeVisible()
  })
})

// ── CodeTrace — correto = verde, errado = vermelho ────────────────────────────

test('CodeTrace — campo correto vira verde, errado fica vermelho', async ({ page }) => {
  await page.goto(URL)
  await page.evaluate(() => {
    localStorage.setItem('poo:/test-preview:hotel-reserva-trace:preset', '1')
  })
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.getByRole('heading', { name: /Etapa 2/i }).scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)

  // Neste teste isolado, os 9 blanks do fill-uml ainda existem → trace começa no índice 9
  const blanks = page.locator('input[placeholder="___"]')

  await test.step('q101.numero = 101 (correto) → some da DOM, texto verde aparece', async () => {
    await blanks.nth(9).fill('101')
    await blanks.nth(9).blur()
    await page.waitForTimeout(400)
    await expect(page.getByText('101').first()).toBeVisible()
    // input sumiu do DOM
    await expect(blanks.nth(9)).not.toHaveValue('101')
  })

  await test.step('q101.diaria = 999 (errado) → borda vermelha', async () => {
    await blanks.nth(9).fill('999')  // agora é o próximo blank (diaria)
    await blanks.nth(9).blur()
    await page.waitForTimeout(400)
    await expect(blanks.nth(9)).toHaveClass(/border-red/)
  })

  await test.step('q101.diaria = 180.0 (correto após correção)', async () => {
    await blanks.nth(9).fill('180.0')
    await blanks.nth(9).blur()
    await page.waitForTimeout(400)
    await expect(page.getByText('180.0').first()).toBeVisible()
  })
})

// ── Gabarito oculto por padrão ────────────────────────────────────────────────

test('Gabarito oculto por padrão no modo aluno', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')

  // Deve haver pelo menos 2 blocos bloqueados (diagrama + solução completa)
  const locked = page.getByText('Gabarito oculto pelo professor.')
  await expect(locked.first()).toBeVisible()
  expect(await locked.count()).toBeGreaterThanOrEqual(2)

  // Nenhum diagrama mermaid deve ser renderizado
  await expect(page.locator('svg.mermaid')).not.toBeAttached()
})
