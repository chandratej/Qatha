import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookMarked, Users, Globe2, Plus, Trash2, CheckCircle2, Circle, Download } from 'lucide-react';
import { api } from '../lib/api';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { LORE_CATEGORIES } from '../../../packages/shared/storyBible';
import { INVITE_ROLES } from '../../../packages/shared/collaboration';
import type {
  StoryCharacter,
  StoryCollaborationTask,
  StoryLoreEntry,
  StoryMemberSummary,
} from '../../../packages/shared/storyBible';
import type { StoryMemberInvite } from '../../../packages/shared/collaboration';
import type { StoryContributorAttribution } from '../../../packages/shared/media';
import { useLocale } from '../context/LocaleContext';

type Tab = 'characters' | 'world' | 'team';

function memberLabel(member: StoryMemberSummary) {
  const shortId = member.user_id.slice(0, 8);
  return `${member.role.replace(/_/g, ' ')} · ${shortId}`;
}

export function StoryBible() {
  const { t } = useLocale();
  const { storyId = '' } = useParams();
  const [tab, setTab] = useState<Tab>('characters');
  const [storyTitle, setStoryTitle] = useState('Story');
  const [characters, setCharacters] = useState<StoryCharacter[]>([]);
  const [lore, setLore] = useState<StoryLoreEntry[]>([]);
  const [members, setMembers] = useState<StoryMemberSummary[]>([]);
  const [tasks, setTasks] = useState<StoryCollaborationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [charName, setCharName] = useState('');
  const [charBio, setCharBio] = useState('');
  const [loreTitle, setLoreTitle] = useState('');
  const [loreCategory, setLoreCategory] = useState<string>('location');
  const [loreBody, setLoreBody] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [invites, setInvites] = useState<StoryMemberInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('co_author');
  const [inviteChapter, setInviteChapter] = useState('');
  const [attributions, setAttributions] = useState<StoryContributorAttribution[]>([]);

  const reload = useCallback(async () => {
    if (!storyId) return;
    setLoading(true);
    setError(null);
    try {
      const [chars, loreRes, membersRes, tasksRes, invitesRes, attrRes, storiesRes] = await Promise.all([
        api.getStoryCharacters(storyId),
        api.getStoryLore(storyId),
        api.getStoryMembers(storyId),
        api.getStoryTasks(storyId),
        api.getStoryInvites(storyId).catch(() => ({ invites: [] })),
        api.getStoryAttributions(storyId).catch(() => ({ attributions: [] })),
        api.getCreatorStories().catch(() => ({ stories: [] })),
      ]);
      setCharacters(chars.characters);
      setLore(loreRes.entries);
      setMembers(membersRes.members);
      setTasks(tasksRes.tasks);
      setInvites(invitesRes.invites);
      setAttributions(attrRes.attributions);
      const story = storiesRes.stories?.find((s) => s.id === storyId);
      if (story?.title) setStoryTitle(story.title);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load story bible');
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addCharacter = async () => {
    if (!charName.trim()) return;
    setBusy(true);
    try {
      await api.createStoryCharacter(storyId, { name: charName.trim(), bio: charBio.trim() || undefined });
      setCharName('');
      setCharBio('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add character');
    } finally {
      setBusy(false);
    }
  };

  const addLore = async () => {
    if (!loreTitle.trim()) return;
    setBusy(true);
    try {
      await api.createStoryLore(storyId, {
        title: loreTitle.trim(),
        category: loreCategory,
        body: loreBody.trim() || undefined,
        glossary_term: loreCategory === 'glossary' ? loreTitle.trim() : undefined,
      });
      setLoreTitle('');
      setLoreBody('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add lore entry');
    } finally {
      setBusy(false);
    }
  };

  const addTask = async () => {
    if (!taskTitle.trim()) return;
    setBusy(true);
    try {
      const assigneeMember = members.find((m) => m.id === taskAssignee);
      await api.createStoryTask(storyId, {
        title: taskTitle.trim(),
        assignee_label: assigneeMember ? memberLabel(assigneeMember) : undefined,
      });
      setTaskTitle('');
      setTaskAssignee('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add task');
    } finally {
      setBusy(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.createStoryInvite(storyId, {
        invitee_email: inviteEmail.trim(),
        role: inviteRole,
        chapter_number: inviteChapter ? Number(inviteChapter) : undefined,
      });
      setInviteEmail('');
      setInviteChapter('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send invite');
    } finally {
      setBusy(false);
    }
  };

  const toggleTask = async (task: StoryCollaborationTask) => {
    const next = task.status === 'done' ? 'open' : 'done';
    await api.updateStoryTask(storyId, task.id, { status: next });
    await reload();
  };

  const exportGlossary = async () => {
    setBusy(true);
    setError(null);
    try {
      const { glossary } = await api.getStoryGlossary(storyId);
      const lines = glossary.map((g) => `${g.term}: ${g.definition || '(no definition)'}`);
      const text = [`# Glossary — ${storyTitle}`, '', ...lines].join('\n');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${storyTitle.replace(/\s+/g, '-').toLowerCase()}-glossary.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not export glossary');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cms-page studio-page story-bible-page">
      <StudioPageHeader
        eyebrow={t('storyBible.eyebrow')}
        eyebrowIcon={BookMarked}
        title={storyTitle}
        subtitle={t('storyBible.subtitle')}
        actions={(
          <Link to={`/stories/${storyId}`} className="katha-cta katha-cta--soft">
            {t('storyBible.backToChapters')}
          </Link>
        )}
      />

      <nav className="story-bible-tabs" aria-label="Story bible sections">
        <button type="button" className={tab === 'characters' ? 'is-active' : ''} onClick={() => setTab('characters')}>
          {t('storyBible.characters')}
        </button>
        <button type="button" className={tab === 'world' ? 'is-active' : ''} onClick={() => setTab('world')}>
          {t('storyBible.world')}
        </button>
        <button type="button" className={tab === 'team' ? 'is-active' : ''} onClick={() => setTab('team')}>
          {t('storyBible.team')}
        </button>
      </nav>

      {error && <p className="cms-error-text" role="alert">{error}</p>}
      {loading && <p className="cms-loading cms-loading--inline">Loading story bible…</p>}

      {!loading && tab === 'characters' && (
        <section className="cms-panel story-bible-section">
          <h2 className="dashboard-panel__title">{t('storyBible.characters')}</h2>
          <div className="story-bible-form">
            <input className="cms-input" placeholder="Character name" value={charName} onChange={(e) => setCharName(e.target.value)} />
            <textarea className="cms-input" placeholder="Bio & voice notes" rows={2} value={charBio} onChange={(e) => setCharBio(e.target.value)} />
            <button type="button" className="katha-cta katha-cta--maroon" disabled={busy} onClick={() => { void addCharacter(); }}>
              <Plus size={16} aria-hidden /> {t('storyBible.addCharacter')}
            </button>
          </div>
          <ul className="story-bible-list">
            {characters.length === 0 && <li className="input-hint">No characters yet — add your protagonist and key cast.</li>}
            {characters.map((c) => (
              <li key={c.id} className="story-bible-card">
                <strong>{c.name}</strong>
                {c.bio && <p>{c.bio}</p>}
                {c.arc_summary && <p className="input-hint">Arc: {c.arc_summary}</p>}
                <button type="button" className="btn btn-ghost" aria-label={`Delete ${c.name}`} onClick={() => { void api.deleteStoryCharacter(storyId, c.id).then(reload); }}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!loading && tab === 'world' && (
        <section className="cms-panel story-bible-section">
          <div className="story-bible-section__head">
            <h2 className="dashboard-panel__title"><Globe2 size={16} aria-hidden /> {t('storyBible.world')}</h2>
            <button type="button" className="katha-cta katha-cta--soft" disabled={busy} onClick={() => { void exportGlossary(); }}>
              <Download size={16} aria-hidden /> Export glossary
            </button>
          </div>
          <div className="story-bible-form">
            <select className="cms-input" value={loreCategory} onChange={(e) => setLoreCategory(e.target.value)}>
              {LORE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="cms-input" placeholder="Entry title" value={loreTitle} onChange={(e) => setLoreTitle(e.target.value)} />
            <textarea className="cms-input" placeholder="Lore details" rows={3} value={loreBody} onChange={(e) => setLoreBody(e.target.value)} />
            <button type="button" className="katha-cta katha-cta--maroon" disabled={busy} onClick={() => { void addLore(); }}>
              <Plus size={16} aria-hidden /> {t('storyBible.addEntry')}
            </button>
          </div>
          <ul className="story-bible-list">
            {lore.length === 0 && <li className="input-hint">Build your world bible — locations, cultures, glossary terms.</li>}
            {lore.map((e) => (
              <li key={e.id} className="story-bible-card">
                <span className="story-bible-card__tag">{e.category}</span>
                <strong>{e.title}</strong>
                {e.body && <p>{e.body}</p>}
                <button type="button" className="btn btn-ghost" aria-label={`Delete ${e.title}`} onClick={() => { void api.deleteStoryLore(storyId, e.id).then(reload); }}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!loading && tab === 'team' && (
        <section className="cms-panel story-bible-section">
          <h2 className="dashboard-panel__title"><Users size={16} aria-hidden /> {t('storyBible.team')}</h2>
          <div className="story-bible-members">
            {members.map((m) => (
              <span key={m.id} className="story-bible-member-pill">{m.role}</span>
            ))}
          </div>
          <div className="story-bible-form story-bible-invite-form">
            <input
              className="cms-input"
              type="email"
              placeholder="Co-author email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <select className="cms-input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
              {INVITE_ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
            <input
              className="cms-input"
              type="number"
              min={1}
              placeholder="Chapter # (optional)"
              value={inviteChapter}
              onChange={(e) => setInviteChapter(e.target.value)}
            />
            <button type="button" className="katha-cta katha-cta--maroon" disabled={busy} onClick={() => { void sendInvite(); }}>
              Invite
            </button>
          </div>
          {invites.length > 0 && (
            <ul className="story-bible-list story-bible-invites">
              {invites.filter((i) => i.status === 'pending').map((i) => (
                <li key={i.id} className="story-bible-card">
                  <span className="story-bible-card__tag">{i.role}</span>
                  <strong>{i.invitee_email || i.invitee_user_id}</strong>
                  {i.chapter_number && <p className="input-hint">Chapter {i.chapter_number} assignment</p>}
                </li>
              ))}
            </ul>
          )}
          {attributions.length > 0 && (
            <div className="story-bible-attributions">
              <h3 className="input-hint">Contributor attribution</h3>
              <ul className="story-bible-list">
                {attributions.map((a) => (
                  <li key={a.id} className="story-bible-card story-bible-card--compact">
                    <span className="story-bible-card__tag">{a.role}</span>
                    <strong>{a.display_name || a.user_id}</strong>
                    {(a.revenue_share_bps ?? 0) > 0 && (
                      <p className="input-hint">{(a.revenue_share_bps ?? 0) / 100}% revenue share (basis points scaffold)</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="story-bible-form story-bible-form--inline story-bible-task-form">
            <input
              className="cms-input"
              placeholder={t('storyBible.taskPlaceholder')}
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <select
              className="cms-input story-bible-task-form__assignee"
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
              aria-label={t('storyBible.assignee')}
            >
              <option value="">{t('storyBible.unassigned')}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{memberLabel(m)}</option>
              ))}
            </select>
            <button type="button" className="katha-cta katha-cta--soft" disabled={busy} onClick={() => { void addTask(); }}>
              {t('storyBible.addTask')}
            </button>
          </div>
          <ul className="story-bible-list">
            {tasks.length === 0 && <li className="input-hint">Async tasks for co-authors and editors.</li>}
            {tasks.map((task) => (
              <li key={task.id} className="story-bible-card story-bible-card--task">
                <button type="button" className="story-bible-task-toggle" onClick={() => { void toggleTask(task); }} aria-label={task.status === 'done' ? 'Mark open' : 'Mark done'}>
                  {task.status === 'done' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>
                <span className={task.status === 'done' ? 'is-done' : ''}>
                  {task.title}
                  {task.assignee_label && (
                    <span className="story-bible-task-assignee"> · {task.assignee_label}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}