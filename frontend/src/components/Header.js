import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import WavesRounded from '@mui/icons-material/WavesRounded';
import BubbleChartRounded from '@mui/icons-material/BubbleChartRounded';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import DarkModeRounded from '@mui/icons-material/DarkModeRounded';

function IconToggle({ label, pressed, onClick, children }) {
  return (
    <button
      type="button"
      className={`icon-btn ${pressed ? 'is-active' : ''}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
    >
      {children}
    </button>
  );
}

export default function Header({ isDark, onToggleTheme, waves, onToggleWaves, particles, onToggleParticles }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <DescriptionRounded fontSize="small" />
          </span>
          <span className="brand-name">Resume Analyzer</span>
        </div>

        <div className="topbar-actions">
          <IconToggle label="Wave background" pressed={waves} onClick={onToggleWaves}>
            <WavesRounded fontSize="small" />
          </IconToggle>
          <IconToggle label="Particle background" pressed={particles} onClick={onToggleParticles}>
            <BubbleChartRounded fontSize="small" />
          </IconToggle>
          <span className="topbar-divider" aria-hidden="true" />
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <LightModeRounded fontSize="small" /> : <DarkModeRounded fontSize="small" />}
          </button>
        </div>
      </div>
    </header>
  );
}
