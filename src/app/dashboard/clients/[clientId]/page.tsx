import { ClientProfileCard } from '@/components/clients/client-profile'

type ClientProfilePageProps = {
  params: Promise<{
    clientId: string
  }>
}

export default async function ClientProfilePage({
  params,
}: ClientProfilePageProps) {
  const { clientId } = await params

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
          Perfil da cliente
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-stone-950">
          Histórico individual
        </h2>
      </div>

      <ClientProfileCard clientId={clientId} />
    </section>
  )
}
