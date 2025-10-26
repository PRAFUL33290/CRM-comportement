import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageSquare } from "lucide-react";

export default function ActualitesSidebar() {
  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.MessageMur.list('-created_date', 1),
    staleTime: 120000,
    refetchOnWindowFocus: false,
  });

  const dernierMessage = messages[0];

  if (!dernierMessage) {
    return (
      <div className="p-3 bg-purple-50 rounded-lg">
        <p className="text-sm text-purple-700">Aucun message pour le moment</p>
      </div>
    );
  }

  return (
    <Link 
      to={createPageUrl("Messagerie")} 
      className="block p-3 bg-purple-50 rounded-lg transition-colors duration-200 hover:bg-purple-100 group"
    >
      <div className="flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-purple-800 text-sm leading-tight group-hover:underline">
            {dernierMessage.auteur_nom}
          </p>
          <p className="text-xs text-purple-700 mt-1 line-clamp-2">
            {dernierMessage.contenu}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {format(new Date(dernierMessage.created_date), "d MMM", { locale: fr })}
          </p>
        </div>
      </div>
    </Link>
  );
}