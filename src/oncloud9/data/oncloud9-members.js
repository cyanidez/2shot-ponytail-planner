import config from './oncloud9-config.json';

export const members = config.members;
export const activities = config.activities;
export const fanmeet = config.fanmeet;
export const eventDates = config.eventDates;
export const timeSlots = config.timeSlots;
export const ticketPrice = config.ticketPrice;
export const cdnBase = config.cdnBase;

export const getMemberById = (id) => members.find(m => m.id === id);

export const getMemberImageUrl = (memberName) =>
  `/images/oncloud9/${memberName.toLowerCase()}.webp`;

export const formatShortDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const getDayName = (dateStr) => {
  const d = new Date(dateStr);
  return ['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()];
};

export const getActivityById = (id) => activities.find(a => a.id === id);

// Group members by group and generation for filters
export const getMemberGroups = () => {
  const groups = {};
  members.forEach(m => {
    const key = `${m.group}`;
    if (!groups[key]) groups[key] = {};
    if (!groups[key][m.generation]) groups[key][m.generation] = [];
    groups[key][m.generation].push(m);
  });
  return groups;
};

// Generate rotating schedule: activity members rotate across stations per time slot
// Distribution: members are assigned to activities round-robin, then rotate stations
const generateSchedule = () => {
  const activityIds = activities.map(a => a.id);
  const memberIds = members.map(m => m.id);

  // Distribute members round-robin across activities
  const activityMembers = {};
  activityIds.forEach(id => { activityMembers[id] = []; });
  memberIds.forEach((id, idx) => {
    activityMembers[activityIds[idx % activityIds.length]].push(id);
  });

  const schedule = {};

  eventDates.forEach(date => {
    schedule[date] = {};
    const slots = timeSlots[date] || [];

    activityIds.forEach(actId => {
      schedule[date][actId] = {};
      const pool = activityMembers[actId];
      const n = pool.length;

      slots.forEach((slot, slotIdx) => {
        schedule[date][actId][slot] = [
          pool[slotIdx % n],
          pool[(slotIdx + 1) % n],
          pool[(slotIdx + 2) % n]
        ];
      });
    });
  });

  return schedule;
};

export const schedule = generateSchedule();

// Get all time slots where a specific member appears across all activities on a date
export const getMemberSlots = (memberId, date) => {
  const result = [];
  const daySchedule = schedule[date] || {};
  Object.entries(daySchedule).forEach(([actId, slots]) => {
    Object.entries(slots).forEach(([slot, stationMembers]) => {
      const stationIdx = stationMembers.indexOf(memberId);
      if (stationIdx !== -1) {
        result.push({ activityId: actId, slot, station: stationIdx + 1 });
      }
    });
  });
  return result;
};

// Compute activity cost for a plan selection count
export const getActivityCost = (activityId, count) => {
  const act = getActivityById(activityId);
  if (!act) return 0;
  if (act.id === 'hachi_cha') return count * (act.hachiChaPrice || 145);
  return count * act.ticketsRequired * ticketPrice;
};

// Fanmeet helpers
export const getFanmeetByDate = (date) => fanmeet.filter(f => f.date === date);

// Parse time slot string to minutes from midnight
export const slotToMinutes = (slotStr) => {
  const [h, m] = slotStr.split(':').map(Number);
  return h * 60 + m;
};

// Format slot as "HH:MM - HH:MM" (each slot = 60 min)
export const formatSlotRange = (slotStr) => {
  const [h, m] = slotStr.split(':').map(Number);
  const endH = Math.floor((h * 60 + m + 60) / 60);
  const endM = (m + 60) % 60;
  const pad = n => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)} - ${pad(endH)}:${pad(endM)}`;
};

// Check if a time slot is currently active (slot lasts 60 min)
export const isSlotActive = (slotStr, nowMinutes) => {
  const start = slotToMinutes(slotStr);
  return nowMinutes >= start && nowMinutes < start + 60;
};
