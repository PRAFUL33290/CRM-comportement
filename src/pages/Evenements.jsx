
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Trash2, Search, Calendar, MapPin, User, AlertTriangle, Clock, Eye, CheckCircle, Edit2, X, Save } from "lucide-react";
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
import BoutonAjoutFlottant from "../components/shared/BoutonAjoutFlottant";
import DialogAjoutEvenement from "../components/evenements/DialogAjoutEvenement";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Evenements() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState(null);
  const [deleteEventNom, setDeleteEventNom] = useState("");
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categorieFilter, setCategorieFilter] = useState("all");
  const [editingConvenu, setEditingConvenu] = useState(null);
  const [convenuText, setConvenuText] = useState("");
  const [showResolvedProblems, setShowResolvedProblems] = useState(false); // New state for toggling resolved problems

  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const deleteAllEvenements = useMutation({
    mutationFn: async () => {
      const currentEvents = queryClient.getQueryData(['evenements']);
      if (!currentEvents) {
        console.warn("No events found to delete.");
        return;
      }
      const deletePromises = currentEvents.map(evt => base44.entities.Evenement.delete(evt.id));
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evenements'] });
      setDeleteAllDialogOpen(false);
    },
  });

  const updateProblemeRegle = useMutation({
    mutationFn: ({ id, probleme_regle }) => base44.entities.Evenement.update(id, { probleme_regle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evenements'] });
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour du problème résolu:", error);
    }
  });

  const updateConvenu = useMutation({
    mutationFn: ({ id, convenu_parents }) => base44.entities.Evenement.update(id, { convenu_parents }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evenements'] });
      setEditingConvenu(null);
      setConvenuText("");
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

  const handleProblemeRegleToggle = async (evt) => {
    try {
      await updateProblemeRegle.mutateAsync({
        id: evt.id,
        probleme_regle: !evt.probleme_regle
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  const handleVoirFiche = (evt) => {
    navigate(createPageUrl("Enfants", evt.enfant_id));
  };

  const startEditingConvenu = (evt) => {
    setEditingConvenu(evt.id);
    setConvenuText(evt.convenu_parents || "");
  };

  const saveConvenu = async (evtId) => {
    await updateConvenu.mutateAsync({ id: evtId, convenu_parents: convenuText });
  };

  const cancelEditingConvenu = () => {
    setEditingConvenu(null);
    setConvenuText("");
  };

  const getCategorieColor = (cat) => {
    switch(cat) {
      case 'Positif': return 'bg-green-500 text-white';
      case 'Négatif': return 'bg-red-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComportementColor = (cat) => {
    switch(cat) {
      case 'Positif': return 'bg-green-500 text-white';
      case 'Négatif': return 'bg-red-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEvenements = evenements.filter(evt => {
    const matchesSearch = evt.enfant_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evt.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategorie = categorieFilter === "all" || evt.categorie === categorieFilter;

    let matchesResolvedStatus;
    if (showResolvedProblems) {
      // If showing resolved problems, only show negative events that ARE resolved
      matchesResolvedStatus = evt.categorie === 'Négatif' && evt.probleme_regle === true;
    } else {
      // If showing current events (non-resolved negative and all positive)
      const isNonResolu = evt.categorie === 'Négatif' ? evt.probleme_regle !== true : true;
      matchesResolvedStatus = isNonResolu;
    }
    
    return matchesResolvedStatus && matchesSearch && matchesCategorie;
  });

  return (
    <>
      <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Événements</h1>
              <p className="text-gray-600">{filteredEvenements.length} événements affichés</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button 
                onClick={() => setDeleteAllDialogOpen(true)}
                variant="outline"
                className="flex-1 md:flex-initial border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={evenements.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer tout
              </Button>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="flex-1 md:flex-initial bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un problème
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button
              variant={!showResolvedProblems ? "default" : "outline"}
              onClick={() => {
                setShowResolvedProblems(false);
                setCategorieFilter("all"); // Reset category filter when switching views
              }}
              className={!showResolvedProblems ? "bg-purple-600 hover:bg-purple-700" : "border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700"}
            >
              Événements en cours
            </Button>
            <Button
              variant={showResolvedProblems ? "default" : "outline"}
              onClick={() => {
                setShowResolvedProblems(true);
                setCategorieFilter("Négatif"); // Force 'Négatif' category when viewing resolved problems
              }}
              className={showResolvedProblems ? "bg-purple-600 hover:bg-purple-700" : "border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700"}
            >
              Problèmes résolus
            </Button>
          </div>

          <Card className="shadow-md mb-6">
            <CardHeader className="border-b">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un événement..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categorieFilter} onValueChange={setCategorieFilter} disabled={showResolvedProblems}>
                  <SelectTrigger className="md:w-48">
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    <SelectItem value="Positif">Bon comportement</SelectItem>
                    <SelectItem value="Négatif">Mauvais comportement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredEvenements.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Aucun événement trouvé</p>
              </div>
            ) : (
              filteredEvenements.map((evt) => (
                <Card key={evt.id} className="hover:shadow-lg transition-shadow relative flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {evt.lieu && (
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                            <h3 className="font-bold text-gray-900 text-lg sm:text-xl truncate">{evt.lieu}</h3>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{format(new Date(evt.date), 'd MMM yyyy à HH:mm', { locale: fr })}</span>
                        </div>

                        <Link 
                          to={createPageUrl("Enfants", evt.enfant_id)} 
                          className="text-purple-600 hover:text-purple-700 hover:underline font-medium text-base sm:text-lg"
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
                    {evt.categorie === 'Négatif' && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <input
                          type="checkbox"
                          id={`probleme-${evt.id}`}
                          checked={evt.probleme_regle === true}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleProblemeRegleToggle(evt);
                          }}
                          className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <label 
                          htmlFor={`probleme-${evt.id}`}
                          className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProblemeRegleToggle(evt);
                          }}
                        >
                          {evt.probleme_regle ? (
                            <span className="text-green-700 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Problème résolu - L&apos;enfant a changé de comportement
                            </span>
                          ) : (
                            "Marquer comme résolu"
                          )}
                        </label>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Badge className={getCategorieColor(evt.categorie)}>
                          {evt.categorie}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-16 sm:w-24 h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              evt.categorie === 'Positif' ? 'bg-green-500' :
                              evt.categorie === 'Négatif' ? 'bg-red-500' : 'bg-gray-500'
                            }`}
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
                            className={`${getComportementColor(evt.categorie)} text-xs justify-center`}
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
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <p className="text-sm text-gray-700 line-clamp-3 sm:line-clamp-none">{evt.details}</p>
                      </div>
                    )}

                    {evt.convenu_parents && (
                      <div className="bg-purple-50 border sm:border-2 border-purple-200 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs sm:text-sm font-semibold sm:font-bold text-purple-900 flex items-center gap-1 sm:gap-2">
                            <User className="w-3 h-3 sm:w-4 sm:h-4" />
                            Convenu avec les parents
                          </p>
                          {editingConvenu !== evt.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditingConvenu(evt)}
                              className="h-6 w-6 text-purple-600 hover:text-purple-700"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        {editingConvenu === evt.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={convenuText}
                              onChange={(e) => setConvenuText(e.target.value)}
                              className="text-xs sm:text-sm"
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditingConvenu}
                                className="h-7 px-2"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Annuler
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => saveConvenu(evt.id)}
                                className="h-7 px-2 bg-purple-600 hover:bg-purple-700"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                Sauvegarder
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-purple-800">{evt.convenu_parents}</p>
                        )}
                      </div>
                    )}

                    {evt.sanction && (
                      <div className="bg-red-50 border sm:border-2 border-red-200 rounded-lg p-2 sm:p-4">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-700 flex-shrink-0" />
                          <p className="text-xs sm:text-sm font-bold text-red-900">
                            {evt.type_sanction || 'Sanction'}
                          </p>
                        </div>
                        <p className="text-xs sm:text-sm text-red-800 line-clamp-2 sm:line-clamp-none">{evt.sanction}</p>
                        {evt.sanction_jusquau && (
                          <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                            <p className="text-xs sm:text-sm text-red-600">
                              Jusqu&apos;au {format(new Date(evt.sanction_jusquau), 'd MMM à HH:mm', { locale: fr })}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      {evt.prochain_suivi && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center gap-2 flex-grow sm:flex-none">
                          <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-blue-900">Prochain suivi</p>
                            <p className="text-xs text-blue-700">
                              {format(new Date(evt.prochain_suivi), 'd MMM yyyy à HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1"></div>

                    {evt.parents_contactes && evt.type_contact && evt.type_contact !== "À définir" && (
                      <div className="pt-3 mt-3 border-t border-gray-200">
                        <Badge className="bg-purple-100 text-purple-800 w-full justify-center py-2 text-sm sm:text-base">
                          📞 Parents contactés - {evt.type_contact}
                        </Badge>
                      </div>
                    )}

                    <div className="pt-3 mt-3 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoirFiche(evt);
                        }}
                        className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir la fiche de l&apos;enfant
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <div>
        <BoutonAjoutFlottant />
      </div>
      
      <DialogAjoutEvenement open={dialogOpen} onOpenChange={setDialogOpen} />

      <AlertDialog open={!!deleteEventId} onOpenChange={() => {
        setDeleteEventId(null);
        setDeleteEventNom("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;événement de {deleteEventNom} sera définitivement supprimé.
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
            <AlertDialogTitle>Supprimer tous les événements ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les événements ({evenements.length}) seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteAllEvenements.mutate()}
            >
              Supprimer tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
