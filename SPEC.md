# BNK48 Planner System Specification

## 1. Project Overview

- **Project Name**: BNK48 2-Shot Ponytail Planner made by L BNK48 Fandom
- **Type**: React Web Application
- **Core Functionality**: A planner system to manage and view 2shot activity schedules for BNK48 members
- **Target Users**: BNK48 fans who want to track member activities

## 2. UI/UX Specification

### Layout Structure

- **Header**: App title and member filter dropdown
- **Main Content**: 
  - Tab navigation (Schedule | Summary)
  - Schedule view: Calendar/table showing 2shot activities
  - Summary view: Overview of all member activities by time period
- **Footer**: Minimal footer with app info

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Visual Design

**Color Palette**
- Primary: `#FF6B9D` (BNK48 Pink)
- Secondary: `#1A1A2E` (Dark Navy)
- Accent: `#FFD93D` (Gold)
- Background: `#0F0F1A` (Dark Background)
- Surface: `#16213E` (Card Background)
- Text Primary: `#FFFFFF`
- Text Secondary: `#A0A0B0`
- Success: `#4CAF50`
- Warning: `#FF9800`

**Typography**
- Font Family: 'Kanit', sans-serif (Thai-friendly)
- Headings: 24px (h1), 20px (h2), 18px (h3)
- Body: 16px
- Small: 14px

**Spacing System**
- Base unit: 8px
- Padding: 16px, 24px, 32px
- Margins: 8px, 16px, 24px

### Components

1. **MemberSelector**: Dropdown to select focus member
2. **TabNavigation**: Switch between Schedule and Summary views
3. **ScheduleCard**: Display individual 2shot activity
4. **MemberBadge**: Show member name with color coding
5. **TimeSlot**: Display time blocks in schedule
6. **SummaryTable**: Overview table of all activities

## 3. Functionality Specification

### Core Features

1. **Member Selection**
   - Dropdown list of all BNK48 members
   - "All Members" option to view everyone
   - Selected member filters the schedule view

2. **2shot Schedule View**
   - Display activities grouped by date
   - Show member name, time, and location
   - Color-coded by member
   - Filter by selected member

3. **Summary Tab**
   - Overview table showing all activities
   - Grouped by time period (morning/afternoon/evening)
   - Show which members have activities
   - Filter by selected member

4. **Data Persistence**
   - Store all schedule data in localStorage
   - Pre-populated with sample 2shot data

### Data Structure

```typescript
interface Member {
  id: string;
  name: string;
  color: string;
  generation: number;
}

interface Activity {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  type: '2shot' | 'event' | 'other';
  notes?: string;
}
```

### User Interactions
- Click dropdown to select member
- Click tabs to switch views
- Click activity card for details (future enhancement)

## 4. Acceptance Criteria

1. ✅ Can select a member from dropdown
2. ✅ Schedule view shows filtered activities when member selected
3. ✅ Summary tab shows overview of all activities
4. ✅ Data persists in localStorage
5. ✅ Responsive design works on mobile/tablet/desktop
6. ✅ Visual design matches BNK48 theme (pink/gold/dark)
7. ✅ All BNK48 members are available in selector