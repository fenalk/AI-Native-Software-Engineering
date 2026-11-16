import { Link } from '../../components/atoms/Link/Link.jsx'
import { AppTemplate } from '../../components/templates/AppTemplate/AppTemplate.jsx'

export function AboutPage() {
  return (
    <AppTemplate active="about">
      <section className="flex flex-col gap-6 rounded-lg bg-surface p-8">
        <h1 className="m-0 text-3xl font-semibold leading-normal text-ink">
          Sobre nós
        </h1>
        <p className="m-0 text-xl leading-normal text-ink">
          O Code Connect é um espaço para compartilhar código, aprender em
          comunidade e descobrir como outras pessoas resolvem problemas reais
          de front-end e back-end.
        </p>
        <p className="m-0 text-sm leading-normal text-muted">
          Este feed faz parte do sandbox do curso de AI-Native Software
          Engineering da Alura. Os posts publicados aqui são dados de
          demonstração.
        </p>
        <Link href="/feed" variant="accent">
          Voltar ao feed
        </Link>
      </section>
    </AppTemplate>
  )
}
