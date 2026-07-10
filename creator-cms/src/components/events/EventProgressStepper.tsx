import { Check } from 'lucide-react';
import type { EventProgressStep } from '../../business/eventProgress';

interface Props {
  steps: EventProgressStep[];
  /** Accessible label for the whole stepper */
  label?: string;
}

export function EventProgressStepper({ steps, label = 'Your contest progress' }: Props) {
  return (
    <nav className="event-progress" aria-label={label}>
      <ol className="event-progress__list">
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={`event-progress__step event-progress__step--${step.state}`}
          >
            <span className="event-progress__marker" aria-hidden>
              {step.state === 'done' ? <Check size={14} /> : i + 1}
            </span>
            <span className="event-progress__label">{step.label}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}