import { useEffect, useMemo, useState } from "react";
import { StyleSheet, TextInput, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";
import { useFocusEffect } from "expo-router";
import { useTheme } from "../theme/ThemeProvider";
import { ModalScreen } from "../components/ModalScreen";
import { AppText, Card, PressableScale, Skeleton } from "../components/Themed";
import { GrowthIcon } from "../components/icons";
import { saveBabyProfile, useBabyStatus, useTimeline } from "../data/useData";
import { getStoredBabySex, saveStoredBabySex, type BabySexChoice } from "../data/localBabySexStore";
import { percentile, valueAtPercentile } from "../lib/growth/percentile";
import type { BabySex, GrowthMeasure } from "../lib/growth/wholms";
import type { CareEvent } from "../data/repository";

const MEASURES: { id: GrowthMeasure; label: string; subtype: string }[] = [
  { id: "weight", label: "Weight", subtype: "Weight" },
  { id: "length", label: "Length", subtype: "Length" },
  { id: "head", label: "Head", subtype: "Head circumference" },
];

const UNIT: Record<GrowthMeasure, string> = { weight: "kg", length: "cm", head: "cm" };

const MONTHS_PER_MS = 1 / (1000 * 60 * 60 * 24 * 30.4375);

function ageInMonths(at: Date, birthDate: Date): number {
  return (at.getTime() - birthDate.getTime()) * MONTHS_PER_MS;
}

interface GrowthPoint {
  event: CareEvent;
  ageMonths: number;
  value: number;
}

export default function GrowthScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const baby = useBabyStatus();
  const timeline = useTimeline();
  const [measure, setMeasure] = useState<GrowthMeasure>("weight");
  const [sex, setSex] = useState<BabySexChoice | null>(null);
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthError, setBirthError] = useState<string | null>(null);
  const [savingBirth, setSavingBirth] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getStoredBabySex().then((stored) => {
      if (!cancelled) setSex(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(() => {
    timeline.reload();
  });

  const subtype = MEASURES.find((m) => m.id === measure)!.subtype;

  const points = useMemo<GrowthPoint[]>(() => {
    if (timeline.status !== "ready") return [];
    return timeline.data
      .filter((e) => e.type === "growth" && e.subtype === subtype && e.quantity != null)
      .map((event) => ({
        event,
        ageMonths: Math.max(0, ageInMonths(event.at, baby.data?.birthDate ?? new Date())),
        value: parseFloat(event.quantity!),
      }))
      .filter((p) => Number.isFinite(p.value))
      .sort((a, b) => a.ageMonths - b.ageMonths);
  }, [timeline.status, timeline.data, subtype, baby.data]);

  if (baby.status === "loading" || timeline.status === "loading") {
    return (
      <ModalScreen title="Growth">
        <Skeleton style={{ width: "100%", height: 220, borderRadius: theme.radius.lg }} />
        <Skeleton style={{ width: "70%", height: 16, marginTop: 16, borderRadius: 8 }} />
      </ModalScreen>
    );
  }

  const birthDate = baby.status === "ready" ? baby.data.birthDate : undefined;
  const latest = points.length ? points[points.length - 1] : null;
  const latestPercentile = latest && sex && birthDate ? percentile(measure, sex, latest.ageMonths, latest.value) : NaN;

  async function saveBirthDate() {
    if (savingBirth) return;
    const month = Number(birthMonth);
    const day = Number(birthDay);
    const year = Number(birthYear);
    if (!month || !day || !year || month < 1 || month > 12 || day < 1 || day > 31) {
      setBirthError("Enter a valid date (month, day, year).");
      return;
    }
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() > Date.now()) {
      setBirthError("That date doesn’t look right — it can’t be in the future.");
      return;
    }
    setSavingBirth(true);
    setBirthError(null);
    try {
      await saveBabyProfile({
        name: baby.status === "ready" ? baby.data.name : "Baby",
        ageLabel: baby.status === "ready" ? baby.data.ageLabel : "",
        birthDate: parsed,
      });
      baby.reload();
    } catch (err) {
      setBirthError(err instanceof Error ? err.message : "Couldn't save the birth date.");
    } finally {
      setSavingBirth(false);
    }
  }

  return (
    <ModalScreen title="Growth">
      <View
        style={{
          flexDirection: "row",
          gap: 6,
          padding: 5,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.color.surfaceSunken,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.color.line,
        }}
      >
        {MEASURES.map((m) => {
          const on = m.id === measure;
          return (
            <PressableScale
              key={m.id}
              scale={0.95}
              haptic="selection"
              onPress={() => setMeasure(m.id)}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 9,
                borderRadius: theme.radius.md,
                backgroundColor: on ? theme.color.accent : "transparent",
              }}
            >
              <AppText variant="label" weight="semibold" style={{ color: on ? "#fff" : theme.color.inkSoft }}>
                {m.label}
              </AppText>
            </PressableScale>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }}>
        <AppText variant="caption" color="inkSoft">
          Reference sex:
        </AppText>
        {(["boy", "girl"] as BabySexChoice[]).map((option) => {
          const on = sex === option;
          return (
            <PressableScale
              key={option}
              scale={0.96}
              haptic="selection"
              onPress={() => {
                setSex(option);
                saveStoredBabySex(option);
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: on ? theme.color.surface2 : "transparent",
                borderWidth: 1.5,
                borderColor: on ? theme.color.accent : theme.color.line,
              }}
            >
              <AppText variant="label" weight="semibold" style={{ color: on ? theme.color.ink : theme.color.inkSoft }}>
                {option === "boy" ? "Boy" : "Girl"}
              </AppText>
            </PressableScale>
          );
        })}
      </View>

      {!birthDate ? (
        <View style={{ paddingVertical: 24 }}>
          <AppText variant="body" color="inkSoft" style={{ textAlign: "center" }}>
            Growth charts compare against the WHO reference, so they need{"\n"}
            {baby.status === "ready" && baby.data.name ? `${baby.data.name}’s ` : "your baby’s "}birth date.
          </AppText>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
            {[
              { label: "Month", value: birthMonth, set: setBirthMonth, max: 2, placeholder: "MM" },
              { label: "Day", value: birthDay, set: setBirthDay, max: 2, placeholder: "DD" },
              { label: "Year", value: birthYear, set: setBirthYear, max: 4, placeholder: "YYYY" },
            ].map((field) => (
              <View key={field.label} style={{ flex: 1 }}>
                <AppText variant="caption" color="inkSoft" style={{ marginBottom: 6 }}>
                  {field.label}
                </AppText>
                <TextInput
                  value={field.value}
                  onChangeText={(text) => field.set(text.replace(/[^0-9]/g, "").slice(0, field.max))}
                  keyboardType="number-pad"
                  placeholder={field.placeholder}
                  placeholderTextColor={theme.color.inkFaint}
                  style={{
                    paddingVertical: 12,
                    borderRadius: theme.radius.lg,
                    backgroundColor: theme.color.surface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.color.line,
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "600",
                    color: theme.color.ink,
                  }}
                />
              </View>
            ))}
          </View>
          {birthError && (
            <AppText variant="caption" color="danger" style={{ marginTop: 10, textAlign: "center" }}>
              {birthError}
            </AppText>
          )}
          <PressableScale
            scale={0.98}
            disabled={savingBirth}
            onPress={saveBirthDate}
            style={{
              marginTop: 16,
              paddingVertical: 14,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.color.accent,
              alignItems: "center",
              opacity: savingBirth ? 0.7 : 1,
            }}
          >
            <AppText variant="heading" weight="bold" style={{ color: "#fff" }}>
              {savingBirth ? "Saving…" : "Save birth date"}
            </AppText>
          </PressableScale>
        </View>
      ) : points.length === 0 ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              backgroundColor: theme.color.surface2,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <GrowthIcon size={28} color={theme.color.accent} />
          </View>
          <AppText display variant="title" weight="medium">
            No measurements yet
          </AppText>
          <AppText variant="body" color="inkSoft" style={{ textAlign: "center", marginTop: 8 }}>
            Log weight, length, or head circumference from the Log tab — they’ll chart here against the WHO reference.
          </AppText>
        </View>
      ) : (
        <>
          {latest && (
            <Card style={{ marginTop: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.color.accent + "22",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <GrowthIcon size={20} color={theme.color.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body" weight="semibold">
                  Latest {subtype.toLowerCase()}: {latest.value} {UNIT[measure]}
                </AppText>
                <AppText variant="caption" color="inkSoft">
                  {sex
                    ? `${Math.round(latestPercentile)}th percentile at ${Math.round(latest.ageMonths * 10) / 10} months (WHO reference)`
                    : "Pick a reference sex above to see the percentile"}
                </AppText>
              </View>
            </Card>
          )}
          <GrowthChart measure={measure} sex={sex ?? "boy"} points={points} width={width - 64} />
          <AppText variant="caption" color="inkFaint" style={{ marginTop: 14, textAlign: "center", lineHeight: 17 }}>
            Percentiles compare with WHO Child Growth Standards (2006). Informational only — not medical advice.{"\n"}
            Faint lines: 3rd / 50th / 97th percentiles.
          </AppText>
        </>
      )}
    </ModalScreen>
  );
}

function GrowthChart({
  measure,
  sex,
  points,
  width,
}: {
  measure: GrowthMeasure;
  sex: BabySex;
  points: GrowthPoint[];
  width: number;
}) {
  const theme = useTheme();
  const HEIGHT = 230;
  const PAD = { top: 14, right: 10, bottom: 26, left: 40 };

  const { min, max } = useMemo(() => {
    const lo = valueAtPercentile(measure, sex, 0, 3);
    const hi = valueAtPercentile(measure, sex, 24, 97);
    const pad = (hi - lo) * 0.08;
    return { min: lo - pad, max: hi + pad };
  }, [measure, sex]);

  const x = (ageMonths: number) => PAD.left + (ageMonths / 24) * (width - PAD.left - PAD.right);
  const y = (value: number) => PAD.top + (1 - (value - min) / (max - min)) * (HEIGHT - PAD.top - PAD.bottom);

  const curve = (p: number) =>
    Array.from({ length: 25 }, (_, m) => `${x(m)},${y(valueAtPercentile(measure, sex, m, p))}`).join(" ");

  const series = points.map((p) => `${x(p.ageMonths)},${y(p.value)}`).join(" ");

  const gridLines = [0, 6, 12, 18, 24].map((m) => ({ m, px: x(m) }));

  return (
    <View
      style={{
        marginTop: 18,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.color.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.color.line,
        padding: 10,
      }}
    >
      <Svg width={width - 20} height={HEIGHT}>
        {gridLines.map(({ m, px }) => (
          <Line
            key={m}
            x1={px}
            y1={PAD.top}
            x2={px}
            y2={HEIGHT - PAD.bottom}
            stroke={theme.color.line}
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        ))}
        <Polyline
          points={curve(3)}
          fill="none"
          stroke={theme.color.lineStrong}
          strokeWidth={1.4}
          strokeDasharray="2 4"
        />
        <Polyline points={curve(50)} fill="none" stroke={theme.color.inkFaint} strokeWidth={1.6} />
        <Polyline
          points={curve(97)}
          fill="none"
          stroke={theme.color.lineStrong}
          strokeWidth={1.4}
          strokeDasharray="2 4"
        />
        {points.length > 1 && <Polyline points={series} fill="none" stroke={theme.color.accent} strokeWidth={2} />}
        {points.map((p) => (
          <Circle
            key={p.event.id}
            cx={x(p.ageMonths)}
            cy={y(p.value)}
            r={4.5}
            fill={theme.color.accent}
            stroke={theme.color.surface}
            strokeWidth={2}
          />
        ))}
        {gridLines.map(({ m, px }) => (
          <SvgText key={m} x={px} y={HEIGHT - 8} fontSize={10} fill={theme.color.inkFaint} textAnchor="middle">
            {m}m
          </SvgText>
        ))}
        <SvgText x={PAD.left - 4} y={PAD.top + 8} fontSize={10} fill={theme.color.inkFaint} textAnchor="end">
          {max.toFixed(1)}
        </SvgText>
        <SvgText
          x={PAD.left - 4}
          y={HEIGHT - PAD.bottom - 4}
          fontSize={10}
          fill={theme.color.inkFaint}
          textAnchor="end"
        >
          {min.toFixed(1)}
        </SvgText>
      </Svg>
    </View>
  );
}
