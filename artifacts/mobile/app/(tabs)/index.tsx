import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import QuickAddModal from '@/components/QuickAddModal';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notes, tasks, events } = useApp();
  const [quickAdd, setQuickAdd] = useState<'note' | 'task' | 'event' | null>(null);
  const isWeb = Platform.OS === 'web';

  const today = new Date();

  const todayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), today));
  const todayEvents = events
    .filter(e => isSameDay(new Date(e.startDate), today))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const recentNotes = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3);
  const completedToday = todayTasks.filter(t => t.completed).length;
  const focusTask = tasks.find(t => !t.completed && t.priority === 'high');

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: isWeb ? 67 : insets.top }]}>
      <View style={s.header}>
        <View>
          <Text style={[s.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
          <Text style={[s.dateText, { color: colors.foreground }]}>
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {focusTask && (
          <TouchableOpacity
            style={[s.focusCard, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}
            onPress={() => router.push('/tasks')}
            activeOpacity={0.8}
          >
            <View style={s.focusTop}>
              <Feather name="target" size={12} color={colors.primary} />
              <Text style={[s.focusLabel, { color: colors.primary }]}>FOCUS</Text>
            </View>
            <Text style={[s.focusTitle, { color: colors.foreground }]}>{focusTask.title}</Text>
            <View style={[s.priorityBadge, { backgroundColor: colors.priorityHigh + '25' }]}>
              <Text style={[s.priorityBadgeText, { color: colors.priorityHigh }]}>High priority</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: colors.foreground }]}>{tasks.filter(t => !t.completed).length}</Text>
            <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Pending</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: colors.success }]}>{completedToday}</Text>
            <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Done today</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: colors.foreground }]}>{notes.length}</Text>
            <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Notes</Text>
          </View>
        </View>

        <View style={s.quickRow}>
          <TouchableOpacity
            style={[s.quickBtn, { backgroundColor: colors.primary + '18' }]}
            onPress={() => setQuickAdd('note')}
            activeOpacity={0.75}
          >
            <Feather name="file-text" size={18} color={colors.primary} />
            <Text style={[s.quickBtnLabel, { color: colors.primary }]}>Note</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.quickBtn, { backgroundColor: colors.accent + '18' }]}
            onPress={() => setQuickAdd('task')}
            activeOpacity={0.75}
          >
            <Feather name="check-square" size={18} color={colors.accent} />
            <Text style={[s.quickBtnLabel, { color: colors.accent }]}>Task</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.quickBtn, { backgroundColor: colors.success + '18' }]}
            onPress={() => setQuickAdd('event')}
            activeOpacity={0.75}
          >
            <Feather name="calendar" size={18} color={colors.success} />
            <Text style={[s.quickBtnLabel, { color: colors.success }]}>Event</Text>
          </TouchableOpacity>
        </View>

        {todayEvents.length > 0 && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Today's schedule</Text>
            {todayEvents.map(ev => (
              <TouchableOpacity
                key={ev.id}
                style={[s.eventRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/event/${ev.id}`)}
                activeOpacity={0.75}
              >
                <View style={[s.eventBar, { backgroundColor: ev.color }]} />
                <View style={s.eventInfo}>
                  <Text style={[s.eventTitle, { color: colors.foreground }]}>{ev.title}</Text>
                  {!ev.allDay && (
                    <Text style={[s.eventTime, { color: colors.mutedForeground }]}>
                      {formatTime(ev.startDate)} – {formatTime(ev.endDate)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {todayTasks.length > 0 && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Due today</Text>
            {todayTasks.map(task => (
              <View
                key={task.id}
                style={[s.taskRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[s.taskPrio, {
                  backgroundColor: task.priority === 'high'
                    ? colors.priorityHigh
                    : task.priority === 'medium'
                      ? colors.priorityMedium
                      : colors.priorityLow,
                }]} />
                <Text style={[s.taskTitle, { color: task.completed ? colors.mutedForeground : colors.foreground },
                  task.completed && s.taskDone]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
                {task.completed && <Feather name="check" size={14} color={colors.success} />}
              </View>
            ))}
          </View>
        )}

        {recentNotes.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeaderRow}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Recent notes</Text>
              <TouchableOpacity onPress={() => router.push('/notes')}>
                <Text style={[s.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentNotes.map(note => (
              <TouchableOpacity
                key={note.id}
                style={[s.noteRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/note/${note.id}`)}
                activeOpacity={0.75}
              >
                {note.pinned && <Feather name="bookmark" size={12} color={colors.primary} />}
                <View style={s.noteInfo}>
                  <Text style={[s.noteTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {note.title || 'Untitled'}
                  </Text>
                  {note.content ? (
                    <Text style={[s.notePreview, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {note.content}
                    </Text>
                  ) : null}
                </View>
                <Text style={[s.noteDate, { color: colors.mutedForeground }]}>
                  {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: isWeb ? 34 : insets.bottom + 90 }} />
      </ScrollView>

      <QuickAddModal type={quickAdd} onClose={() => setQuickAdd(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 22, paddingBottom: 14 },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 3 },
  dateText: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  scroll: { paddingHorizontal: 22, paddingTop: 2 },
  focusCard: { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  focusTop: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  focusLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  focusTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
  priorityBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityBadgeText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1 },
  statNum: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 3 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12 },
  quickBtnLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  section: { marginBottom: 22 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
  seeAll: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  eventRow: { flexDirection: 'row', alignItems: 'stretch', borderRadius: 12, marginBottom: 8, overflow: 'hidden', borderWidth: 1 },
  eventBar: { width: 3 },
  eventInfo: { flex: 1, padding: 12 },
  eventTitle: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  eventTime: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  taskRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 13, marginBottom: 8, gap: 10, borderWidth: 1 },
  taskPrio: { width: 4, height: 18, borderRadius: 2 },
  taskTitle: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  taskDone: { textDecorationLine: 'line-through' as const },
  noteRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 13, marginBottom: 8, gap: 8, borderWidth: 1 },
  noteInfo: { flex: 1 },
  noteTitle: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  notePreview: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  noteDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
