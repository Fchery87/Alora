import type { EventType } from "../data/mock";

type P = { size?: number; stroke?: number; className?: string };

const base = (size = 22, sw = 1.6): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: sw,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const HomeIcon = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M5.5 10.5V19a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1v-8.5" />
  </svg>
);

export const LogIcon = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 8.2v7.6M8.2 12h7.6" />
  </svg>
);

export const TimelineIcon = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M7 5v14" />
    <circle cx="7" cy="8.5" r="1.6" />
    <circle cx="7" cy="15.5" r="1.6" />
    <path d="M12 8.5h6M12 15.5h6" />
  </svg>
);

export const CheckInIcon = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M12 20s-7-4.3-7-9.3A4 4 0 0 1 12 7a4 4 0 0 1 7 3.7c0 5-7 9.3-7 9.3Z" />
  </svg>
);

export const SettingsIcon = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4M17.8 17.8l-1.4-1.4M7.6 7.6 6.2 6.2" />
  </svg>
);

export const FeedIcon = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M9 2.5c2 0 3 1.4 3 3.2 0-1.8 1-3.2 3-3.2" />
    <path d="M7.5 8.5h9l-.9 9.7a3 3 0 0 1-3 2.8h-1.2a3 3 0 0 1-3-2.8L7.5 8.5Z" />
    <path d="M7.6 12.5h8.8" />
  </svg>
);

export const DiaperIcon = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M3.5 6.5h17l-1 5.5a8.5 8.5 0 0 1-15 0l-1-5.5Z" />
    <path d="M9.5 11.5c1.7 1 3.3 1 5 0" />
  </svg>
);

export const SleepIcon = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5Z" />
  </svg>
);

export const MoonIcon = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5Z" />
  </svg>
);

export const SunIcon = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6" />
  </svg>
);

export const BellIcon = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 5 2 6.5 2 6.5H4.5s2-1.5 2-6.5Z" />
    <path d="M10 19.5a2 2 0 0 0 4 0" />
  </svg>
);

export const CloudIcon = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M7 18a4 4 0 0 1-.5-7.97A5 5 0 0 1 16 9.5a3.5 3.5 0 0 1 .5 6.97" />
    <path d="M9.5 14.5 11 16l3.2-3.5" />
  </svg>
);

export const PlusIcon = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M12 6v12M6 12h12" />
  </svg>
);

export const ChevronRight = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="m9.5 6 6 6-6 6" />
  </svg>
);

export const eventIcon: Record<EventType, (p: P) => React.JSX.Element> = {
  feed: FeedIcon,
  diaper: DiaperIcon,
  sleep: SleepIcon,
};

export const eventColorVar: Record<EventType, string> = {
  feed: "var(--feed)",
  diaper: "var(--diaper)",
  sleep: "var(--sleep)",
};

export const eventTintVar: Record<EventType, string> = {
  feed: "var(--feed-tint)",
  diaper: "var(--diaper-tint)",
  sleep: "var(--sleep-tint)",
};
