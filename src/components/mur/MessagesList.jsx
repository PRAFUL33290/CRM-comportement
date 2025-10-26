import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Trash2, Reply, MessageSquare, X, Bell, Info, Calendar, Send } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
  { emoji: "😴", label: "Fatigué" },
  { emoji: "😰", label: "Stressé" },
  { emoji: "😠", label: "Énervé" },
];

const TYPES_MESSAGE = [
  { value: "Information", icon: Info, label: "Information", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "Rappel", icon: Bell, label: "Rappel", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "Événement", icon: Calendar, label: "Événement", color: "bg-purple-100 text-purple-700 border-purple-300" }
];

export default function MessagesList() {
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const [repondreDialogOpen, setRepondreDialogOpen] = useState(false);
  const [messageRepondu, setMessageRepondu] = useState(null);
  const [reponseContenu, setReponseContenu] = useState("");
  const [reponseAnimateur, setReponseAnimateur] = useState("");
  const [reponseEmoji, setReponseEmoji] = useState("");
  const [reponseType, setReponseType] = useState("");
  const [reponseLien, setReponseLien] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.MessageMur.list('-created_date'),
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 600000,
    refetchOnWindowFocus: false,
  });

  const messagesHierarchiques = () => {
    const parentMessages = messages.filter(m => !m.reponse_a_id);
    const replyMessages = messages.filter(m => m.reponse_a_id);

    return parentMessages.map(parent => ({
      ...parent,
      reponses: replyMessages
        .filter(reply => reply.reponse_a_id === parent.id)
        .sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime())
    })).sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
  };

  const deleteMessage = useMutation({
    mutationFn: (id) => base44.entities.MessageMur.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setDeleteMessageId(null);
    },
  });

  const createReponse = useMutation({
    mutationFn: (data) => base44.entities.MessageMur.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setRepondreDialogOpen(false);
      resetReponseForm();
    },
  });

  const resetReponseForm = () => {
    setReponseContenu("");
    setReponseAnimateur("");
    setReponseEmoji("");
    setReponseType("");
    setReponseLien("");
    setMessageRepondu(null);
    setPhotoFile(null);
  };

  const handleRepondre = (message) => {
    setMessageRepondu(message);
    setRepondreDialogOpen(true);
  };

  const handleSubmitReponse = async (e) => {
    e.preventDefault();
    if (!reponseAnimateur) return;

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

    const messageData = {
      auteur_nom: reponseAnimateur,
      contenu: `${reponseEmoji} ${reponseContenu.trim()}`,
      photo_url: photoUrl,
      lien_externe: reponseLien || null,
      reponse_a_id: messageRepondu.id,
      reponse_a_nom: messageRepondu.auteur_nom
    };

    if (reponseType) {
      messageData.type_message = reponseType;
    }

    await createReponse.mutateAsync(messageData);
  };

  const canEditOrDelete = (message) => {
    return message.created_by === user?.email;
  };

  const renderMessage = (message, isReponse = false) => (
    <div key={message.id} className={`flex gap-3 p-4 rounded-lg ${isReponse ? 'bg-white border-l-4 border-purple-300' : 'bg-gray-50'}`}>
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold text-sm">
          {message.auteur_nom?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
            <p className="font-medium text-sm text-gray-900 truncate">{message.auteur_nom}</p>
            {message.type_message && (
              <Badge className={`
                ${message.type_message === 'Rappel' ? 'bg-orange-100 text-orange-700 border-orange-300' : ''}
                ${message.type_message === 'Information' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
                ${message.type_message === 'Événement' ? 'bg-purple-100 text-purple-700 border-purple-300' : ''}
                text-xs flex items-center gap-1 flex-shrink-0
              `}>
                {message.type_message === 'Rappel' && <Bell className="w-3 h-3" />}
                {message.type_message === 'Information' && <Info className="w-3 h-3" />}
                {message.type_message === 'Événement' && <Calendar className="w-3 h-3" />}
                {message.type_message}
              </Badge>
            )}
            <p className="text-xs text-gray-500">
                Publié le {format(new Date(message.created_date), 'd MMMM yyyy à HH:mm', { locale: fr })}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {!isReponse && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-purple-600 hover:bg-purple-50 flex-shrink-0"
                onClick={() => handleRepondre(message)}
              >
                <Reply className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Répondre</span>
              </Button>
            )}
            {canEditOrDelete(message) && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 flex-shrink-0"
                onClick={() => setDeleteMessageId(message.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{message.contenu}</p>
        {message.lien_externe && (
          <a 
            href={message.lien_externe} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-purple-600 hover:underline mt-2 inline-block break-all"
          >
            🔗 {message.lien_externe}
          </a>
        )}
        {message.photo_url && (
          <img 
            src={message.photo_url} 
            alt="Photo jointe au message" 
            className="mt-2 w-full max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
            style={{ maxHeight: '300px', objectFit: 'cover' }}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {messagesHierarchiques().length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-600">
            Aucun message pour l&apos;instant
          </p>
          <p className="text-sm mt-1">Soyez le premier à partager une info !</p>
        </div>
      ) : (
        messagesHierarchiques().map((messageParent) => (
          <div key={messageParent.id} className="space-y-2 overflow-hidden">
            {renderMessage(messageParent)}
            {messageParent.reponses && messageParent.reponses.length > 0 && (
              <div className="ml-4 md:ml-8 space-y-2 overflow-hidden">
                {messageParent.reponses.map(reponse => renderMessage(reponse, true))}
              </div>
            )}
          </div>
        ))
      )}

      <Dialog open={repondreDialogOpen} onOpenChange={setRepondreDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Reply className="w-5 h-5 text-purple-600" />
                Répondre à {messageRepondu?.auteur_nom}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8"
                onClick={() => {
                  setRepondreDialogOpen(false);
                  resetReponseForm();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmitReponse} className="space-y-4 p-1">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Votre nom *</Label>
              <Select value={reponseAnimateur} onValueChange={setReponseAnimateur}>
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
                    onClick={() => setReponseEmoji(item.emoji)}
                    className={`p-1.5 text-xl rounded-lg border-2 transition-all ${
                      reponseEmoji === item.emoji 
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
                      onClick={() => setReponseType(reponseType === type.value ? "" : type.value)}
                      className={`py-2 px-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                        reponseType === type.value
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
                value={reponseContenu}
                onChange={(e) => setReponseContenu(e.target.value)}
                placeholder="Écrivez votre réponse..."
                rows={4}
                maxLength={500}
                className="text-sm"
              />
              <p className="text-xs text-gray-500 text-right">{reponseContenu.length}/500</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lien-externe" className="text-sm font-medium">Lien externe (optionnel)</Label>
              <Input
                id="lien-externe"
                type="url"
                value={reponseLien}
                onChange={(e) => setReponseLien(e.target.value)}
                placeholder="https://exemple.com"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo-reponse" className="text-sm font-medium">Photo (optionnelle)</Label>
              <Input
                id="photo-reponse"
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

            <div className="flex justify-end gap-2 sticky bottom-0 bg-white pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRepondreDialogOpen(false);
                  resetReponseForm();
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-purple-600"
                disabled={!reponseAnimateur || uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <>Téléchargement...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Répondre
                  </>
                )}
              </Button>
            </div>
          </form>
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
              className="bg-red-600"
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