
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Users, AlertTriangle, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Statistiques() {
  const { data: enfants = [] } = useQuery({
    queryKey: ['enfants'],
    queryFn: () => base44.entities.Enfant.list(),
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: evenements = [] } = useQuery({
    queryKey: ['evenements'],
    queryFn: () => base44.entities.Evenement.list('-date'),
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const statsParEnfant = enfants.map(enfant => {
    const evtsEnfant = evenements.filter(evt => evt.enfant_id === enfant.id);
    const evtsNegatifs = evtsEnfant.filter(evt => evt.categorie === 'Négatif');
    const evtsPositifs = evtsEnfant.filter(evt => evt.categorie === 'Positif');
    
    return {
      nom: enfant.nom,
      genre: enfant.sexe, // Changed from 'sexe' to 'genre'
      groupe: enfant.groupe,
      totalEvenements: evtsEnfant.length,
      negatifs: evtsNegatifs.length,
      positifs: evtsPositifs.length,
      ratio: evtsEnfant.length > 0 
        ? ((evtsPositifs.length / evtsEnfant.length) * 100).toFixed(1)
        : 0
    };
  }).sort((a, b) => b.negatifs - a.negatifs);

  const totalNegatifs = evenements.filter(evt => evt.categorie === 'Négatif').length;
  const totalPositifs = evenements.filter(evt => evt.categorie === 'Positif').length;
  const totalEvenements = evenements.length;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistiques</h1>
          <p className="text-gray-600">Vue détaillée des comportements</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enfants</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enfants.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Événements</CardTitle>
              <BarChart2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvenements}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Négatifs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totalNegatifs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positifs</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalPositifs}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Statistiques détaillées par enfant</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Nom</TableHead>
                    <TableHead>Genre</TableHead> {/* Changed from 'Sexe' to 'Genre' */}
                    <TableHead>Classe</TableHead>
                    {/* Removed 'Total' column */}
                    <TableHead className="text-center">Négatifs</TableHead>
                    <TableHead className="text-center">Positifs</TableHead>
                    <TableHead className="text-center">Ratio Positif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsParEnfant.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500"> {/* colSpan updated from 7 to 6 */}
                        Aucune donnée disponible
                      </TableCell>
                    </TableRow>
                  ) : (
                    statsParEnfant.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{stat.nom}</TableCell>
                        <TableCell>
                          {stat.genre === 'Fille' ? '👧' : '👦'} {stat.genre} {/* Uses stat.genre */}
                        </TableCell>
                        <TableCell>
                          {stat.groupe && (
                            <Badge variant="outline">{stat.groupe}</Badge>
                          )}
                        </TableCell>
                        {/* Removed TotalEvenements column */}
                        <TableCell className="text-center">
                          <Badge className="bg-red-100 text-red-800">
                            {stat.negatifs}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-100 text-green-800">
                            {stat.positifs}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            className={`${
                              parseFloat(stat.ratio) >= 50 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {stat.ratio}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
