import { useState, useEffect, useRef } from 'react';
import ProjectSwitcher, { OC9_PROJECT } from '../components/ProjectSwitcher';
import {
  members, activities, fanmeet, eventDates, timeSlots, ticketPrice,
  getMemberById, getMemberImageUrl, getActivityById, getMemberGroups,
  schedule, getFanmeetByDate, formatShortDate, getDayName,
  getActivityCost, isSlotActive, slotToMinutes, formatSlotRange,
  eventName, eventSubtitle,
} from './data/oncloud9-members';
import './oncloud9.css';

const PLAN_KEY = 'oncloud9_plan';
const FILTER_KEY = 'oncloud9_filter_members';
const loadPlan = () => {
  try { return JSON.parse(localStorage.getItem(PLAN_KEY) || '{}'); } catch { return {}; }
};

// plan key: activityId|date|slot|station (1-3)
const planKey = (actId, date, slot, station) => `${actId}|${date}|${slot}|${station}`;

function OnCloud9App() {
  const [activeTab, setActiveTab] = useState('planner');
  const [planSelections, setPlanSelections] = useState(loadPlan);
  const [filterMemberIds, setFilterMemberIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FILTER_KEY) || '[]'); } catch { return []; }
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [modalData, setModalData] = useState(null);  // { actId, date, slot, station, memberId }
  const [fanmeetPlan, setFanmeetPlan] = useState(() => {
    try { return JSON.parse(localStorage.getItem('oncloud9_fanmeet') || '{}'); } catch { return {}; }
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    document.title = `${eventName} | ${eventSubtitle}`;
    return () => { document.title = 'BNK48 2-Shot Ponytail Planner'; };
  }, []);

  useEffect(() => {
    localStorage.setItem(PLAN_KEY, JSON.stringify(planSelections));
  }, [planSelections]);

  useEffect(() => {
    localStorage.setItem('oncloud9_fanmeet', JSON.stringify(fanmeetPlan));
  }, [fanmeetPlan]);

  useEffect(() => {
    localStorage.setItem(FILTER_KEY, JSON.stringify(filterMemberIds));
  }, [filterMemberIds]);

  const togglePlan = (actId, date, slot, station) => {
    const k = planKey(actId, date, slot, station);
    setPlanSelections(prev => {
      const next = { ...prev };
      if (next[k]) delete next[k];
      else next[k] = 1;
      return next;
    });
  };

  const openModal = (actId, date, slot, station, memberId) => {
    setModalData({ actId, date, slot, station, memberId });
    setShowMemberModal(true);
  };

  const closeModal = () => {
    setShowMemberModal(false);
    setModalData(null);
  };

  const confirmModal = (count) => {
    if (!modalData) return;
    const k = planKey(modalData.actId, modalData.date, modalData.slot, modalData.station);
    if (count <= 0) {
      setPlanSelections(prev => { const n = { ...prev }; delete n[k]; return n; });
    } else {
      setPlanSelections(prev => ({ ...prev, [k]: count }));
    }
    closeModal();
  };

  const clearAll = () => {
    setPlanSelections({});
    setFanmeetPlan({});
    setFilterMemberIds([]);
    setShowClearConfirm(false);
  };

  // Filter members for planner view (empty = show all)
  const visibleMemberIds = filterMemberIds.length === 0
    ? new Set(members.map(m => m.id))
    : new Set(filterMemberIds);

  // Compute total tickets & cost from plan
  const totalTickets = Object.entries(planSelections).reduce((sum, [k, cnt]) => {
    const [actId] = k.split('|');
    const act = getActivityById(actId);
    if (!act || act.id === 'hachi_cha') return sum;
    return sum + (act.ticketsRequired * cnt);
  }, 0);

  const totalCost = Object.entries(planSelections).reduce((sum, [k, cnt]) => {
    const [actId] = k.split('|');
    return sum + getActivityCost(actId, cnt);
  }, 0);

  return (
    <div className="oc9-app">
      <header className="oc9-header">
        <div className="oc9-header-inner">
          <div className="oc9-logo">
            <span className="oc9-logo-badge">9</span>
            <div>
              <div className="oc9-event-name">On Cloud 9 Festival</div>
              <div className="oc9-event-sub">BNK48 × CGM48 9th Anniversary · May 30 – Jun 1, 2026</div>
            </div>
          </div>
          <div className="oc9-header-right">
            <ProjectSwitcher projects={[
              { label: '2Shot BNK48 Planner', path: '/', icon: 'B', color: '#FF6B9D' },
              { label: '2Shot Shock Me Girls', path: '/2shot_smg', icon: 'S', color: '#e91e63' },
              OC9_PROJECT,
            ]} />
            <button className="oc9-clear-btn" onClick={() => setShowClearConfirm(true)}>🗑 Clear All</button>
          </div>
        </div>
      </header>

      {showClearConfirm && (
        <div className="oc9-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="oc9-modal oc9-confirm-modal" onClick={e => e.stopPropagation()}>
            <p>ยืนยันล้างแผนทั้งหมด?</p>
            <div className="oc9-confirm-btns">
              <button className="oc9-btn-danger" onClick={clearAll}>ล้างข้อมูล</button>
              <button className="oc9-btn-cancel" onClick={() => setShowClearConfirm(false)}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {showFilterModal && (
        <FilterModal
          selected={filterMemberIds}
          onConfirm={(ids) => { setFilterMemberIds(ids); setShowFilterModal(false); }}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {showMemberModal && modalData && (
        <MemberModal
          data={modalData}
          current={planSelections[planKey(modalData.actId, modalData.date, modalData.slot, modalData.station)] || 0}
          onConfirm={confirmModal}
          onClose={closeModal}
          fanmeetPlan={fanmeetPlan}
        />
      )}

      <nav className="oc9-tabs">
        {[
          { id: 'happening', label: '🕐 NOW' },
          { id: 'planner',   label: '📅 Planner' },
          { id: 'members',   label: '👤 Members' },
          { id: 'summary',   label: '📊 Summary' },
        ].map(t => (
          <button
            key={t.id}
            className={`oc9-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="oc9-main">
        {activeTab === 'happening' && <HappeningView planSelections={planSelections} />}
        {activeTab === 'planner' && (
          <PlannerView
            visibleMemberIds={visibleMemberIds}
            filterMemberIds={filterMemberIds}
            planSelections={planSelections}
            onOpenFilterModal={() => setShowFilterModal(true)}
            onCellClick={openModal}
            fanmeetPlan={fanmeetPlan}
            setFanmeetPlan={setFanmeetPlan}
          />
        )}
        {activeTab === 'members' && <MemberScheduleView filterMemberIds={filterMemberIds} planSelections={planSelections} onCellClick={openModal} />}
        {activeTab === 'summary' && (
          <SummaryView
            planSelections={planSelections}
            fanmeetPlan={fanmeetPlan}
            totalTickets={totalTickets}
            totalCost={totalCost}
          />
        )}
      </main>

      <footer className="oc9-footer">
        <p>Made for BNK48 × CGM48 fans · แผนนี้ทำเพื่อวางแผน ไม่ใช่ข้อมูลทางการ</p>
        {totalTickets > 0 && (
          <div className="oc9-footer-ticker">
            🎫 {totalTickets} tickets · ฿{totalCost.toLocaleString()}
          </div>
        )}
      </footer>
    </div>
  );
}

// ─── Member Card (in schedule table) ─────────────────────────────────────────

function MemberCell({ memberId, actId, date, slot, station, planSelections, onCellClick, visibleMemberIds }) {
  const member = getMemberById(memberId);
  const [imgErr, setImgErr] = useState(false);
  if (!member) return <div className="oc9-cell-empty">—</div>;

  const k = planKey(actId, date, slot, station);
  const count = planSelections[k] || 0;
  const isPlanned = count > 0;
  const isVisible = visibleMemberIds.has(memberId);

  return (
    <div
      className={`oc9-member-cell ${isPlanned ? 'planned' : ''} ${!isVisible ? 'dimmed' : ''}`}
      style={{ '--mc': member.color }}
      onClick={() => onCellClick(actId, date, slot, station, memberId)}
    >
      <div className="oc9-member-photo">
        {!imgErr ? (
          <img
            src={getMemberImageUrl(member.name)}
            alt={member.name}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="oc9-member-initial" style={{ background: member.color }}>
            {member.name[0]}
          </div>
        )}
        {isPlanned && <span className="oc9-count-badge">×{count}</span>}
      </div>
      <div className="oc9-member-label" style={{ color: member.color }}>{member.name}</div>
    </div>
  );
}

// ─── Planner View ─────────────────────────────────────────────────────────────

function FanmeetSection({ date, fanmeetPlan, setFanmeetPlan }) {
  const dayFanmeets = getFanmeetByDate(date);
  if (!dayFanmeets.length) return null;
  return (
    <div className="oc9-fanmeet-section">
      <div className="oc9-fanmeet-title">⭐ Fanmeet</div>
      {dayFanmeets.map((fm, i) => {
        const fmKey = `${fm.date}|${fm.time}`;
        const planned = fanmeetPlan[fmKey];
        return (
          <div key={i} className={`oc9-fanmeet-card ${planned ? 'planned' : ''}`}
            onClick={() => setFanmeetPlan(prev => ({ ...prev, [fmKey]: !prev[fmKey] }))}>
            <div className="oc9-fanmeet-time">{fm.time}</div>
            <div className="oc9-fanmeet-label">{fm.label}</div>
            <div className="oc9-fanmeet-note">{fm.note}</div>
            {planned && <span className="oc9-fanmeet-check">✓ วางแผนแล้ว</span>}
          </div>
        );
      })}
    </div>
  );
}

function PlannerView({ visibleMemberIds, filterMemberIds, planSelections, onOpenFilterModal, onCellClick, fanmeetPlan, setFanmeetPlan }) {
  const [activeDate, setActiveDate] = useState('all');
  const [activeActivityId, setActiveActivityId] = useState(null);
  const [plannerMode, setPlannerMode] = useState('activity'); // 'activity' | 'timeline'
  const filterCount = filterMemberIds.length;

  const handleSetMode = (mode) => {
    setPlannerMode(mode);
    if (mode === 'timeline' && activeDate === 'all') setActiveDate(eventDates[0]);
  };

  const visibleActivities = activeActivityId
    ? activities.filter(a => a.id === activeActivityId)
    : activities;

  const datesToShow = activeDate === 'all' ? eventDates : [activeDate];

  return (
    <div className="oc9-planner">
      {/* Mode toggle */}
      <div className="oc9-mode-toggle-row">
        <button className={`oc9-mode-btn ${plannerMode === 'activity' ? 'active' : ''}`} onClick={() => handleSetMode('activity')}>📋 ดูตามกิจกรรม</button>
        <button className={`oc9-mode-btn ${plannerMode === 'timeline' ? 'active' : ''}`} onClick={() => handleSetMode('timeline')}>🗓 ดูตามเวลา</button>
      </div>

      {/* Date selector + member filter button */}
      <div className="oc9-planner-topbar">
        <div className="oc9-date-tabs">
          {plannerMode === 'activity' && (
            <button
              className={`oc9-date-tab ${activeDate === 'all' ? 'active' : ''}`}
              style={{ '--dc': '#38bdf8' }}
              onClick={() => setActiveDate('all')}
            >
              <span className="oc9-date-day">ALL</span>
              <span className="oc9-date-num">ทุกวัน</span>
            </button>
          )}
          {eventDates.map(d => {
            const [y, m, dd] = d.split('-').map(Number);
            const day = new Date(y, m - 1, dd).getDay();
            const dateColor = day === 6 ? '#7c3aed' : day === 0 ? '#dc2626' : '#eab308';
            return (
              <button
                key={d}
                className={`oc9-date-tab ${activeDate === d ? 'active' : ''}`}
                style={{ '--dc': dateColor }}
                onClick={() => setActiveDate(d)}
              >
                <span className="oc9-date-day">{getDayName(d)}</span>
                <span className="oc9-date-num">{formatShortDate(d)}</span>
              </button>
            );
          })}
        </div>
        <button className={`oc9-filter-toggle ${filterCount > 0 ? 'active' : ''}`} onClick={onOpenFilterModal}>
          🔍 {filterCount > 0 ? `${filterCount} คน` : <span>Filter by<br/>member</span>}
        </button>
      </div>

      {/* Activity filter icons — activity mode only */}
      {plannerMode === 'activity' && <div className="oc9-act-filter-bar">
        <button
          className={`oc9-act-filter-btn ${activeActivityId === null ? 'active' : ''}`}
          onClick={() => setActiveActivityId(null)}
          title="ทุกกิจกรรม"
        >
          <span className="oc9-act-filter-emoji">🎪</span>
          <span className="oc9-act-filter-label">ทั้งหมด</span>
        </button>
        {activities.map(act => {
          const isActive = activeActivityId === act.id;
          return (
            <button
              key={act.id}
              className={`oc9-act-filter-btn ${isActive ? 'active' : ''}`}
              style={{ '--act-fc': act.color }}
              onClick={() => setActiveActivityId(isActive ? null : act.id)}
              title={act.name}
            >
              <span className="oc9-act-filter-emoji">{act.emoji}</span>
              <span className="oc9-act-filter-label">{act.name}</span>
            </button>
          );
        })}
      </div>}

      {/* Timeline mode */}
      {plannerMode === 'timeline' && activeDate !== 'all' && (
        <>
          <FanmeetSection date={activeDate} fanmeetPlan={fanmeetPlan} setFanmeetPlan={setFanmeetPlan} />
          <TimelineView
            date={activeDate}
            planSelections={planSelections}
            visibleMemberIds={visibleMemberIds}
            onCellClick={onCellClick}
          />
        </>
      )}

      {/* Activity mode: per date */}
      {plannerMode === 'activity' && datesToShow.map(date => {
        const [y, m, dd] = date.split('-').map(Number);
        const day = new Date(y, m - 1, dd).getDay();
        const dateColor = day === 6 ? '#7c3aed' : day === 0 ? '#dc2626' : '#eab308';
        return (
          <div key={date}>
            {activeDate === 'all' && (
              <div className="oc9-date-section-header" style={{ '--dc': dateColor }}>
                <span className="oc9-date-section-day">{getDayName(date)}</span>
                <span className="oc9-date-section-num">{formatShortDate(date)}</span>
              </div>
            )}
            {activeActivityId === null && (
              <FanmeetSection date={date} fanmeetPlan={fanmeetPlan} setFanmeetPlan={setFanmeetPlan} />
            )}
            {visibleActivities.map(act => (
              <ActivityTable
                key={`${date}-${act.id}`}
                activity={act}
                date={date}
                planSelections={planSelections}
                visibleMemberIds={visibleMemberIds}
                onCellClick={onCellClick}
                fanmeetPlan={fanmeetPlan}
                defaultOpen={true}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Timeline View ────────────────────────────────────────────────────────────

function TimelineView({ date, planSelections, visibleMemberIds, onCellClick }) {
  const slots = timeSlots[date] || [];

  return (
    <div className="oc9-timeline">
      <div className="oc9-timeline-scroll">
        <table className="oc9-tl-table">
          <thead>
            <tr>
              <th className="oc9-tl-th-time"></th>
              {activities.map(act => (
                <th key={act.id} className="oc9-tl-th-act" style={{ '--act-fc': act.color }}>
                  <span className="oc9-tl-act-emoji">{act.emoji}</span>
                  <span className="oc9-tl-act-name">{act.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => (
              <tr key={slot}>
                <td className="oc9-tl-td-time">{slot}</td>
                {activities.map(act => {
                  const memberIds = schedule[date]?.[act.id]?.[slot] || [];
                  return (
                    <td key={act.id} className="oc9-tl-td-cell">
                      {[0, 1, 2].map(i => {
                        const memberId = memberIds[i];
                        if (!memberId) return <div key={i} className="oc9-tl-member empty">—</div>;
                        const member = getMemberById(memberId);
                        if (!member) return null;
                        const isVisible = visibleMemberIds.has(memberId);
                        const k = planKey(act.id, date, slot, i + 1);
                        const isPlanned = !!planSelections[k];
                        return (
                          <div
                            key={i}
                            className={`oc9-tl-member ${isPlanned ? 'planned' : ''} ${!isVisible ? 'dimmed' : ''}`}
                            style={{ '--mc': member.color }}
                            onClick={() => onCellClick(act.id, date, slot, i + 1, memberId)}
                          >
                            {isPlanned && <span className="oc9-tl-check">✓</span>}
                            {member.name}
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityTable({ activity, date, planSelections, visibleMemberIds, onCellClick, fanmeetPlan, defaultOpen = true }) {
  const slots = timeSlots[date] || [];
  const daySchedule = schedule[date]?.[activity.id] || {};
  const [collapsed, setCollapsed] = useState(!defaultOpen);

  // Count planned selections for this activity on this date
  const plannedCount = Object.keys(planSelections).filter(k => {
    const [a, d] = k.split('|');
    return a === activity.id && d === date;
  }).length;

  // Find planned fanmeet that overlaps a given slot
  const getFanmeetConflict = (slot) => {
    const slotStart = slotToMinutes(slot);
    return getFanmeetByDate(date).find(fm => {
      if (!fanmeetPlan?.[`${fm.date}|${fm.time}`]) return false;
      const [startStr, endStr] = fm.time.split(' - ');
      const start = slotToMinutes(startStr.trim());
      const end = slotToMinutes(endStr.trim());
      return slotStart >= start && slotStart < end;
    }) || null;
  };

  return (
    <div className="oc9-activity-block" style={{ '--act-color': activity.color }}>
      <div className="oc9-activity-header" onClick={() => setCollapsed(c => !c)}>
        <div className="oc9-activity-title">
          <span className="oc9-activity-emoji">{activity.emoji}</span>
          <span className="oc9-activity-name">{activity.name}</span>
          <span className="oc9-activity-name-en">{activity.nameEn}</span>
        </div>
        <div className="oc9-activity-meta">
          <span className="oc9-ticket-badge">
            {activity.id === 'hachi_cha'
              ? `฿${activity.hachiChaPrice}+`
              : `${activity.ticketsRequired} ticket${activity.ticketsRequired > 1 ? 's' : ''}`}
          </span>
          {plannedCount > 0 && <span className="oc9-planned-badge">+{plannedCount}</span>}
          <span className="oc9-collapse-icon">{collapsed ? '▼' : '▲'}</span>
        </div>
      </div>
      <div className="oc9-activity-desc">{activity.description}</div>

      {!collapsed && (
        <div className="oc9-schedule-scroll">
          <table className="oc9-schedule-table">
            <thead>
              <tr>
                <th className="oc9-slot-col">เวลา</th>
                <th>M#1</th>
                <th>M#2</th>
                <th>M#3</th>
              </tr>
            </thead>
            <tbody>
              {slots.map(slot => {
                const stationMembers = daySchedule[slot] || [];
                const conflict = getFanmeetConflict(slot);
                return (
                  <tr key={slot} className={conflict ? 'oc9-slot-row--fanmeet' : ''}>
                    <td className="oc9-slot-cell">
                      {formatSlotRange(slot)}
                      {conflict && <div className="oc9-fanmeet-conflict-text">{conflict.label}</div>}
                    </td>
                    {[0, 1, 2].map(si => (
                      <td key={si} className="oc9-station-cell">
                        {stationMembers[si] ? (
                          <MemberCell
                            memberId={stationMembers[si]}
                            actId={activity.id}
                            date={date}
                            slot={slot}
                            station={si + 1}
                            planSelections={planSelections}
                            onCellClick={onCellClick}
                            visibleMemberIds={visibleMemberIds}
                          />
                        ) : <div className="oc9-cell-empty">—</div>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Filter Modal ─────────────────────────────────────────────────────────────

function FilterModal({ selected, onConfirm, onClose }) {
  const [temp, setTemp] = useState(selected);
  const [search, setSearch] = useState('');

  const toggle = (id) => setTemp(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group filtered members by group+gen for display
  const groups = {};
  filtered.forEach(m => {
    const key = `${m.group} Gen ${m.generation}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });

  return (
    <div className="oc9-overlay" onClick={onClose}>
      <div className="oc9-filter-modal" onClick={e => e.stopPropagation()}>
        <div className="oc9-modal-header">
          <span>กรองสมาชิก</span>
          <button className="oc9-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="oc9-filter-modal-search">
          <input
            className="oc9-search-input"
            placeholder="ค้นหาชื่อ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="oc9-filter-modal-actions">
          <button className="oc9-filter-action-btn" onClick={() => setTemp(members.map(m => m.id))}>เลือกทั้งหมด</button>
          <button className="oc9-filter-action-btn" onClick={() => setTemp([])}>ล้างทั้งหมด</button>
        </div>

        <div className="oc9-filter-modal-body">
          {Object.entries(groups).sort().map(([groupLabel, groupMembers]) => (
            <div key={groupLabel} className="oc9-filter-group-section">
              <div className="oc9-filter-group-label">{groupLabel}</div>
              <div className="oc9-filter-chips">
                {groupMembers.map(m => (
                  <button
                    key={m.id}
                    className={`oc9-member-chip ${temp.includes(m.id) ? 'selected' : ''}`}
                    style={{ '--mc': m.color }}
                    onClick={() => toggle(m.id)}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="oc9-modal-footer">
          <span className="oc9-filter-count">
            {temp.length === 0 ? 'แสดงทุกคน' : `เลือก ${temp.length} คน`}
          </span>
          <button className="oc9-btn-confirm" onClick={() => onConfirm(temp)}>ยืนยัน</button>
        </div>
      </div>
    </div>
  );
}

// ─── Member Modal ─────────────────────────────────────────────────────────────

function MemberModal({ data, current, onConfirm, onClose, fanmeetPlan }) {
  const [count, setCount] = useState(current || 1);
  const [fanmeetConflict, setFanmeetConflict] = useState(null);
  const member = getMemberById(data.memberId);
  const activity = getActivityById(data.actId);
  const [imgErr, setImgErr] = useState(false);

  if (!member || !activity) return null;

  const cost = getActivityCost(data.actId, count);

  const handleConfirm = () => {
    if (count <= 0) { onConfirm(0); return; }
    const slotStart = slotToMinutes(data.slot);
    const conflict = getFanmeetByDate(data.date).find(fm => {
      if (!fanmeetPlan?.[`${fm.date}|${fm.time}`]) return false;
      const [s, e] = fm.time.split(' - ');
      return slotStart >= slotToMinutes(s.trim()) && slotStart < slotToMinutes(e.trim());
    });
    if (conflict) setFanmeetConflict(conflict);
    else onConfirm(count);
  };

  return (
    <>
      <div className="oc9-overlay" onClick={onClose}>
        <div className="oc9-modal" onClick={e => e.stopPropagation()}>
          <div className="oc9-modal-header">
            <span style={{ color: member.color }}>{member.name}</span>
            <button className="oc9-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="oc9-modal-body">
            <div className="oc9-modal-photo">
              {!imgErr ? (
                <img src={getMemberImageUrl(member.name)} alt={member.name} onError={() => setImgErr(true)} />
              ) : (
                <div className="oc9-member-initial large" style={{ background: member.color }}>{member.name[0]}</div>
              )}
            </div>
            <div className="oc9-modal-info">
              <div className="oc9-modal-act">{activity.name} · สถานี {data.station}</div>
              <div className="oc9-modal-slot">{getDayName(data.date)} {parseInt(data.date.split('-')[2])} · {formatSlotRange(data.slot)}</div>
              {activity.id === 'hachi_cha' ? (
                <div className="oc9-modal-price">฿{activity.hachiChaPrice}+ (ซื้อเครื่องดื่ม)</div>
              ) : (
                <div className="oc9-modal-price">{activity.ticketsRequired} ticket/ครั้ง</div>
              )}
            </div>
            <div className="oc9-counter">
              <button className="oc9-cnt-btn" onClick={() => setCount(c => Math.max(0, c - 1))}>−</button>
              <input
                className="oc9-cnt-input"
                type="text"
                value={count}
                onChange={e => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v) && v >= 0 && v <= 20) setCount(v);
                }}
              />
              <button className="oc9-cnt-btn" onClick={() => setCount(c => Math.min(20, c + 1))}>+</button>
            </div>
            {cost > 0 && <div className="oc9-modal-cost">฿{cost.toLocaleString()}</div>}
          </div>
          <div className="oc9-modal-footer">
            <button className="oc9-btn-confirm" onClick={handleConfirm}>ยืนยัน</button>
            {current > 0 && (
              <button className="oc9-btn-remove" onClick={() => onConfirm(0)}>ลบออก</button>
            )}
          </div>
        </div>
      </div>

      {fanmeetConflict && (
        <div className="oc9-overlay oc9-overlay--top" onClick={() => setFanmeetConflict(null)}>
          <div className="oc9-modal oc9-confirm-modal" onClick={e => e.stopPropagation()}>
            <p>
              ⭐ เวลานี้ตรงกับ Fanmeet<br/>
              <strong style={{ color: '#ffd700' }}>{fanmeetConflict.label}</strong><br/>
              <span style={{ fontSize: '13px', color: '#9898c0' }}>{fanmeetConflict.time}</span><br/>
              แน่ใจเหรอ?
            </p>
            <div className="oc9-confirm-btns">
              <button className="oc9-btn-confirm" onClick={() => { onConfirm(count); setFanmeetConflict(null); }}>ยืนยัน</button>
              <button className="oc9-btn-cancel" onClick={() => setFanmeetConflict(null)}>ไม่</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Happening View ───────────────────────────────────────────────────────────

function HappeningView({ planSelections }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const pad = n => String(n).padStart(2, '0');
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isEventDay = eventDates.includes(todayStr);

  const currentSlots = isEventDay
    ? (timeSlots[todayStr] || []).filter(s => isSlotActive(s, nowMinutes))
    : [];
  const nextSlots = isEventDay
    ? (timeSlots[todayStr] || []).filter(s => slotToMinutes(s) > nowMinutes).slice(0, 1)
    : [];

  // Planned activities in current slot
  const getPlannedForSlot = (slot) => {
    const result = [];
    activities.forEach(act => {
      [1, 2, 3].forEach(station => {
        const k = planKey(act.id, todayStr, slot, station);
        if (planSelections[k]) {
          const stationMembers = schedule[todayStr]?.[act.id]?.[slot] || [];
          const memberId = stationMembers[station - 1];
          const member = getMemberById(memberId);
          if (member) result.push({ act, station, member, count: planSelections[k] });
        }
      });
    });
    return result;
  };

  return (
    <div className="oc9-happening">
      <div className="oc9-clock-bar">
        <span className="oc9-clock">{timeStr}</span>
        <span className="oc9-clock-label">เวลาปัจจุบัน</span>
      </div>

      {!isEventDay && (
        <div className="oc9-happening-empty">
          <div className="oc9-empty-icon">📅</div>
          <p>วันนี้ไม่ใช่วันงาน</p>
          <p className="oc9-empty-sub">งานจัดวันที่ 30 พ.ค. – 1 มิ.ย. 2569</p>
        </div>
      )}

      {isEventDay && currentSlots.length === 0 && (
        <div className="oc9-happening-empty">
          <div className="oc9-empty-icon">⏳</div>
          <p>ยังไม่มีกิจกรรมที่กำลังดำเนินอยู่</p>
          {nextSlots.length > 0 && <p className="oc9-empty-sub">รอบต่อไป: {nextSlots[0]}</p>}
        </div>
      )}

      {currentSlots.map(slot => {
        const planned = getPlannedForSlot(slot);
        return (
          <div key={slot} className="oc9-happening-slot">
            <div className="oc9-happening-slot-header">
              <span className="oc9-live-badge">● LIVE</span>
              <span className="oc9-slot-time">{formatSlotRange(slot)}</span>
            </div>

            {planned.length === 0 ? (
              <p className="oc9-no-plan">ไม่มีแผนในรอบนี้</p>
            ) : (
              <div className="oc9-happening-items">
                {planned.map((item, i) => (
                  <div key={i} className="oc9-happening-card" style={{ borderColor: item.member.color }}>
                    <div className="oc9-happening-member" style={{ color: item.member.color }}>{item.member.name}</div>
                    <div className="oc9-happening-meta">{item.act.name} · สถานี {item.station}</div>
                    <div className="oc9-happening-count">×{item.count}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Show all activities in this slot */}
            <div className="oc9-happening-all-acts">
              <div className="oc9-happening-all-title">กิจกรรมทั้งหมดในรอบนี้:</div>
              {activities.map(act => {
                const stationMembers = schedule[todayStr]?.[act.id]?.[slot] || [];
                return (
                  <div key={act.id} className="oc9-happening-act-row">
                    <span className="oc9-happening-act-name" style={{ color: act.color }}>{act.name}</span>
                    <div className="oc9-happening-stations">
                      {stationMembers.map((mId, si) => {
                        const m = getMemberById(mId);
                        const k = planKey(act.id, todayStr, slot, si + 1);
                        return m ? (
                          <span key={si} className={`oc9-station-chip ${planSelections[k] ? 'planned' : ''}`} style={{ color: m.color }}>
                            {m.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Fanmeet happening */}
      {isEventDay && (
        <FanmeetHappening date={todayStr} nowMinutes={nowMinutes} />
      )}
    </div>
  );
}

function FanmeetHappening({ date, nowMinutes }) {
  const dayFanmeets = getFanmeetByDate(date);
  const activeFanmeets = dayFanmeets.filter(fm => {
    const [startStr, endStr] = fm.time.split(' - ');
    const start = slotToMinutes(startStr.trim());
    const end = slotToMinutes(endStr.trim());
    return nowMinutes >= start && nowMinutes < end;
  });
  if (activeFanmeets.length === 0) return null;
  return (
    <div className="oc9-happening-fanmeet">
      <div className="oc9-fanmeet-title">⭐ Fanmeet กำลังดำเนินอยู่</div>
      {activeFanmeets.map((fm, i) => (
        <div key={i} className="oc9-fanmeet-card planned">
          <div className="oc9-fanmeet-time">{fm.time}</div>
          <div className="oc9-fanmeet-label">{fm.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Member Schedule View ─────────────────────────────────────────────────────

function MemberScheduleView({ filterMemberIds, planSelections, onCellClick }) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  const groups = ['ALL', 'BNK48', 'CGM48'];
  const filterSet = filterMemberIds.length > 0 ? new Set(filterMemberIds) : null;

  const filtered = members.filter(m => {
    const matchGroup = selectedGroup === 'ALL' || m.group === selectedGroup;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchGroup && matchSearch;
  });

  return (
    <div className="oc9-ms-wrap">
      <div className="oc9-ms-toolbar">
        <input
          className="oc9-ms-search"
          placeholder="ค้นหาชื่อ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="oc9-ms-group-tabs">
          {groups.map(g => (
            <button
              key={g}
              className={`oc9-ms-group-btn ${selectedGroup === g ? 'active' : ''}`}
              onClick={() => setSelectedGroup(g)}
            >{g}</button>
          ))}
        </div>
      </div>

      <div className="oc9-ms-list">
        {filtered.map(member => (
          <MemberScheduleCard
            key={member.id}
            member={member}
            dimmed={filterSet !== null && !filterSet.has(member.id)}
            planSelections={planSelections}
            onCellClick={onCellClick}
          />
        ))}
      </div>
    </div>
  );
}

function MemberScheduleCard({ member, dimmed, planSelections, onCellClick }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`oc9-ms-card ${dimmed ? 'oc9-ms-card--dimmed' : ''}`} style={{ '--mc': member.color }}>
      <div className="oc9-ms-card-header" onClick={() => setOpen(o => !o)}>
        <div className="oc9-ms-card-left">
          <div className="oc9-ms-photo">
            <img
              src={getMemberImageUrl(member.name)}
              alt={member.name}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
            <div className="oc9-ms-initial" style={{ display: 'none', background: member.color }}>
              {member.name[0]}
            </div>
          </div>
          <div>
            <div className="oc9-ms-name" style={{ color: member.color }}>{member.name}</div>
            <div className="oc9-ms-gen">{member.group} Gen {member.generation}</div>
          </div>
        </div>
        <span className="oc9-collapse-icon">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="oc9-ms-body">
          {eventDates.map(date => {
            const [y, m, dd] = date.split('-').map(Number);
            const day = new Date(y, m - 1, dd).getDay();
            const dateColor = day === 6 ? '#7c3aed' : day === 0 ? '#dc2626' : '#eab308';

            const slots = [];
            Object.entries(schedule[date] || {}).forEach(([actId, actSlots]) => {
              Object.entries(actSlots).forEach(([slot, arr]) => {
                const stationIdx = arr.indexOf(member.id);
                if (stationIdx !== -1) {
                  const act = getActivityById(actId);
                  const station = stationIdx + 1;
                  const k = planKey(actId, date, slot, station);
                  const count = planSelections[k] || 0;
                  slots.push({ slot, act, actId, station, count });
                }
              });
            });
            slots.sort((a, b) => a.slot.localeCompare(b.slot));

            const getFanmeetConflict = (slot) => {
              const slotStart = slotToMinutes(slot);
              return getFanmeetByDate(date).find(fm => {
                const [startStr, endStr] = fm.time.split(' - ');
                return slotStart >= slotToMinutes(startStr.trim()) && slotStart < slotToMinutes(endStr.trim());
              }) || null;
            };

            return (
              <div key={date} className="oc9-ms-day">
                <div className="oc9-ms-day-label" style={{ color: dateColor }}>
                  {getDayName(date)} · {formatShortDate(date)}
                </div>
                {slots.length === 0 ? (
                  <div className="oc9-ms-empty">ไม่มีกิจกรรม</div>
                ) : (
                  <div className="oc9-ms-slots">
                    {slots.map((s, i) => {
                      const conflict = getFanmeetConflict(s.slot);
                      return (
                        <div
                          key={i}
                          className={`oc9-ms-slot-row ${s.count > 0 ? 'planned' : ''}`}
                          style={{ '--act-color': s.act?.color }}
                          onClick={() => onCellClick(s.actId, date, s.slot, s.station, member.id)}
                        >
                          <span className="oc9-ms-slot-time">
                            {formatSlotRange(s.slot)}
                            {conflict && <span className="oc9-fanmeet-conflict-text">{conflict.label}</span>}
                          </span>
                          <span className="oc9-ms-slot-act">
                            {s.act?.emoji} {s.act?.name}
                          </span>
                          <span className="oc9-ms-slot-count">
                            {s.count > 0 ? `${s.count} ใบ` : '+ plan'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Summary View ─────────────────────────────────────────────────────────────

function SummaryView({ planSelections, fanmeetPlan, totalTickets, totalCost }) {
  // Group by date → slot → actId → [items]
  const byDate = {};
  eventDates.forEach(d => { byDate[d] = {}; });

  Object.entries(planSelections).forEach(([k, count]) => {
    const [actId, date, slot, station] = k.split('|');
    if (!byDate[date]) return;
    if (!byDate[date][slot]) byDate[date][slot] = {};
    if (!byDate[date][slot][actId]) byDate[date][slot][actId] = [];
    const stationMembers = schedule[date]?.[actId]?.[slot] || [];
    const memberId = stationMembers[parseInt(station) - 1];
    const member = getMemberById(memberId);
    const activity = getActivityById(actId);
    byDate[date][slot][actId].push({ member, count, cost: getActivityCost(actId, count) });
  });

  const hasPlan = Object.values(byDate).some(d => Object.keys(d).length > 0)
    || Object.keys(fanmeetPlan).some(k => fanmeetPlan[k]);

  if (!hasPlan) {
    return (
      <div className="oc9-summary-empty">
        <div className="oc9-empty-icon">📋</div>
        <p>ยังไม่มีแผน</p>
        <p className="oc9-empty-sub">ไปที่ Planner เพื่อเลือกกิจกรรม</p>
      </div>
    );
  }

  return (
    <div className="oc9-summary">
      <div className="oc9-summary-totals">
        <div className="oc9-total-item">
          <span className="oc9-total-label">Tickets ทั้งหมด</span>
          <span className="oc9-total-value">🎫 {totalTickets}</span>
        </div>
        <div className="oc9-total-item">
          <span className="oc9-total-label">ค่าใช้จ่ายรวม</span>
          <span className="oc9-total-value">฿{totalCost.toLocaleString()}</span>
        </div>
      </div>

      {eventDates.map(date => {
        const slotMap = byDate[date];
        const dayFanmeets = getFanmeetByDate(date).filter(fm => fanmeetPlan[`${fm.date}|${fm.time}`]);
        const allSlots = timeSlots[date] || [];
        const hasAnything = Object.keys(slotMap).length > 0 || dayFanmeets.length > 0;
        if (!hasAnything) return null;

        const [y, m, dd] = date.split('-').map(Number);
        const day = new Date(y, m - 1, dd).getDay();
        const dateColor = day === 6 ? '#7c3aed' : day === 0 ? '#dc2626' : '#eab308';
        const dayCost = Object.values(slotMap).flatMap(s => Object.values(s).flat()).reduce((s, i) => s + i.cost, 0);

        return (
          <div key={date} className="oc9-summary-day">
            <div className="oc9-summary-day-header" style={{ '--dc': dateColor }}>
              <span>{getDayName(date)} · {formatShortDate(date)}</span>
              {dayCost > 0 && <span className="oc9-day-cost">฿{dayCost.toLocaleString()}</span>}
            </div>

            {(() => {
              // Merge fanmeets + activity slots, sort by start time
              const merged = [];
              dayFanmeets.forEach(fm => {
                const [startStr] = fm.time.split(' - ');
                merged.push({ type: 'fanmeet', startMinutes: slotToMinutes(startStr.trim()), fm });
              });
              allSlots.forEach(slot => {
                const actMap = slotMap[slot] || {};
                if (Object.keys(actMap).length > 0) {
                  merged.push({ type: 'slot', startMinutes: slotToMinutes(slot), slot, actMap });
                }
              });
              merged.sort((a, b) => a.startMinutes - b.startMinutes);

              return merged.map((item, idx) => {
                if (item.type === 'fanmeet') {
                  return (
                    <div key={`fm-${idx}`} className="oc9-summary-slot-group">
                      <div className="oc9-summary-slot-header">
                        <span className="oc9-summary-slot-time">{item.fm.time}</span>
                      </div>
                      <div className="oc9-summary-act-row" style={{ '--act-color': '#ffd700' }}>
                        <span className="oc9-summary-act-name">⭐ แฟนมีต</span>
                        <div className="oc9-summary-members">
                          <span className="oc9-summary-member-chip" style={{ '--mc': '#ffd700' }}>
                            <span style={{ color: '#ffd700' }}>{item.fm.label}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                const { slot, actMap } = item;
                const slotCost = Object.values(actMap).flat().reduce((s, i) => s + i.cost, 0);
                return (
                  <div key={slot} className="oc9-summary-slot-group">
                    <div className="oc9-summary-slot-header">
                      <span className="oc9-summary-slot-time">{formatSlotRange(slot)}</span>
                      {slotCost > 0 && <span className="oc9-summary-slot-cost">฿{slotCost.toLocaleString()}</span>}
                    </div>
                    {Object.entries(actMap).map(([actId, items]) => {
                      const act = getActivityById(actId);
                      if (!act) return null;
                      return (
                        <div key={actId} className="oc9-summary-act-row" style={{ '--act-color': act.color }}>
                          <span className="oc9-summary-act-name">{act.emoji} {act.name}</span>
                          <div className="oc9-summary-members">
                            {items.map((item, i) => (
                              <span key={i} className="oc9-summary-member-chip" style={{ '--mc': item.member?.color }}>
                                <span style={{ color: item.member?.color }}>{item.member?.name || '—'}</span>
                                <span className="oc9-summary-chip-count">×{item.count}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        );
      })}

      <div className="oc9-grand-total">
        <span>Grand Total</span>
        <span>฿{totalCost.toLocaleString()}</span>
      </div>

      <MemberTicketBreakdown planSelections={planSelections} />

      <div className="oc9-summary-note">
        * ราคาโดยประมาณ · 1 ticket = ฿{250} · SNS = 5 tickets · Cha Ba Cha = ฿145+<br />
        * Fanmeet ใช้ Ticket แยกผ่าน iAM48
      </div>
    </div>
  );
}

function MemberTicketBreakdown({ planSelections }) {
  const [open, setOpen] = useState(true);

  // Build per-member summary
  const byMember = {};
  Object.entries(planSelections).forEach(([k, count]) => {
    const [actId, date, slot, station] = k.split('|');
    const stationMembers = schedule[date]?.[actId]?.[slot] || [];
    const memberId = stationMembers[parseInt(station) - 1];
    const member = getMemberById(memberId);
    const activity = getActivityById(actId);
    if (!member || !activity) return;

    if (!byMember[memberId]) {
      byMember[memberId] = { member, tickets: 0, cost: 0, rows: [] };
    }
    const tickets = activity.ticketsRequired * count;
    const cost = getActivityCost(actId, count);
    byMember[memberId].tickets += tickets;
    byMember[memberId].cost += cost;
    byMember[memberId].rows.push({ activity, count, tickets, cost, date, slot });
  });

  const sorted = Object.values(byMember).sort((a, b) => b.tickets - a.tickets);
  if (sorted.length === 0) return null;

  return (
    <div className="oc9-member-breakdown">
      <button className="oc9-breakdown-toggle" onClick={() => setOpen(o => !o)}>
        <span>🎫 Tickets ต่อเมมเบอร์</span>
        <span className="oc9-collapse-icon">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="oc9-breakdown-body">
          {sorted.map(({ member, tickets, cost, rows }) => (
            <MemberBreakdownRow
              key={member.id}
              member={member}
              tickets={tickets}
              cost={cost}
              rows={rows}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberBreakdownRow({ member, tickets, cost, rows }) {
  const [expanded, setExpanded] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="oc9-mb-row" style={{ '--mc': member.color }}>
      <div className="oc9-mb-row-header" onClick={() => setExpanded(e => !e)}>
        <div className="oc9-mb-row-left">
          <div className="oc9-mb-photo">
            {!imgErr ? (
              <img src={getMemberImageUrl(member.name)} alt={member.name} onError={() => setImgErr(true)} />
            ) : (
              <div className="oc9-mb-initial" style={{ background: member.color }}>{member.name[0]}</div>
            )}
          </div>
          <div>
            <div className="oc9-mb-name" style={{ color: member.color }}>{member.name}</div>
            <div className="oc9-mb-group">{member.group} Gen {member.generation}</div>
          </div>
        </div>
        <div className="oc9-mb-row-right">
          <span className="oc9-mb-tickets">🎫 {tickets}</span>
          <span className="oc9-mb-cost">฿{cost.toLocaleString()}</span>
          <span className="oc9-collapse-icon">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <table className="oc9-mb-detail-table">
          <thead>
            <tr><th>กิจกรรม</th><th>วันที่</th><th>เวลา</th><th>จำนวน</th><th>Ticket</th></tr>
          </thead>
          <tbody>
            {rows.sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot)).map((r, i) => (
              <tr key={i}>
                <td>{r.activity.emoji} {r.activity.nameEn}</td>
                <td>{formatShortDate(r.date)}</td>
                <td>{formatSlotRange(r.slot)}</td>
                <td>×{r.count}</td>
                <td>{r.tickets > 0 ? `🎫 ${r.tickets}` : `฿${r.cost}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default OnCloud9App;
