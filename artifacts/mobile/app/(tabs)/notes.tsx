import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp, Note } from '@/context/AppContext';
import QuickAddModal from '@/components/QuickAddModal';

export default function NotesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notes } = useApp();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const isWeb = Platform.OS === 'web';

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [notes, search]);

  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAdd(true);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: isWeb ? 67 : insets.top }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.foreground }]}>Notes</Text>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.primary }]} onPress={handleAdd}>
          <Feather name="plus" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <View style={[s.searchContainer, { backgroundColor: colors.input, marginHorizontal: 22 }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[s.searchInput, { color: colors.foreground }]}
          placeholder="Search notes..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {pinned.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Feather name="bookmark" size={12} color={colors.mutedForeground} />
              <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>PINNED</Text>
            </View>
            {pinned.map(note => (
              <NoteCard key={note.id} note={note} onPress={() => router.push(`/note/${note.id}`)} />
            ))}
          </View>
        )}

        {unpinned.length > 0 && (
          <View style={s.section}>
            {pinned.length > 0 && (
              <View style={s.sectionHeader}>
                <Feather name="file-text" size={12} color={colors.mutedForeground} />
                <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>ALL NOTES</Text>
              </View>
            )}
            {unpinned.map(note => (
              <NoteCard key={note.id} note={note} onPress={() => router.push(`/note/${note.id}`)} />
            ))}
          </View>
        )}

        {filtered.length === 0 && (
          <View style={s.emptyState}>
            <Feather name="file-text" size={44} color={colors.mutedForeground} />
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>
              {search ? 'No results found' : 'No notes yet'}
            </Text>
            <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
              {search ? 'Try a different search term' : 'Tap + to create your first note'}
            </Text>
          </View>
        )}

        <View style={{ height: isWeb ? 34 : insets.bottom + 90 }} />
      </ScrollView>

      <QuickAddModal type={showAdd ? 'note' : null} onClose={() => setShowAdd(false)} />
    </View>
  );
}

function NoteCard({ note, onPress }: { note: Note; onPress: () => void }) {
  const colors = useColors();
  const bg = colors.noteColors[note.color] ?? colors.card;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[nc.card, { backgroundColor: bg, borderColor: colors.border }]}
      activeOpacity={0.78}
    >
      <View style={nc.topRow}>
        {note.title ? (
          <Text style={[nc.title, { color: colors.foreground }]} numberOfLines={1}>{note.title}</Text>
        ) : null}
        {note.pinned && <Feather name="bookmark" size={13} color={colors.primary} />}
      </View>
      {note.content ? (
        <Text style={[nc.preview, { color: colors.mutedForeground }]} numberOfLines={2}>{note.content}</Text>
      ) : null}
      <View style={nc.footer}>
        <Text style={[nc.date, { color: colors.mutedForeground }]}>
          {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        {note.tags.length > 0 && (
          <View style={nc.tags}>
            {note.tags.slice(0, 2).map(tag => (
              <View key={tag} style={[nc.tag, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[nc.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const nc = StyleSheet.create({
  card: { borderRadius: 14, padding: 15, marginBottom: 10, borderWidth: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  title: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', marginRight: 8 },
  preview: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginBottom: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  tags: { flexDirection: 'row', gap: 5 },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  tagText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
});

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 14 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 16, gap: 9 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  scroll: { paddingHorizontal: 22, paddingTop: 2 },
  section: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
});
