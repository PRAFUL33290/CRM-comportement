
import { useRef, useState } from "react";
import { Trash2, Edit2 } from "lucide-react";
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";

function SwipeableMessage({ children, onDelete, onEdit, canEdit }) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = startX.current - currentX.current;
    
    // Limiter le swipe à gauche uniquement et max 100px
    if (diff > 0 && diff <= 100) {
      setTranslateX(-diff);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    // Si swipe > 50px, on garde ouvert à -80px, sinon on ferme
    if (Math.abs(translateX) > 50) {
      setTranslateX(-80);
    } else {
      setTranslateX(0);
    }
  };

  const handleDelete = () => {
    setTranslateX(0);
    onDelete();
  };

  const handleEdit = () => {
    setTranslateX(0);
    onEdit();
  };

  return (
    <div className="relative overflow-hidden">
      {/* Boutons d'action en arrière-plan */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-2">
        {canEdit && onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-full w-12 bg-purple-500 hover:bg-purple-600 text-white rounded-none"
            onClick={handleEdit}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-full w-12 bg-red-500 hover:bg-red-600 text-white rounded-none"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Contenu swipeable */}
      <div
        className="relative bg-gray-50 transition-transform"
        style={{
          transform: `translateX(${translateX}px)`,
          transitionDuration: isSwiping ? '0ms' : '300ms'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

SwipeableMessage.propTypes = {
  children: PropTypes.node.isRequired,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  canEdit: PropTypes.bool,
};

export default SwipeableMessage;
