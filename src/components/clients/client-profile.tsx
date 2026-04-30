import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ClientProfileCardProps = {
  clientId: string;
};

export function ClientProfileCard({ clientId }: ClientProfileCardProps) {
  return (
    <Card className="border-stone-200/80 shadow-none">
      <CardHeader>
        <CardTitle className="text-lg text-stone-900">
          Perfil da cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-stone-500">ID referência: {clientId}</p>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </CardContent>
    </Card>
  );
}
