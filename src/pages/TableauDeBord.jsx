
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Actualites from "../components/dashboard/Actualites";
import ChiffresClés from "../components/dashboard/ChiffresClés";
import GraphiqueRepartition from "../components/dashboard/GraphiqueRepartition";
import GraphiqueTendance from "../components/dashboard/GraphiqueTendance";
import GraphiqueGenreClasse from "../components/dashboard/GraphiqueGenreClasse";
import EnfantsRecents from "../components/dashboard/EnfantsRecents";
import BoutonAjoutFlottant from "../components/shared/BoutonAjoutFlottant";
import DialogAjoutEvenement from "../components/evenements/DialogAjoutEvenement";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function TableauDeBord() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: enfants = [] } = useQuery({
    queryKey: ['enfants'],
    queryFn: () => base44.entities.Enfant.list('-date_ajout'),
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: evenements = [] } = useQuery({
    queryKey: ['evenements'],
    queryFn: () => base44.entities.Evenement.list('-date'),
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });
  
  // Problèmes = événements négatifs NON réglés
  const problemesCount = evenements.filter(evt => 
    evt.categorie === 'Négatif' && evt.probleme_regle !== true
  ).length;
  
  // Problèmes réglés = événements négatifs marqués comme résolus
  const problemesRegles = evenements.filter(evt =>
    evt.categorie === 'Négatif' && evt.probleme_regle === true
  ).length;

  const il30Jours = new Date();
  il30Jours.setDate(il30Jours.getDate() - 30);

  const enfantsASurveiller = new Set(
    evenements
      .filter(evt => evt.categorie === 'Négatif' && new Date(evt.date) >= il30Jours)
      .map(evt => evt.enfant_id)
  ).size;

  return (
    <>
      <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
              <p className="text-gray-600 mt-1">Vue d&apos;ensemble de l&apos;activité</p>
            </div>
            <Button 
              onClick={() => setDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 shadow-lg w-full md:w-auto"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un problème
            </Button>
          </div>

          <ChiffresClés
            enfantsCount={enfants.length}
            evenementsCount={problemesCount}
            evenementsAujourdhui={problemesRegles}
            enfantsASurveiller={enfantsASurveiller}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
            <div className="w-full order-2 lg:order-1">
              <EnfantsRecents enfants={enfants} evenements={evenements} />
            </div>
            <div className="w-full order-1 lg:order-2">
              <Actualites />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
            <div className="w-full">
              <GraphiqueRepartition evenements={evenements} />
            </div>
            <div className="w-full">
              <GraphiqueTendance evenements={evenements} />
            </div>
          </div>

          <div className="mt-4 md:mt-6 w-full">
            <GraphiqueGenreClasse enfants={enfants} evenements={evenements} />
          </div>
        </div>
      </div>

      <BoutonAjoutFlottant />
      <DialogAjoutEvenement open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
