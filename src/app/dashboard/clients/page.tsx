import { ClientList } from '@/components/clients/client-list'

export default function ClientsPage() {
  return (
    <section className="space-y-4 px-2">
      <div className='px-2'>
        <p className="text-xs font-medium uppercase tracking-widest text-stone-400">Clientes</p>
        <h2 className="mt-1 text-2xl font-semibold text-stone-800">Minhas clientes</h2>
      </div>
      <ClientList />
    </section>
  )
}
