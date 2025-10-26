
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User, AlertCircle, CheckCircle, Trash2, Eye, Calendar, Clock, AlertTriangle, Edit2, X, Save } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import BoutonAjoutFlottant from "../components/shared/BoutonAjoutFlottant";
import DialogAjoutEvenement from "../components/evenements/DialogAjoutEvenement";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export default function Enfants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [groupeFilter, setGroupeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteEnfantId, setDeleteEnfantId] = useState(null);
  const [deleteEnfantNom, setDeleteEnfantNom] = useState("");
  const [selectedEnfant, setSelectedEnfant] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState("");
  
  const queryClient = useQueryClient();

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

  const enfantsValides = enfants.filter(e => e && e.id && e.nom);

  const deleteEnfant = useMutation({
    mutationFn: (id) => base44.entities.Enfant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      setDeleteEnfantId(null);
      setDeleteEnfantNom("");
    },
  });

  const deleteAllEnfants = useMutation({
    mutationFn: async () => {
      const deletePromises = enfantsValides.map(enfant => base44.entities.Enfant.delete(enfant.id));
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      setDeleteAllDialogOpen(false);
    },
  });

  const updateNotes = useMutation({
    mutationFn: ({ id, notes }) => base44.entities.Enfant.update(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      setEditingNotes(null);
      // No need to reset notesText here, it will be updated by handleViewClick or cancelEditingNotes
    },
  });

  const handleDeleteClick = (enfant) => {
    setDeleteEnfantId(enfant.id);
    setDeleteEnfantNom(enfant.nom);
  };

  const confirmDelete = async () => {
    if (deleteEnfantId) {
      await deleteEnfant.mutateAsync(deleteEnfantId);
    }
  };

  const handleViewClick = (enfant) => {
    setSelectedEnfant(enfant);
    setNotesText(enfant.notes || ""); // Set notesText when opening the dialog
    setDetailsDialogOpen(true);
    setEditingNotes(null); // Ensure not in editing mode initially
  };

  const startEditingNotes = () => {
    if (selectedEnfant) {
      setEditingNotes(selectedEnfant.id);
      setNotesText(selectedEnfant.notes || ""); // Load current notes into textarea
    }
  };

  const saveNotes = async () => {
    if (selectedEnfant) {
      await updateNotes.mutateAsync({ 
        id: selectedEnfant.id, 
        notes: notesText 
      });
      // Update selectedEnfant state locally to reflect the change immediately
      setSelectedEnfant(prev => prev ? { ...prev, notes: notesText } : null);
    }
  };

  const cancelEditingNotes = () => {
    setEditingNotes(null);
    setNotesText(selectedEnfant?.notes || ""); // Revert notesText to original
  };

  const hasIncidentIn30Days = (enfantId) => {
    const il30Jours = new Date();
    il30Jours.setDate(il30Jours.getDate() - 30);
    return evenements.some(evt => 
      evt.enfant_id === enfantId && 
      evt.categorie === 'Négatif' && 
      new Date(evt.date) >= il30Jours
    );
  };

  const getEnfantEvenements = (enfantId) => {
    return evenements.filter(evt => evt.enfant_id === enfantId);
  };

  const getCategorieColor = (cat) => {
    switch(cat) {
      case 'Positif': return 'bg-green-100 text-green-800';
      case 'Négatif': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNombreIncidents = (enfantId) => {
    return evenements.filter(evt => evt.enfant_id === enfantId && evt.categorie === 'Négatif').length;
  };

  const getNombreBonsComportements = (enfantId) => {
    return evenements.filter(evt => evt.enfant_id === enfantId && evt.categorie === 'Positif').length;
  };

  const getDernierIncidentDate = (enfantId) => {
    const incidents = evenements
      .filter(evt => evt.enfant_id === enfantId && evt.categorie === 'Négatif')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return incidents.length > 0 ? incidents[0].date : null;
  };

  const getActiveSanction = (enfantId) => {
    const now = new Date();
    const activeSanctions = evenements.filter(evt =>
      evt.enfant_id === enfantId &&
      evt.categorie === 'Négatif' &&
      evt.sanction_jusquau &&
      new Date(evt.sanction_jusquau) > now
    );
    activeSanctions.sort((a, b) => new Date(b.sanction_jusquau).getTime() - new Date(a.sanction_jusquau).getTime());
    return activeSanctions.length > 0 ? activeSanctions[0] : null;
  };

  const getProchainSuivi = (enfantId) => {
    const now = new Date();
    const suivis = evenements.filter(evt =>
      evt.enfant_id === enfantId &&
      evt.prochain_suivi &&
      new Date(evt.prochain_suivi) >= now
    );
    suivis.sort((a, b) => new Date(a.prochain_suivi).getTime() - new Date(b.prochain_suivi).getTime());
    return suivis.length > 0 ? suivis[0].prochain_suivi : null;
  };

  const groupesUniques = [...new Set(enfantsValides.map(e => e.groupe))].filter(Boolean);

  const filteredEnfants = enfantsValides.filter(enfant => {
    const matchesSearch = enfant.nom?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroupe = groupeFilter === "all" || enfant.groupe === groupeFilter;
    return matchesSearch && matchesGroupe;
  });

  const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

  return (
    <>
      <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Enfants</h1>
              <p className="text-gray-600">{enfantsValides.length} enfants inscrits</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button 
                onClick={() => setDeleteAllDialogOpen(true)}
                variant="outline"
                className="flex-1 md:flex-initial border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={enfantsValides.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer tout
              </Button>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="flex-1 md:flex-initial bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un enfant
              </Button>
            </div>
          </div>

          <Card className="shadow-md mb-6">
            <CardHeader className="border-b">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un enfant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={groupeFilter} onValueChange={setGroupeFilter}>
                  <SelectTrigger className="md:w-48">
                    <SelectValue placeholder="Tous les groupes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les groupes</SelectItem>
                    {groupesUniques.map((groupe) => (
                      <SelectItem key={groupe} value={groupe}>{groupe}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          {/* Affichage en cartes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEnfants.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Aucun enfant trouvé</p>
              </div>
            ) : (
              filteredEnfants.map((enfant) => {
                const nombreIncidents = getNombreIncidents(enfant.id);
                const nombreBonsComportements = getNombreBonsComportements(enfant.id);
                const dernierIncident = getDernierIncidentDate(enfant.id);
                const sanctionActive = getActiveSanction(enfant.id);
                const prochainSuivi = getProchainSuivi(enfant.id);
                const alerteRouge = nombreIncidents >= 3;
                
                return (
                  <Card 
                    key={enfant.id} 
                    className={`hover:shadow-lg transition-shadow ${
                      alerteRouge ? 'bg-red-50 border-2 border-red-500' : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-3xl flex-shrink-0">
                            {enfant.sexe === "Fille" ? "👧" : "👦"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-lg truncate ${alerteRouge ? 'text-red-900' : 'text-gray-900'}`}>
                              {enfant.nom}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {enfant.groupe && (
                                <Badge className="bg-purple-50 text-purple-700 text-xs">
                                  {enfant.groupe}
                                </Badge>
                              )}
                              {enfant.centre && (
                                <Badge className="bg-gray-50 text-gray-700 text-xs">
                                  {enfant.centre}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewClick(enfant)}
                            className={`h-8 w-8 ${
                              alerteRouge 
                                ? 'text-red-700 hover:text-red-800 hover:bg-red-100' 
                                : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                            }`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(enfant)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {alerteRouge && (
                        <div className="bg-red-600 text-white rounded-lg p-3 font-bold text-center animate-pulse">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <AlertTriangle className="w-5 h-5" />
                            <span>ALERTE ROUGE</span>
                          </div>
                          <p className="text-sm">APPELER LES PARENTS IMMÉDIATEMENT</p>
                        </div>
                      )}

                      {/* Incidents et bons comportements */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className={`rounded-lg p-2 ${alerteRouge ? 'bg-red-100 border-2 border-red-600' : 'bg-red-50'}`}>
                          <div className="flex items-center gap-1 mb-1">
                            <AlertCircle className={`w-3 h-3 ${alerteRouge ? 'text-red-800' : 'text-red-600'}`} />
                            <p className={`text-xs font-medium ${alerteRouge ? 'text-red-900 font-bold' : 'text-red-900'}`}>Incidents</p>
                          </div>
                          <p className={`text-xl font-bold ${alerteRouge ? 'text-red-800' : 'text-red-700'}`}>{nombreIncidents}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                          <div className="flex items-center gap-1 mb-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <p className="text-xs font-medium text-green-900">Bons</p>
                          </div>
                          <p className="text-xl font-bold text-green-700">{nombreBonsComportements}</p>
                        </div>
                      </div>

                      {/* Dernier incident */}
                      {dernierIncident && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 p-2 rounded">
                          <Calendar className="w-3 h-3 text-orange-600 flex-shrink-0" />
                          <span className="font-medium">Dernier :</span>
                          <span>{format(new Date(dernierIncident), 'd MMM', { locale: fr })}</span>
                        </div>
                      )}

                      {/* Sanction active */}
                      {sanctionActive && (
                        <div className="bg-red-100 border border-red-300 rounded-lg p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0" />
                            <p className="text-xs font-bold text-red-900">
                              {sanctionActive.type_sanction || 'Sanction'} active
                            </p>
                          </div>
                          <p className="text-xs text-red-800 line-clamp-2">{sanctionActive.sanction}</p>
                          <p className="text-xs text-red-600 mt-1">
                            Jusqu&apos;au {format(new Date(sanctionActive.sanction_jusquau), 'd MMM', { locale: fr })}
                          </p>
                        </div>
                      )}

                      {/* Prochain suivi */}
                      {prochainSuivi && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-blue-900">Prochain suivi</p>
                              <p className="text-xs text-blue-700">
                                {format(new Date(prochainSuivi), "d MMM 'à' HH:mm", { locale: fr })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Statut 30 jours */}
                      {hasIncidentIn30Days(enfant.id) && (
                        <Badge className="bg-purple-100 text-purple-800 w-full justify-center">
                          ⚠️ Incident dans les 30 derniers jours
                        </Badge>
                      )}

                      {/* Date d'ajout */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Ajouté le {format(new Date(enfant.date_ajout || enfant.created_date), 'd MMM yyyy', { locale: fr })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bouton flottant - visible sur toutes les tailles d'écran */}
      <BoutonAjoutFlottant />
      
      <DialogAjoutEvenement open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Dialog des détails de l'enfant */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {selectedEnfant?.sexe === "Fille" ? "👧" : "👦"}
                </span>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">{selectedEnfant?.nom}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {selectedEnfant?.groupe && (
                          <Badge className="bg-purple-50 text-purple-700">
                            {selectedEnfant.groupe}
                          </Badge>
                        )}
                        {selectedEnfant?.centre && (
                          <Badge className="bg-gray-50 text-gray-700">
                            {selectedEnfant.centre}
                          </Badge>
                        )}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          {selectedEnfant && (
            <div className="space-y-6">
              {getActiveSanction(selectedEnfant.id) && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-900">{getActiveSanction(selectedEnfant.id).type_sanction || 'Sanction'} active</h3>
                    <p className="text-sm">
                      {getActiveSanction(selectedEnfant.id).sanction}
                    </p>
                    {getActiveSanction(selectedEnfant.id).sanction_jusquau && (
                      <p className="text-sm mt-1">
                        Jusqu&apos;au {format(new Date(getActiveSanction(selectedEnfant.id).sanction_jusquau), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes personnelles */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Notes personnelles
                  </h3>
                  {editingNotes !== selectedEnfant.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startEditingNotes}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                  )}
                </div>
                {editingNotes === selectedEnfant.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Ajoutez des notes sur cet enfant..."
                      className="min-h-[120px] bg-white"
                      rows={5}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelEditingNotes}
                        className="text-gray-600"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveNotes}
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={updateNotes.isLoading}
                      >
                        {updateNotes.isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                        <Save className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-3 border border-purple-200 min-h-[80px]">
                    {selectedEnfant.notes ? (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEnfant.notes}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Aucune note pour le moment</p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3">Informations générales</h3>
                
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Date d&apos;ajout</p>
                    <p className="text-sm text-gray-600">
                      {selectedEnfant.date_ajout ? format(new Date(selectedEnfant.date_ajout), 'd MMMM yyyy', { locale: fr }) : '-'}
                    </p>
                  </div>
                </div>

                {selectedEnfant.groupe && (
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Groupe/Classe</p>
                      <p className="text-sm text-gray-600">{selectedEnfant.groupe}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 text-purple-600 mt-0.5">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Ajouté par</p>
                    {isEmail(selectedEnfant.created_by) ? (
                      <a href={`mailto:${selectedEnfant.created_by}`} className="text-sm text-purple-600 hover:underline">
                        {selectedEnfant.created_by}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-600">{selectedEnfant.created_by || 'Non spécifié'}</p>
                    )}
                  </div>
                </div>
              </div>

              {getProchainSuivi(selectedEnfant.id) && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Prochain suivi
                  </h3>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Date du suivi</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(getProchainSuivi(selectedEnfant.id)), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Événements enregistrés
                </h3>
                
                {getEnfantEvenements(selectedEnfant.id).length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Aucun événement enregistré pour cet enfant</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getEnfantEvenements(selectedEnfant.id).map((evt) => (
                      <div key={evt.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getCategorieColor(evt.categorie)}>
                              {evt.categorie === 'Positif' ? (
                                <><CheckCircle className="w-3 h-3 mr-1" />Bon comportement</>
                              ) : (
                                <><AlertCircle className="w-3 h-3 mr-1" />Mauvais comportement</>
                              )}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {format(new Date(evt.date), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  evt.categorie === 'Positif' ? 'bg-green-500' :
                                  evt.categorie === 'Négatif' ? 'bg-red-500' : 'bg-gray-500'
                                }`}
                                style={{ width: `${evt.intensite}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700">{evt.intensite}%</span>
                          </div>
                        </div>
                        
                        {evt.lieu && (
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-medium">Lieu:</span> {evt.lieu}
                          </p>
                        )}
                        
                        {evt.details && (
                          <p className="text-sm text-gray-600 mb-2">{evt.details}</p>
                        )}
                        
                        {evt.animateur_nom && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Animateur:</span> {" "}
                            {isEmail(evt.animateur_nom) ? (
                              <a href={`mailto:${evt.animateur_nom}`} className="text-purple-600 hover:underline">
                                {evt.animateur_nom}
                              </a>
                            ) : (
                              evt.animateur_nom
                            )}
                          </p>
                        )}

                        {evt.types_comportement && evt.types_comportement.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {evt.types_comportement.map((type, idx) => (
                              <Badge 
                                key={idx} 
                                className={`text-xs ${getCategorieColor(evt.categorie)}`}
                              >
                                {type}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {evt.sanction && (
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <p className="text-xs font-semibold text-gray-700 mb-1">
                              {evt.type_sanction || "Sanction/Punition"} :
                            </p>
                            <p className="text-xs text-gray-600">{evt.sanction}</p>
                            {evt.sanction_jusquau && (
                              <p className="text-sm text-gray-500 mt-1">
                                Jusqu&apos;au {format(new Date(evt.sanction_jusquau), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                              </p>
                            )}
                          </div>
                        )}
                        
                        {evt.convenu_parents && (
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <p className="text-xs font-semibold text-purple-700 mb-1">
                              Convenu avec les parents :
                            </p>
                            <p className="text-xs text-gray-600">{evt.convenu_parents}</p>
                          </div>
                        )}

                        {evt.parents_contactes && (
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <Badge className="bg-purple-50 text-purple-700 text-xs">
                              Parents contactés
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteEnfantId} onOpenChange={() => {
        setDeleteEnfantId(null);
        setDeleteEnfantNom("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {deleteEnfantNom} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;enfant et tous ses événements associés seront définitivement supprimés.
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
            <AlertDialogTitle>Supprimer tous les enfants ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les enfants ({enfantsValides.length}) et leurs événements associés seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteAllEnfants.mutate()}
            >
              Supprimer tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
