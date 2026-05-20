import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Modal,
  TouchableWithoutFeedback, Keyboard, Platform, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp, DEFAULT_TASK_LISTS, EVENT_COLORS, Priority } from '@/context/AppContext';

type ModalType = 'note' | 'task' | 'event' | null;

interface QuickAddModalProps {
  type: ModalType;
  onClose: () => void;
  defaultDate?: Date;
}

export default function QuickAddModal({ type, onClose, defaultDate }: QuickAddModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addNote, addTask, addEvent } = useApp();
  const isWeb = Platform.OS === 'web';

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [listId, setListId] = useState('personal');
  const [eventColor, setEventColor] = useState(EVENT_COLORS[0]);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (type) {
      setTitle('');
      setPriority('medium');
      setListId('personal');
      setEventColor(EVENT_COLORS[0]);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 300, useNativeDriver: true, duration: 200 }).start();
    }
  }, [type]);

  const handleSave = () => {
    const t = title.trim();
    if (!t) { onClose(); return; }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (type === 'note') {
      const note = addNote({ title: t, content: '', tags: [], color: 'default', pinned: false });
      onClose();
      setTimeout(() => router.push(`/note/${note.id}`), 150);
    } else if (type === 'task') {
      addTask({ title: t, completed: false, priority, listId, dueDate: undefined });
      onClose();
    } else if (type === 'event') {
      const base = defaultDate ?? new Date();
      const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), new Date().getHours() + 1, 0, 0);
      const end = new Date(start.getTime() + 3600000);
      addEvent({ title: t, description: '', startDate: start.toISOString(), endDate: end.toISOString(), color: eventColor, allDay: false });
      onClose();
    }
  };

  const typeConfig = {
    note: { icon: 'file-text' as const, label: 'New note', color: colors.primary, placeholder: 'Note title...' },
    task: { icon: 'check-square' as const, label: 'New task', color: colors.accent, placeholder: 'Task title...' },
    event: { icon: 'calendar' as const, label: 'New event', color: colors.success, placeholder: 'Event title...' },
  };

  const cfg = type ? typeConfig[type] : null;

  return (
    <Modal visible={!!type} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose(); }}>
        <View style={s.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          s.sheet,
          { backgroundColor: colors.card, borderColor: colors.border, transform: [{ translateY: slideAnim }] },
          { paddingBottom: isWeb ? 24 : insets.bottom + 16 },
        ]}
      >
        {cfg && (
          <>
            <View style={s.sheetHeader}>
              <View style={s.sheetTitleRow}>
                <View style={[s.sheetIcon, { backgroundColor: cfg.color + '22' }]}>
                  <Feather name={cfg.icon} size={16} color={cfg.color} />
                </View>
                <Text style={[s.sheetTitle, { color: colors.foreground }]}>{cfg.label}</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
              placeholder={cfg.placeholder}
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            {type === 'task' && (
              <View style={s.extraRow}>
                <Text style={[s.extraLabel, { color: colors.mutedForeground }]}>Priority</Text>
                <View style={s.pillRow}>
                  {(['low', 'medium', 'high'] as Priority[]).map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[s.pill, {
                        backgroundColor: priority === p ? (p === 'high' ? colors.priorityHigh : p === 'medium' ? colors.priorityMedium : colors.priorityLow) + '30' : colors.muted,
                        borderWidth: priority === p ? 1.5 : 0,
                        borderColor: p === 'high' ? colors.priorityHigh : p === 'medium' ? colors.priorityMedium : colors.priorityLow,
                      }]}
                      onPress={() => setPriority(p)}
                    >
                      <Text style={[s.pillText, {
                        color: priority === p ? (p === 'high' ? colors.priorityHigh : p === 'medium' ? colors.priorityMedium : colors.priorityLow) : colors.mutedForeground,
                      }]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[s.extraLabel, { color: colors.mutedForeground, marginTop: 10 }]}>List</Text>
                <View style={s.pillRow}>
                  {DEFAULT_TASK_LISTS.map(l => (
                    <TouchableOpacity
                      key={l.id}
                      style={[s.pill, {
                        backgroundColor: listId === l.id ? l.color + '25' : colors.muted,
                        borderWidth: listId === l.id ? 1.5 : 0,
                        borderColor: l.color,
                      }]}
                      onPress={() => setListId(l.id)}
                    >
                      <Text style={[s.pillText, { color: listId === l.id ? l.color : colors.mutedForeground }]}>{l.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {type === 'event' && (
              <View style={s.extraRow}>
                <Text style={[s.extraLabel, { color: colors.mutedForeground }]}>Color</Text>
                <View style={s.colorRow}>
                  {EVENT_COLORS.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[s.colorDot, { backgroundColor: c, borderWidth: eventColor === c ? 2.5 : 0, borderColor: colors.foreground }]}
                      onPress={() => setEventColor(c)}
                    />
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: cfg.color }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={s.saveBtnText}>Add {type}</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingTop: 20, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'Inter_400Regular', marginBottom: 14 },
  extraRow: { marginBottom: 14 },
  extraLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  pillText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
