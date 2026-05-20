import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DEFAULT_PROJECTS = [
  { label: '2Shot BNK48 Planner', path: '/', icon: 'B', color: '#FF6B9D' },
  { label: '2Shot Shock Me Girls', path: '/2shot_smg', icon: 'S', color: '#e91e63' },
  { label: 'On Cloud 9 Festival', path: '/oncloud9', icon: '9', color: '#7c3aed' },
];

export const OC9_PROJECT = { label: 'On Cloud 9 Festival', path: '/oncloud9', icon: '9', color: '#7c3aed' };

export default function ProjectSwitcher({ projects = DEFAULT_PROJECTS }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const currentPath = pathname.startsWith('/oncloud9')
    ? '/oncloud9'
    : pathname.startsWith('/2shot_smg') ? '/2shot_smg' : '/';
  const current = projects.find(p => p.path === currentPath);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (path) => {
    setOpen(false);
    if (path !== currentPath) navigate(path);
  };

  if (!current) return null;

  return (
    <div className="ps-wrapper" ref={ref}>
      <button
        className={`ps-trigger ${open ? 'ps-trigger--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="ps-icon" style={{ background: `linear-gradient(135deg, ${current.color}cc, ${current.color})` }}>
          {current.icon}
        </span>
        <span className="ps-label">{current.label}</span>
        <svg className={`ps-chevron ${open ? 'ps-chevron--up' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <ul className="ps-menu" role="listbox">
          {projects.map(p => {
            const active = p.path === currentPath;
            return (
              <li
                key={p.path}
                className={`ps-item ${active ? 'ps-item--active' : ''}`}
                role="option"
                aria-selected={active}
                onClick={() => handleSelect(p.path)}
              >
                <span className="ps-icon ps-icon--sm" style={{ background: `linear-gradient(135deg, ${p.color}cc, ${p.color})` }}>
                  {p.icon}
                </span>
                <span className="ps-item-label">{p.label}</span>
                {active && (
                  <svg className="ps-check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
