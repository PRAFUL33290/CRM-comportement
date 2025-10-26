import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, TrendingUp } from "lucide-react";

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function StatistiquesGenre() {
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

  const statsParGenre = { Garçon: 0, Fille: 0 };
  const statsEvenementsGenre = { Garçon: { positifs: 0, negatifs: 0 }, Fille: { positifs: 0, negatifs: 0 } };

  enfants.forEach(enfant => {
    if (enfant.sexe) {
      statsParGenre[enfant.sexe] = (statsParGenre[enfant.sexe] || 0) + 1;
    }
  });

  evenements.forEach(evt => {
    const enfant = enfants.find(e => e.id === evt.enfant_id);
    if (enfant && enfant.sexe) {
      if (evt.categorie === 'Positif') {
        statsEvenementsGenre[enfant.sexe].positifs += 1;
      } else if (evt.categorie === 'Négatif') {
        statsEvenementsGenre[enfant.sexe].negatifs += 1;
      }
    }
  });

  const dataGenre = Object.entries(statsParGenre).map(([genre, total]) => ({
    genre,
    total,
    positifs: statsEvenementsGenre[genre].positifs,
    negatifs: statsEvenementsGenre[genre].negatifs
  }));

  const dataPieGenre = Object.entries(statsParGenre).map(([name, value]) => ({ name, value }));

  const statsParClasse = {};
  const statsEvenementsClasse = {};

  enfants.forEach(enfant => {
    if (enfant.groupe) {
      statsParClasse[enfant.groupe] = (statsParClasse[enfant.groupe] || 0) + 1;
      if (!statsEvenementsClasse[enfant.groupe]) {
        statsEvenementsClasse[enfant.groupe] = { positifs: 0, negatifs: 0 };
      }
    }
  });

  evenements.forEach(evt => {
    const enfant = enfants.find(e => e.id === evt.enfant_id);
    if (enfant && enfant.groupe) {
      if (evt.categorie === 'Positif') {
        statsEvenementsClasse[enfant.groupe].positifs += 1;
      } else if (evt.categorie === 'Négatif') {
        statsEvenementsClasse[enfant.groupe].negatifs += 1;
      }
    }
  });

  const dataClasse = Object.entries(statsParClasse).map(([classe, total]) => ({
    classe,
    total,
    positifs: statsEvenementsClasse[classe]?.positifs || 0,
    negatifs: statsEvenementsClasse[classe]?.negatifs || 0
  }));

  const dataPieClasse = Object.entries(statsParClasse).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistiques par Genre et Classe</h1>
          <p className="text-gray-600">Analyse détaillée des comportements</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Répartition par Genre
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enfants.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Aucun enfant enregistré pour l&apos;instant
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dataPieGenre}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dataPieGenre.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Événements par Genre
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataGenre.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Aucune donnée pour l&apos;instant
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dataGenre}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="genre" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="positifs" fill="#10b981" name="Positifs" />
                    <Bar dataKey="negatifs" fill="#ef4444" name="Négatifs" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Répartition par Classe
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataClasse.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Aucune donnée pour l&apos;instant
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dataPieClasse}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dataPieClasse.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Événements par Classe
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataClasse.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Aucune donnée pour l&apos;instant
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dataClasse}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="classe" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="positifs" fill="#10b981" name="Positifs" />
                    <Bar dataKey="negatifs" fill="#ef4444" name="Négatifs" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}