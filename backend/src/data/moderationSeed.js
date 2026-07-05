let mockQueue = [
  {
    id: 'mod-001',
    status: 'pending',
    reason: 'High toxicity score',
    toxicity_score: 0.72,
    created_at: new Date().toISOString(),
    chapters: {
      id: 'pending-ch-1',
      title: 'అధ్యాయం 7 — పరీక్ష',
      chapter_number: 7,
      content: 'ఇది పరీక్ష కథాంశం. మోడరేషన్ కోసం వేచి ఉంది.',
    },
    creators: { pen_name: 'లక్ష్మీ దేవి' },
  },
];

export function getMockModerationQueue() {
  return mockQueue.filter((q) => q.status === 'pending');
}

export function reviewMockItem(id, decision, notes) {
  const item = mockQueue.find((q) => q.id === id);
  if (!item) return null;
  item.status = decision === 'approved' ? 'approved' : decision;
  item.reviewer_notes = notes;
  item.reviewed_at = new Date().toISOString();
  return item;
}

export function addToMockQueue(chapter, creatorName, reason, toxicityScore = 0.5) {
  const entry = {
    id: `mod-${Date.now()}`,
    status: 'pending',
    reason: reason || 'Pending review',
    toxicity_score: toxicityScore,
    created_at: new Date().toISOString(),
    chapters: chapter,
    creators: { pen_name: creatorName || 'Creator' },
  };
  mockQueue.unshift(entry);
  return entry;
}