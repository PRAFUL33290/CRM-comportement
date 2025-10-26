
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DernierMessage() {
  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.MessageMur.list('-created_date', 1),
  });

  const dernierMessage = messages[0];

  return (
    <Card className="shadow-md border-purple-100">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
        <CardTitle className="flex items-center gap-2 text-purple-900 text-lg">
          <MessageSquare className="w-5 h-5" />
          Dernier message
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {!dernierMessage ? (
          <div className="text-center py-6 text-gray-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucun message pour le moment</p>
          </div>
        ) : (
          <div className="flex gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold text-sm">
                {dernierMessage.auteur_nom?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm text-gray-900">{dernierMessage.auteur_nom}</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(dernierMessage.created_date), "d MMM 'à' HH:mm", { locale: fr })}
                </p>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{dernierMessage.contenu}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
