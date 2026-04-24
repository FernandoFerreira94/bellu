export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-white px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-pink-800 mb-4">Ayumi Nails</h1>
        <p className="text-gray-600 mb-8">Agende seu horário de forma rápida e fácil</p>
        <a
          href="/schedule"
          className="inline-block bg-pink-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-pink-700 transition-colors"
        >
          Agendar Agora
        </a>
      </div>
    </main>
  )
}
