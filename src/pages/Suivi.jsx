
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, AlertTriangle, TrendingUp, Eye } from "lucide-react";
import { format, isPast, isFuture, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "../utils";

export default function Suivi() {
  const { data: evenements = [] } = useQuery({
    queryKey: ['evenements'],
    queryFn: () => base44.entities.Evenement.list('-prochain_suivi'),
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const evenementsAvecSuivi = evenements.filter(evt => evt.prochain_suivi);

  const suiviEnRetard = evenementsAvecSuivi.filter(evt => 
    evt.prochain_suivi && isPast(new Date(evt.prochain_suivi)) && !isToday(new Date(evt.prochain_suivi))
  );

  const suiviAujourdhui = evenementsAvecSuivi.filter(evt => 
    evt.prochain_suivi && isToday(new Date(evt.prochain_suivi))
  );

  const suiviAVenir = evenementsAvecSuivi.filter(evt => 
    evt.prochain_suivi && isFuture(new Date(evt.prochain_suivi)) && !isToday(new Date(evt.prochain_suivi))
  );

  const getCategorieColor = (cat) => {
    switch(cat) {
      case 'Positif': return 'bg-green-100 text-green-800 border-green-200';
      case 'Négatif': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderSuiviSection = (title, items, color, icon) => (
    <Card className="shadow-md">
      <CardHeader className={`border-b ${color}`}>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title} ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {items.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Aucun suivi {title.toLowerCase()}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((evt) => (
              <div key={evt.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{evt.enfant_nom}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getCategorieColor(evt.categorie)}>
                        {evt.categorie}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {format(new Date(evt.date), "d MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    Suivi : {format(new Date(evt.prochain_suivi), "d MMM", { locale: fr })}
                  </Badge>
                </div>
                
                {evt.lieu && (
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Lieu:</span> {evt.lieu}
                  </p>
                )}
                
                {evt.details && (
                  <p className="text-sm text-gray-600 mb-2">{evt.details}</p>
                )}
                
                {evt.consequence_action && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Action prise:</span> {evt.consequence_action}
                  </p>
                )}
                
                {evt.animateur_nom && (
                  <p className="text-xs text-gray-500 mt-2">
                    <span className="font-medium">Animateur:</span> {evt.animateur_nom}
                  </p>
                )}

                <div className="flex justify-end mt-4">
                  <Link to={createPageUrl("evenement-details", { evenementId: evt.id })}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Voir les détails
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Suivi des Événements</h1>
          <p className="text-gray-600">Gérer les suivis programmés</p>
        </div>

        <div className="grid gap-6">
          {renderSuiviSection(
            "En retard",
            suiviEnRetard,
            "bg-red-50",
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}

          {renderSuiviSection(
            "Aujourd'hui",
            suiviAujourdhui,
            "bg-orange-50",
            <Calendar className="w-5 h-5 text-orange-600" />
          )}

          {renderSuiviSection(
            "À venir",
            suiviAVenir,
            "bg-green-50",
            <TrendingUp className="w-5 h-5 text-green-600" />
          )}
        </div>
      </div>
    </div>
  );
}
