export type Exam = { id: string; subject: string; course: string; department: string; duration: number; priority: string };
export type Student = { id: string; name: string; roll: string; course: string; department: string; examIds: string[] };
export type Room = { id: string; building: string; floor: number; capacity: number; type: string; available: boolean };
export type Slot = { id: string; date: string; start: string; end: string; available: boolean };
export type Dataset = { exams: Exam[]; students: Student[]; rooms: Room[]; slots: Slot[] };
export type Ordering = 'degree' | 'sequential' | 'students';
export type Step = { examId: string; neighbors: string[]; used: number[]; chosen: number; available: number[] };
export type Coloring = { colors: Record<string, number>; steps: Step[]; order: string[]; colorCount: number; executionTime: number };
export type Allocation = { examId: string; slotId: string | null; roomId: string | null; reason?: string };
export type Validation = { conflicts: string[]; rooms: string[]; capacity: string[]; missing: string[]; valid: boolean };

export function createGraph(data: Dataset) {
  const graph: Record<string, string[]> = Object.fromEntries(data.exams.map(e => [e.id, []]));
  const pairs = new Set<string>();
  for (const student of data.students) {
    const ids = [...new Set(student.examIds.filter(id => graph[id]))];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      if (a && b) pairs.add([a, b].sort().join('|'));
    }
  }
  for (const pair of pairs) {
    const [a, b] = pair.split('|');
    if (a && b) { graph[a]?.push(b); graph[b]?.push(a); }
  }
  return { graph, edges: [...pairs].map(pair => pair.split('|') as [string, string]) };
}
export function greedyGraphColoring(data: Dataset, graph: Record<string, string[]>, ordering: Ordering): Coloring {
  const start = performance.now();
  const counts = Object.fromEntries(data.exams.map(e => [e.id, data.students.filter(s => s.examIds.includes(e.id)).length]));
  const order = [...data.exams].sort((a, b) => ordering === 'degree' ? (graph[b.id]?.length ?? 0) - (graph[a.id]?.length ?? 0) : ordering === 'students' ? (counts[b.id] ?? 0) - (counts[a.id] ?? 0) : 0).map(e => e.id);
  const colors: Record<string, number> = {};
  const steps: Step[] = [];
  for (const examId of order) {
    const neighbors = graph[examId] ?? [];
    const used = [...new Set(neighbors.map(id => colors[id]).filter((v): v is number => v !== undefined))].sort((a,b) => a-b);
    let chosen = 1;
    while (used.includes(chosen)) chosen++;
    colors[examId] = chosen;
    steps.push({ examId, neighbors, used, chosen, available: Array.from({ length: Math.max(chosen + 1, 4) }, (_, i) => i + 1).filter(c => !used.includes(c)) });
  }
  return { colors, steps, order, colorCount: Math.max(0, ...Object.values(colors)), executionTime: performance.now() - start };
}
export function allocate(data: Dataset, coloring: Coloring): Allocation[] {
  const available = data.slots.filter(s => s.available);
  const occupied = new Set<string>();
  return coloring.order.map(examId => {
    const color = coloring.colors[examId];
    const slot = color === undefined ? undefined : available[color - 1];
    if (!slot) return { examId, slotId: null, roomId: null, reason: 'No available time slot for this color' };
    const count = data.students.filter(s => s.examIds.includes(examId)).length;
    const room = [...data.rooms].filter(r => r.available && r.capacity >= count && !occupied.has(`${slot.id}|${r.id}`)).sort((a,b) => a.capacity - b.capacity)[0];
    if (!room) return { examId, slotId: slot.id, roomId: null, reason: `No available room fits ${count} students` };
    occupied.add(`${slot.id}|${room.id}`);
    return { examId, slotId: slot.id, roomId: room.id };
  });
}
export function validate(data: Dataset, graph: Record<string, string[]>, coloring: Coloring, allocations: Allocation[]): Validation {
  const conflicts: string[] = [], rooms: string[] = [], capacity: string[] = [], missing: string[] = [];
  const byExam = Object.fromEntries(allocations.map(a => [a.examId, a]));
  const used = new Map<string, string>();
  for (const exam of data.exams) {
    const a = byExam[exam.id];
    if (!a?.slotId || !a.roomId) { missing.push(`${exam.subject}: ${a?.reason ?? 'No allocation'}`); continue; }
    const room = data.rooms.find(r => r.id === a.roomId);
    const count = data.students.filter(s => s.examIds.includes(exam.id)).length;
    if (!room || room.capacity < count) capacity.push(`${exam.subject}: ${count} students exceed room capacity`);
    const key = `${a.slotId}|${a.roomId}`;
    if (used.has(key)) rooms.push(`${exam.subject} and ${used.get(key)} share a room`);
    used.set(key, exam.subject);
    for (const other of graph[exam.id] ?? []) if (exam.id < other && a.slotId === byExam[other]?.slotId) conflicts.push(`${exam.subject} conflicts with ${data.exams.find(e => e.id === other)?.subject}`);
  }
  return { conflicts, rooms, capacity, missing, valid: !conflicts.length && !rooms.length && !capacity.length && !missing.length };
}

const subjects = ['Mathematics II','Data Structures','Digital Electronics','Computer Networks','Database Systems','Operating Systems','Physics','Algorithms','Software Engineering','Discrete Mathematics','Artificial Intelligence','Computer Architecture','Linear Algebra','Web Technologies','Cyber Security','Probability'];
const first = ['Aarav','Diya','Rohan','Ananya','Vivaan','Isha','Aditya','Meera','Arjun','Sara','Kiran','Nisha'];
const last = ['Sharma','Reddy','Patel','Kumar','Singh','Rao','Nair','Das'];
export function demoData(): Dataset {
  const exams: Exam[] = subjects.map((subject, i) => ({ id: `EX${String(i+1).padStart(3,'0')}`, subject, course: `B.Tech ${1 + (i % 4)} Year`, department: i % 3 === 0 ? 'ECE' : 'CSE', duration: 180, priority: i % 5 === 0 ? 'High' : 'Normal' }));
  const students: Student[] = Array.from({ length: 72 }, (_, i) => {
    const group = i % 4;
    const base = group * 4;
    return { id: `ST${String(i+1).padStart(3,'0')}`, name: `${first[i % first.length]} ${last[Math.floor(i / first.length) % last.length]}`, roll: `BT${String(2023001+i)}`, course: `B.Tech ${group+1} Year`, department: group === 0 ? 'ECE' : 'CSE', examIds: [`EX${String(base+1).padStart(3,'0')}`, `EX${String(base+2+(Math.floor(i/4)%3)).padStart(3,'0')}`, `EX${String(base+2+((Math.floor(i/4)+1)%3)).padStart(3,'0')}`] };
  });
  const rooms: Room[] = [60,80,100,45,120,70].map((capacity,i) => ({ id: `${i < 3 ? 'A' : 'B'}${101+i}`, building: i < 3 ? 'Academic Block A' : 'Academic Block B', floor: i < 3 ? 1 : 2, capacity, type: i === 2 ? 'Computer Lab' : 'Lecture Hall', available: true }));
  const slots: Slot[] = Array.from({ length: 6 }, (_,i) => ({ id: `Slot ${i+1}`, date: `2026-10-${String(12+Math.floor(i/2)).padStart(2,'0')}`, start: i%2 ? '13:00' : '09:00', end: i%2 ? '16:00' : '12:00', available: true }));
  return { exams, students, rooms, slots };
}
