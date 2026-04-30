"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, User, Phone, Calendar, ClipboardList } from "lucide-react";

interface AppointmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
}

// Mock clients for search
const mockClients = [
  { id: 1, name: "Maria Silva", phone: "(11) 98765-4321" },
  { id: 2, name: "Ana Oliveira", phone: "(11) 91234-5678" },
  { id: 3, name: "Juliana Costa", phone: "(11) 99999-8888" },
];

const procedures = [
  "Manutenção Acrílico",
  "Aplicação Gel",
  "Esmaltação Simples",
  "Design de Sobrancelha",
  "Pé e Mão",
];

export function AppointmentDialog({ isOpen, onOpenChange, selectedDate }: AppointmentDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [procedure, setProcedure] = useState("");
  const [date, setDate] = useState(selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("10:00");

  const handleClientSelect = (client: typeof mockClients[0]) => {
    setClientName(client.name);
    setPhone(client.phone);
    setSearchTerm("");
  };

  const filteredClients = searchTerm 
    ? mockClients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-3xl border-none shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            Novo Agendamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client Search */}
          <div className="space-y-2 relative">
            <Label htmlFor="search" className="text-xs font-semibold uppercase text-stone-500 ml-1">
              Buscar Cliente
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                id="search"
                placeholder="Nome da cliente..."
                className="pl-10 h-12 bg-stone-50 border-none rounded-xl focus-visible:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {filteredClients.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-stone-100 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                {filteredClients.map(client => (
                  <button
                    key={client.id}
                    className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors flex flex-col"
                    onClick={() => handleClientSelect(client)}
                  >
                    <span className="font-medium text-stone-800">{client.name}</span>
                    <span className="text-[10px] text-stone-500">{client.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase text-stone-500 ml-1">
                Nome Completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  id="name"
                  placeholder="Nome"
                  className="pl-10 h-12 bg-stone-50 border-none rounded-xl focus-visible:ring-primary/20"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-semibold uppercase text-stone-500 ml-1">
                WhatsApp / Telefone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  className="pl-10 h-12 bg-stone-50 border-none rounded-xl focus-visible:ring-primary/20"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date Field */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs font-semibold uppercase text-stone-500 ml-1">
                  Data
                </Label>
                <Input
                  id="date"
                  type="date"
                  className="h-12 bg-stone-50 border-none rounded-xl focus-visible:ring-primary/20"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Time Field */}
              <div className="space-y-2">
                <Label htmlFor="time" className="text-xs font-semibold uppercase text-stone-500 ml-1">
                  Horário
                </Label>
                <Input
                  id="time"
                  type="time"
                  className="h-12 bg-stone-50 border-none rounded-xl focus-visible:ring-primary/20"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            {/* Procedure Select */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-stone-500 ml-1">
                Procedimento
              </Label>
              <Select onValueChange={(v: string | null) => setProcedure(v ?? "")}>
                <SelectTrigger className="h-12 bg-stone-50 border-none rounded-xl focus-visible:ring-primary/20">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-stone-400" />
                    <SelectValue placeholder="Selecione o serviço" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl border-stone-100 shadow-xl">
                  {procedures.map((p, i) => (
                    <SelectItem key={i} value={p} className="hover:bg-primary/5 focus:bg-primary/5 cursor-pointer">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button 
            className="w-full h-14 bg-primary text-secondary font-bold text-lg rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-primary/90 transition-all active:scale-[0.98]"
            onClick={() => {
              // Handle save logic here
              onOpenChange(false);
            }}
          >
            Confirmar Agendamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
