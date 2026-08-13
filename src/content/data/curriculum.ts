import type { Module } from '@/types'

export const CURRICULUM: Module[] = [
  {
    number: 1,
    slug: 'modulo-01-fundamentos',
    title: 'Fundamentos e Lógica Modular',
    description: 'Revisão de Java, métodos estáticos e lógica procedural. A base necessária antes de entrar no paradigma OO.',
    color: 'from-slate-600 to-slate-800',
    encounters: [
      { slug: 'encontro-01', number: 1,  title: 'Introdução à Plataforma Java e Lógica Procedural', module: 1, type: 'teoria',  xp: 50,  exercises: 5 },
      { slug: 'encontro-02', number: 2,  title: 'Aprofundamento em Métodos',                          module: 1, type: 'teoria',  xp: 50,  exercises: 5 },
      {
        slug: 'desafio-m01', number: 0, title: '⚔️ Desafio do Módulo 1 — JOptionPane + Fundamentos', module: 1, type: 'desafio', xp: 120, exercises: 0,
        challengeTasks: [
          { id: 't1', label: 'Calculadora com 4 operações usando JOptionPane',            coins: 20, difficulty: 'basico'        },
          { id: 't2', label: 'Calculadora de IMC com validação e mensagem de categoria',  coins: 25, difficulty: 'intermediario' },
          { id: 't3', label: 'Conversor de temperatura (°C ↔ °F ↔ K) via JOptionPane',   coins: 30, difficulty: 'intermediario' },
          { id: 't4', label: 'Jogo de adivinhação com contador de tentativas',            coins: 45, difficulty: 'avancado'      },
        ],
      },
    ],
  },
  {
    number: 2,
    slug: 'modulo-02-poo',
    title: 'O Paradigma Orientado a Objetos',
    description: 'Transição para POO: Classes, Objetos, Construtores, UML e Modelagem a partir de requisitos.',
    color: 'from-blue-600 to-blue-800',
    encounters: [
      { slug: 'encontro-03', number: 3,  title: 'Transição de Paradigma — Classes e Objetos I',     module: 2, type: 'teoria',    xp: 50,  exercises: 5 },
      { slug: 'encontro-04', number: 4,  title: 'Gerenciamento de Estado — Classes e Objetos II',   module: 2, type: 'teoria',    xp: 50,  exercises: 5 },
      { slug: 'encontro-05', number: 5,  title: 'Engenharia de Requisitos e Modelagem',             module: 2, type: 'teoria',    xp: 50,  exercises: 4 },
      { slug: 'encontro-06', number: 6,  title: 'Atividade Prática 1',                              module: 2, type: 'avaliacao', xp: 150, exercises: 1 },
      { slug: 'colecoes-01', number: 0, title: 'Coleções — ArrayList, List e Iteração',             module: 2, type: 'complementar', xp: 60, exercises: 6 },
      { slug: 'colecoes-02', number: 0, title: 'Map, Set e Generics',                               module: 2, type: 'complementar', xp: 60, exercises: 5 },
      {
        slug: 'desafio-m02', number: 0, title: '⚔️ Desafio do Módulo 2 — JOptionPane + POO',        module: 2, type: 'desafio', xp: 140, exercises: 0,
        challengeTasks: [
          { id: 't1', label: 'Criar classe Aluno e coletar dados via JOptionPane',               coins: 20, difficulty: 'basico'        },
          { id: 't2', label: 'Agenda de Contatos com array de objetos e menu JOptionPane',       coins: 35, difficulty: 'intermediario' },
          { id: 't3', label: 'Estacionamento: calcular tarifa por tipo de veículo (JOptionPane)',coins: 40, difficulty: 'avancado'      },
          { id: 't4', label: 'Mini-banco com saldo, depósito e saque via diálogos',             coins: 45, difficulty: 'expert'        },
        ],
      },
    ],
  },
  {
    number: 3,
    slug: 'modulo-03-encapsulamento',
    title: 'Proteção e Integridade',
    description: 'Encapsulamento, modificadores de acesso, invariantes de classe e exceções de domínio.',
    color: 'from-green-600 to-green-800',
    encounters: [
      { slug: 'encontro-07', number: 7,  title: 'Princípio da Ocultação de Informação — Encapsulamento I', module: 3, type: 'teoria', xp: 50,  exercises: 5 },
      { slug: 'encontro-08', number: 8,  title: 'Invariantes de Classe — Encapsulamento II',               module: 3, type: 'teoria', xp: 50,  exercises: 5 },
      { slug: 'encontro-09', number: 9,  title: 'Revisão Geral e Laboratório de Fixação',                  module: 3, type: 'lab',    xp: 50,  exercises: 8 },
      { slug: 'encontro-10', number: 10, title: 'Avaliação Objetiva',                                       module: 3, type: 'prova',  xp: 150, exercises: 0 },
      { slug: 'excecoes-01', number: 0,  title: 'Hierarquia de Exceções — checked vs unchecked',            module: 3, type: 'complementar', xp: 60, exercises: 5 },
      { slug: 'excecoes-02', number: 0,  title: 'Exceções de Domínio e Custom Exceptions',                  module: 3, type: 'complementar', xp: 60, exercises: 5 },
      {
        slug: 'desafio-m03', number: 0, title: '⚔️ Desafio do Módulo 3 — JOptionPane + Encapsulamento',    module: 3, type: 'desafio', xp: 160, exercises: 0,
        challengeTasks: [
          { id: 't1', label: 'Conta bancária: depósito e saque com validação e dialogo de erro',    coins: 25, difficulty: 'basico'        },
          { id: 't2', label: 'Produto com preço protegido: rejeitar valores negativos via dialogo', coins: 35, difficulty: 'intermediario' },
          { id: 't3', label: 'Senha com encapsulamento: tentativas limitadas e alerta de bloqueio', coins: 45, difficulty: 'avancado'      },
          { id: 't4', label: 'Mini-estoque: invariante de quantidade mínima com JOptionPane',       coins: 55, difficulty: 'expert'        },
        ],
      },
    ],
  },
  {
    number: 4,
    slug: 'modulo-04-heranca',
    title: 'Reuso e Hierarquia',
    description: 'Herança, polimorfismo por herança, sobrescrita de métodos, classes abstratas e a relação É-UM.',
    color: 'from-purple-600 to-purple-800',
    encounters: [
      { slug: 'encontro-11', number: 11, title: 'Generalização e Especialização — Herança I', module: 4, type: 'teoria',    xp: 50,  exercises: 5 },
      { slug: 'encontro-12', number: 12, title: 'Mecânica de Herança — Herança II',           module: 4, type: 'teoria',    xp: 50,  exercises: 5 },
      { slug: 'encontro-13', number: 13, title: 'Classes Abstratas',                           module: 4, type: 'teoria',    xp: 50,  exercises: 5 },
      { slug: 'encontro-14', number: 14, title: 'Trabalho Prático 2',                          module: 4, type: 'avaliacao', xp: 150, exercises: 1 },
      {
        slug: 'desafio-m04', number: 0, title: '⚔️ Desafio do Módulo 4 — JOptionPane + Herança', module: 4, type: 'desafio', xp: 180, exercises: 0,
        challengeTasks: [
          { id: 't1', label: 'Menu JOptionPane para selecionar tipo de Funcionario',                   coins: 25, difficulty: 'basico'        },
          { id: 't2', label: 'Sistema de cadastro com herança: Person → Aluno/Professor',             coins: 40, difficulty: 'intermediario' },
          { id: 't3', label: 'Folha de pagamento: calcular salários de tipos diferentes via diálogo', coins: 50, difficulty: 'avancado'      },
          { id: 't4', label: 'Template Method + JOptionPane: relatório formatado por tipo',            coins: 65, difficulty: 'expert'        },
        ],
      },
    ],
  },
  {
    number: 5,
    slug: 'modulo-05-polimorfismo',
    title: 'Contratos e Comportamentos Dinâmicos',
    description: 'Polimorfismo, Princípio de Substituição de Liskov, downcasting e Interfaces como contratos.',
    color: 'from-orange-600 to-orange-800',
    encounters: [
      { slug: 'encontro-15', number: 15, title: 'O Princípio da Substituição — Polimorfismo I', module: 5, type: 'teoria', xp: 50, exercises: 5 },
      { slug: 'encontro-16', number: 16, title: 'Identificação de Tipos — Polimorfismo II',     module: 5, type: 'teoria', xp: 50, exercises: 5 },
      { slug: 'encontro-17', number: 17, title: 'Acoplamento e Contratos — Interfaces',         module: 5, type: 'teoria', xp: 50, exercises: 5 },
      { slug: 'junit-01',    number: 0,  title: 'Testes Unitários com JUnit 5 — Fundamentos',  module: 5, type: 'complementar', xp: 70, exercises: 6 },
      { slug: 'junit-02',    number: 0,  title: 'Testando Contratos e Interfaces com JUnit 5', module: 5, type: 'complementar', xp: 70, exercises: 5 },
      {
        slug: 'desafio-m05', number: 0, title: '⚔️ Desafio do Módulo 5 — JOptionPane + Polimorfismo', module: 5, type: 'desafio', xp: 200, exercises: 0,
        challengeTasks: [
          { id: 't1', label: 'Calculadora de áreas: selecionar forma geométrica via JOptionPane',      coins: 30, difficulty: 'basico'        },
          { id: 't2', label: 'Sistema de notificação: interface Notificavel + 3 implementações',       coins: 45, difficulty: 'intermediario' },
          { id: 't3', label: 'Coleção polimórfica com menu JOptionPane + instanceof defensivo',        coins: 55, difficulty: 'avancado'      },
          { id: 't4', label: 'Strategy + JOptionPane: ordenação configurável por critério',            coins: 70, difficulty: 'expert'        },
        ],
      },
    ],
  },
  {
    number: 6,
    slug: 'modulo-06-projeto-final',
    title: 'Síntese e Projeto Final',
    description: 'Integração de todos os pilares da POO em um projeto arquitetural real com defesa oral.',
    color: 'from-rose-600 to-rose-800',
    encounters: [
      { slug: 'encontro-18', number: 18, title: 'Trabalho Prático 3 — Design e Arquitetura',      module: 6, type: 'avaliacao',   xp: 150, exercises: 0 },
      { slug: 'encontro-19', number: 19, title: 'Trabalho Prático 3 — Desenvolvimento Intensivo', module: 6, type: 'avaliacao',   xp: 150, exercises: 0 },
      { slug: 'encontro-20', number: 20, title: 'Defesa Arquitetural e Encerramento',             module: 6, type: 'apresentacao', xp: 200, exercises: 0 },
      {
        slug: 'desafio-m06', number: 0, title: '⚔️ Desafio Final — JOptionPane + SOLID Completo', module: 6, type: 'desafio', xp: 250, exercises: 0,
        challengeTasks: [
          { id: 't1', label: 'Sistema de pagamentos OCP: adicionar Pix sem modificar ProcessadorPagamentos', coins: 40, difficulty: 'intermediario' },
          { id: 't2', label: 'Folha de pagamento completa com UI JOptionPane (SRP + DIP)',                   coins: 55, difficulty: 'avancado'      },
          { id: 't3', label: 'SOLID Audit: refatorar código violando 3 princípios fornecidos',               coins: 70, difficulty: 'avancado'      },
          { id: 't4', label: 'Projeto livre: sistema original com todos os 5 princípios SOLID + JOptionPane',coins: 85, difficulty: 'expert'        },
        ],
      },
    ],
  },
  {
    number: 7,
    slug: 'modulo-07-joptionpane',
    title: 'Bônus — JOptionPane e Interface Gráfica',
    description: 'Caixas de diálogo Swing para criar interfaces gráficas simples. Integre GUI nos seus projetos POO.',
    color: 'from-teal-600 to-cyan-700',
    encounters: [
      {
        slug: 'joptionpane-01', number: 0, title: 'JOptionPane — Do Console à Interface Gráfica', module: 7, type: 'bonus', xp: 80, exercises: 6,
      },
    ],
  },
]

export function getEncounterBySlug(slug: string) {
  for (const module of CURRICULUM) {
    const encounter = module.encounters.find((e) => e.slug === slug)
    if (encounter) return { encounter, module }
  }
  return null
}

export function getAllEncounters() {
  return CURRICULUM.flatMap((m) => m.encounters)
}
