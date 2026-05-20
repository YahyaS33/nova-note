import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp, EVENT_COLORS } from '@/context/AppContext';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { events, addEvent, updateEvent, deleteEvent } = useApp();
  const isWeb = Platform.OS === 'web';

  const isNew = id === 'new';
  const existing = events.find(e => e.id === id);

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
  const defaultEnd = new Date(defaultStart.getTime() + 3600000);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [startDate, setStartDate] = useState(existing?.startDate ?? defaultStart.toISOString());
  const [endDate, setEndDate] = useState(existing?.endDate ?? defaultEnd.toISOString());
  const [selectedColor, setSelectedColor] = useState(existing?.color ?? EVENT_COLORS[0]);
  const [allDay, setAllDay] = useState(existing?.allDay ?? false);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Add a title', 'Please enter an event title.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isNew) {
      addEvent({ title: title.trim(), description: description.trim(), startDate, endDate, color: selectedColor, allDay });
    } else if (existing) {
      updateEvent(existing.id, { title: title.trim(), description: description.trim(), startDate, endDate, color: selectedColor, allDay });
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete event', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          if (existing) deleteEvent(existing.id);
          router.back();
        },
      },
    ]);
  };

  const adjustTime = (current: string, hoursOffset: number) => {
    return new Date(new Date(current).getTime() + hoursOffset * 3600000).toISOString();
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.topBar, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.screenTitle, { color: colors.foreground }]}>{isNew ? 'New event' : 'Edit event'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[s.saveBtn, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: isWeb ? 60 : insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[s.titleInput, { color: colors.foreground, borderBottomColor: colors.border }]}
            placeholder="Event title"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            autoFocus={isNew}
            returnKeyType="next"
          />
          <TextInput
            style={[s.descInput, { color: colors.foreground }]}
            placeholder="Add description..."
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.row}>
            <Feather name="sun" size={16} color={colors.mutedForeground} />
            <Text style={[s.rowLabel, { color: colors.foreground }]}>All day</Text>
            <TouchableOpacity
              style={[s.toggle, { backgroundColor: allDay ? colors.primary : colors.muted }]}
              onPress={() => { setAllDay(!allDay); Haptics.selectionAsync(); }}
            >
              <View style={[s.toggleThumb, { left: allDay ? 18 : 2 }]} />
            </TouchableOpacity>
          </View>
        </View>

        {!allDay && (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.timeBlock}>
              <View style={s.timeRow}>
                <Text style={[s.timeLabel, { color: colors.mutedForeground }]}>Start</Text>
                <Text style={[s.timeValue, { color: colors.foreground }]}>{formatDateTime(startDate)}</Text>
              </View>
              <View style={s.timeAdjust}>
                <TouchableOpacity style={[s.adjustBtn, { backgroundColor: colors.muted }]} onPress={() => setStartDate(adjustTime(startDate, -1))}>
                  <Feather name="minus" size={14} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[s.adjustLabel, { color: colors.mutedForeground }]}>1 hr</Text>
                <TouchableOpacity style={[s.adjustBtn, { backgroundColor: colors.muted }]} onPress={() => setStartDate(adjustTime(startDate, 1))}>
                  <Feather name="plus" size={14} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[s.divider, { backgroundColor: colors.border }]} />

            <View style={s.timeBlock}>
              <View style={s.timeRow}>
                <Text style={[s.timeLabel, { color: colors.mutedForeground }]}>End</Text>
                <Text style={[s.timeValue, { color: colors.foreground }]}>{formatDateTime(endDate)}</Text>
              </View>
              <View style={s.timeAdjust}>
                <TouchableOpacity style={[s.adjustBtn, { backgroundColor: colors.muted }]} onPress={() => setEndDate(adjustTime(endDate, -1))}>
                  <Feather name="minus" size={14} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[s.adjustLabel, { color: colors.mutedForeground }]}>1 hr</Text>
                <TouchableOpacity style={[s.adjustBtn, { backgroundColor: colors.muted }]} onPress={() => setEndDate(adjustTime(endDate, 1))}>
                  <Feather name="plus" size={14} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Color</Text>
          <View style={s.colorRow}>
            {EVENT_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.colorDot, { backgroundColor: c, borderWidth: selectedColor === c ? 2.5 : 0, borderColor: colors.foreground }]}
                onPress={() => { setSelectedColor(c); Haptics.selectionAsync(); }}
              />
            ))}
          </View>
        </View>

        {!isNew && (
          <TouchableOpacity style={[s.deleteBtn, { borderColor: colors.destructive + '50' }]} onPress={handleDelete}>
            <Feather name="trash-2" size={16} color={colors.destructive} />
            <Text style={[s.deleteBtnText, { color: colors.destructive }]}>Delete event</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 14 },
  screenTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  saveBtn: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  scroll: { paddingHorizontal: 22, paddingTop: 8, gap: 12 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  titleInput: { fontSize: 20, fontFamily: 'Inter_600SemiBold', paddingBottom: 12, borderBottomWidth: 1, marginBottom: 10 },
  descInput: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, minHeight: 50 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  toggle: { width: 42, height: 24, borderRadius: 12 },
  toggleThumb: { position: 'absolute', top: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  timeBlock: { paddingVertical: 4 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timeLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  timeValue: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  timeAdjust: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  adjustBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  adjustLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1, textAlign: 'center' },
  divider: { height: 1, marginVertical: 10 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, marginBottom: 12 },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginTop: 4 },
  deleteBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
