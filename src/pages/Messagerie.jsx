import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2 } from "lucide-react";
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
import MessagesList from "../components/mur/MessagesList";
import MessageForm from "../components/mur/MessageForm";

export default function Messagerie() {
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.MessageMur.list('-created_date'),
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const deleteAllMessages = useMutation({
    mutationFn: async () => {
      const deletePromises = messages.map(msg => base44.entities.MessageMur.delete(msg.id));
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setDeleteAllDialogOpen(false);
    },
  });

  return (
    <>
      <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Messagerie</h1>
              <p className="text-gray-600">Communication interne de l&apos;équipe</p>
            </div>
            <Button 
              onClick={() => setDeleteAllDialogOpen(true)}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={messages.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer tous les messages
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="shadow-md">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <MessageSquare className="w-5 h-5" />
                    Messages de l&apos;équipe
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <MessagesList />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <MessageForm />
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer tous les messages ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les messages ({messages.length}) seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteAllMessages.mutate()}
            >
              Supprimer tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}