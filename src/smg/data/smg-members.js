import config from './smg-config.json';

export const members = config.members;
export const eventName = config.eventName;
export const eventDate = config.eventDate;
export const location = config.location;
export const imageBasePath = config.imageBasePath;

export const getActivityConfig = (activityType) =>
  config.activityTypes[activityType] || null;

export const getRounds = (activityType) =>
  config.activityTypes[activityType]?.rounds || [];

export const getEventDates = (activityType) =>
  Object.keys(config.activityTypes[activityType]?.schedule || {}).sort();

export const getLane = (memberId, round, date, activityType) => {
  const schedule = config.activityTypes[activityType]?.schedule;
  return schedule?.[date]?.laneConfig?.[memberId]?.[String(round)] || '';
};

export const generateActivities = (activityType) => {
  const actConfig = config.activityTypes[activityType];
  if (!actConfig) return [];

  const activities = [];
  let id = 1;

  Object.entries(actConfig.schedule).forEach(([date, dateConfig]) => {
    members.forEach(member => {
      const memberRounds = dateConfig.laneConfig[member.id];
      if (!memberRounds) return;
      Object.keys(memberRounds)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach(round => {
          const roundData = actConfig.rounds.find(r => r.round === round);
          activities.push({
            id: `a${id++}`,
            memberId: member.id,
            date,
            round,
            time: roundData?.time.split(' - ')[0] || '',
            lane: memberRounds[String(round)],
            type: activityType,
          });
        });
    });
  });

  return activities;
};

export const getMemberById = (id) => members.find(m => m.id === id);

export const formatShortDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const getDayName = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};
