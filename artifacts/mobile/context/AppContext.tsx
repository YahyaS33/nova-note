import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type NoteColor = 'default' | 'purple' | 'blue' | 'green' | 'orange' | 'pink';
export type Priority = 'low' | 'medium' | 'high';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  color: NoteColor;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  listId: string;
  createdAt: string;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  color: string;
  allDay: boolean;
}

const genId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

export const DEFAULT_TASK_LISTS: TaskList[] = [
  { id: 'personal', name: 'Personal', color: '#7B6EF5' },
  { id: 'work', name: 'Work', color: '#5B8AF0' },
  { id: 'shopping', name: 'Shopping', color: '#30D158' },
];

export const EVENT_COLORS = ['#7B6EF5', '#5B8AF0', '#30D158', '#FF9F0A', '#FF453A', '#FF6AB2'];

function makeSampleData() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const notes: Note[] = [
    {
      id: genId(),
      title: 'Welcome to Nova Notes',
      content: 'Your premium space for ideas, tasks, and time. Everything in one calm place.',
      tags: ['welcome'],
      color: 'purple',
      pinned: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: genId(),
      title: 'Meeting notes',
      content: 'Discuss Q3 goals, review design budget, finalize product roadmap for the upcoming sprint. Invite design leads.',
      tags: ['work', 'meetings'],
      color: 'blue',
      pinned: false,
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      id: genId(),
      title: 'Reading list',
      content: 'Atomic Habits, Deep Work, The Pragmatic Programmer, Thinking Fast and Slow, Project Hail Mary',
      tags: ['books'],
      color: 'green',
      pinned: false,
      createdAt: new Date(now.getTime() - 172800000).toISOString(),
      updatedAt: new Date(now.getTime() - 172800000).toISOString(),
    },
    {
      id: genId(),
      title: 'Weekend ideas',
      content: 'Hike in the morning, visit the farmers market, try that new ramen spot downtown.',
      tags: ['personal'],
      color: 'orange',
      pinned: false,
      createdAt: new Date(now.getTime() - 259200000).toISOString(),
      updatedAt: new Date(now.getTime() - 259200000).toISOString(),
    },
  ];

  const tasks: Task[] = [
    { id: genId(), title: 'Review design mockups', completed: false, priority: 'high', dueDate: today.toISOString(), listId: 'work', createdAt: now.toISOString() },
    { id: genId(), title: 'Send weekly update email', completed: false, priority: 'high', dueDate: today.toISOString(), listId: 'work', createdAt: now.toISOString() },
    { id: genId(), title: 'Buy groceries', completed: false, priority: 'medium', dueDate: today.toISOString(), listId: 'shopping', createdAt: now.toISOString() },
    { id: genId(), title: 'Morning workout', completed: true, priority: 'medium', dueDate: today.toISOString(), listId: 'personal', createdAt: now.toISOString() },
    { id: genId(), title: 'Read for 30 minutes', completed: false, priority: 'low', listId: 'personal', createdAt: now.toISOString() },
    { id: genId(), title: 'Call dentist', completed: false, priority: 'medium', dueDate: new Date(now.getTime() + 86400000).toISOString(), listId: 'personal', createdAt: now.toISOString() },
  ];

  const events: CalendarEvent[] = [
    {
      id: genId(),
      title: 'Team standup',
      description: 'Daily sync with the team',
      startDate: new Date(today.getTime() + 10 * 3600000).toISOString(),
      endDate: new Date(today.getTime() + 10.5 * 3600000).toISOString(),
      color: '#7B6EF5',
      allDay: false,
    },
    {
      id: genId(),
      title: 'Design review',
      description: 'Review Q3 product designs',
      startDate: new Date(today.getTime() + 14 * 3600000).toISOString(),
      endDate: new Date(today.getTime() + 15 * 3600000).toISOString(),
      color: '#5B8AF0',
      allDay: false,
    },
    {
      id: genId(),
      title: 'Dinner with family',
      startDate: new Date(today.getTime() + 19 * 3600000).toISOString(),
      endDate: new Date(today.getTime() + 21 * 3600000).toISOString(),
      color: '#30D158',
      allDay: false,
    },
    {
      id: genId(),
      title: 'Sprint planning',
      startDate: new Date(today.getTime() + 86400000 + 9 * 3600000).toISOString(),
      endDate: new Date(today.getTime() + 86400000 + 11 * 3600000).toISOString(),
      color: '#FF9F0A',
      allDay: false,
    },
  ];

  return { notes, tasks, events };
}

interface AppContextType {
  notes: Note[];
  addNote: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  tasks: Task[];
  taskLists: TaskList[];
  addTask: (data: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  events: CalendarEvent[];
  addEvent: (data: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  loaded: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLists] = useState<TaskList[]>(DEFAULT_TASK_LISTS);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [n, t, e] = await Promise.all([
          AsyncStorage.getItem('nova_notes'),
          AsyncStorage.getItem('nova_tasks'),
          AsyncStorage.getItem('nova_events'),
        ]);
        const sample = makeSampleData();
        setNotes(n ? JSON.parse(n) : sample.notes);
        setTasks(t ? JSON.parse(t) : sample.tasks);
        setEvents(e ? JSON.parse(e) : sample.events);
      } catch {
        const sample = makeSampleData();
        setNotes(sample.notes);
        setTasks(sample.tasks);
        setEvents(sample.events);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem('nova_notes', JSON.stringify(notes)).catch(() => {});
  }, [notes, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem('nova_tasks', JSON.stringify(tasks)).catch(() => {});
  }, [tasks, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem('nova_events', JSON.stringify(events)).catch(() => {});
  }, [events, loaded]);

  const addNote = useCallback((data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const note: Note = { ...data, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setNotes(prev => [note, ...prev]);
    return note;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const addTask = useCallback((data: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = { ...data, id: genId(), createdAt: new Date().toISOString() };
    setTasks(prev => [task, ...prev]);
    return task;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, []);

  const addEvent = useCallback((data: Omit<CalendarEvent, 'id'>) => {
    const event: CalendarEvent = { ...data, id: genId() };
    setEvents(prev => [event, ...prev]);
    return event;
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      notes, addNote, updateNote, deleteNote,
      tasks, taskLists, addTask, updateTask, deleteTask, toggleTask,
      events, addEvent, updateEvent, deleteEvent,
      loaded,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
