import Image from "next/image";
import Logo from "@/assets/logo-bellu.png";

import { UserMenu } from "./user-menu";

export default function Header({ 
  user, 
  userGoogle 
}: {
  user: { studio_name: string; logo_url: string | null; owner_name: string } | null;
  userGoogle?: Record<string, string> | null;
}) {
    const studioName = user?.studio_name ?? "Bellu";
    const logoUrl = user?.logo_url ?? null;


    return (
        <header className="flex lg:hidden items-center justify-between shadow-lg bg-primary px-4 py-2 rounded-b-xl mb-6">
        <div className="flex items-center space-x-2">
          {logoUrl ? (
           
            <img
              src={logoUrl}
              alt={studioName}
              width={32}
              height={32}
              className="rounded-lg object-contain bg-white/10"
            />
          ) : (
            <Image src={Logo} alt={studioName} width={32} height={32} className="rounded-lg" />
          )}
          <h1 className="text-xl font-medium tracking-tight text-secondary font-serif">
            {studioName}
          </h1>
        </div>
        <UserMenu initialUser={userGoogle as Record<string, string>} />
      </header>
    );
}