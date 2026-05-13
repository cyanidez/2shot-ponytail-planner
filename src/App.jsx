import { useState, useEffect } from 'react';
import ProjectSwitcher from './components/ProjectSwitcher';
import {
  members,
  initialActivities,
  getMemberById,
  formatDate,
  formatShortDate,
  getDayName,
  groupActivitiesByDate,
  groupActivitiesByTimePeriod,
  getRoundTime,
  getLane,
  rounds,
  eventDates,
  getSlotImageData
} from './data/members';

// LocalStorage keys
const PLAN_KEY = 'bnk48_planner_plan';
const MEMBERS_KEY = 'bnk48_planner_members';

// Initialize selected members from localStorage
const initializeSelectedMembers = () => {
  const stored = localStorage.getItem(MEMBERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Initialize plan selections from localStorage
const initializePlanSelections = () => {
  const stored = localStorage.getItem(PLAN_KEY);
  return stored ? JSON.parse(stored) : {};
};

function App() {
  const [selectedMembers, setSelectedMembers] = useState(initializeSelectedMembers);
  const [tempSelectedMembers, setTempSelectedMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [memberFilter, setMemberFilter] = useState('');
  const [activeTab, setActiveTab] = useState('schedule');
  const [activities, setActivities] = useState(initialActivities);
  const [planSelections, setPlanSelections] = useState(initializePlanSelections);
  
  // Ticket count modal state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketModalData, setTicketModalData] = useState(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [ticketImageError, setTicketImageError] = useState(false);

  // Save plan selections to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(planSelections).length > 0) {
      localStorage.setItem(PLAN_KEY, JSON.stringify(planSelections));
    }
  }, [planSelections]);

  // Save selected members to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(selectedMembers));
  }, [selectedMembers]);

  // Filter activities based on selected members
  const filteredActivities = selectedMembers.length === 0
    ? activities
    : activities.filter(a => selectedMembers.includes(a.memberId));

  // Group activities by date for schedule view
  const activitiesByDate = groupActivitiesByDate(filteredActivities);

  // Group activities by time period for summary view
  const activitiesByPeriod = groupActivitiesByTimePeriod(filteredActivities);

  // Open ticket count modal
  const openTicketModal = (memberId, round, memberName, roundTime, date) => {
    const key = `${memberId}_${date}_${round}`;
    const currentCount = planSelections[key] || 1;
    const slotImageData = getSlotImageData(memberId, memberName, date, round);
    setTicketModalData({ memberId, round, memberName, roundTime, date, slotImageData });
    setTicketCount(currentCount);
    setTicketImageError(false);
    setShowTicketModal(true);
  };

  // Close ticket modal without saving
  const closeTicketModal = () => {
    setShowTicketModal(false);
    setTicketModalData(null);
    setTicketCount(1);
    setTicketImageError(false);
  };

  // Confirm ticket count
  const confirmTicketCount = () => {
    if (ticketModalData) {
      const key = `${ticketModalData.memberId}_${ticketModalData.date}_${ticketModalData.round}`;
      setPlanSelections(prev => ({
        ...prev,
        [key]: ticketCount
      }));
    }
    closeTicketModal();
  };

  // Handle decrement
  const handleDecrement = () => {
    if (ticketCount > 0) {
      setTicketCount(ticketCount - 1);
    }
  };

  // Handle increment
  const handleIncrement = () => {
    if (ticketCount < 20) {
      setTicketCount(ticketCount + 1);
    }
  };

  // Handle input change - only allow 0-20
  const handleTicketInputChange = (e) => {
    const value = e.target.value;
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      setTicketCount(0);
    } else if (num > 20) {
      setTicketCount(20);
    } else {
      setTicketCount(num);
    }
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
    setTempSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleConfirmSelection = () => {
    setSelectedMembers([...tempSelectedMembers]);
    setShowModal(false);
  };

  const handleSelectAll = () => {
    setTempSelectedMembers(members.map(m => m.id));
  };

  const handleClearAll = () => {
    setTempSelectedMembers([]);
  };

  // Filter members based on search text
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(memberFilter.toLowerCase()) ||
    (memberFilter.toLowerCase().includes('gen') && member.generation.toString().includes(memberFilter.replace(/[^0-9]/g, '')))
  );

  // Get selected member names for display
  const getSelectedMemberNames = () => {
    if (selectedMembers.length === 0) return 'ทุกคน';
    if (selectedMembers.length <= 2) {
      return selectedMembers.map(id => members.find(m => m.id === id)?.name).join(', ');
    }
    return `${selectedMembers.length} คน`;
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">B</div>
            <h1>BNK48 2-Shot Ponytail Planner made by L BNK48 Fandom</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <ProjectSwitcher />
            <div className="member-selector">
              🔍<button className="filter-link" onClick={handleOpenModal}>
                  Select by member
                </button>
              <span className="selected-info">
                {getSelectedMemberNames()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Modal */}
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
                onChange={(e) => setMemberFilter(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="action-btn" onClick={handleSelectAll}>Select All</button>
              <button className="action-btn" onClick={handleClearAll}>Clear All</button>
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
              <span className="selected-count">
                {tempSelectedMembers.length} members selected
              </span>
              <button className="confirm-btn" onClick={handleConfirmSelection}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Count Modal */}
      {showTicketModal && ticketModalData && (
        <div className="modal-overlay" onClick={closeTicketModal}>
          <div className="modal-content ticket-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>จำนวนบัตร 2shot</h2>
              <button className="close-btn" onClick={closeTicketModal}>×</button>
            </div>
            <div className="ticket-modal-body">
              {ticketModalData.slotImageData && (
                ticketImageError ? (
                  <div className="slot-desc-container">
                    <p className="slot-desc">
                      {ticketModalData.slotImageData.desc || 'เมมเบอร์ยังไม่แจ้งชุด'}
                    </p>
                  </div>
                ) : (
                  <div className="slot-image-container">
                    <img
                      src={ticketModalData.slotImageData.imageUrl}
                      alt={ticketModalData.memberName}
                      className="slot-image"
                      onError={() => setTicketImageError(true)}
                    />
                  </div>
                )
              )}
              <div className="ticket-info">
                <span className="member-name" style={{ color: members.find(m => m.id === ticketModalData.memberId)?.color }}>
                  {ticketModalData.memberName}
                </span>
                <span className="round-info">Round {ticketModalData.round} ({ticketModalData.roundTime})</span>
              </div>
              <div className="ticket-counter">
                <button 
                  className="counter-btn decrement" 
                  onClick={handleDecrement}
                  disabled={ticketCount <= 0}
                >
                  −
                </button>
                <input
                  type="text"
                  className="ticket-input"
                  value={ticketCount}
                  onChange={handleTicketInputChange}
                  maxLength={2}
                />
                <button 
                  className="counter-btn increment" 
                  onClick={handleIncrement}
                  disabled={ticketCount >= 20}
                >
                  +
                </button>
              </div>
              <div className="ticket-range">
                <span>0 - 20 ใบ</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="confirm-btn" onClick={confirmTicketCount}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="main-content">
        <nav className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            📅  Schedule
          </button>
          <button
            className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            📊 Summary
          </button>
        </nav>

        {activeTab === 'schedule' ? (
          <ScheduleView activities={filteredActivities} planSelections={planSelections} onOpenTicketModal={openTicketModal} />
        ) : (
          <SummaryView activities={filteredActivities} selectedMembers={selectedMembers} />
        )}
      </main>

      <footer className="footer">
        <p>
          Made with <span className="heart">Sisaster Team</span> for BNK48 fans
        </p>
      </footer>
    </div>
  );
}

// Schedule View Component - Table format with dates as sections and rounds as columns
function ScheduleView({ activities, planSelections, onOpenTicketModal }) {
  // Group activities by date and round
  const scheduleByDateAndRound = {};
  
  eventDates.forEach(date => {
    scheduleByDateAndRound[date] = {};
    rounds.forEach(round => {
      scheduleByDateAndRound[date][round.round] = [];
    });
  });
  
  activities.forEach(activity => {
    if (scheduleByDateAndRound[activity.date] && scheduleByDateAndRound[activity.date][activity.round]) {
      scheduleByDateAndRound[activity.date][activity.round].push(activity);
    }
  });

  if (activities.length === 0) {
    return (
      <div className="schedule-view">
        <div className="empty-state">
          <div className="icon">📅</div>
          <h3>No Activities</h3>
          <p>There are no 2-shot activities in the selected time range</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-view">
      {eventDates.map(date => {
        const dateClass = date === eventDates[0] ? 'date-purple' : 'date-red';
        const activeMembersOnDate = members.filter(member =>
          rounds.some(round => scheduleByDateAndRound[date][round.round]?.some(a => a.memberId === member.id))
        );
        const activeRoundsOnDate = rounds.filter(round =>
          scheduleByDateAndRound[date][round.round]?.length > 0
        );
        return (
        <div key={date} className={`date-group ${dateClass}`}>
          <div className="date-header">
            <span>{formatShortDate(date)}</span>
            <span className="day-name">{getDayName(date)}</span>
          </div>
          <div className="schedule-table-container schedule-desktop">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th className="member-column">Member</th>
                  {rounds.map(round => (
                    <th key={round.round} className="round-column">
                      <div className="round-header">
                        <span className="round-number">Round {round.round}</span>
                        <span className="round-time">{round.time}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(member => {
                  // Check if this member has activities on this date
                  const memberHasActivities = rounds.some(round =>
                    scheduleByDateAndRound[date][round.round]?.some(a => a.memberId === member.id)
                  );

                  if (!memberHasActivities) return null;

                  return (
                    <tr key={member.id}>
                      <td className="member-cell">
                        <div className="member-name" style={{ color: member.color }}>
                          {member.name}
                        </div>
                      </td>
                      {rounds.map(round => {
                        const activity = scheduleByDateAndRound[date][round.round]?.find(a => a.memberId === member.id);
                        const key = `${member.id}_${date}_${round.round}`;
                        const ticketCount = planSelections[key];
                        const isSelected = ticketCount > 0;

                        return (
                          <td key={round.round} className="activity-cell">
                            {activity ? (
                              <div
                                className={`activity-slot ${isSelected ? 'selected' : 'unselected'}`}
                                style={{
                                  backgroundColor: isSelected ? `${member.color}30` : 'transparent',
                                  borderColor: member.color,
                                  '--member-color': member.color
                                }}
                                onClick={() => onOpenTicketModal(member.id, round.round, member.name, round.time, date)}
                              >
                                <span className="ticket-count">{ticketCount || 0}</span>
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
                  {activeRoundsOnDate.map(round => (
                    <tr key={round.round}>
                      <td className="mobile-round-td">
                        <div className="mobile-round-num">Round {round.round}</div>
                        <div className="mobile-round-time-sm">{round.time.replace(' - ', '-')}</div>
                      </td>
                      {activeMembersOnDate.map(member => {
                        const activity = scheduleByDateAndRound[date][round.round]?.find(a => a.memberId === member.id);
                        const key = `${member.id}_${date}_${round.round}`;
                        const count = planSelections[key];
                        const selected = count > 0;
                        if (!activity) {
                          return (
                            <td key={member.id} className="mobile-cell">
                              <span className="mobile-dash">-</span>
                            </td>
                          );
                        }
                        return (
                          <td key={member.id} className="mobile-cell">
                            <div
                              className={`mobile-slot ${selected ? 'selected' : 'unselected'}`}
                              style={selected ? { borderColor: member.color, backgroundColor: `${member.color}25`, color: member.color } : {}}
                              onClick={() => onOpenTicketModal(member.id, round.round, member.name, round.time, date)}
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

// Summary View Component
function SummaryView({ activities, selectedMembers }) {
  // Get plan selections from localStorage
  const [planSelections, setPlanSelections] = useState({});
  
  useEffect(() => {
    const storedPlan = localStorage.getItem(PLAN_KEY);
    if (storedPlan) {
      setPlanSelections(JSON.parse(storedPlan));
    }
  }, []);

  // Build summary data: group by date
  const getSummaryData = () => {
    const byDate = {};
    
    eventDates.forEach(date => {
      byDate[date] = [];
      
      rounds.forEach(round => {
        // Find all members selected for this round on this date
        const selectedInRound = [];
        
        Object.entries(planSelections).forEach(([key, ticketCount]) => {
          if (!ticketCount || ticketCount <= 0) return;
          
          const parts = key.split('_');
          const memberId = parts[0];
          const keyDate = parts[1];
          const roundStr = parts[2];
          const roundNum = parseInt(roundStr, 10);
          
          // Check if this key matches the current date and round
          if (keyDate !== date || roundNum !== round.round) return;
          
          // Check if this member has activity on this date
          const hasActivity = activities.some(a => 
            a.memberId === memberId && a.date === date && a.round === roundNum
          );
          
          if (!hasActivity) return;
          
          // Filter by selected members (if any selected)
          if (selectedMembers.length > 0 && !selectedMembers.includes(memberId)) {
            return;
          }
          
          const member = getMemberById(memberId);
          if (member) {
            selectedInRound.push({
              memberId,
              memberName: member.name,
              memberColor: member.color,
              ticketCount: ticketCount,
              price: ticketCount * 1000
            });
          }
        });
        
        byDate[date].push({
          round: round.round,
          time: round.time,
          members: selectedInRound
        });
      });
    });
    
    return byDate;
  };

  const summaryData = getSummaryData();

  const grandTotal = Object.values(summaryData)
    .flat()
    .flatMap(r => r.members)
    .reduce((sum, m) => sum + m.price, 0);

  return (
    <div className="summary-view">
      {Object.entries(summaryData).sort().map(([date, roundsData]) => {
        const isFirstDate = date === eventDates[0];
        const bgClass = isFirstDate ? 'date-purple' : 'date-red';
        const dateTotal = roundsData.flatMap(r => r.members).reduce((sum, m) => sum + m.price, 0);

        return (
          <div key={date} className={`summary-date-group ${bgClass}`}>
            <div className="summary-date-header">
              <span>{formatShortDate(date)}</span>
              <span className="day-name">{getDayName(date)}</span>
              {dateTotal > 0 && (
                <span className="date-total">฿{dateTotal.toLocaleString()}</span>
              )}
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
                {roundsData.map((item, index) => {
                  const roundTotal = item.members.reduce((sum, m) => sum + m.price, 0);
                  return (
                    <tr key={index}>
                      <td>
                        <span className="round-badge">
                          Round {item.round}<br />
                          <span className="round-time-small">{item.time}</span>
                        </span>
                      </td>
                      <td>
                        {item.members.length > 0 ? (
                          <div className="member-list-inline">
                            {item.members.map((m, i) => (
                              <span key={i}>
                                <span style={{ color: m.memberColor }}>
                                  {m.memberName} × {m.ticketCount}
                                </span>
                                {i < item.members.length - 1 && (
                                  <span style={{ color: '#FFFFFF' }}> / </span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="no-member-text">No members selected for 2-shot</span>
                        )}
                      </td>
                      <td className="price-col">
                        {roundTotal > 0 ? (
                          <span className="round-price">฿{roundTotal.toLocaleString()}</span>
                        ) : (
                          <span className="no-member-text">-</span>
                        )}
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

export default App;