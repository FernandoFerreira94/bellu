import { ServiceList } from '@/components/services/service-list'

export default function ServicesPage() {
  return (
    <section className="space-y-4 px-4">
      <div className=''>
        <p className="text-xs font-medium uppercase tracking-widest text-stone-400">Serviços</p>
        <h2 className="mt-1 text-2xl font-semibold text-stone-800">Meus serviços</h2>
      </div>
      <ServiceList />
    </section>
  )
}
