
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Download, Filter } from "lucide-react";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale"; // Added fr locale
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

const COLORS_PIE = {
  'Positif': '#10b981',
  'Neutre': '#6b7280',
  'Négatif': '#ef4444'
};

export default function Rapports() {
  const [periode, setPeriode] = useState("30");
  
  const { data: enfants = [] } = useQuery({
    queryKey: ['enfants'],
    queryFn: () => base44.entities.Enfant.list(),
  });

  const { data: evenements = [] } = useQuery({
    queryKey: ['evenements'],
    queryFn: () => base44.entities.Evenement.list('-date'), // Added sorting by date
    staleTime: 300000, // Added staleTime
    refetchOnWindowFocus: false, // Added refetchOnWindowFocus
  });

  // Filtrer par période
  const dateDebut = subDays(new Date(), parseInt(periode));
  const evenementsFiltres = evenements.filter(evt => 
    new Date(evt.date) >= dateDebut
  );

  // 1. Tendances par enfant (top 10)
  const tendancesParEnfant = Object.entries(
    evenementsFiltres.reduce((acc, evt) => {
      if (!acc[evt.enfant_nom]) {
        acc[evt.enfant_nom] = { Positif: 0, Neutre: 0, Négatif: 0, total: 0 };
      }
      acc[evt.enfant_nom][evt.categorie]++;
      acc[evt.enfant_nom].total++;
      return acc;
    }, {})
  )
    .map(([nom, stats]) => ({ nom, ...stats }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // 2. Types d'incidents/conséquences
  const typesIncidents = evenementsFiltres
    .filter(evt => evt.consequence_action)
    .reduce((acc, evt) => {
      acc[evt.consequence_action] = (acc[evt.consequence_action] || 0) + 1;
      return acc;
    }, {});

  const dataTypesIncidents = Object.entries(typesIncidents)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 3. Répartition par lieu
  const repartitionLieux = evenementsFiltres.reduce((acc, evt) => {
    if (evt.lieu) {
      acc[evt.lieu] = (acc[evt.lieu] || 0) + 1;
    }
    return acc;
  }, {});

  const dataLieux = Object.entries(repartitionLieux)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 4. Répartition par animateur
  const repartitionAnimateurs = evenementsFiltres.reduce((acc, evt) => {
    if (evt.animateur_nom) {
      acc[evt.animateur_nom] = (acc[evt.animateur_nom] || 0) + 1;
    }
    return acc;
  }, {});

  const dataAnimateurs = Object.entries(repartitionAnimateurs)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 5. Répartition globale par catégorie
  const repartitionCategories = evenementsFiltres.reduce((acc, evt) => {
    acc[evt.categorie] = (acc[evt.categorie] || 0) + 1;
    return acc;
  }, {});

  const dataCategories = Object.entries(repartitionCategories).map(([name, value]) => ({ name, value }));

  // Export CSV
  const exportCSV = () => {
    const headers = ['Date', 'Enfant', 'Catégorie', 'Intensité', 'Lieu', 'Détails', 'Animateur', 'Conséquence'];
    const rows = evenementsFiltres.map(evt => [
      format(new Date(evt.date), 'dd/MM/yyyy HH:mm', { locale: fr }), // Added locale: fr
      evt.enfant_nom,
      evt.categorie,
      evt.intensite,
      evt.lieu || '',
      (evt.details || '').replace(/,/g, ';'),
      evt.animateur_nom || '',
      evt.consequence_action || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_${format(new Date(), 'yyyy-MM-dd', { locale: fr })}.csv`; // Added locale: fr
    link.click();
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Rapports</h1>
            <p className="text-gray-600">Analyses détaillées et export de données</p>
          </div>
          <div className="flex gap-3">
            <Select value={periode} onValueChange={setPeriode}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">90 derniers jours</SelectItem>
                <SelectItem value="365">1 an</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportCSV} className="bg-purple-600 hover:bg-purple-700">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Résumé rapide */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 mb-1">Total événements</p>
              <p className="text-2xl font-bold text-gray-900">{evenementsFiltres.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 mb-1">Enfants concernés</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(evenementsFiltres.map(e => e.enfant_id)).size}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 mb-1">Positifs</p>
              <p className="text-2xl font-bold text-green-600">
                {evenementsFiltres.filter(e => e.categorie === 'Positif').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 mb-1">Négatifs</p>
              <p className="text-2xl font-bold text-red-600">
                {evenementsFiltres.filter(e => e.categorie === 'Négatif').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Tendances par enfant */}
          <Card className="shadow-md">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="w-5 h-5 text-purple-600" /> {/* Changed from TrendingUp */}
                Top 10 Enfants (Activité)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tendancesParEnfant}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nom" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Positif" fill="#10b981" stackId="a" />
                  <Bar dataKey="Neutre" fill="#6b7280" stackId="a" />
                  <Bar dataKey="Négatif" fill="#ef4444" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Répartition globale */}
          <Card className="shadow-md">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-purple-600" /> {/* Changed from BarChart3 */}
                Répartition par Catégorie
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dataCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dataCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_PIE[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tableaux de données */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Types d'incidents */}
          <Card className="shadow-md">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-purple-600" />
                Actions/Conséquences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {dataTypesIncidents.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <Badge variant="secondary">{item.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Par lieu */}
          <Card className="shadow-md">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="w-5 h-5 text-purple-600" /> {/* Changed from MapPin */}
                Répartition par Lieu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {dataLieux.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <Badge variant="secondary">{item.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Par animateur */}
          <Card className="shadow-md lg:col-span-2">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-purple-600" /> {/* Changed from Users */}
                Événements par Animateur
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                {dataAnimateurs.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 truncate">{item.name}</span>
                    <Badge variant="secondary">{item.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
