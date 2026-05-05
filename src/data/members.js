// BNK48 Members Data
import config from './config.json';

export const members = config.members;

// 2shot Round Configuration (from config.json)
export const rounds = config.rounds.map(r => ({
  round: r.round,
  time: r.time,
  lane: r.lane
}));

export const getRoundTime = (roundNumber) => {
  const round = rounds.find(r => r.round === roundNumber);
  return round ? round.time : '';
};

// Event Dates Configuration (from config.json)
export const eventDates = config.eventDates;

// Member 2shot Schedule Config (from config.json)
export const memberScheduleConfig = {
  // June 13, 2026
  '2026-06-13': {
    default: config.memberSchedule.default,
    laneConfig: config.memberSchedule['2026-06-13'].laneConfig
  },
  // June 14, 2026
  '2026-06-14': {
    default: config.memberSchedule.default,
    laneConfig: config.memberSchedule['2026-06-14'].laneConfig
  }
};

// Get lane based on memberId, round, and date
export const getLane = (memberId, round, date) => {
  if (date && memberScheduleConfig[date]) {
    const laneConfig = memberScheduleConfig[date].laneConfig;
    const memberLanes = laneConfig[memberId];
    if (memberLanes && memberLanes[round]) {
      return memberLanes[round];
    }
  }
  return `LANE ${round}`;
};

// Generate activities from config
export const generateActivities = () => {
  const activities = [];
  let id = 1;
  
  eventDates.forEach(date => {
    const config = memberScheduleConfig[date];
    if (!config) return;
    
    members.forEach(member => {
      const memberRounds = config.laneConfig[member.id] 
        ? Object.keys(config.laneConfig[member.id]).map(Number).sort((a, b) => a - b)
        : config.default;
      memberRounds.forEach(round => {
        activities.push({
          id: `a${id++}`,
          memberId: member.id,
          date: date,
          round: round,
          time: rounds.find(r => r.round === round)?.time.split(' - ')[0] || '',
          location: getLane(member.id, round, date),
          type: '2shot',
          notes: '2shot ครบ 50 คน'
        });
      });
    });
  });
  
  return activities;
};

// Initial activities (generated from config)
export const initialActivities = generateActivities();

// Helper functions
export const getMemberById = (id) => members.find(m => m.id === id);

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('th-TH', options);
};

export const formatShortDate = (dateStr) => {
  const date = new Date(dateStr);
  const options = { month: 'short', day: 'numeric' };
  return date.toLocaleDateString('th-TH', options);
};

export const getDayName = (dateStr) => {
  const date = new Date(dateStr);
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  return days[date.getDay()];
};

export const getTimePeriod = (time) => {
  const hour = parseInt(time.split(':')[0]);
  if (hour < 12) return 'เช้า';
  if (hour < 17) return 'บ่าย';
  return 'เย็น';
};

export const groupActivitiesByDate = (activities) => {
  const grouped = {};
  activities.forEach(activity => {
    if (!grouped[activity.date]) {
      grouped[activity.date] = [];
    }
    grouped[activity.date].push(activity);
  });
  
  // Sort by date
  return Object.keys(grouped)
    .sort()
    .reduce((result, key) => {
      result[key] = grouped[key].sort((a, b) => a.time.localeCompare(b.time));
      return result;
    }, {});
};

export const groupActivitiesByTimePeriod = (activities) => {
  const grouped = { เช้า: [], บ่าย: [], เย็น: [] };
  activities.forEach(activity => {
    const period = getTimePeriod(activity.time);
    grouped[period].push(activity);
  });
  return grouped;
};