import Link from 'next/link'
import { ArrowRight, CheckCircle, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const PILARES = [
  { icon: '🧱', title: 'Encapsulamento', desc: 'Proteja o estado interno com modificadores de acesso e invariantes de classe.' },
  { icon: '🧬', title: 'Herança',        desc: 'Elimine duplicação via generalização e especialização com a relação É-UM.' },
  { icon: '🎭', title: 'Polimorfismo',   desc: 'Trate objetos distintos de forma uniforme com o Princípio de Substituição de Liskov.' },
  { icon: '🔒', title: 'Abstração',      desc: 'Modele em Classes, Interfaces e UML antes de digitar uma linha de código.' },
]

const DESTAQUES = [
  '20 encontros em 6 módulos com progressão pedagógica rigorosa',
  'UML integrado desde o Encontro 1 — modele antes de codificar',
  'Código comentado, fluxogramas e diagramas em cada aula',
  '3 Trabalhos Práticos + Prova Objetiva + Defesa Arquitetural',
  'Gamificação com XP, badges e níveis de proficiência',
  'Exercícios progressivos do nível fácil ao difícil',
]

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center">
          <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/20">
            Java · POO · UML · 80 aulas
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-6">
            Programação Orientada<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              a Objetos em Java
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Do método estático ao polimorfismo. Uma progressão pedagógica com teoria, UML,
            código comentado e exercícios práticos em cada encontro.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/cursos/poo-java">
              <Button size="lg" className="gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8">
                Começar o Curso <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="gap-2 bg-white text-slate-900 border-white hover:bg-slate-700 hover:text-white hover:border-slate-700">
                <Trophy size={16} /> Meu Progresso
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '20', label: 'Encontros' },
            { value: '80', label: 'Aulas' },
            { value: '6',  label: 'Módulos'  },
            { value: '10', label: 'Badges'   },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pilares */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-3">Os 4 Pilares da POO</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Cada pilar é introduzido no momento certo, após a base anterior estar sólida.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILARES.map((p) => (
            <Card key={p.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center space-y-3">
                <span className="text-4xl">{p.icon}</span>
                <h3 className="font-bold">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Por que diferente */}
      <section className="border-y bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Por que este curso é diferente?</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              A maioria dos cursos de POO começa direto em classes e objetos, sem nivelar a lógica
              dos alunos. Aqui, a progressão é pedagógica: métodos primeiro, objetos depois,
              hierarquia em seguida — cada etapa construindo sobre a anterior.
            </p>
            <ul className="space-y-3">
              {DESTAQUES.map((d) => (
                <li key={d} className="flex items-start gap-3 text-sm">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-slate-950 p-6 text-slate-100 font-mono text-sm">
            <div className="flex gap-1.5 mb-4">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-green-500/70" />
            </div>
            <pre className="text-[13px] leading-relaxed whitespace-pre-wrap">{`// E01: primeiro método estático
public static double calcularArea(
    double base, double altura) {
  return base * altura;
}

// E03: primeiro objeto
Carro meuCarro = new Carro();
meuCarro.ligar();

// E15: polimorfismo em ação
List<Funcionario> equipe = new ArrayList<>();
equipe.add(new Horista("Ana", 40));
equipe.add(new Assalariado("Bob", 5000));
equipe.forEach(f ->
  System.out.println(f.calcularSalario())
);`}</pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
        <p className="text-muted-foreground mb-8">Acesse o primeiro encontro agora mesmo.</p>
        <Link href="/cursos/poo-java">
          <Button size="lg" className="gap-2 px-10">
            Ver Currículo Completo <ArrowRight size={18} />
          </Button>
        </Link>
      </section>
    </main>
  )
}
