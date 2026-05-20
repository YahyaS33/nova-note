import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp, NoteColor } from '@/context/AppContext';

const NOTE_COLORS: NoteColor[] = ['default', 'purple', 'blue', 'green', 'orange', 'pink'];

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notes, addNote, updateNote, deleteNote } = useApp();
  const isWeb = Platform.OS === 'web';

  const isNew = id === 'new';
  const existing = notes.find(n => n.id === id);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [color, setColor] = useState<NoteColor>(existing?.color ?? 'default');
  const [pinned, setPinned] = useState(existing?.pinned ?? false);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [noteId, setNoteId] = useState<string | null>(isNew ? null : (id ?? null));

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoSave = (t: string, c: string, col: NoteColor, pin: boolean, tgs: string[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (noteId) {
        updateNote(noteId, { title: t, content: c, color: col, pinned: pin, tags: tgs });
      } else if (t || c) {
        const n = addNote({ title: t, content: c, color: col, pinned: pin, tags: tgs });
        setNoteId(n.id);
      }
    }, 600);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    autoSave(val, content, color, pinned, tags);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    autoSave(title, val, color, pinned, tags);
  };

  const handleColorChange = (c: NoteColor) => {
    setColor(c);
    Haptics.selectionAsync();
    if (noteId) updateNote(noteId, { color: c });
    else if (title || content) {
      const n = addNote({ title, content, color: c, pinned, tags });
      setNoteId(n.id);
    }
  };

  const handlePinToggle = () => {
    const newPinned = !pinned;
    setPinned(newPinned);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (noteId) updateNote(noteId, { pinned: newPinned });
    else if (title || content) {
      const n = addNote({ title, content, color, pinned: newPinned, tags });
      setNoteId(n.id);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag || tags.includes(tag)) { setTagInput(''); return; }
    const newTags = [...tags, tag];
    setTags(newTags);
    setTagInput('');
    if (noteId) updateNote(noteId, { tags: newTags });
  };

  const handleDelete = () => {
    Alert.alert('Delete note', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          if (noteId) deleteNote(noteId);
          router.back();
        },
      },
    ]);
  };

  const handleBack = () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      if (noteId) {
        updateNote(noteId, { title, content, color, pinned, tags });
      } else if (title || content) {
        addNote({ title, content, color, pinned, tags });
      }
    }
    router.back();
  };

  const bg = colors.noteColors[color] ?? colors.background;

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[s.topBar, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.topActions}>
          <TouchableOpacity onPress={handlePinToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name={pinned ? 'bookmark' : 'bookmark'} size={20} color={pinned ? colors.primary : colors.mutedForeground} />
          </TouchableOpacity>
          {noteId && (
            <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="trash-2" size={20} color={colors.destructive} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: isWeb ? 100 : insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={[s.titleInput, { color: colors.foreground }]}
          placeholder="Title"
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={handleTitleChange}
          multiline
          blurOnSubmit={false}
          returnKeyType="next"
          autoFocus={isNew}
        />

        {existing?.updatedAt && !isNew && (
          <Text style={[s.timestamp, { color: colors.mutedForeground }]}>
            {new Date(existing.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </Text>
        )}

        <TextInput
          style={[s.contentInput, { color: colors.foreground }]}
          placeholder="Start writing..."
          placeholderTextColor={colors.mutedForeground}
          value={content}
          onChangeText={handleContentChange}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
        />
      </ScrollView>

      <View style={[s.toolbar, { backgroundColor: bg, borderTopColor: colors.border, paddingBottom: isWeb ? 20 : insets.bottom + 8 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.colorRow} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {NOTE_COLORS.map(c => (
            <TouchableOpacity
              key={c}
              style={[s.colorDot, {
                backgroundColor: colors.noteColors[c] ?? colors.card,
                borderWidth: color === c ? 2 : 1,
                borderColor: color === c ? colors.primary : colors.border,
              }]}
              onPress={() => handleColorChange(c)}
            />
          ))}
        </ScrollView>

        <View style={s.tagRow}>
          {tags.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[s.tag, { backgroundColor: colors.primary + '22' }]}
              onPress={() => {
                const newTags = tags.filter(t => t !== tag);
                setTags(newTags);
                if (noteId) updateNote(noteId, { tags: newTags });
              }}
            >
              <Text style={[s.tagText, { color: colors.primary }]}>{tag}</Text>
              <Feather name="x" size={10} color={colors.primary} />
            </TouchableOpacity>
          ))}
          <TextInput
            style={[s.tagInput, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="Add tag..."
            placeholderTextColor={colors.mutedForeground}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={handleAddTag}
            blurOnSubmit={false}
            returnKeyType="done"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 12 },
  topActions: { flexDirection: 'row', gap: 16 },
  scroll: { paddingHorizontal: 22, paddingTop: 4 },
  titleInput: { fontSize: 26, fontFamily: 'Inter_700Bold', lineHeight: 34, marginBottom: 6, minHeight: 40 },
  timestamp: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 18 },
  contentInput: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 26, minHeight: 200 },
  toolbar: { borderTopWidth: 1, paddingHorizontal: 22, paddingTop: 12 },
  colorRow: { marginBottom: 10 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  tagInput: { fontSize: 12, fontFamily: 'Inter_400Regular', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, minWidth: 80 },
});
