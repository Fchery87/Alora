import Svg, { Circle, Path } from "react-native-svg";
import { useTheme } from "../theme/ThemeProvider";
import type { ColorTokens } from "../theme/tokens";

export type IconProps = { size?: number; color?: string; strokeWidth?: number };

function useStroke(color?: string) {
  const theme = useTheme();
  return color ?? theme.color.ink;
}

const svg = (size = 22) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const });
const stroke = (c: string, w = 1.6) => ({
  stroke: c,
  strokeWidth: w,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const HomeIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path d="M4 11.5 12 4l8 7.5" {...stroke(c, strokeWidth)} />
      <Path d="M5.5 10.5V19a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1v-8.5" {...stroke(c, strokeWidth)} />
    </Svg>
  );
};

export const LogIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Circle cx="12" cy="12" r="8.2" {...stroke(c, strokeWidth)} />
      <Path d="M12 8.2v7.6M8.2 12h7.6" {...stroke(c, strokeWidth)} />
    </Svg>
  );
};

export const TimelineIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path d="M7 5v14" {...stroke(c, strokeWidth)} />
      <Circle cx="7" cy="8.5" r="1.6" {...stroke(c, strokeWidth)} />
      <Circle cx="7" cy="15.5" r="1.6" {...stroke(c, strokeWidth)} />
      <Path d="M12 8.5h6M12 15.5h6" {...stroke(c, strokeWidth)} />
    </Svg>
  );
};

export const CheckInIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path d="M12 20s-7-4.3-7-9.3A4 4 0 0 1 12 7a4 4 0 0 1 7 3.7c0 5-7 9.3-7 9.3Z" {...stroke(c, strokeWidth)} />
    </Svg>
  );
};

export const SettingsIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Circle cx="12" cy="12" r="3" {...stroke(c, strokeWidth)} />
      <Path
        d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4M17.8 17.8l-1.4-1.4M7.6 7.6 6.2 6.2"
        {...stroke(c, strokeWidth)}
      />
    </Svg>
  );
};

export const FeedIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path d="M9 2.5c2 0 3 1.4 3 3.2 0-1.8 1-3.2 3-3.2" {...stroke(c, strokeWidth)} />
      <Path d="M7.5 8.5h9l-.9 9.7a3 3 0 0 1-3 2.8h-1.2a3 3 0 0 1-3-2.8L7.5 8.5Z" {...stroke(c, strokeWidth)} />
      <Path d="M7.6 12.5h8.8" {...stroke(c, strokeWidth)} />
    </Svg>
  );
};

export const DiaperIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path d="M3.5 6.5h17l-1 5.5a8.5 8.5 0 0 1-15 0l-1-5.5Z" {...stroke(c, strokeWidth)} />
      <Path d="M9.5 11.5c1.7 1 3.3 1 5 0" {...stroke(c, strokeWidth)} />
    </Svg>
  );
};

export const SleepIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5Z" {...stroke(c, strokeWidth)} />
    </Svg>
  );
};

export const GrowthIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path d="M8.5 3v18" {...stroke(c, strokeWidth)} />
      <Path d="M8.5 4h3.2M8.5 8h2.4M8.5 12h3.2M8.5 16h2.4M8.5 20h3.2" {...stroke(c, strokeWidth)} />
      <Path d="M16.5 6.5V8l-3.5 8v1.5H20V16l-3.5-8V6.5h-1Z" {...stroke(c, strokeWidth)} />
    </Svg>
  );
};

export const MoonIcon = SleepIcon;

export const SunIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Circle cx="12" cy="12" r="4" {...stroke(c, strokeWidth)} />
      <Path
        d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6"
        {...stroke(c, strokeWidth)}
      />
    </Svg>
  );
};

export const BellIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 5 2 6.5 2 6.5H4.5s2-1.5 2-6.5Z" {...stroke(c, strokeWidth)} />
      <Path d="M10 19.5a2 2 0 0 0 4 0" {...stroke(c, strokeWidth)} />
    </Svg>
  );
};

export const CloudIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path d="M7 18a4 4 0 0 1-.5-7.97A5 5 0 0 1 16 9.5a3.5 3.5 0 0 1 .5 6.97" {...stroke(c, strokeWidth)} />
      <Path d="M9.5 14.5 11 16l3.2-3.5" {...stroke(c, strokeWidth)} />
    </Svg>
  );
};

export const ChevronRight = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path d="m9.5 6 6 6-6 6" {...stroke(c, strokeWidth)} />
    </Svg>
  );
};

export const PlusIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path d="M12 6v12M6 12h12" {...stroke(c, strokeWidth ?? 2)} />
    </Svg>
  );
};

export const WarnIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path d="M12 4 2.5 20h19L12 4Z" {...stroke(c, strokeWidth)} />
      <Path d="M12 10v4M12 17.2v.1" {...stroke(c, strokeWidth)} />
    </Svg>
  );
};

export const RetryIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path d="M20 11A8 8 0 1 0 18 16" {...stroke(c, strokeWidth ?? 2)} />
      <Path d="M20 4v6h-6" {...stroke(c, strokeWidth ?? 2)} />
    </Svg>
  );
};

export const TrashIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"
        {...stroke(c, strokeWidth ?? 1.7)}
      />
    </Svg>
  );
};

export const DocIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path
        d="M7 3.5h7L19 8.5V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
        {...stroke(c, strokeWidth ?? 1.7)}
      />
      <Path d="M14 3.5V9h5M9.5 13h6M9.5 16.5h6" {...stroke(c, strokeWidth ?? 1.7)} />
    </Svg>
  );
};

export const SeatIcon = ({ size, color, strokeWidth }: IconProps) => {
  const c = useStroke(color);
  return (
    <Svg {...svg(size)}>
      <Path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" {...stroke(c, strokeWidth ?? 1.7)} />
      <Path
        d="M2.5 19c.6-2.6 3-4.5 6.5-4.5s5.9 1.9 6.5 4.5M16 5.5a3 3 0 0 1 0 5.6M17.5 14.7c2 .6 3.4 2.2 4 4.3"
        {...stroke(c, strokeWidth ?? 1.7)}
      />
    </Svg>
  );
};

export const eventIcon = {
  feed: FeedIcon,
  diaper: DiaperIcon,
  sleep: SleepIcon,
  growth: GrowthIcon,
} as const;

export const eventColorKey: Record<"feed" | "diaper" | "sleep" | "growth", keyof ColorTokens> = {
  feed: "feed",
  diaper: "diaper",
  sleep: "sleep",
  growth: "accent",
};
export const eventTintKey: Record<"feed" | "diaper" | "sleep" | "growth", keyof ColorTokens> = {
  feed: "feedTint",
  diaper: "diaperTint",
  sleep: "sleepTint",
  growth: "surface2",
};
