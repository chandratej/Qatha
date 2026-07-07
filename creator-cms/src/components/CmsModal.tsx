import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface CmsModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function CmsModal({ title, onClose, children, footer }: CmsModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="cms-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cms-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cms-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cms-modal__head">
          <h2 id="cms-modal-title" className="cms-modal__title">{title}</h2>
          <button type="button" className="cms-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>
        <div className="cms-modal__body">{children}</div>
        {footer && <footer className="cms-modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}