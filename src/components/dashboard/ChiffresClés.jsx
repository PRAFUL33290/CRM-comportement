import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import PropTypes from 'prop-types';
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

function ChiffresClés({ enfantsCount, evenementsCount, evenementsAujourdhui, enfantsASurveiller }) {
  const stats = [
    {
      title: "NOMBRES D'ENFANTS",
      value: enfantsCount,
      icon: Users,
      color: "bg-purple-500",
      link: "Enfants"
    },
    {
      title: evenementsCount > 1 ? "PROBLÈMES NON RÉSOLUS" : "PROBLÈME NON RÉSOLU",
      value: evenementsCount,
      icon: AlertTriangle,
      color: "bg-red-500",
      link: "Evenements"
    },
    {
      title: evenementsAujourdhui > 1 ? "Problèmes réglés" : "Problème réglé",
      value: evenementsAujourdhui,
      icon: CheckCircle,
      color: "bg-green-500",
      link: "ProblemesResolus"
    },
    {
      title: "À surveiller (30j)",
      value: enfantsASurveiller,
      icon: Calendar,
      color: "bg-orange-500",
      link: "Suivi"
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
      {stats.map((stat) => (
        <Link key={stat.title} to={createPageUrl(stat.link)}>
          <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer w-full">
            <div className={`absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 transform translate-x-8 -translate-y-8 ${stat.color} rounded-full opacity-10`} />
            <CardHeader className="p-3 md:p-4 pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{stat.title}</p>
                  <CardTitle className="text-2xl md:text-3xl font-bold mt-1 md:mt-2 text-gray-900">
                    {stat.value}
                  </CardTitle>
                </div>
                <div className={`p-1.5 md:p-2 rounded-lg ${stat.color} bg-opacity-20 flex-shrink-0`}>
                  <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

ChiffresClés.propTypes = {
  enfantsCount: PropTypes.number.isRequired,
  evenementsCount: PropTypes.number.isRequired,
  evenementsAujourdhui: PropTypes.number.isRequired,
  enfantsASurveiller: PropTypes.number.isRequired,
};

export default ChiffresClés;