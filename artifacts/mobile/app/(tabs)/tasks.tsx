import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp, Task, DEFAULT_TASK_LISTS, Priority } from '@/context/AppContext';
import QuickAddModal from '@/components/QuickAddModal';

type Filter = 'all' | 'active' | 'done';

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function TaskItemRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const colors = useColors();
  const prioColor = task.priority === 'high'
    ? colors.priorityHigh
    : task.priority === 'medium'
      ? colors.priorityMedium
      : colors.priorityLow;

  const list = DEFAULT_TASK_LISTS.find(l => l.id === task.listId);
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  return (
    <View style={[ti.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(); }}
        style={[ti.check, {
          borderColor: task.completed ? colors.success : prioColor,
          backgroundColor: task.completed ? colors.success + '22' : 'transparent',
        }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {task.completed && <Feather name="check" size={11} color={colors.success} />}
      </TouchableOpacity>

      <View style={ti.info}>
        <Text style={[ti.title, { color: task.completed ? colors.mutedForeground : colors.foreground }, task.completed && ti.strikethrough]} numberOfLines={1}>
          {task.title}
        </Text>
        <View style={ti.meta}>
          {task.dueDate && (
            <View style={ti.metaItem}>
              <Feather name="clock" size={10} color={isOverdue ? colors.priorityHigh : colors.mutedForeground} />
              <Text style={[ti.metaText, { color: isOverdue ? colors.priorityHigh : colors.mutedForeground }]}>
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          )}
          {list && (
            <View style={ti.metaItem}>
              <View style={[ti.listDot, { backgroundColor: list.color }]} />
              <Text style={[ti.metaText, { color: colors.mutedForeground }]}>{list.name}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[ti.prioBadge, { backgroundColor: prioColor + '22' }]}>
        <Text style={[ti.prioText, { color: prioColor }]}>
          {task.priority === 'high' ? '!!' : task.priority === 'medium' ? '!' : ''}
        </Text>
      </View>
    </View>
  );
}

const ti = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 13, padding: 13, marginBottom: 8, gap: 11, borderWidth: 1 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'Inter_500Medium', lineHeight: 20 },
  strikethrough: { textDecorationLine: 'line-through' as const },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 3 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listDot: { width: 6, height: 6, borderRadius: 3 },
  metaText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  prioBadge: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  prioText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
});

export default function TasksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, toggleTask, taskLists } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [activeList, setActiveList] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const isWeb = Platform.OS === 'web';

  const filtered = useMemo(() => {
    let t = tasks;
    if (activeList !== 'all') t = t.filter(x => x.listId === activeList);
    if (filter === 'active') t = t.filter(x => !x.completed);
    if (filter === 'done') t = t.filter(x => x.completed);
    return [...t].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    });
  }, [tasks, filter, activeList]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: isWeb ? 67 : insets.top }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.foreground }]}>Tasks</Text>
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAdd(true); }}
        >
          <Feather name="plus" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <View style={[s.progressCard, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 22 }]}>
        <View style={s.progressHeader}>
          <Text style={[s.progressLabel, { color: colors.mutedForeground }]}>Overall progress</Text>
          <Text style={[s.progressCount, { color: colors.foreground }]}>{completedCount}/{totalCount}</Text>
        </View>
        <View style={[s.progressTrack, { backgroundColor: colors.muted }]}>
          <View style={[s.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` as any }]} />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.listScroll} contentContainerStyle={s.listScrollContent}>
        {[{ id: 'all', name: 'All', color: colors.primary }, ...taskLists].map(list => (
          <TouchableOpacity
            key={list.id}
            style={[s.listChip, {
              backgroundColor: activeList === list.id ? list.color : colors.card,
              borderColor: activeList === list.id ? list.color : colors.border,
            }]}
            onPress={() => setActiveList(list.id)}
          >
            <Text style={[s.listChipText, { color: activeList === list.id ? '#fff' : colors.mutedForeground }]}>
              {list.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[s.filterRow, { marginHorizontal: 22, marginBottom: 14 }]}>
        {(['all', 'active', 'done'] as Filter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, { backgroundColor: filter === f ? colors.primary + '20' : 'transparent' }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterBtnText, { color: filter === f ? colors.primary : colors.mutedForeground }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingHorizontal: 22 }]}>
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Feather name="check-circle" size={44} color={colors.mutedForeground} />
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>
              {filter === 'done' ? 'Nothing completed yet' : 'All clear!'}
            </Text>
            <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
              {filter === 'done' ? 'Complete tasks to see them here' : 'Tap + to add a task'}
            </Text>
          </View>
        ) : (
          filtered.map(task => (
            <TaskItemRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
          ))
        )}
        <View style={{ height: isWeb ? 34 : insets.bottom + 90 }} />
      </ScrollView>

      <QuickAddModal type={showAdd ? 'task' : null} onClose={() => setShowAdd(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 14 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  progressCard: { borderRadius: 16, padding: 15, marginBottom: 14, borderWidth: 1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  progressCount: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  listScroll: { marginBottom: 12 },
  listScrollContent: { paddingHorizontal: 22, gap: 8 },
  listChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  listChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  filterRow: { flexDirection: 'row', gap: 4 },
  filterBtn: { flex: 1, paddingVertical: 7, borderRadius: 10, alignItems: 'center' },
  filterBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  scroll: { paddingTop: 2 },
  empty: { alignItems: 'center', paddingTop: 64, gap: 10 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
