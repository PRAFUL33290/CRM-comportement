
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ChevronRight, ChevronLeft, Eye, Calendar, MapPin, User, CheckCircle, AlertCircle, Clock, AlertTriangle, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import PropTypes from 'prop-types';
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQueryClient, useMutation } from '@tanstack/react-query'; // Added for mutation
import { Textarea } from "@/components/ui/textarea"; // Added for notes input
import { base44 } from '@/api/base44Client'; // Corrected import path for base44Client

function EnfantsRecents({ enfants, evenements }) {
  const [startIndex, setStartIndex] = useState(0);
  const [selectedEnfant, setSelectedEnfant] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false); // New state for editing notes
  const [notesText, setNotesText] = useState(""); // New state for notes text input
  const itemsPerPage = 3;

  const queryClient = useQueryClient(); // Initializing query client

  // Mutation hook for updating enfant's notes
  const updateNotes = useMutation({
    mutationFn: ({ id, notes }) => base44.entities.Enfant.update(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] }); // Invalidate cache to refetch updated data
      setEditingNotes(false); // Exit editing mode
      // Optionally update selectedEnfant notes directly here to avoid delay before full refetch
      setSelectedEnfant(prev => prev ? { ...prev, notes: notesText } : null);
    },
    onError: (error) => {
      console.error("Failed to update notes:", error);
      // Handle error, e.g., show a toast message
    },
  });

  const enfantsRecents = enfants
    .filter(e => e && e.id && e.nom)
    .sort((a, b) => {
      const dateA = new Date(a.date_ajout || a.created_date);
      const dateB = new Date(b.date_ajout || b.created_date);
      return dateA.getTime() - dateB.getTime(); // Plus ancien en premier
    });

  const getDernierEvenement = (enfantId) => {
    const evts = evenements.filter(e => e.enfant_id === enfantId);
    return evts.length > 0 ? evts[0] : null;
  };

  const getEnfantEvenements = (enfantId) => {
    return evenements
      .filter(evt => evt.enfant_id === enfantId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Plus récent en premier
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
    activeSanctions.sort((a, b) => new Date(b.sanction_jusquau) - new Date(a.sanction_jusquau));
    return activeSanctions.length > 0 ? activeSanctions[0] : null;
  };

  const getProchainSuivi = (enfantId) => {
    const now = new Date();
    const suivis = evenements.filter(evt =>
      evt.enfant_id === enfantId &&
      evt.prochain_suivi &&
      new Date(evt.prochain_suivi) >= now
    );
    suivis.sort((a, b) => new Date(a.prochain_suivi) - new Date(b.prochain_suivi));
    return suivis.length > 0 ? suivis[0].prochain_suivi : null;
  };

  const handleViewClick = (enfant) => {
    setSelectedEnfant(enfant);
    setNotesText(enfant.notes || ""); // Initialize notesText when dialog opens
    setEditingNotes(false); // Ensure editing mode is off when opening
    setDetailsDialogOpen(true);
  };

  const startEditingNotes = () => {
    setEditingNotes(true);
  };

  const saveNotes = async () => {
    if (selectedEnfant) {
      await updateNotes.mutateAsync({ 
        id: selectedEnfant.id, 
        notes: notesText 
      });
      // The setSelectedEnfant update is handled in onSuccess callback of useMutation
      // setEditingNotes(false); // This is also handled in onSuccess
    }
  };

  const cancelEditingNotes = () => {
    setEditingNotes(false);
    setNotesText(selectedEnfant?.notes || ""); // Revert changes
  };

  const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

  const visibleEnfants = enfantsRecents.slice(startIndex, startIndex + itemsPerPage);
  const canGoNext = startIndex + itemsPerPage < enfantsRecents.length;
  const canGoPrev = startIndex > 0;

  return (
    <>
      <Card className="shadow-md h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Enfants récents
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setStartIndex(Math.max(0, startIndex - itemsPerPage))}
              disabled={!canGoPrev}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setStartIndex(startIndex + itemsPerPage)}
              disabled={!canGoNext}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleEnfants.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun enfant enregistré</p>
          ) : (
            visibleEnfants.map((enfant) => {
              const dernierEvt = getDernierEvenement(enfant.id);
              const nombreIncidents = getNombreIncidents(enfant.id);
              const alerteRouge = nombreIncidents >= 3;
              
              return (
                <div
                  key={enfant.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    alerteRouge 
                      ? 'bg-red-100 border-2 border-red-500 hover:bg-red-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-1">
                    {alerteRouge && (
                      <Badge className="bg-red-600 text-white mb-2 animate-pulse">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        ALERTE - 3+ incidents
                      </Badge>
                    )}
                    <div className={`font-semibold ${alerteRouge ? 'text-red-900' : 'text-gray-900'}`}>
                      {enfant.nom}
                    </div>
                    <div className="text-sm text-gray-600">
                      {enfant.groupe && <span className="mr-2">{enfant.groupe}</span>}
                      {enfant.sexe && <span>{enfant.sexe === 'Garçon' ? '👦' : '👧'}</span>}
                    </div>
                    {dernierEvt && (
                      <div className="text-xs text-gray-500 mt-1">
                        {dernierEvt.lieu && <span className="mr-2">📍 {dernierEvt.lieu}</span>}
                        {dernierEvt.animateur_nom && <span>👤 {dernierEvt.animateur_nom}</span>}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={
                      alerteRouge 
                        ? 'text-red-700 hover:text-red-800 hover:bg-red-200' 
                        : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                    }
                    onClick={() => handleViewClick(enfant)}
                  >
                    <Eye className="w-5 h-5" />
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

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
                        Jusqu&apos;au {format(new Date(getActiveSanction(selectedEnfant.id).sanction_jusquau), "d MMM yyyy 'à' HH:mm", { locale: fr })}
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
                  {!editingNotes && (
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
                {editingNotes ? (
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
                        disabled={updateNotes.isLoading}
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
                        {updateNotes.isLoading ? (
                          <span className="flex items-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Sauvegarde...</span>
                        ) : (
                          <><Save className="w-4 h-4 mr-1" /> Sauvegarder</>
                        )}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-medium text-red-900">Incidents</p>
                  </div>
                  <p className="text-2xl font-bold text-red-700">{getNombreIncidents(selectedEnfant.id)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Bons comportements</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{getNombreBonsComportements(selectedEnfant.id)}</p>
                </div>
              </div>

              {getDernierIncidentDate(selectedEnfant.id) && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50 p-3 rounded">
                  <Calendar className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span className="font-medium">Dernier incident :</span>
                  <span>{format(new Date(getDernierIncidentDate(selectedEnfant.id)), 'd MMM', { locale: fr })}</span>
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

              <div className="flex gap-2 pt-4 border-t">
                <Link to={createPageUrl("Evenements")} className="flex-1">
                  <Button variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50">
                    Voir tous les événements
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

EnfantsRecents.propTypes = {
  enfants: PropTypes.array.isRequired,
  evenements: PropTypes.array.isRequired,
};

export default EnfantsRecents;
