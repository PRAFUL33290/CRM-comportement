
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, Calendar, MapPin, User, Clock, Eye, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProblemesResolus() {
  const [deleteEventId, setDeleteEventId] = useState(null);
  const [deleteEventNom, setDeleteEventNom] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: evenements = [] } = useQuery({
    queryKey: ['evenements'],
    queryFn: () => base44.entities.Evenement.list('-updated_date'),
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const deleteEvenement = useMutation({
    mutationFn: (id) => base44.entities.Evenement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evenements'] });
      setDeleteEventId(null);
      setDeleteEventNom("");
    },
  });

  const updateProblemeRegle = useMutation({
    mutationFn: ({ id, probleme_regle }) => base44.entities.Evenement.update(id, { probleme_regle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evenements'] });
    },
  });

  const problemesResolus = evenements.filter(evt =>
    evt.categorie === 'Négatif' && evt.probleme_regle === true
  );

  const deleteAllProblemes = useMutation({
    mutationFn: async () => {
      const deletePromises = problemesResolus.map(evt => base44.entities.Evenement.delete(evt.id));
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evenements'] });
      setDeleteAllDialogOpen(false);
    },
  });

  const handleDeleteClick = (evt) => {
    setDeleteEventId(evt.id);
    setDeleteEventNom(evt.enfant_nom);
  };

  const confirmDelete = async () => {
    if (deleteEventId) {
      await deleteEvenement.mutateAsync(deleteEventId);
    }
  };

  const handleMarquerNonResolu = async (evt) => {
    await updateProblemeRegle.mutateAsync({
      id: evt.id,
      probleme_regle: false
    });
  };

  const filteredEvenements = problemesResolus.filter(evt => {
    const matchesSearch = evt.enfant_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evt.details?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Problèmes résolus</h1>
              <p className="text-gray-600">{problemesResolus.length} problème{problemesResolus.length > 1 ? 's' : ''} résolu{problemesResolus.length > 1 ? 's' : ''}</p>
            </div>
            <Button
              onClick={() => setDeleteAllDialogOpen(true)}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={problemesResolus.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer tout
            </Button>
          </div>

          <Card className="shadow-md mb-6">
            <CardHeader className="border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un problème résolu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredEvenements.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Aucun problème résolu trouvé</p>
              </div>
            ) : (
              filteredEvenements.map((evt) => (
                <Card key={evt.id} className="hover:shadow-lg transition-shadow relative flex flex-col bg-green-50 border-2 border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {evt.lieu && (
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                            <h3 className="font-bold text-gray-900 text-lg sm:text-xl truncate">{evt.lieu}</h3>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{format(new Date(evt.date), 'd MMM yyyy à HH:mm', { locale: fr })}</span>
                        </div>

                        <Link
                          to={createPageUrl("Enfants", evt.enfant_id)}
                          className="text-green-700 hover:text-green-800 hover:underline font-medium text-base sm:text-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {evt.enfant_nom}
                        </Link>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(evt); }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 sm:h-auto sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg border-2 border-green-300">
                      <CheckCircle className="w-5 h-5 text-green-700 flex-shrink-0" />
                      <span className="text-sm font-semibold text-green-800">
                        Problème résolu - L&apos;enfant a changé de comportement
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Badge className="bg-green-600 text-white">
                          Résolu
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-16 sm:w-24 h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${evt.intensite}%` }}
                          />
                        </div>
                        <span className="text-sm sm:text-base font-medium sm:font-semibold">{evt.intensite}%</span>
                      </div>
                    </div>

                    {evt.types_comportement && evt.types_comportement.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {evt.types_comportement.map((type, idx) => (
                          <Badge
                            key={type + idx}
                            className="bg-green-600 text-white text-xs justify-center"
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {evt.animateur_nom && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{evt.animateur_nom}</span>
                      </div>
                    )}

                    {evt.details && (
                      <div className="bg-white p-2 sm:p-3 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-700 line-clamp-3 sm:line-clamp-none">{evt.details}</p>
                      </div>
                    )}

                    {evt.convenu_parents && (
                      <div className="bg-green-100 border sm:border-2 border-green-300 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm font-semibold sm:font-bold text-green-900 mb-1 flex items-center gap-1 sm:gap-2">
                          <User className="w-3 h-3 sm:w-4 sm:h-4" />
                          Convenu avec les parents
                        </p>
                        <p className="text-sm text-green-800">{evt.convenu_parents}</p>
                      </div>
                    )}

                    {evt.sanction && (
                      <div className="bg-orange-50 border sm:border-2 border-orange-200 rounded-lg p-2 sm:p-4">
                        <p className="text-xs sm:text-sm font-bold text-orange-900 mb-1">
                          {evt.type_sanction || 'Sanction'}
                        </p>
                        <p className="text-xs sm:text-sm text-orange-800 line-clamp-2 sm:line-clamp-none">{evt.sanction}</p>
                        {evt.sanction_jusquau && (
                          <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                            <p className="text-xs sm:text-sm text-orange-600">
                              Jusqu&apos;au {format(new Date(evt.sanction_jusquau), 'd MMM à HH:mm', { locale: fr })}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1"></div>

                    <div className="pt-3 mt-3 border-t border-green-200 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarquerNonResolu(evt)}
                        className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Marquer comme non résolu
                      </Button>
                      <Link to={createPageUrl("Enfants", evt.enfant_id)} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-green-200 text-green-600 hover:bg-green-50"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir l&apos;enfant
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteEventId} onOpenChange={() => {
        setDeleteEventId(null);
        setDeleteEventNom("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce problème résolu ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le problème résolu de {deleteEventNom} sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer tous les problèmes résolus ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les problèmes résolus ({problemesResolus.length}) seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteAllProblemes.mutate()}
            >
              Supprimer tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
