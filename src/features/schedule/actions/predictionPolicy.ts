const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PredictionSchedule {
  status: string | null;
  departments: string[] | null;
  date?: string | null;
  end_date?: string | null;
  end_time?: string | null;
}

interface PredictionDepartment {
  department_id: string;
  name: string;
}

export function hasValidPredictionIds(scheduleId: string, departmentId: string): boolean {
  return UUID_PATTERN.test(scheduleId) && UUID_PATTERN.test(departmentId);
}

export function canVoteForDepartment(
  schedule: PredictionSchedule,
  department: PredictionDepartment,
  now = new Date()
): boolean {
  if (schedule.status === "finished") return false;

  if (schedule.date && schedule.end_time) {
    const endDate = schedule.end_date || schedule.date;
    const endTime = schedule.end_time.length === 5 ? `${schedule.end_time}:00` : schedule.end_time;
    const endTimestamp = Date.parse(`${endDate}T${endTime}+08:00`);

    if (!Number.isNaN(endTimestamp) && now.getTime() > endTimestamp) return false;
  }

  const participants = schedule.departments || [];
  return participants.includes(department.department_id) || participants.includes(department.name);
}
