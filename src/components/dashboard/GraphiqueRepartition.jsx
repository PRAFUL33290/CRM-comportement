import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import PropTypes from 'prop-types';

const COLORS_REPARTITION = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

function GraphiqueRepartition({ evenements }) {
  const dataPositifs = Object.entries(
    evenements
      .filter(e => e.categorie === 'Positif')
      .reduce((acc, evt) => {
        (evt.types_comportement || []).forEach(type => {
          acc[type] = (acc[type] || 0) + 1;
        });
        return acc;
      }, {})
  ).map(([name, value]) => ({ name, value }));

  const dataNegatifs = Object.entries(
    evenements
      .filter(e => e.categorie === 'Négatif')
      .reduce((acc, evt) => {
        (evt.types_comportement || []).forEach(type => {
          acc[type] = (acc[type] || 0) + 1;
        });
        return acc;
      }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Répartition des comportements</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-semibold text-green-700 mb-4">Comportements Positifs</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dataPositifs}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataPositifs.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS_REPARTITION[idx % COLORS_REPARTITION.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col items-center">
            <h3 className="text-sm font-semibold text-red-700 mb-4">Comportements Négatifs</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dataNegatifs}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataNegatifs.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS_REPARTITION[idx % COLORS_REPARTITION.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

GraphiqueRepartition.propTypes = {
  evenements: PropTypes.array.isRequired,
};

export default GraphiqueRepartition;