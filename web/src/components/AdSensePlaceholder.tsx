import React from 'react';

interface AdSensePlaceholderProps {
  slotName?: string;
  format?: 'banner' | 'leaderboard' | 'rectangle';
}

export const AdSensePlaceholder: React.FC<AdSensePlaceholderProps> = ({
  slotName = 'Top Responsive Banner',
  format = 'leaderboard',
}) => {
  return (
    <aside
      className={`adsense-placeholder-container format-${format}`}
      aria-label="Advertisement Banner Placeholder"
    >
      <div className="adsense-border-box">
        <span className="adsense-tag">ADVERTISEMENT</span>
        <div className="adsense-inner-content">
          <p className="adsense-title">Google AdSense Placement Slot</p>
          <p className="adsense-meta">
            Slot: {slotName} • Ready for <code className="code-badge">&lt;ins class="adsbygoogle"&gt;</code> integration
          </p>
        </div>
      </div>
    </aside>
  );
};
