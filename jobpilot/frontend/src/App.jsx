import { useState } from 'react';
import { getToken, setToken } from './api.js';
import PageHeader from './components/PageHeader.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Review from './pages/Review.jsx';
import Kanban from './pages/Kanban.jsx';
import Resumes from './pages/Resumes.jsx';
import Settings from './pages/Settings.jsx';

const PAGES = {
  Dashboard: {
    component: Dashboard,
    title: 'Dashboard',
    description: 'Your job search, at a glance.',
    icon: 'dashboard',
  },
  Review: {
    component: Review,
    title: 'Review queue',
    description: 'Review job matches and prepare your next application.',
    icon: 'review',
  },
  Kanban: {
    component: Kanban,
    title: 'Applications',
    description: 'Keep your opportunities moving through the pipeline.',
    icon: 'applications',
  },
  Resumes: {
    component: Resumes,
    title: 'Resume Studio',
    description: 'Manage your master resume and uploaded versions.',
    icon: 'resumes',
  },
  Settings: {
    component: Settings,
    title: 'Settings',
    description: 'Manage your job preferences and connected accounts.',
    icon: 'settings',
  },
};

const NAVIGATION = [
  { label: 'Dashboard', page: 'Dashboard', section: 'MAIN' },
  { label: 'Review queue', page: 'Review' },
  { label: 'Applications', page: 'Kanban' },
  { label: 'Resume Studio', page: 'Resumes', section: 'WORKSPACE' },
];

function NavigationIcon({ name }) {
  const common = {
    'aria-hidden': true,
    fill: 'none',
    height: 18,
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 1.7,
    viewBox: '0 0 24 24',
    width: 18,
  };

  switch (name) {
    case 'dashboard':
      return <svg {...common}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></svg>;
    case 'review':
      return <svg {...common}><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.2 4.2" /><path d="M8.5 10.8h4.6M10.8 8.5v4.6" /></svg>;
    case 'applications':
      return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M3 12h18M10 12v2h4v-2" /></svg>;
    case 'resumes':
      return <svg {...common}><path d="M7 3.5h7l4.5 4.5v12A1.5 1.5 0 0 1 17 21.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" /><path d="M14 3.8V8h4.2M8.5 12h7M8.5 16h7" /></svg>;
    case 'settings':
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" transform="translate(1 1) scale(.92)" /></svg>;
    default:
      return null;
  }
}

function BrandMark() {
  return (
    <svg aria-hidden="true" className="brand-mark" fill="none" viewBox="0 0 32 32">
      <rect fill="currentColor" height="28" rx="9" width="28" x="2" y="2" />
      <path d="M9 21V11h3.2l3.8 5.1 3.8-5.1H23v10h-3v-5.4l-4 5-4-5V21H9Z" fill="white" />
    </svg>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [tab, setTab] = useState('Dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  const currentPage = PAGES[tab];
  const Page = currentPage.component;

  function navigate(page) {
    setTab(page);
    setMobileNavOpen(false);
  }

  function logout() {
    setToken(null);
    setAuthed(false);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {mobileNavOpen && (
        <button
          aria-label="Close navigation"
          className="sidebar-backdrop"
          onClick={() => setMobileNavOpen(false)}
          type="button"
        />
      )}
      <aside aria-label="Main sidebar" className={`sidebar${mobileNavOpen ? ' sidebar-open' : ''}`} id="mobile-sidebar">
        <button aria-label="JobPilot home" className="brand" onClick={() => navigate('Dashboard')} type="button">
          <BrandMark />
          <span>JobPilot</span>
        </button>

        <nav aria-label="Main navigation" className="sidebar-navigation">
          {NAVIGATION.map((item) => (
            <div className="navigation-entry" key={item.page}>
              {item.section && <div className="navigation-section">{item.section}</div>}
              <button
                aria-current={tab === item.page ? 'page' : undefined}
                className={`navigation-link${tab === item.page ? ' active' : ''}`}
                onClick={() => navigate(item.page)}
                type="button"
              >
                <NavigationIcon name={PAGES[item.page].icon} />
                <span>{item.label}</span>
              </button>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            aria-current={tab === 'Settings' ? 'page' : undefined}
            className={`navigation-link${tab === 'Settings' ? ' active' : ''}`}
            onClick={() => navigate('Settings')}
            type="button"
          >
            <NavigationIcon name="settings" />
            <span>Settings</span>
          </button>
          <div className="account-row">
            <div aria-hidden="true" className="account-avatar">J</div>
            <div className="account-copy">
              <span className="account-name">Your account</span>
              <span className="account-label">JobPilot workspace</span>
            </div>
            <button aria-label="Log out" className="logout-button" onClick={logout} title="Log out" type="button">
              <svg aria-hidden="true" fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="18">
                <path d="M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <div className="mobile-topbar">
          <button
            aria-controls="mobile-sidebar"
            aria-expanded={mobileNavOpen}
            aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
            className="icon-button"
            onClick={() => setMobileNavOpen((open) => !open)}
            type="button"
          >
            <svg aria-hidden="true" fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" viewBox="0 0 24 24" width="20">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="mobile-brand"><BrandMark /> JobPilot</span>
        </div>
        <main className="page-container" id="main-content" tabIndex="-1">
          <PageHeader
            actions={tab === 'Dashboard' && (
              <>
                <button className="button button-secondary" onClick={() => navigate('Kanban')} type="button">Applications</button>
                <button className="button button-primary" onClick={() => navigate('Review')} type="button">Review matches</button>
              </>
            )}
            description={currentPage.description}
            title={currentPage.title}
          />
          <Page go={navigate} />
        </main>
      </div>
    </div>
  );
}
