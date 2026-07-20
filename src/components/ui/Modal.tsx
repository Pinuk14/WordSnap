import React, { useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-lg bg-card border-4 border-black rounded-brutal shadow-[12px_12px_0_#000] flex flex-col max-h-[90vh] animate-[slideIn_0.2s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-primary text-foreground">
          <h2 id="modal-title" className="font-display text-lg drop-shadow-[2px_2px_0_#000]">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-black/20 rounded transition-colors focus:outline-none focus:ring-4 focus:ring-white"
            aria-label="Close modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-black font-sans text-lg">
          {children}
        </div>
        {footer && (
          <div className="p-4 border-t-4 border-black bg-[#E5E0D8]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
