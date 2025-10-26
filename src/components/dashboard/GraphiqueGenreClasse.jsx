import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users } from "lucide-react";
import PropTypes from 'prop-types';

function GraphiqueGenreClasse({ enfants, evenements }) {
  const evenementsNegatifs = evenements.filter(evt => evt.categorie === 'Négatif');

  const genresStats = { Garçon: 0, Fille: 0 };
  const classesStats = {};

  enfants.forEach(enfant => {
    if (enfant.sexe) {
      genresStats[enfant.sexe] = (genresStats[enfant.sexe] || 0) + 1;
    }
    if (enfant.groupe) {
      classesStats[enfant.groupe] = (classesStats[enfant.groupe] || 0) + 1;
    }
  });

  const dataGenresChart = Object.entries(genresStats).map(([genre, total]) => ({
    genre,
    total,
    evenements: evenementsNegatifs.filter(evt => {
      const enfant = enfants.find(e => e.id === evt.enfant_id);
      return enfant && enfant.sexe === genre;
    }).length
  }));

  const dataClassesChart = Object.entries(classesStats).map(([classe, total]) => ({
    classe,
    total,
    evenements: evenementsNegatifs.filter(evt => {
      const enfant = enfants.find(e => e.id === evt.enfant_id);
      return enfant && enfant.groupe === classe;
    }).length
  }));

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Répartition par genre et classe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">Par genre</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dataGenresChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="genre" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8b5cf6" name="Total enfants" />
                <Bar dataKey="evenements" fill="#ef4444" name="Événements négatifs" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">Par classe</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dataClassesChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="classe" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8b5cf6" name="Total enfants" />
                <Bar dataKey="evenements" fill="#ef4444" name="Événements négatifs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

GraphiqueGenreClasse.propTypes = {
  enfants: PropTypes.array.isRequired,
  evenements: PropTypes.array.isRequired,
};

export default GraphiqueGenreClasse;