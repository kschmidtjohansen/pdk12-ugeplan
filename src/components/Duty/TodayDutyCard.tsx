import React, { useMemo } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Phone } from 'lucide-react';
import type { Duty } from '@/types/duty';
import type { Employee } from '@/types/employee';

interface TodayDutyCardProps {
  duties: Duty[];
  employees: Employee[];
  /** yyyy-MM-dd for today */
  todayStr: string;
}

const externalName = (notes?: string | null): string | null => {
  if (!notes?.startsWith('EKSTERN:')) return null;
  return notes.split('\n')[0].replace('EKSTERN: ', '').replace(/\s*\[.*?\]\s*/, '').trim();
};

/**
 * Compact overview of who is on duty today, with directly callable phone
 * numbers so nobody has to dig through the plan.
 */

const TodayDutyCard: React.FC<TodayDutyCardProps> = ({ duties, employees, todayStr }) => {
  const { t } = useTranslation();

  const phoneById = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => {
      if (e.phone) map.set(e.id, e.phone);
    });
    return map;
  }, [employees]);

  const deptById = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => {
      const name = (e as Employee & { department_name?: string | null }).department_name;
      if (name) map.set(e.id, name);
    });
    return map;
  }, [employees]);

  const todayDuties = useMemo(
    () => duties.filter((d) => d.duty_date === todayStr),
    [duties, todayStr]
  );

  const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

  return (
    <section aria-labelledby="today-duty-title" className="facet-duty-hero flex min-h-[11.5rem] flex-col gap-4 rounded-[24px] p-5 sm:p-6">
      <h2 id="today-duty-title" className="text-sm font-semibold">
        {t('duty.todayDuties')}
        {todayDuties.length > 0 && <> · {t('duty.onDutyCount').replace('{{count}}', String(todayDuties.length))}</>}
      </h2>
      {todayDuties.length === 0 ? (
        <p className="text-sm opacity-90">{t('duty.noDutyToday')}</p>
      ) : (
        <ul className="flex flex-wrap gap-2.5">
          {todayDuties.map((duty) => {
            const ext = externalName(duty.notes);
            const name = ext || duty.employee?.name || t('duty.unassignedSlot');
            const phone = duty.employee_id ? phoneById.get(duty.employee_id) : undefined;
            const dept = duty.employee_id ? deptById.get(duty.employee_id) : undefined;
            return (
              <li key={duty.id} className="facet-duty-chip flex min-w-[11rem] items-center gap-2.5 rounded-[14px] py-2 pl-2.5 pr-2">
                <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/85 text-xs font-bold text-primary-foreground">{initials(name)}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">{name}</span>
                  <span className="truncate text-xs opacity-85">
                    {t(`duty.${duty.duty_type === 'kørevagt' ? 'kørevagt' : 'skadelederVagt'}`)}{dept && ` · ${dept}`}
                  </span>
                </span>
                {phone ? (
                  <a href={`tel:${phone.replace(/\s/g, '')}`} aria-label={`${t('duty.call')} ${name}`} title={phone}
                    className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary-foreground shadow-flade transition-transform duration-140 ease-facet hover:-translate-y-px">
                    <Phone className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="sr-only">{t('duty.noPhone')}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default React.memo(TodayDutyCard);
