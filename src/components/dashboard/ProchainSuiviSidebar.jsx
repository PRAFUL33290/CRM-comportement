import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar } from "lucide-react";

export default function ProchainSuiviSidebar() {
  const { data: prochainsSuivis = [] } = useQuery({
    queryKey: ['prochainSuivi'],
    queryFn: async () => {
      const allEvents = await base44.entities.Evenement.list('-date');
      const now = new Date();
      return allEvents.filter(evt => 
        evt.prochain_suivi && new Date(evt.prochain_suivi) >= now
      ).sort((a, b) => new Date(a.prochain_suivi) - new Date(b.prochain_suivi));
    },
    staleTime: 120000,
    refetchOnWindowFocus: false,
  });

  const prochainSuivi = prochainsSuivis[0];
  const nombreSuivis = prochainsSuivis.length;

  if (!prochainSuivi) {
    return (
      <Link 
        to={createPageUrl("Suivi")}
        className="block p-3 bg-blue-50 rounded-lg transition-colors duration-200 hover:bg-blue-100 group"
      >
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-blue-800 text-sm leading-tight group-hover:underline">
              Aucun suivi à venir
            </p>
            <p className="text-xs text-blue-700 mt-1 line-clamp-2">
              Cliquez ici pour planifier un nouveau suivi.
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      to={createPageUrl("Suivi")} 
      className="block p-3 bg-blue-50 rounded-lg transition-colors duration-200 hover:bg-blue-100 group"
    >
      <div className="flex items-start gap-3">
        <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-blue-800 text-sm leading-tight group-hover:underline truncate">
            {nombreSuivis} suivi{nombreSuivis > 1 ? 's' : ''} à venir
          </p>
          <p className="text-xs text-blue-700 mt-1 line-clamp-2">
            Prochain : {prochainSuivi.enfant_nom}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {format(new Date(prochainSuivi.prochain_suivi), "d MMM yyyy", { locale: fr })}
          </p>
        </div>
      </div>
    </Link>
  );
}