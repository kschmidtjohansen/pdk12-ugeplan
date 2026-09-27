import React from 'react';
import { Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmployeeContactActionsProps {
  phone?: string | null;
  name?: string;
  size?: 'sm' | 'default';
  className?: string;
}

const normalizePhone = (phone: string) => phone.replace(/[\s-]/g, '');

/**
 * One-tap call and SMS buttons shown next to an employee's name.
 * Renders nothing when the employee has no phone number.
 */
const EmployeeContactActions: React.FC<EmployeeContactActionsProps> = ({
  phone,
  name,
  size = 'default',
  className = '',
}) => {
  if (!phone) return null;
  const tel = normalizePhone(phone);
  const label = name ? ` til ${name}` : '';
  const btnSize = size === 'sm' ? 'h-8 w-8 min-h-8 min-w-8' : 'h-11 w-11 min-h-11 min-w-11';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 ${className}`}
      onClick={e => e.stopPropagation()}
    >
      <Button variant="ghost" size="icon" className={btnSize} asChild>
        <a href={`tel:${tel}`} aria-label={`Ring${label}`} title={`Ring${label}`}>
          <Phone className={iconSize} />
        </a>
      </Button>
      <Button variant="ghost" size="icon" className={btnSize} asChild>
        <a href={`sms:${tel}`} aria-label={`Send besked${label}`} title={`Send besked${label}`}>
          <MessageSquare className={iconSize} />
        </a>
      </Button>
    </span>
  );
};

export default EmployeeContactActions;
