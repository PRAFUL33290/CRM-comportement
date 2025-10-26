
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import PropTypes from 'prop-types';

function GraphiqueTendance({ evenements }) {
  const derniers30Jours = [];
  for (let i = 29; i >= 0; i--) {
    const date = startOfDay(subDays(new Date(), i));
    derniers30Jours.push({
      date: format(date, 'yyyy-MM-dd'),
      label: format(date, 'd MMM', { locale: fr }),
      Positif: 0,
      Négatif: 0,
      total: 0
    });
  }

  evenements.forEach(evt => {
    const evtDate = format(startOfDay(new Date(evt.date)), 'yyyy-MM-dd');
    const day = derniers30Jours.find(d => d.date === evtDate);
    if (day) {
      // Assuming evt.categorie can be 'Positif' or 'Négatif'
      // This mutates the day object directly, which is acceptable for data aggregation before render.
      day[evt.categorie] += 1;
      day.total += 1;
    }
  });

  return (
    <Card className="shadow-md">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Tendance sur 30 jours
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={derniers30Jours}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="Positif"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Négatif"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

GraphiqueTendance.propTypes = {
  evenements: PropTypes.array.isRequired,
};

export default GraphiqueTendance;
