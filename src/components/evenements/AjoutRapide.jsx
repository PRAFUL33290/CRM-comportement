
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Plus, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

const LIEUX = ["Cour de récréation", "Salle d'activité", "Cantine", "Dortoir", "Sortie", "Autre"];
const CATEGORIES = ["Positif", "Neutre", "Négatif"];

export default function AjoutRapide() {
  const [enfantId, setEnfantId] = useState("");
  const [lieu, setLieu] = useState("");
  const [categorie, setCategorie] = useState("");
  const [intensite, setIntensite] = useState([50]);
  const [details, setDetails] = useState("");
  const queryClient = useQueryClient();

  const { data: enfants = [] } = useQuery({
    queryKey: ['enfants'],
    queryFn: () => base44.entities.Enfant.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createEvenement = useMutation({
    mutationFn: (data) => base44.entities.Evenement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evenements'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      resetForm();
    },
  });

  const resetForm = () => {
    setEnfantId("");
    setCategorie("");
    setIntensite([50]);
    setDetails("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!enfantId || !lieu || !categorie) return; // Keep original validation for submission flow

    const enfant = enfants.find(e => e.id === enfantId);
    await createEvenement.mutateAsync({
      enfant_id: enfantId,
      enfant_nom: enfant?.nom || "",
      date: new Date().toISOString(),
      lieu,
      categorie,
      intensite: intensite[0],
      details,
      animateur_nom: user?.full_name || "",
      type: categorie === "Positif" ? "Réussite" : "Incident",
      parents_contactes: false
    });
  };

  const handleActionRapide = async (cat, int) => {
    if (!enfantId || !lieu) return;
    
    const enfant = enfants.find(e => e.id === enfantId);
    await createEvenement.mutateAsync({
      enfant_id: enfantId,
      enfant_nom: enfant?.nom || "",
      date: new Date().toISOString(),
      lieu,
      categorie: cat,
      intensite: int,
      details,
      animateur_nom: user?.full_name || "",
      type: cat === "Positif" ? "Réussite" : "Incident",
      parents_contactes: false
    });
    resetForm();
  };

  const getCategorieColor = (cat) => {
    switch(cat) {
      case 'Positif': return 'bg-green-100 text-green-800 border-green-200';
      case 'Négatif': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Plus className="w-5 h-5" />
          Ajout rapide d&apos;événement
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Enfant *</label>
              <Select value={enfantId} onValueChange={setEnfantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un enfant" />
                </SelectTrigger>
                <SelectContent>
                  {enfants.map((enfant) => (
                    <SelectItem key={enfant.id} value={enfant.id}>
                      {enfant.nom} - {enfant.groupe}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lieu *</label>
              <Select value={lieu} onValueChange={setLieu}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un lieu" />
                </SelectTrigger>
                <SelectContent>
                  {LIEUX.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Catégorie *</label>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategorie(cat)}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                    categorie === cat 
                      ? getCategorieColor(cat) + ' border-current'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Intensité</label>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {intensite[0]}
              </Badge>
            </div>
            <Slider 
              value={intensite} 
              onValueChange={setIntensite}
              max={100}
              step={5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Détails</label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Décrire l'événement..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">{details.length}/500</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              type="submit" 
              disabled={!enfantId || !categorie || createEvenement.isPending}
              className={categorie === 'Positif' ? 'flex-1 bg-green-600 hover:bg-green-700' : 'flex-1 bg-red-600 hover:bg-red-700'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleActionRapide("Positif", 50)}
                disabled={!enfantId || !lieu}
                className="border-green-200 hover:bg-green-50"
              >
                <Zap className="w-3 h-3 mr-1" /> +50
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleActionRapide("Négatif", 30)}
                disabled={!enfantId || !lieu}
                className="border-red-200 hover:bg-red-50"
              >
                <Zap className="w-3 h-3 mr-1" /> -30
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
