import { useState, useEffect } from 'react';
import ProjectSwitcher from '../components/ProjectSwitcher';
import {
  members,
  getMemberById,
  formatShortDate,
  getDayName,
  generateActivities,
  getRounds,
  getEventDates,
  getActivityConfig,
} from './data/smg-members';
import './smg.css';

const PLAN_KEY = (type) => `smg_planner_plan_${type}`;
const MEMBERS_KEY = 'smg_planner_members';

const loadPlan = (type) => {
  const stored = localStorage.getItem(PLAN_KEY(type));
  return stored ? JSON.parse(stored) : {};
};

const loadMembers = () => {
  const stored = localStorage.getItem(MEMBERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

function SmgApp() {
  const [activityType, setActivityType] = useState('meet_receive');
  const [selectedMembers, setSelectedMembers] = useState(loadMembers);
  const [tempSelectedMembers, setTempSelectedMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [memberFilter, setMemberFilter] = useState('');
  const [activeTab, setActiveTab] = useState('schedule');
  const [planSelections, setPlanSelections] = useState(() => loadPlan('meet_receive'));

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketModalData, setTicketModalData] = useState(null);
  const [ticketCount, setTicketCount] = useState(1);

  useEffect(() => {
    setPlanSelections(loadPlan(activityType));
  }, [activityType]);

  useEffect(() => {
    localStorage.setItem(PLAN_KEY(activityType), JSON.stringify(planSelections));
  }, [planSelections, activityType]);

  useEffect(() => {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(selectedMembers));
  }, [selectedMembers]);

  const activityConfig = getActivityConfig(activityType);
  const rounds = getRounds(activityType);
  const eventDates = getEventDates(activityType);
  const activities = generateActivities(activityType);
  const price = activityConfig?.price || 0;

  const filteredActivities = selectedMembers.length === 0
    ? activities
    : activities.filter(a => selectedMembers.includes(a.memberId));

  const openTicketModal = (memberId, round, memberName, roundTime, date) => {
    const key = `${memberId}_${date}_${round}`;
    setTicketCount(planSelections[key] || 1);
    setTicketModalData({ memberId, round, memberName, roundTime, date });
    setShowTicketModal(true);
  };

  const closeTicketModal = () => {
    setShowTicketModal(false);
    setTicketModalData(null);
    setTicketCount(1);
  };

  const confirmTicketCount = () => {
    if (ticketModalData) {
      const key = `${ticketModalData.memberId}_${ticketModalData.date}_${ticketModalData.round}`;
      setPlanSelections(prev => ({ ...prev, [key]: ticketCount }));
    }
    closeTicketModal();
  };

  const handleOpenModal = () => {
    setTempSelectedMembers([...selectedMembers]);
    setMemberFilter('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTempSelectedMembers([...selectedMembers]);
    setMemberFilter('');
  };

  const handleToggleMember = (memberId) => {
    setTempSelectedMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const handleConfirmSelection = () => {
    setSelectedMembers([...tempSelectedMembers]);
    setShowModal(false);
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(memberFilter.toLowerCase())
  );

  const getSelectedMemberNames = () => {
    if (selectedMembers.length === 0) return 'ทุกคน';
    if (selectedMembers.length <= 2)
      return selectedMembers.map(id => members.find(m => m.id === id)?.name).join(', ');
    return `${selectedMembers.length} คน`;
  };

  return (
    <div className="app smg-app">
      <header className="header smg-header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon smg-logo-icon">S</div>
            <h1>Shock Me Girls - Locker Box Planner</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <ProjectSwitcher />
            <div className="member-selector">
              🔍
              <button className="filter-link" onClick={handleOpenModal}>
                Select by member
              </button>
              <span className="selected-info">{getSelectedMemberNames()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Member Selector Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Members</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-filter">
              <input
                type="text"
                className="member-filter-input"
                placeholder="Filter member name..."
                value={memberFilter}
                onChange={e => setMemberFilter(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="action-btn" onClick={() => setTempSelectedMembers(members.map(m => m.id))}>Select All</button>
              <button className="action-btn" onClick={() => setTempSelectedMembers([])}>Clear All</button>
            </div>
            <div className="member-list">
              {filteredMembers.map(member => (
                <label
                  key={member.id}
                  className={`member-checkbox ${tempSelectedMembers.includes(member.id) ? 'selected' : ''}`}
                  style={{ '--member-color': member.color }}
                >
                  <input
                    type="checkbox"
                    checked={tempSelectedMembers.includes(member.id)}
                    onChange={() => handleToggleMember(member.id)}
                  />
                  <span className="member-name">{member.name}</span>
                  <span className="member-gen">Gen {member.generation}</span>
                  <span className="checkmark">✓</span>
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <span className="selected-count">{tempSelectedMembers.length} members selected</span>
              <button className="confirm-btn" onClick={handleConfirmSelection}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Count Modal */}
      {showTicketModal && ticketModalData && (
        <div className="modal-overlay" onClick={closeTicketModal}>
          <div className="modal-content ticket-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>จำนวนบัตร {activityConfig?.label}</h2>
              <button className="close-btn" onClick={closeTicketModal}>×</button>
            </div>
            <div className="ticket-modal-body">
              <div className="ticket-info">
                <span
                  className="member-name"
                  style={{ color: members.find(m => m.id === ticketModalData.memberId)?.color }}
                >
                  {ticketModalData.memberName}
                </span>
                <span className="round-info">
                  Round {ticketModalData.round} ({ticketModalData.roundTime})
                </span>
                {price > 0 && (
                  <span className="price-info">฿{(ticketCount * price).toLocaleString()}</span>
                )}
              </div>
              <div className="ticket-counter">
                <button
                  className="counter-btn decrement"
                  onClick={() => ticketCount > 0 && setTicketCount(c => c - 1)}
                  disabled={ticketCount <= 0}
                >
                  −
                </button>
                <input
                  type="text"
                  className="ticket-input"
                  value={ticketCount}
                  onChange={e => {
                    const v = e.target.value;
                    if (!/^\d*$/.test(v)) return;
                    const n = parseInt(v, 10);
                    setTicketCount(isNaN(n) ? 0 : Math.min(n, 20));
                  }}
                  maxLength={2}
                />
                <button
                  className="counter-btn increment"
                  onClick={() => ticketCount < 20 && setTicketCount(c => c + 1)}
                  disabled={ticketCount >= 20}
                >
                  +
                </button>
              </div>
              <div className="ticket-range"><span>0 - 20 ใบ</span></div>
            </div>
            <div className="modal-footer">
              <button className="confirm-btn" onClick={confirmTicketCount}>OK</button>
            </div>
          </div>
        </div>
      )}

      <main className="main-content">
        {/* Activity Type Toggle */}
        <div className="activity-type-bar">
          <div className="activity-type-toggle">
            <button
              className={`activity-type-btn ${activityType === 'meet_receive' ? 'active' : ''}`}
              onClick={() => setActivityType('meet_receive')}
            >
              Meet &amp; Receive
            </button>
            <button
              className={`activity-type-btn ${activityType === '2shot' ? 'active' : ''}`}
              onClick={() => setActivityType('2shot')}
            >
              2-Shot
            </button>
          </div>
        </div>

        <nav className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'now' ? 'active' : ''}`}
            onClick={() => setActiveTab('now')}
          >
            🕐 Now
          </button>
          <button
            className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            📅 Schedule
          </button>
          <button
            className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            📊 Summary
          </button>
        </nav>

        {activeTab === 'schedule' ? (
          <SmgScheduleView
            activities={filteredActivities}
            planSelections={planSelections}
            rounds={rounds}
            eventDates={eventDates}
            activityType={activityType}
            onOpenTicketModal={openTicketModal}
          />
        ) : activeTab === 'summary' ? (
          <SmgSummaryView
            activities={filteredActivities}
            selectedMembers={selectedMembers}
            rounds={rounds}
            eventDates={eventDates}
            activityType={activityType}
            price={price}
            planKey={PLAN_KEY(activityType)}
          />
        ) : (
          <SmgNowView planSelections_mr={loadPlan('meet_receive')} planSelections_2shot={loadPlan('2shot')} />
        )}
      </main>

      <footer className="footer">
        <p>Made with <span className="heart">Sisaster Team</span> for Shock Me Girls fans</p>
      </footer>
    </div>
  );
}

function SmgScheduleView({ activities, planSelections, rounds, eventDates, onOpenTicketModal }) {
  if (eventDates.length === 0 || rounds.length === 0) {
    return (
      <div className="schedule-view">
        <div className="empty-state">
          <div className="icon">🚧</div>
          <h3>Coming Soon</h3>
          <p>ยังไม่มีข้อมูลตารางในส่วนนี้</p>
        </div>
      </div>
    );
  }

  const scheduleByDateAndRound = {};
  eventDates.forEach(date => {
    scheduleByDateAndRound[date] = {};
    rounds.forEach(r => {
      scheduleByDateAndRound[date][r.round] = [];
    });
  });
  activities.forEach(activity => {
    scheduleByDateAndRound[activity.date]?.[activity.round]?.push(activity);
  });

  if (activities.length === 0) {
    return (
      <div className="schedule-view">
        <div className="empty-state">
          <div className="icon">📅</div>
          <h3>No Activities</h3>
          <p>ไม่มีกิจกรรมของเมมเบอร์ที่เลือก</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-view">
      {eventDates.map(date => {
        const activeMembersOnDate = members.filter(member =>
          rounds.some(r => scheduleByDateAndRound[date][r.round]?.some(a => a.memberId === member.id))
        );
        const activeRoundsOnDate = rounds.filter(r =>
          scheduleByDateAndRound[date][r.round]?.length > 0
        );

        return (
          <div key={date} className="date-group date-pink">
            <div className="date-header">
              <span>{formatShortDate(date)}</span>
              <span className="day-name">{getDayName(date)}</span>
              <span className="smg-location-badge">Paradise Park</span>
            </div>

            {/* Desktop table */}
            <div className="schedule-table-container schedule-desktop">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th className="member-column">Member</th>
                    {rounds.map(r => (
                      <th key={r.round} className="round-column">
                        <div className="round-header">
                          <span className="round-number">Round {r.round}</span>
                          <span className="round-time">{r.time}</span>
                          <span className="round-close">Close {r.close}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => {
                    const hasActivities = rounds.some(r =>
                      scheduleByDateAndRound[date][r.round]?.some(a => a.memberId === member.id)
                    );
                    if (!hasActivities) return null;
                    return (
                      <tr key={member.id}>
                        <td className="member-cell">
                          <div className="member-name" style={{ color: member.color }}>{member.name}</div>
                        </td>
                        {rounds.map(r => {
                          const activity = scheduleByDateAndRound[date][r.round]?.find(a => a.memberId === member.id);
                          const key = `${member.id}_${date}_${r.round}`;
                          const count = planSelections[key];
                          const isSelected = count > 0;
                          return (
                            <td key={r.round} className="activity-cell">
                              {activity ? (
                                <div
                                  className={`activity-slot ${isSelected ? 'selected' : 'unselected'}`}
                                  style={{
                                    backgroundColor: isSelected ? `${member.color}30` : 'transparent',
                                    borderColor: member.color,
                                    '--member-color': member.color,
                                  }}
                                  onClick={() => onOpenTicketModal(member.id, r.round, member.name, r.time, date)}
                                >
                                  <span className="ticket-count">{count || 0}</span>
                                  <span className="lane-badge">{activity.lane}</span>
                                </div>
                              ) : (
                                <div className="empty-slot">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile table */}
            <div className="schedule-rounds-mobile">
              <div className="mobile-table-scroll">
                <table className="mobile-schedule-table">
                  <thead>
                    <tr>
                      <th className="mobile-round-col">Round</th>
                      {activeMembersOnDate.map(member => (
                        <th key={member.id} className="mobile-member-th" style={{ color: member.color }}>
                          {member.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeRoundsOnDate.map(r => (
                      <tr key={r.round}>
                        <td className="mobile-round-td">
                          <div className="mobile-round-num">Round {r.round}</div>
                          <div className="mobile-round-time-sm">{r.time.replace(' - ', '-')}</div>
                        </td>
                        {activeMembersOnDate.map(member => {
                          const activity = scheduleByDateAndRound[date][r.round]?.find(a => a.memberId === member.id);
                          const key = `${member.id}_${date}_${r.round}`;
                          const count = planSelections[key];
                          const selected = count > 0;
                          if (!activity) return <td key={member.id} className="mobile-cell"><span className="mobile-dash">-</span></td>;
                          return (
                            <td key={member.id} className="mobile-cell">
                              <div
                                className={`mobile-slot ${selected ? 'selected' : 'unselected'}`}
                                style={selected ? { borderColor: member.color, backgroundColor: `${member.color}25`, color: member.color } : {}}
                                onClick={() => onOpenTicketModal(member.id, r.round, member.name, r.time, date)}
                              >
                                {count || 0}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SmgSummaryView({ activities, selectedMembers, rounds, eventDates, price, planKey }) {
  const [planSelections, setPlanSelections] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem(planKey);
    setPlanSelections(stored ? JSON.parse(stored) : {});
  }, [planKey]);

  if (eventDates.length === 0) {
    return (
      <div className="summary-view">
        <div className="empty-state">
          <div className="icon">🚧</div>
          <h3>Coming Soon</h3>
          <p>ยังไม่มีข้อมูลในส่วนนี้</p>
        </div>
      </div>
    );
  }

  const summaryData = {};
  eventDates.forEach(date => {
    summaryData[date] = rounds.map(r => {
      const selected = [];
      Object.entries(planSelections).forEach(([key, count]) => {
        if (!count || count <= 0) return;
        const [memberId, keyDate, roundStr] = key.split('_');
        if (keyDate !== date || Number(roundStr) !== r.round) return;
        const hasActivity = activities.some(
          a => a.memberId === memberId && a.date === date && a.round === r.round
        );
        if (!hasActivity) return;
        if (selectedMembers.length > 0 && !selectedMembers.includes(memberId)) return;
        const member = getMemberById(memberId);
        if (member) selected.push({ memberId, memberName: member.name, memberColor: member.color, ticketCount: count, price: count * price });
      });
      return { round: r.round, time: r.time, members: selected };
    });
  });

  const grandTotal = Object.values(summaryData).flat().flatMap(r => r.members).reduce((s, m) => s + m.price, 0);

  return (
    <div className="summary-view">
      {Object.entries(summaryData).sort().map(([date, roundsData]) => {
        const dateTotal = roundsData.flatMap(r => r.members).reduce((s, m) => s + m.price, 0);
        return (
          <div key={date} className="summary-date-group date-pink">
            <div className="summary-date-header">
              <span>{formatShortDate(date)}</span>
              <span className="day-name">{getDayName(date)}</span>
              {dateTotal > 0 && <span className="date-total">฿{dateTotal.toLocaleString()}</span>}
            </div>
            <table className="summary-table">
              <thead>
                <tr>
                  <th className="round-col">Round</th>
                  <th>Member</th>
                  <th className="price-col">Price</th>
                </tr>
              </thead>
              <tbody>
                {roundsData.map((item, i) => {
                  const roundTotal = item.members.reduce((s, m) => s + m.price, 0);
                  return (
                    <tr key={i}>
                      <td>
                        <span className="round-badge">
                          Round {item.round}<br />
                          <span className="round-time-small">{item.time}</span>
                        </span>
                      </td>
                      <td>
                        {item.members.length > 0 ? (
                          <div className="member-list-inline">
                            {item.members.map((m, j) => (
                              <span key={j}>
                                <span style={{ color: m.memberColor }}>{m.memberName} × {m.ticketCount}</span>
                                {j < item.members.length - 1 && <span style={{ color: '#FFFFFF' }}> / </span>}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="no-member-text">No members selected</span>
                        )}
                      </td>
                      <td className="price-col">
                        {roundTotal > 0
                          ? <span className="round-price">฿{roundTotal.toLocaleString()}</span>
                          : <span className="no-member-text">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {grandTotal > 0 && (
        <div className="grand-total-box">
          <span className="grand-total-label">Grand Total</span>
          <span className="grand-total-amount">฿{grandTotal.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

function SmgNowView({ planSelections_mr, planSelections_2shot }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseRoundTime = (t) => {
    const [s, e] = t.split(' - ');
    const toMin = (x) => { const [h, m] = x.split(':').map(Number); return h * 60 + m; };
    return { start: toMin(s), end: toMin(e) };
  };

  const getRoundStatus = (round) => {
    const { start, end } = parseRoundTime(round.time);
    if (currentMinutes >= start && currentMinutes < end) return 'active';
    if (currentMinutes < start) return 'upcoming';
    return 'ended';
  };

  const allEventDates = [...new Set([
    ...getEventDates('meet_receive'),
    ...getEventDates('2shot'),
  ])].sort();

  const isEventDay = allEventDates.includes(todayStr);

  const activityTypes = [
    { key: 'meet_receive', label: 'Meet & Receive', planSelections: planSelections_mr },
    { key: '2shot', label: '2-Shot', planSelections: planSelections_2shot },
  ];

  const activeTypes = isEventDay
    ? activityTypes.map(({ key, label, planSelections }) => {
        const typeRounds = getRounds(key);
        const typeActivities = generateActivities(key).filter(a => a.date === todayStr);
        const activeRound = typeRounds.find(r => getRoundStatus(r) === 'active') || null;
        if (!activeRound) return null;
        const plannedActivities = typeActivities.filter(a => {
          if (a.round !== activeRound.round) return false;
          const k = `${a.memberId}_${todayStr}_${activeRound.round}`;
          return (planSelections[k] || 0) > 0;
        });
        return { key, label, activeRound, plannedActivities, planSelections, typeRounds };
      }).filter(Boolean)
    : [];

  return (
    <div className="now-view">
      <div className="now-clock-bar">
        <span className="now-clock-time">{timeStr}</span>
        <span className="now-clock-label">เวลาปัจจุบัน</span>
      </div>

      {!isEventDay ? (
        <div className="now-empty-state">
          <div className="now-empty-icon">📅</div>
          <p>วันนี้ไม่ใช่วันงาน</p>
        </div>
      ) : activeTypes.length === 0 ? (
        <div className="now-empty-state">
          <div className="now-empty-icon">⏳</div>
          <p>ยังไม่มี Round ที่กำลังดำเนินอยู่ตอนนี้</p>
        </div>
      ) : (
        <div className="now-date-section date-pink">
          <div className="now-date-header">
            <span className="now-date-text">{formatShortDate(todayStr)}</span>
            <span className="now-day-name">{getDayName(todayStr)}</span>
            <span className="now-badge today-badge">วันนี้</span>
          </div>
          {activeTypes.map(({ key, label, activeRound, plannedActivities, planSelections: ps }) => (
            <div key={key} className="now-activity-type-section">
              <div className="now-activity-type-label">{label}</div>
              <div className="now-rounds-list">
                <div className="now-round-block now-active">
                  <div className="now-round-header">
                    <span className="now-round-num">Round {activeRound.round}</span>
                    <span className="now-round-time">{activeRound.time}</span>
                    {activeRound.close && <span className="now-round-close">Close {activeRound.close}</span>}
                    <span className="now-status-badge live-badge">● LIVE</span>
                  </div>
                  {plannedActivities.length === 0 ? (
                    <p className="now-no-plan">ไม่มีแผนใน Round นี้</p>
                  ) : (
                    <div className="now-members-wrap">
                      {plannedActivities.map(activity => {
                        const member = members.find(m => m.id === activity.memberId);
                        if (!member) return null;
                        const k = `${activity.memberId}_${todayStr}_${activeRound.round}`;
                        const tickets = ps[k];
                        return (
                          <div key={activity.memberId} className="now-member-chip" style={{ borderColor: member.color }}>
                            <span className="now-member-name" style={{ color: member.color }}>{member.name}</span>
                            <span className="now-member-lane">{activity.lane}</span>
                            <span className="now-ticket-dot" style={{ background: member.color }}>×{tickets}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SmgApp;
