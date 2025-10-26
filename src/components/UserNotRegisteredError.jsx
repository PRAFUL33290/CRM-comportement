import { AlertCircle } from "lucide-react";

export default function UserNotRegisteredError() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Accès non autorisé
        </h1>
        <p className="text-gray-600 mb-6">
          Vous devez être enregistré pour accéder à cette application.
          Veuillez contacter un administrateur.
        </p>
      </div>
    </div>
  );
}