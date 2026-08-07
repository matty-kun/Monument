import { useMemo, useState } from "react";

export function usePublicTeamsViewModel({ results, schedules, allCategories }: { results: any[], schedules: any[], allCategories: any[] }) {
  const [filter, setFilter] = useState<'all' | 'gold' | 'silver' | 'bronze' | 'upcoming'>('all');

  const getDynamicStatus = (schedule: any): 'upcoming' | 'ongoing' | 'finished' => {
    const now = new Date();

    if (!schedule.date) return 'upcoming';

    if (!schedule.start_time) {
      const day = new Date(`${schedule.date}T00:00:00`);
      return isNaN(day.getTime()) || now < day ? 'upcoming' : 'finished';
    }

    const start = new Date(`${schedule.date}T${schedule.start_time}`);
    if (isNaN(start.getTime())) return 'upcoming';
    if (now < start) return 'upcoming';

    const end = schedule.end_time
      ? new Date(`${schedule.date}T${schedule.end_time}`)
      : new Date(start.getTime() + 2 * 60 * 60 * 1000);

    if (now >= start && now <= end) return 'ongoing';
    return 'finished';
  };

  const displayItems = useMemo(() => {
    const items: any[] = [];
    
    if (filter === 'all' || filter === 'upcoming') {
      const activeSchedules = schedules
        .filter(s => {
          const status = getDynamicStatus(s);
          return status !== 'finished';
        })
        .map(s => ({
          ...s,
          itemType: 'schedule',
          computedStatus: getDynamicStatus(s)
        }));
      items.push(...activeSchedules);
    }

    if (filter !== 'upcoming') {
      const filteredResults = results
        .filter((r) => filter === 'all' || r.medal_type === filter)
        .map(r => ({ ...r, itemType: 'result' }));
        
      filteredResults.sort((a, b) => {
        const val = { gold: 3, silver: 2, bronze: 1 };
        return val[b.medal_type as keyof typeof val] - val[a.medal_type as keyof typeof val];
      });
      
      items.push(...filteredResults);
    }

    return items;
  }, [results, schedules, filter]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(w => !['of', 'and', 'the'].includes(w.toLowerCase()))
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return allCategories?.find(c => c.id === categoryId)?.name || categoryId;
  };

  return {
    filter,
    setFilter,
    displayItems,
    getInitials,
    getCategoryName
  };
}
