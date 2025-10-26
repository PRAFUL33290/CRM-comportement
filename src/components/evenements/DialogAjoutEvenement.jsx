
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Trash2, AlertTriangle, FileWarning, CheckCircle, XCircle, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const LIEUX = [
  "Gameclub (élémentaire)",
  "Dessino (élémentaire)",
  "Constructo (élémentaire)",
  "Tisanerie (élémentaire)",
  "Dojo (élémentaire)",
  "Cantine",
  "Cour de récréation (élémentaire)",
  "Atelier (élémentaire)",
  "Salle informatique (élémentaire)",
  "Barbajoue (maternelle)",
  "Barbalego (maternelle)",
  "Cour de récréation (maternelle)",
  "Salle de motricité (maternelle)"
];

const COMPORTEMENTS_POSITIFS = [
  "Calme", "À l'écoute", "Partage", "Entraide", "Respect des autres",
  "Respect du matériel", "Autonomie", "Participation active", "Créativité",
  "Leadership positif", "Persévérance", "Fair-play", "Gentillesse",
  "Responsabilité", "Propreté", "Politesse"
];

const COMPORTEMENTS_NEGATIFS = [
  "Agitation", "Désobéissance", "Violence physique", "Violence verbale",
  "Manque de respect", "Dégradation du matériel", "Perturbation",
  "Isolement", "Refus de participer", "Mensonge", "Vol", "Insolence",
  "Moquerie", "Exclusion d'autres", "Non-respect des règles", "Impolitesse"
];

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
  "Thibault (animateur)"
];

const CLASSES = [
  "PS",
  "MS",
  "GS",
  "CP",
  "CE1",
  "CE2",
  "CM1",
  "CM2"
];

const renderTextWithLinks = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 underline hover:text-blue-800"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

function DialogAjoutEvenement({ open, onOpenChange }) {
  const [enfantNom, setEnfantNom] = useState("");
  const [enfantSexe, setEnfantSexe] = useState("");
  const [enfantClasse, setEnfantClasse] = useState("");
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedEnfantId, setSelectedEnfantId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [lieu, setLieu] = useState("");
  const [categorie, setCategorie] = useState("");
  const [typesComportement, setTypesComportement] = useState([]);
  const [animateur, setAnimateur] = useState("");
  const [intensite, setIntensite] = useState([50]);
  const [details, setDetails] = useState("");
  const [prevenir_parents, setPrevenir_parents] = useState(false);
  const [prochainSuivi, setProchainSuivi] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successEnfantNom, setSuccessEnfantNom] = useState("");
  const [showEventSuccessMessage, setShowEventSuccessMessage] = useState(false);
  const [sanction, setSanction] = useState("");
  const [sanctionJusquau, setSanctionJusquau] = useState("");
  const [sanctionDetails, setSanctionDetails] = useState("");
  const [convenuParents, setConvenuParents] = useState("");
  const [problemeRegle, setProblemeRegle] = useState(false);

  const queryClient = useQueryClient();

  const { data: enfants = [] } = useQuery({
    queryKey: ['enfants'],
    queryFn: () => base44.entities.Enfant.list(),
  });

  const { data: evenements = [] } = useQuery({
    queryKey: ['evenements'],
    queryFn: () => base44.entities.Evenement.list('-date'),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createEnfant = useMutation({
    mutationFn: (data) => base44.entities.Enfant.create(data),
    onSuccess: (newEnfant) => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      setSelectedEnfantId(newEnfant.id);
      setEnfantNom(newEnfant.nom);
      setSuccessEnfantNom(newEnfant.nom);
      setShowSuccessMessage(true);
      setOpenCombobox(false);
      
      if (document.activeElement) {
        document.activeElement.blur();
      }
      
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    },
  });

  const createEvenement = useMutation({
    mutationFn: (data) => base44.entities.Evenement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evenements'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      setShowEventSuccessMessage(true);
      
      setTimeout(() => {
        setShowEventSuccessMessage(false);
        onOpenChange(false);
        resetForm();
      }, 2000);
    },
  });

  const resetForm = () => {
    setEnfantNom("");
    setEnfantSexe("");
    setEnfantClasse("");
    setSelectedEnfantId("");
    setDate(new Date().toISOString().slice(0, 16));
    setLieu("");
    setCategorie("");
    setTypesComportement([]);
    setAnimateur("");
    setIntensite([50]);
    setDetails("");
    setPrevenir_parents(false);
    setProchainSuivi("");
    setPhotoFile(null);
    setUploadingPhoto(false);
    setShowSuccessMessage(false);
    setSuccessEnfantNom("");
    setShowEventSuccessMessage(false);
    setSanction("");
    setSanctionJusquau("");
    setSanctionDetails("");
    setConvenuParents("");
    setProblemeRegle(false);
  };

  const handleEnfantNameChange = (value) => {
    setEnfantNom(value);
    if (selectedEnfantId) {
      setSelectedEnfantId("");
      setEnfantSexe("");
      setEnfantClasse("");
      setShowSuccessMessage(false);
    }
  };

  const tryCreateEnfant = () => {
    if (!selectedEnfantId && enfantNom.trim()) {
      if (enfantClasse && enfantSexe) {
        const existingEnfant = enfants.find(e => e.nom?.toLowerCase() === enfantNom.toLowerCase());
        if (!existingEnfant) {
          createEnfant.mutate({
            nom: enfantNom,
            sexe: enfantSexe,
            groupe: enfantClasse,
            date_ajout: new Date().toISOString().split('T')[0]
          });
        }
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && enfantNom.trim()) {
      e.preventDefault();
      
      const existingEnfant = enfants.find(e => e.nom?.toLowerCase() === enfantNom.toLowerCase());
      if (existingEnfant) {
        handleEnfantSelect(existingEnfant);
      } else {
        setOpenCombobox(false);
        setTimeout(tryCreateEnfant, 0);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let enfantId = selectedEnfantId;
    let finalEnfantNom = enfantNom;

    if (!enfantId && enfantNom.trim()) {
      if (!enfantClasse || !enfantSexe) {
        alert("Veuillez renseigner la classe et le sexe de l'enfant.");
        return;
      }
      
      const newEnfant = await createEnfant.mutateAsync({
        nom: enfantNom,
        sexe: enfantSexe,
        groupe: enfantClasse,
        date_ajout: new Date().toISOString().split('T')[0]
      });
      enfantId = newEnfant.id;
      finalEnfantNom = newEnfant.nom;
    }

    if (!enfantId) {
      alert("Veuillez sélectionner ou créer un enfant.");
      return;
    }

    let photoUrl = null;
    if (photoFile) {
      setUploadingPhoto(true);
      try {
        const result = await base44.integrations.Core.UploadFile({ file: photoFile });
        photoUrl = result.file_url;
      } catch (error) {
        console.error("Erreur upload photo:", error);
        alert("Erreur lors du téléchargement de la photo. Veuillez réessayer.");
        setUploadingPhoto(false);
        return;
      }
      setUploadingPhoto(false);
    }

    await createEvenement.mutateAsync({
      enfant_id: enfantId,
      enfant_nom: finalEnfantNom,
      date: new Date(date).toISOString(),
      lieu: lieu || null,
      categorie: categorie || "Négatif",
      types_comportement: typesComportement,
      intensite: intensite[0],
      details,
      animateur_nom: animateur || user?.full_name || "",
      type: categorie === "Positif" ? "Réussite" : "Incident",
      parents_contactes: prevenir_parents,
      type_contact: prevenir_parents ? "À définir" : null,
      prochain_suivi: prochainSuivi ? new Date(prochainSuivi).toISOString() : null,
      photo_url: photoUrl,
      type_sanction: sanction && sanction !== "" ? sanction : null,
      sanction: sanctionDetails || null,
      sanction_jusquau: sanctionJusquau ? new Date(sanctionJusquau).toISOString() : null,
      convenu_parents: convenuParents || null,
      probleme_regle: problemeRegle
    });
  };

  const handleEnfantSelect = (enfant) => {
    setSelectedEnfantId(enfant.id);
    setEnfantNom(enfant.nom);
    setEnfantSexe(enfant.sexe || "");
    setEnfantClasse(enfant.groupe || "");
    setOpenCombobox(false);
    setShowSuccessMessage(false);
    setSanction("");
    setSanctionJusquau("");
    setSanctionDetails("");
    setProchainSuivi("");
    setPrevenir_parents(false);
    setConvenuParents("");
  };

  const getEnfantHistorique = () => {
    if (!selectedEnfantId) return [];
    return evenements
      .filter(evt => evt.enfant_id === selectedEnfantId && evt.categorie === 'Négatif')
      .slice(0, 3);
  };

  const getDernierEvenement = () => {
    if (!selectedEnfantId) return null;
    const enfantEvents = evenements.filter(evt => evt.enfant_id === selectedEnfantId);
    return enfantEvents.length > 0 ? enfantEvents[0] : null;
  };

  const toggleTypeComportement = (type) => {
    setTypesComportement(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getIntensiteColor = (value) => {
    const violet = { r: 147, g: 51, b: 234 }; 
    const rouge = { r: 239, g: 68, b: 68 }; 
    
    const ratio = value / 100;
    const r = Math.round(violet.r + (rouge.r - violet.r) * ratio);
    const g = Math.round(violet.g + (rouge.g - violet.g) * ratio);
    const b = Math.round(violet.b + (rouge.b - violet.b) * ratio); 
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-[95vw] sm:w-full p-3 sm:p-6">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-3 sm:pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              Ajouter un événement
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 px-1 overflow-x-hidden">
            {showSuccessMessage && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 sticky top-0 z-10 shadow-lg">
                <p className="text-green-800 font-semibold text-sm sm:text-base text-center">
                  ✓ {successEnfantNom} a bien été ajouté !
                </p>
              </div>
            )}

            {showEventSuccessMessage && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 sticky top-0 z-10 shadow-lg animate-in fade-in">
                <p className="text-green-800 font-semibold text-sm sm:text-base text-center">
                  ✓ Événement enregistré avec succès !
                </p>
              </div>
            )}

            {(() => {
              let stepCounter = 0;

              return (
                <>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm sm:text-base font-semibold">{++stepCounter}. Nom de l&apos;enfant</Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox}
                          className="w-full justify-between text-left h-10 sm:h-11 text-sm sm:text-base"
                        >
                          <span className="truncate">{enfantNom || "Sélectionner ou taper un nom..."}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[90vw] sm:w-full p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Rechercher ou créer..." 
                            value={enfantNom}
                            onValueChange={handleEnfantNameChange}
                            onKeyDown={handleKeyDown}
                            className="text-sm sm:text-base"
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-3 text-sm sm:text-base">
                                <p className="mb-1">Enfant non trouvé.</p>
                                <p className="text-gray-600 text-xs sm:text-sm">
                                  Tapez le nom et appuyez sur Entrée.
                                </p>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {enfants
                                .filter(e => e.nom?.toLowerCase().includes(enfantNom.toLowerCase()))
                                .map((enfant) => (
                                  <CommandItem
                                    key={enfant.id}
                                    onSelect={() => handleEnfantSelect(enfant)}
                                    className="text-sm sm:text-base"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                                        selectedEnfantId === enfant.id ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    <span className="truncate">{enfant.nom} {enfant.groupe && `- ${enfant.groupe}`}</span>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    {selectedEnfantId && getEnfantHistorique().length > 0 && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 mt-2">
                        <h4 className="font-semibold text-red-900 text-sm sm:text-base mb-2 flex items-center gap-1.5">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Événements négatifs précédents
                        </h4>
                        <div className="space-y-2">
                          {getEnfantHistorique().map((evt) => (
                            <div key={evt.id} className="bg-white rounded-lg p-2 border border-red-200">
                              <div className="flex items-start justify-between mb-1 flex-wrap gap-1">
                                <span className="text-xs sm:text-sm font-medium text-red-800">
                                  {format(new Date(evt.date), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                                </span>
                                <Badge className="bg-red-100 text-red-800 text-xs sm:text-sm h-5 sm:h-6">
                                  {evt.intensite}%
                                </Badge>
                              </div>
                              {evt.lieu && (
                                <p className="text-xs sm:text-sm text-gray-700 mb-0.5">
                                  <span className="font-medium">Lieu:</span> {evt.lieu}
                                </p>
                              )}
                              {evt.details && (
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{renderTextWithLinks(evt.details)}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {!selectedEnfantId && enfantNom && (
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label className="text-sm sm:text-base font-semibold">{++stepCounter}. Classe</Label>
                      <Select 
                        value={enfantClasse} 
                        onValueChange={(value) => {
                          setEnfantClasse(value);
                          setTimeout(tryCreateEnfant, 0);
                        }}
                      >
                        <SelectTrigger className="w-full h-10 sm:h-11 text-sm sm:text-base">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASSES.map((classe) => (
                            <SelectItem key={classe} value={classe} className="text-sm sm:text-base">{classe}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {!selectedEnfantId && enfantNom && (
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base font-semibold">{++stepCounter}. Est-ce ?</Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEnfantSexe("Fille");
                            setTimeout(tryCreateEnfant, 0);
                          }}
                          className={`flex-1 py-2.5 px-3 rounded-lg border-2 transition-all font-medium flex items-center justify-center gap-2 text-sm sm:text-base ${
                            enfantSexe === "Fille"
                              ? 'bg-pink-50 border-pink-300 text-pink-700'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <span className="text-xl sm:text-2xl">👧</span> Fille
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEnfantSexe("Garçon");
                            setTimeout(tryCreateEnfant, 0);
                          }}
                          className={`flex-1 py-2.5 px-3 rounded-lg border-2 transition-all font-medium flex items-center justify-center gap-2 text-sm sm:text-base ${
                            enfantSexe === "Garçon"
                              ? 'bg-purple-50 border-purple-300 text-purple-700'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <span className="text-xl sm:text-2xl">👦</span> Garçon
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm sm:text-base font-semibold">{++stepCounter}. Date et heure</Label>
                    <Input
                      type="datetime-local"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm sm:text-base font-semibold">{++stepCounter}. Lieu</Label>
                    <Select value={lieu} onValueChange={setLieu}>
                      <SelectTrigger className="w-full h-10 sm:h-11 text-sm sm:text-base">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {LIEUX.map((l) => (
                          <SelectItem key={l} value={l} className="text-sm sm:text-base">{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm sm:text-base font-semibold">{++stepCounter}. Comportement</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCategorie("Positif");
                          setTypesComportement([]);
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-lg transition-all font-medium text-sm sm:text-base flex items-center justify-center gap-2 ${
                          categorie === "Positif" 
                            ? 'bg-green-500 text-white shadow-lg' 
                            : 'bg-green-500 text-white opacity-50'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        Bon comportement
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCategorie("Négatif");
                          setTypesComportement([]);
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-lg transition-all font-medium text-sm sm:text-base flex items-center justify-center gap-2 ${
                          categorie === "Négatif" 
                            ? 'bg-red-500 text-white shadow-lg' 
                            : 'bg-red-500 text-white opacity-50'
                        }`}
                      >
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        Mauvais comportement
                      </button>
                    </div>

                    {categorie && (
                      <div className="mt-2 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                        <Label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 block">
                          Types de comportement (choix multiples)
                        </Label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(categorie === "Négatif" ? COMPORTEMENTS_NEGATIFS : COMPORTEMENTS_POSITIFS).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => toggleTypeComportement(type)}
                              className={`py-2 px-2.5 rounded-lg border-2 transition-all text-xs sm:text-sm font-medium ${
                                typesComportement.includes(type)
                                  ? categorie === "Négatif"
                                    ? 'bg-red-100 text-red-800 border-red-300'
                                    : 'bg-green-100 text-green-800 border-green-300'
                                  : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm sm:text-base font-semibold">{++stepCounter}. Animateur (qui enregistre/sanctionne)</Label>
                    <Select value={animateur} onValueChange={setAnimateur}>
                      <SelectTrigger className="w-full h-10 sm:h-11 text-sm sm:text-base">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {ANIMATEURS.map((anim) => (
                          <SelectItem key={anim} value={anim} className="text-sm sm:text-base">{anim}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="text-sm sm:text-base font-semibold">{++stepCounter}. Intensité</Label>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Évaluation de l&apos;événement</p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        style={{ 
                          backgroundColor: getIntensiteColor(intensite[0]) + '20',
                          color: getIntensiteColor(intensite[0]),
                          borderColor: getIntensiteColor(intensite[0])
                        }}
                        className="text-sm sm:text-base px-2.5 py-1 border"
                      >
                        {intensite[0]}%
                      </Badge>
                    </div>
                    <div className="relative">
                      <div className="h-2.5 sm:h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full transition-all duration-300"
                          style={{ 
                            width: `${intensite[0]}%`,
                            backgroundColor: getIntensiteColor(intensite[0])
                          }}
                        />
                      </div>
                      <Slider 
                        value={intensite} 
                        onValueChange={setIntensite}
                        max={100}
                        step={5}
                        className="py-2"
                      />
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm font-medium">
                      <span style={{ color: getIntensiteColor(0) }}>0%</span>
                      <span style={{ color: getIntensiteColor(50) }}>50%</span>
                      <span style={{ color: getIntensiteColor(100) }}>100%</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="prevenir"
                        checked={prevenir_parents}
                        onCheckedChange={setPrevenir_parents}
                        className="w-5 h-5 sm:w-6 sm:h-6"
                      />
                      <Label htmlFor="prevenir" className="text-sm sm:text-base font-semibold cursor-pointer">
                        {++stepCounter}. Prévenir les parents ?
                      </Label>
                    </div>
                  </div>

                  {prevenir_parents && (
                    <>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="prochainSuivi" className="text-sm sm:text-base font-semibold">{++stepCounter}. Prochain suivi de l&apos;enfant</Label>
                        <Input
                          id="prochainSuivi"
                          type="datetime-local"
                          value={prochainSuivi}
                          onChange={(e) => setProchainSuivi(e.target.value)}
                          className="w-full h-10 sm:h-11 text-sm sm:text-base"
                        />
                      </div>

                      <div className="space-y-2 border-t pt-3">
                        <Label htmlFor="convenuParents" className="text-sm sm:text-base font-semibold">{++stepCounter}. Ce qui a été convenu avec les parents</Label>
                        <Textarea
                          id="convenuParents"
                          value={convenuParents}
                          onChange={(e) => setConvenuParents(e.target.value)}
                          placeholder="Décrire ce qui a été dit et convenu avec les parents..."
                          rows={4}
                          maxLength={500}
                          className="w-full text-sm sm:text-base"
                        />
                        <p className="text-xs sm:text-sm text-gray-500 text-right">{convenuParents.length}/500</p>
                      </div>
                    </>
                  )}

                  <div className="space-y-2 border-t pt-3">
                    <Label className="text-sm sm:text-base font-semibold">{++stepCounter}. Sanction/Punition</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSanction("");
                          setSanctionDetails("");
                          setSanctionJusquau("");
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-lg border-2 transition-all font-medium text-sm sm:text-base ${
                          !sanction ? 'bg-gray-50 border-gray-300 text-gray-700' : 'bg-white border-gray-200'
                        }`}
                      >
                        Aucune
                      </button>
                      <button
                        type="button"
                        onClick={() => setSanction("Sanction")}
                        className={`flex-1 py-2.5 px-3 rounded-lg border-2 transition-all font-medium flex items-center justify-center gap-2 text-sm sm:text-base ${
                          sanction === "Sanction" ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-white border-gray-200'
                        }`}
                      >
                        <FileWarning className="w-4 h-4 sm:w-5 sm:h-5" />
                        Sanction
                      </button>
                      <button
                        type="button"
                        onClick={() => setSanction("Punition")}
                        className={`flex-1 py-2.5 px-3 rounded-lg border-2 transition-all font-medium flex items-center justify-center gap-2 text-sm sm:text-base ${
                          sanction === "Punition" ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-gray-200'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                        Punition
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm sm:text-base font-semibold">{++stepCounter}. Photo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => setPhotoFile(e.target.files[0])}
                      className="w-full h-10 sm:h-11 text-sm sm:text-base"
                    />
                    {photoFile && (
                      <p className="text-xs sm:text-sm text-green-600">✓ {photoFile.name}</p>
                    )}
                  </div>

                  {sanction && sanction !== "" && (
                    <div className="space-y-2 border-t pt-3">
                      <Label htmlFor="sanctionDetails" className="text-sm sm:text-base font-semibold">{++stepCounter}. Décrire ce qu&apos;il a eu comme sanction/punition</Label>
                      <Textarea
                        id="sanctionDetails"
                        value={sanctionDetails || ""}
                        onChange={(e) => setSanctionDetails(e.target.value)}
                        className="w-full text-sm sm:text-base min-h-[100px]"
                        rows={4}
                      />
                      
                      {sanctionDetails && (
                        <div className="space-y-1.5 mt-3">
                          <Label htmlFor="sanctionJusquau">Jusqu&apos;à quand la sanction/punition prend fin ?</Label>
                          <Input
                            id="sanctionJusquau"
                            type="datetime-local"
                            value={sanctionJusquau}
                            onChange={(e) => setSanctionJusquau(e.target.value)}
                            className="w-full h-10 sm:h-11 text-sm sm:text-base"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {categorie === "Négatif" && (
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="problemeRegle"
                          checked={problemeRegle}
                          onCheckedChange={setProblemeRegle}
                          className="w-5 h-5 sm:w-6 sm:h-6"
                        />
                        <Label htmlFor="problemeRegle" className="text-sm sm:text-base font-semibold cursor-pointer">
                          {++stepCounter}. Problème réglé ?
                        </Label>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm sm:text-base font-semibold">{++stepCounter}. Détails des faits</Label>
                    
                    {selectedEnfantId && getDernierEvenement() && getDernierEvenement().details && (
                      <div className="bg-red-600 text-white rounded-lg p-2.5 mb-2">
                        <p className="text-xs sm:text-sm font-semibold mb-1 flex items-center gap-1.5">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Dernier événement ({format(new Date(getDernierEvenement().date), "d MMM", { locale: fr })}) :
                        </p>
                        <p className="text-xs sm:text-sm">{renderTextWithLinks(getDernierEvenement().details)}</p>
                      </div>
                    )}

                    <Textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Décrire ce qui s'est passé..."
                      rows={3}
                      maxLength={500}
                      className="w-full text-sm sm:text-base"
                    />
                    <p className="text-xs sm:text-sm text-gray-500 text-right">{details.length}/500</p>
                  </div>
                </>
              );
            })()}

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t sticky bottom-0 bg-white pb-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
                className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Supprimer
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  onOpenChange(false);
                  resetForm();
                }}
                className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base"
                disabled={!enfantNom.trim() || uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <>Téléchargement...</>
                ) : (
                  <>
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

DialogAjoutEvenement.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
};

export default DialogAjoutEvenement;
