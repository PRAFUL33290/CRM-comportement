import MessagesList from "../components/mur/MessagesList";
import MessageForm from "../components/mur/MessageForm";

export default function Communication() {
  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Communication</h1>
          <p className="text-gray-600">Partagez des informations avec l&apos;équipe</p>
        </div>

        <div className="space-y-6">
          <MessageForm />
          <MessagesList />
        </div>
      </div>
    </div>
  );
}