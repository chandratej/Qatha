import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackLinkProps {
  to: string;
  label?: string;
}

/** Consistent back navigation used across CMS pages. */
export function BackLink({ to, label = 'Back' }: BackLinkProps) {
  return (
    <Link to={to} className="cms-back-link" aria-label={label}>
      <ArrowLeft size={18} aria-hidden />
    </Link>
  );
}