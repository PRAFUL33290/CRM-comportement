import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function Reglages() {
  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Réglages</h1>
          <p className="text-gray-600">Personnalisez votre application</p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Settings className="w-5 h-5" />
              Paramètres généraux
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600">Les paramètres seront disponibles prochainement...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}