
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Save } from "lucide-react"; // Removed 'User' as it was unused, and new icons were not utilized in the component.
import { Badge } from "@/components/ui/badge";

export default function MonProfil() {
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [nomAffichage, setNomAffichage] = useState("");
  const [equipe, setEquipe] = useState("");

  useEffect(() => { // Changed from useState to useEffect to correctly handle side effects
    if (user) {
      setNomAffichage(user.nom_affichage || "");
      setEquipe(user.equipe || "");
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      alert("Profil mis à jour avec succès !");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile.mutateAsync({
      nom_affichage: nomAffichage,
      equipe: equipe
    });
  };

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'Administrateur';
      default: return 'Animateur';
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mon profil</h1>
          <p className="text-gray-600 mt-1">Gérez vos informations personnelles</p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold text-xl">
                  {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{user.full_name}</CardTitle>
                <Badge className={`mt-1 ${getRoleColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  value={user.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">L&apos;email ne peut pas être modifié</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Nom d&apos;affichage *
                </Label>
                <Input
                  value={nomAffichage}
                  onChange={(e) => setNomAffichage(e.target.value)}
                  placeholder="Ex: Julien (admin)"
                  required
                />
                <p className="text-xs text-gray-500">
                  Ce nom sera affiché dans l&apos;application (événements, messages, etc.)
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Équipe</Label>
                <Select value={equipe} onValueChange={setEquipe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une équipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Élémentaire">Élémentaire</SelectItem>
                    <SelectItem value="Maternelle">Maternelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!nomAffichage}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
