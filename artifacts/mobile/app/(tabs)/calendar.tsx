import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp, CalendarEvent } from '@/context/AppContext';
import QuickAddModal from '@/components/QuickAddModal';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { events } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const isWeb = Platform.OS === 'web';

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      const d = new Date(ev.startDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [events]);

  const selectedDayEvents = useMemo(() => {
    return events
      .filter(e => isSameDay(new Date(e.startDate), selectedDay))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events, selectedDay]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    Haptics.selectionAsync();
    setSelectedDay(new Date(viewYear, viewMonth, day));
  };

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: isWeb ? 67 : insets.top }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.foreground }]}>Calendar</Text>
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAdd(true)}
        >
          <Feather name="plus" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[s.calendarCard, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 22 }]}>
          <View style={s.monthHeader}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="chevron-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[s.monthTitle, { color: colors.foreground }]}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="chevron-right" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={s.weekdayRow}>
            {WEEKDAYS.map(d => (
              <Text key={d} style={[s.weekdayLabel, { color: colors.mutedForeground }]}>{d}</Text>
            ))}
          </View>

          <View style={s.grid}>
            {calendarCells.map((day, idx) => {
              if (!day) return <View key={`empty-${idx}`} style={s.dayCell} />;
              const date = new Date(viewYear, viewMonth, day);
              const isToday = isSameDay(date, today);
              const isSelected = isSameDay(date, selectedDay);
              const dayKey = `${viewYear}-${viewMonth}-${day}`;
              const dayEvents = eventsByDay[dayKey] ?? [];
              const hasEvents = dayEvents.length > 0;

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    s.dayCell,
                    isSelected && { backgroundColor: colors.primary },
                    isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 20 },
                  ]}
                  onPress={() => selectDay(day)}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    s.dayNum,
                    { color: isSelected ? colors.primaryForeground : isToday ? colors.primary : colors.foreground },
                  ]}>
                    {day}
                  </Text>
                  {hasEvents && (
                    <View style={s.dotsRow}>
                      {dayEvents.slice(0, 3).map((ev, i) => (
                        <View key={i} style={[s.dot, {
                          backgroundColor: isSelected ? colors.primaryForeground + 'AA' : ev.color,
                        }]} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[s.agendaSection, { marginHorizontal: 22, marginTop: 20 }]}>
          <Text style={[s.agendaTitle, { color: colors.foreground }]}>
            {isSameDay(selectedDay, today) ? 'Today' : selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>

          {selectedDayEvents.length === 0 ? (
            <View style={s.emptyDay}>
              <Feather name="sun" size={32} color={colors.mutedForeground} />
              <Text style={[s.emptyDayText, { color: colors.mutedForeground }]}>No events scheduled</Text>
            </View>
          ) : (
            selectedDayEvents.map(ev => (
              <TouchableOpacity
                key={ev.id}
                style={[s.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/event/${ev.id}`)}
                activeOpacity={0.78}
              >
                <View style={[s.eventColorStrip, { backgroundColor: ev.color }]} />
                <View style={s.eventBody}>
                  <Text style={[s.eventTitle, { color: colors.foreground }]}>{ev.title}</Text>
                  {ev.allDay ? (
                    <Text style={[s.eventTime, { color: colors.mutedForeground }]}>All day</Text>
                  ) : (
                    <Text style={[s.eventTime, { color: colors.mutedForeground }]}>
                      {formatTime(ev.startDate)} – {formatTime(ev.endDate)}
                    </Text>
                  )}
                  {ev.description ? (
                    <Text style={[s.eventDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {ev.description}
                    </Text>
                  ) : null}
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: isWeb ? 34 : insets.bottom + 90 }} />
      </ScrollView>

      <QuickAddModal type={showAdd ? 'event' : null} onClose={() => setShowAdd(false)} defaultDate={selectedDay} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 14 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  calendarCard: { borderRadius: 18, padding: 16, borderWidth: 1 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  monthTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  weekdayRow: { flexDirection: 'row', marginBottom: 6 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'Inter_500Medium' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%` as any, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 20, paddingVertical: 2 },
  dayNum: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  dotsRow: { flexDirection: 'row', gap: 2, marginTop: 1 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  agendaSection: {},
  agendaTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  emptyDay: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyDayText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  eventCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, marginBottom: 10, borderWidth: 1, overflow: 'hidden' },
  eventColorStrip: { width: 4, alignSelf: 'stretch' },
  eventBody: { flex: 1, padding: 14 },
  eventTitle: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  eventTime: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  eventDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },
});
