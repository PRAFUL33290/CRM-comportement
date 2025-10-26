import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DialogAjoutEvenement from "../evenements/DialogAjoutEvenement";

export default function BoutonAjoutFlottant() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 md:h-20 md:w-20 rounded-full shadow-2xl bg-purple-600 hover:bg-purple-700 z-50 transition-transform hover:scale-110"
        size="icon"
        style={{
          boxShadow: '0 10px 40px rgba(147, 51, 234, 0.4), 0 0 0 4px rgba(147, 51, 234, 0.1)'
        }}
      >
        <Plus className="w-12 h-12 md:w-14 md:h-14" />
      </Button>
      
      <DialogAjoutEvenement open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}