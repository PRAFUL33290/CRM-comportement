
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Edit2, Trash2, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  "Sabrina (animatrice)"
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

export default function MurPublic() {
  const [contenu, setContenu] = useState("");
  const [animateurNom, setAnimateurNom] = useState("");
  const [emoji, setEmoji] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.MessageMur.list('-created_date'),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createMessage = useMutation({
    mutationFn: (data) => base44.entities.MessageMur.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      resetForm();
    },
  });

  const updateMessage = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MessageMur.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setEditingMessage(null);
      resetForm();
    },
  });

  const deleteMessage = useMutation({
    mutationFn: (id) => base44.entities.MessageMur.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setDeleteMessageId(null);
    },
  });

  const resetForm = () => {
    setContenu("");
    setAnimateurNom("");
    setEmoji("");
    setPhotoFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contenu.trim() || !animateurNom) return;

    let photoUrl = editingMessage?.photo_url || null; // Preserve existing photo URL if editing
    if (photoFile) { // If a new photo file is selected, upload it
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
    } else if (editingMessage && !editingMessage.photo_url) {
      // If editing and no new photo file is selected and there was no previous photo, ensure photoUrl is null
      photoUrl = null;
    }


    const messageData = {
      auteur_nom: animateurNom,
      contenu: `${emoji} ${contenu.trim()}`,
      photo_url: photoUrl
    };

    if (editingMessage) {
      await updateMessage.mutateAsync({ 
        id: editingMessage.id, 
        data: messageData 
      });
    } else {
      await createMessage.mutateAsync(messageData);
    }
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
    setAnimateurNom(message.auteur_nom);
    
    // Extraire l'emoji et le contenu
    // Using U+1F000 to U+1FAFF for common emojis, as some might fall outside the basic multilingual plane.
    // Adding U+2600-U+26FF (miscellaneous symbols) and U+2700-U+27BF (dingbats) for completeness.
    const emojiMatch = message.contenu.match(/^([\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])\s/u);
    if (emojiMatch) {
      setEmoji(emojiMatch[1]);
      setContenu(message.contenu.substring(emojiMatch[0].length));
    } else {
      setEmoji("");
      setContenu(message.contenu);
    }
    // Note: for editing, photoFile state is not set directly from message.photo_url
    // as we generally don't re-upload the same file. User would pick a new file to change it.
    // If the user wants to remove an existing photo, that would require more specific UI/logic.
    setPhotoFile(null); // Clear any pending new photo selection when starting edit
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    resetForm();
  };

  const canEditOrDelete = (message) => {
    return message.created_by === user?.email;
  };

  return (
    <>
      <Card className="shadow-md border-purple-100">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <MessageSquare className="w-5 h-5" />
            Quoi de neuf ?
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
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
              <Label className="text-sm font-medium">Votre humeur</Label>
              <div className="grid grid-cols-6 gap-2">
                {EMOJIS_HUMEUR.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => setEmoji(item.emoji)}
                    className={`p-2 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                      emoji === item.emoji 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    title={item.label}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Message *</Label>
              <Textarea
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                placeholder="Partagez une info avec l'équipe..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">{contenu.length}/500</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo-upload" className="text-sm font-medium flex items-center gap-1">
                <ImageIcon className="w-4 h-4 text-gray-600" /> Photo (optionnelle)
              </Label>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setPhotoFile(e.target.files[0])}
                className="w-full file:text-purple-600 file:border-purple-200 file:bg-purple-50 hover:file:bg-purple-100"
              />
              {photoFile && (
                <p className="text-xs text-green-600">✓ Photo sélectionnée : {photoFile.name}</p>
              )}
              {editingMessage?.photo_url && !photoFile && (
                <p className="text-xs text-gray-500">Photo actuelle déjà présente.</p>
              )}
            </div>

            <div className="flex justify-between items-center">
              {editingMessage && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Annuler
                </Button>
              )}
              <div className="flex-1" />
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={!contenu.trim() || !animateurNom || uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <>Téléchargement photo...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {editingMessage ? 'Modifier' : 'Publier'}
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun message pour le moment</p>
                <p className="text-sm mt-1">Soyez le premier à partager une info !</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex gap-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold text-sm">
                      {message.auteur_nom?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-gray-900">{message.auteur_nom}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(message.created_date), "d MMM 'à' HH:mm", { locale: fr })}
                        </p>
                      </div>
                      {canEditOrDelete(message) && (
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                            onClick={() => handleEdit(message)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => setDeleteMessageId(message.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.contenu}</p>
                    {message.photo_url && (
                      <img 
                        src={message.photo_url} 
                        alt="Photo jointe au message" 
                        className="mt-2 max-w-full rounded-lg border border-gray-200 shadow-sm"
                        style={{ maxHeight: '300px', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
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
    </>
  );
}

