
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Send, Bell, Info, Calendar, Plus } from "lucide-react"; // Removed Image as it was not used in the component's JSX/logic
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query"; // Removed useQuery as it was not used
import { toast } from "sonner"; // Added toast

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

const EMOJIS_HUMEUR = [
  { emoji: "😊", label: "Content" },
  { emoji: "😃", label: "Joyeux" },
  { emoji: "😌", label: "Serein" },
  { emoji: "😎", label: "Cool" },
  { emoji: "🤔", label: "Pensif" },
  { emoji: "😴", label: "Fatigué" },
  { emoji: "😅", label: "Soulagé" },
  { emoji: "🤗", label: "Câlin" },
  { emoji: "💪", label: "Motivé" },
  { emoji: "☕", label: "Café" },
  { emoji: "🎉", label: "Fête" },
  { emoji: "❤️", label: "Amour" }
];

const TYPES_MESSAGE = [
  { value: "Information", icon: Info, label: "Information", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "Rappel", icon: Bell, label: "Rappel", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "Événement", icon: Calendar, label: "Événement", color: "bg-purple-100 text-purple-700 border-purple-300" }
];

export default function MessageForm() {
  const [contenu, setContenu] = useState("");
  const [animateurNom, setAnimateurNom] = useState("");
  const [emoji, setEmoji] = useState("");
  const [typeMessage, setTypeMessage] = useState("");
  const [lienExterne, setLienExterne] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const queryClient = useQueryClient();

  const createMessage = useMutation({
    mutationFn: (data) => base44.entities.MessageMur.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      // Reset only specific fields, not animateurNom
      setContenu("");
      setEmoji("");
      setTypeMessage("");
      setLienExterne("");
      setPhotoFile(null);
      toast.success("Message publié avec succès !"); // Added toast on success
    },
    onError: (error) => {
      console.error("Erreur lors de la publication:", error);
      toast.error("Échec de la publication du message."); // Added toast on error
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!animateurNom) {
      toast.error("Veuillez sélectionner votre nom."); // Added toast for missing name
      return;
    }

    let photoUrl = null;
    if (photoFile) {
      setUploadingPhoto(true);
      try {
        const result = await base44.integrations.Core.UploadFile({ file: photoFile });
        photoUrl = result.file_url;
        toast.success("Photo téléchargée avec succès."); // Added toast for photo upload success
      } catch (error) {
        console.error("Erreur upload photo:", error);
        toast.error("Erreur lors du téléchargement de la photo. Veuillez réessayer."); // Added toast for photo upload error
        setUploadingPhoto(false);
        return;
      }
      setUploadingPhoto(false);
    }

    const messageData = {
      auteur_nom: animateurNom,
      contenu: `${emoji} ${contenu.trim()}`,
      photo_url: photoUrl,
      lien_externe: lienExterne || null
    };

    if (typeMessage) {
      messageData.type_message = typeMessage;
    }

    await createMessage.mutateAsync(messageData);
  };

  return (
    <Card className="shadow-md border-purple-100 h-full">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Plus className="w-5 h-5" />
          Nouvelle actualité
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Votre nom *</Label>
            <Select value={animateurNom} onValueChange={setAnimateurNom}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
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
            <Label className="text-sm font-medium">Votre humeur</Label>
            <div className="grid grid-cols-6 gap-1.5">
              {EMOJIS_HUMEUR.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  onClick={() => setEmoji(item.emoji)}
                  className={`p-1.5 text-xl rounded-lg border-2 transition-all ${
                    emoji === item.emoji 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200'
                  }`}
                  title={item.label}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Type de message</Label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES_MESSAGE.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setTypeMessage(typeMessage === type.value ? "" : type.value)}
                    className={`py-2 px-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                      typeMessage === type.value
                        ? type.color + ' border-current'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Message</Label>
            <Textarea
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder="Partagez une info avec l'équipe..."
              rows={4}
              maxLength={500}
              className="text-sm"
            />
            <p className="text-xs text-gray-500 text-right">{contenu.length}/500</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lien-externe-form" className="text-sm font-medium">Lien externe (optionnel)</Label>
            <Input
              id="lien-externe-form"
              type="url"
              value={lienExterne}
              onChange={(e) => setLienExterne(e.target.value)}
              placeholder="https://exemple.com"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo" className="text-sm font-medium">Photo (optionnelle)</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setPhotoFile(e.target.files[0])}
              className="text-xs"
            />
            {photoFile && (
              <p className="text-xs text-green-600">✓ {photoFile.name}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-purple-600"
            disabled={!animateurNom || uploadingPhoto}
          >
            {uploadingPhoto ? (
              <>Téléchargement...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Publier
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
