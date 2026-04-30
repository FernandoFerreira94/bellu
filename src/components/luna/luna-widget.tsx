'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLunaUIStore } from '@/store/lunaUIStore'

export function LunaWidget() {
  const isWidgetOpen = useLunaUIStore((state) => state.isWidgetOpen)
  const setWidgetOpen = useLunaUIStore((state) => state.setWidgetOpen)

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {isWidgetOpen && (
        <Card className="w-[min(22rem,calc(100vw-2rem))] border-stone-200/80 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base text-stone-900">Luna IA</CardTitle>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setWidgetOpen(false)}
            >
              Fechar
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-stone-600">
              Widget flutuante pronto para integrar com o agent endpoint.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
