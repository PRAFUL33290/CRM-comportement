
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ChevronLeft, ChevronRight, FileText, Trash2, Plus, Send } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ExternalLink, CheckCircle, XCircle } from "lucide-react";

const ANIMATEURS = [
  "Julien (administrateur)",
  "Camille (animatrice)",
  "Nicolas (animateur)",
  "Harmonie (animatrice)",
  "Quitterie (animatrice)",
  "Lilian (animateur)",
  "Frédéric (animateur)",
  "Baptiste (directeur)",
  "Alicia (animatrice)",
  "Virginie (animatrice)",
  "Aurore (animatrice)",
  "Marie (animatrice)",
  "Clara (animatrice BPJEPS)",
  "Alizée (animatrice)",
  "Sabrina (animatrice)",
  "Thibault (maternelle)"
];

export default function Actualites() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const [ajoutDialogOpen, setAjoutDialogOpen] = useState(false);
  const [nouveauMessage, setNouveauMessage] = useState("");
  const [animateurNom, setAnimateurNom] = useState("");
  const [messageType, setMessageType] = useState(""); 
  const [autoSwipeEnabled, setAutoSwipeEnabled] = useState(true);

  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.MessageMur.list('-created_date', 10),
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: evenements = [] } = useQuery({
    queryKey: ['evenements'],
    queryFn: () => base44.entities.Evenement.list('-date', 10),
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: enfants = [] } = useQuery({
    queryKey: ['enfants'],
    queryFn: () => base44.entities.Enfant.list('-created_date', 5),
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createMessage = useMutation({
    mutationFn: (data) => base44.entities.MessageMur.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setAjoutDialogOpen(false);
      setNouveauMessage("");
      setAnimateurNom("");
      setMessageType(""); 
    },
  });

  const deleteMessage = useMutation({
    mutationFn: (id) => base44.entities.MessageMur.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setDeleteMessageId(null);
    },
  });

  const evenementsAvecDetails = evenements
    .filter(evt => {
      const enfantExiste = enfants.some(e => e.id === evt.enfant_id);
      return evt.details && evt.details.trim() !== '' && enfantExiste;
    })
    .map(evt => ({
      type: 'evenement',
      id: evt.id,
      auteur: evt.animateur_nom,
      contenu: evt.details,
      enfant: evt.enfant_nom,
      categorie: evt.categorie,
      date: evt.date,
      timestamp: new Date(evt.date).getTime(),
      lieu: evt.lieu,
      intensite: evt.intensite,
      types_comportement: evt.types_comportement || [],
      sanction: evt.sanction,
      type_sanction: evt.type_sanction,
      details: evt.details,
      consequence_action: evt.consequence_action,
      parents_contactes: evt.parents_contactes,
      type_contact: evt.type_contact,
      prochain_suivi: evt.prochain_suivi,
      probleme_regle: evt.probleme_regle // Add probleme_regle here
    }));

  // Filtrer uniquement les messages qui existent réellement
  const messagesFormates = messages
    .filter(msg => msg && msg.id && msg.contenu)
    .map(msg => ({
      type: 'message',
      id: msg.id,
      auteur: msg.auteur_nom,
      contenu: msg.contenu,
      type_message: msg.type_message, 
      date: msg.created_date,
      timestamp: new Date(msg.created_date).getTime(),
      created_by: msg.created_by
    }));

  const enfantsAjoutes = enfants
    .filter(e => e && e.id && e.nom && (e.created_date || e.date_ajout))
    .map(enfant => ({
      type: 'enfant_ajoute',
      id: enfant.id,
      enfant: enfant.nom,
      sexe: enfant.sexe,
      groupe: enfant.groupe,
      date: enfant.date_ajout || enfant.created_date,
      timestamp: new Date(enfant.date_ajout || enfant.created_date).getTime(),
      created_by: enfant.created_by
    }));

  const toutesActualites = [...evenementsAvecDetails, ...messagesFormates, ...enfantsAjoutes]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  useEffect(() => {
    setCurrentIndex(0);
  }, [toutesActualites.length]);

  useEffect(() => {
    if (toutesActualites.length > 1 && autoSwipeEnabled) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev === toutesActualites.length - 1 ? 0 : prev + 1));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [toutesActualites.length, autoSwipeEnabled]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? toutesActualites.length - 1 : prev - 1));
    setAutoSwipeEnabled(false);
    setTimeout(() => setAutoSwipeEnabled(true), 5000);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === toutesActualites.length - 1 ? 0 : prev + 1));
    setAutoSwipeEnabled(false);
    setTimeout(() => setAutoSwipeEnabled(true), 5000);
  };

  const getCategorieColor = (cat) => {
    switch(cat) {
      case 'Positif': return 'bg-green-500 text-white';
      case 'Négatif':
      case 'Mauvais comportement':
        return 'bg-red-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePublierMessage = () => {
    if (!animateurNom || !nouveauMessage.trim()) return; 

    const messageData = {
      auteur_nom: animateurNom,
      contenu: nouveauMessage.trim() 
    };

    if (messageType) {
      messageData.type_message = messageType;
    }

    createMessage.mutate(messageData);
  };

  const renderActualite = (actualite) => {
    if (!actualite) return null;

    if (actualite.type === 'message') {
      return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 md:p-4">
          <div className="flex items-start gap-2 md:gap-3 mb-2">
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs md:text-sm font-semibold text-purple-900 truncate">
                  {actualite.auteur}
                </span>
                <span className="text-xs text-gray-500">
                  {format(new Date(actualite.date), 'HH:mm', { locale: fr })}
                </span>
              </div>
              {actualite.type_message && (
                <Badge className="mb-2 text-xs bg-purple-100 text-purple-800">
                  {actualite.type_message}
                </Badge>
              )}
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed line-clamp-4">
                {actualite.contenu}
              </p>
            </div>
            {user && user.email === actualite.created_by && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteMessageId(actualite.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 md:h-7 md:w-7 flex-shrink-0"
              >
                <Trash2 className="w-3 h-3 md:w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      );
    } else if (actualite.type === 'enfant_ajoute') {
      return (
        <div className="flex gap-3 min-w-full">
          <div className="w-10 h-10 flex-shrink-0 bg-purple-100 rounded-full flex items-center justify-center text-xl">
            {actualite.sexe === "Fille" ? "👧" : "👦"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <Link 
                  to={createPageUrl("Enfants")}
                  className="font-semibold text-sm text-gray-900 hover:text-purple-600 hover:underline transition-colors truncate"
                >
                  {actualite.enfant}
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className="bg-purple-50 text-purple-700 text-xs">
                    ✨ Nouveau
                  </Badge>
                  {actualite.groupe && (
                    <Badge className="bg-gray-50 text-gray-700 text-xs">
                      {actualite.groupe}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-2 line-clamp-2">
              Enfant ajouté au centre - Aucun événement enregistré pour le moment
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span>Par {actualite.created_by}</span>
              <span>•</span>
              <span>{format(new Date(actualite.date), "d MMM 'à' HH:mm", { locale: fr })}</span>
            </div>
            <Link to={createPageUrl("Enfants")} className="md:hidden block">
              <Button
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 shadow-md mt-2"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Voir l&apos;enfant
              </Button>
            </Link>
          </div>
        </div>
      );
    } else { // This handles 'evenement' type
      return (
        <div className="flex gap-3 min-w-full">
          <div className="w-10 h-10 flex-shrink-0 bg-orange-100 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Link 
                  to={createPageUrl("Evenements")}
                  className="font-semibold text-sm text-gray-900 hover:text-purple-600 hover:underline transition-colors"
                >
                  {actualite.enfant}
                </Link>
                <Badge className={getCategorieColor(actualite.categorie)}>
                  {actualite.categorie === 'Positif' ? (
                    <><CheckCircle className="w-3 h-3 mr-1" />Bon comportement</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" />Mauvais comportement</>
                  )}
                </Badge>
              </div>
              {actualite.sanction && (
                <Badge className="bg-red-100 text-red-700 text-xs">
                  <XCircle className="w-3 h-3 mr-1" />
                  Sanction {actualite.type_sanction ? `: ${actualite.type_sanction}` : ''}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2 flex-wrap">
              <span className="font-medium">
                {format(new Date(actualite.date), "d MMM yyyy 'à' HH:mm", { locale: fr })}
              </span>
              {actualite.lieu && (
                <>
                  <span>•</span>
                  <span className="truncate">{actualite.lieu}</span>
                </>
              )}
            </div>

            {actualite.intensite !== undefined && actualite.intensite !== null && (
              <div className="hidden md:flex md:items-center md:gap-2 mb-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      actualite.categorie === 'Positif' ? 'bg-green-500' :
                      actualite.categorie === 'Négatif' ? 'bg-red-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${actualite.intensite}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700">{actualite.intensite}%</span>
              </div>
            )}

            {actualite.types_comportement && actualite.types_comportement.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">Comportement :</p>
                <div className="md:hidden flex items-center gap-1 flex-wrap">
                  <Badge className={`text-xs ${getCategorieColor(actualite.categorie)}`}>
                    {actualite.types_comportement[0]}
                  </Badge>
                  {actualite.types_comportement.length > 1 && (
                    <Badge className="text-xs bg-gray-100 text-gray-700">
                      +{actualite.types_comportement.length - 1}
                    </Badge>
                  )}
                </div>
                <div className="hidden md:flex md:items-center md:gap-1 md:flex-wrap">
                  {actualite.types_comportement.slice(0, 3).map((type, idx) => (
                    <Badge
                      key={idx}
                      className={`text-xs ${getCategorieColor(actualite.categorie)}`}
                    >
                      {type}
                    </Badge>
                  ))}
                  {actualite.types_comportement.length > 3 && (
                    <Badge className="text-xs bg-gray-100 text-gray-700">
                      +{actualite.types_comportement.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="hidden md:block space-y-2">
              {actualite.details && (
                <p className="text-sm text-gray-700 line-clamp-2">{actualite.details}</p>
              )}
              
              {actualite.consequence_action && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Conséquence/Action:</span> {actualite.consequence_action}
                </div>
              )}

              {actualite.parents_contactes && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-50 text-purple-700 text-xs">
                    Parents contactés
                  </Badge>
                  {actualite.type_contact && (
                    <span className="text-xs text-gray-600">{actualite.type_contact}</span>
                  )}
                </div>
              )}

              {actualite.prochain_suivi && (
                <div className="text-xs text-purple-700 font-medium">
                  📅 Prochain suivi: {format(new Date(actualite.prochain_suivi), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
              <span>Par {actualite.auteur}</span>
            </div>

            {actualite.categorie === 'Négatif' && actualite.probleme_regle && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-green-800">
                    ✅ Problème résolu - L&apos;enfant a changé de comportement
                  </span>
                </div>
              </div>
            )}
            
            <Link to={createPageUrl("Evenements")} className="md:hidden block">
              <Button
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 shadow-md mt-2"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Voir plus
              </Button>
            </Link>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="w-full">
      <Card className="shadow-md w-full flex flex-col h-auto">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200 p-3 md:p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-900 text-sm md:text-base lg:text-lg">
              <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
              Actualités
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex md:items-center md:gap-2">
                {toutesActualites.length > 1 && (
                  <span className="text-xs text-purple-700">
                    {currentIndex + 1} / {toutesActualites.length}
                  </span>
                )}
                <Button
                  size="sm"
                  onClick={() => setAjoutDialogOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 h-7 px-2 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Ajouter
                </Button>
              </div>
              <Button
                size="sm"
                onClick={() => setAjoutDialogOpen(true)}
                className="md:hidden bg-purple-600 hover:bg-purple-700 h-6 px-2 text-xs"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 md:p-4 w-full flex-1 flex flex-col overflow-hidden">
          {toutesActualites.length === 0 ? (
            <div className="text-center py-4 md:py-6 text-gray-500 flex-1 flex items-center justify-center">
              <div>
                <MessageSquare className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-xs md:text-sm">Aucune actualité pour le moment</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex-1 flex flex-col">
              {/* Carrousel horizontal pour mobile et desktop */}
              <div className="flex-1 overflow-hidden min-h-[250px]">
                <div className="relative overflow-hidden w-full h-full">
                  <div
                    className="flex transition-transform duration-500 ease-in-out w-full h-full"
                    style={{
                      transform: `translateX(-${currentIndex * 100}%)`
                    }}
                  >
                    {toutesActualites.map((actualite) => (
                      <div key={`${actualite.type}-${actualite.id}`} className="w-full flex-shrink-0 px-1 h-full overflow-y-auto">
                        {renderActualite(actualite)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {toutesActualites.length > 1 && (
                <div className="flex items-center justify-center gap-2 pt-3 border-t flex-shrink-0 mt-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevious}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex gap-1">
                    {toutesActualites.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentIndex(idx);
                          setAutoSwipeEnabled(false);
                          setTimeout(() => setAutoSwipeEnabled(true), 5000);
                        }}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentIndex
                            ? 'w-6 bg-purple-600'
                            : 'w-2 bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNext}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={ajoutDialogOpen} onOpenChange={setAjoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Ajouter un message à la Messagerie
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Votre nom *</Label>
              <Select value={animateurNom} onValueChange={setAnimateurNom}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner votre nom" />
                </SelectTrigger>
                <SelectContent>
                  {ANIMATEURS.map((anim) => (
                    <SelectItem key={anim} value={anim}>
                      {anim}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Type de message</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Aucun</SelectItem> {/* Changed null to "" for consistency with select */}
                  <SelectItem value="Information">Information</SelectItem>
                  <SelectItem value="Rappel">Rappel</SelectItem>
                  <SelectItem value="Événement">Événement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Message</Label>
              <Textarea
                value={nouveauMessage}
                onChange={(e) => setNouveauMessage(e.target.value)}
                placeholder="Partagez une info avec l'équipe..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">{nouveauMessage.length}/500</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAjoutDialogOpen(false);
                  setNouveauMessage("");
                  setAnimateurNom("");
                  setMessageType("");
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handlePublierMessage}
                disabled={!animateurNom || !nouveauMessage.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Publier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteMessageId} onOpenChange={() => setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce message ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le message sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMessageId && deleteMessage.mutate(deleteMessageId)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
