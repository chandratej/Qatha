import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookMarked, Globe2, Plus, Trash2, Users, CheckCircle2, Circle, Download } from 'lucide-react';
import { api } from '../lib/api';
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
import { friendlyFeatureError, isSchemaTableMissingMessage, SCHEMA_FEATURE_PENDING } from '../lib/errors';

type Tab = 'characters' | 'world' | 'team';

function memberLabel(member: StoryMemberSummary) {
  const shortId = member.user_id.slice(0, 8);
  return `${member.role.replace(/_/g, ' ')} · ${shortId}`;
}

function charInitial(name: string) {
  return name.trim().slice(0, 2) || '?';
}

export function StoryBible() {
  const { t } = useLocale();
  const { storyId = '' } = useParams();
  const [tab, setTab] = useState<Tab>('characters');
  const [storyTitle, setStoryTitle] = useState<string | null>(null);
  const [characters, setCharacters] = useState<StoryCharacter[]>([]);
  const [lore, setLore] = useState<StoryLoreEntry[]>([]);
  const [members, setMembers] = useState<StoryMemberSummary[]>([]);
  const [tasks, setTasks] = useState<StoryCollaborationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemaPending, setSchemaPending] = useState(false);
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
    setSchemaPending(false);
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
      setCharacters(chars.characters ?? []);
      setLore(loreRes.entries ?? []);
      setMembers(membersRes.members ?? []);
      setTasks(tasksRes.tasks ?? []);
      setInvites(invitesRes.invites ?? []);
      setAttributions(attrRes.attributions ?? []);
      const story = storiesRes.stories?.find((s) => s.id === storyId);
      if (story?.title) setStoryTitle(story.title);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load story bible';
      if (isSchemaTableMissingMessage(msg)) {
        setCharacters([]);
        setLore([]);
        setMembers([]);
        setTasks([]);
        setInvites([]);
        setAttributions([]);
        setSchemaPending(true);
      } else {
        setError(friendlyFeatureError(msg));
      }
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
      setError(friendlyFeatureError(e instanceof Error ? e.message : 'Could not add character'));
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
      setError(friendlyFeatureError(e instanceof Error ? e.message : 'Could not add lore entry'));
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
      setError(friendlyFeatureError(e instanceof Error ? e.message : 'Could not add task'));
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
      setError(friendlyFeatureError(e instanceof Error ? e.message : 'Could not send invite'));
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
      const title = storyTitle?.trim() || 'story';
      const text = [`# Glossary — ${title}`, '', ...lines].join('\n');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-glossary.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(friendlyFeatureError(e instanceof Error ? e.message : 'Could not export glossary'));
    } finally {
      setBusy(false);
    }
  };

  const tabLabels = {
    characters: t('storyBible.characters'),
    world: t('storyBible.world'),
    team: t('storyBible.team'),
  };

  return (
    <div className="sv21 sv21--bible">
      <Link to={`/stories/${storyId}`} className="sv21__back">
        <ArrowLeft size={14} aria-hidden />
        {t('storyBible.backToChapters')}
      </Link>

      <div className="sv21__head sv21__head--start">
        <div>
          <p className="sv21__eyebrow">
            <BookMarked size={14} aria-hidden />
            {t('storyBible.eyebrow')}
          </p>
          {storyTitle ? (
            <h1 className="sv21__title sv21__title--sm" lang="te">{storyTitle}</h1>
          ) : (
            <h1 className="sv21__title sv21__title--sm" aria-busy="true">
              <span className="dashboard-skeleton sv21__title-skeleton" aria-label={t('storyBible.titleLoading')} />
            </h1>
          )}
          <p className="sv21__subtitle">{t('storyBible.subtitle')}</p>
        </div>
      </div>

      <nav className="sv21__tabs sv21__tabs--underline" aria-label="Story bible sections">
        {(['characters', 'world', 'team'] as Tab[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`sv21__tab${tab === id ? ' sv21__tab--active' : ''}`}
            onClick={() => setTab(id)}
          >
            {tabLabels[id]}
          </button>
        ))}
      </nav>

      {schemaPending && (
        <p className="sv21__compliance" role="status">
          <BookMarked size={15} aria-hidden />
          <span>{SCHEMA_FEATURE_PENDING}</span>
        </p>
      )}
      {error && <p className="sv21__error" role="alert">{error}</p>}
      {loading && <p className="sv21__loading">{t('storyBible.loading')}</p>}

      {!loading && tab === 'characters' && (
        <>
          <div className="sv21__form-card">
            <h3>{t('storyBible.addCharacterTitle')}</h3>
            <div className="sv21__field">
              <input className="sv21__input" placeholder={t('storyBible.charNamePlaceholder')} value={charName} onChange={(e) => setCharName(e.target.value)} />
            </div>
            <div className="sv21__field">
              <textarea className="sv21__textarea" placeholder={t('storyBible.charBioPlaceholder')} rows={2} value={charBio} onChange={(e) => setCharBio(e.target.value)} />
            </div>
            <button type="button" className="sv21__add-btn" disabled={busy} onClick={() => { void addCharacter(); }}>
              <Plus size={16} aria-hidden /> {t('storyBible.addCharacter')}
            </button>
          </div>

          {characters.length === 0 ? (
            <div className="sv21__empty">
              <Users size={26} aria-hidden />
              <p>{t('storyBible.noCharactersV21')}</p>
            </div>
          ) : (
            <div className="sv21__char-list">
              {characters.map((c) => (
                <div key={c.id} className="sv21__char-row">
                  <div className="sv21__char-avatar">{charInitial(c.name)}</div>
                  <div style={{ flex: 1 }}>
                    <p className="sv21__char-name">{c.name}</p>
                    {c.bio && <p className="sv21__char-bio">{c.bio}</p>}
                    {c.arc_summary && <p className="sv21__char-bio">{t('storyBible.arc')}: {c.arc_summary}</p>}
                  </div>
                  <button type="button" className="sv21__icon-btn" aria-label={`Delete ${c.name}`} onClick={() => { void api.deleteStoryCharacter(storyId, c.id).then(reload); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && tab === 'world' && (
        <>
          <div className="sv21__form-card">
            <div className="sv21__section-head" style={{ marginBottom: 10 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Globe2 size={16} aria-hidden /> {t('storyBible.world')}
              </h3>
              <button type="button" className="sv21__cta sv21__cta--soft sv21__cta--sm" disabled={busy} onClick={() => { void exportGlossary(); }}>
                <Download size={14} aria-hidden /> {t('storyBible.exportGlossary')}
              </button>
            </div>
            <div className="sv21__field">
              <select className="sv21__input" value={loreCategory} onChange={(e) => setLoreCategory(e.target.value)}>
                {LORE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sv21__field">
              <input className="sv21__input" placeholder={t('storyBible.entryTitlePlaceholder')} value={loreTitle} onChange={(e) => setLoreTitle(e.target.value)} />
            </div>
            <div className="sv21__field">
              <textarea className="sv21__textarea" placeholder={t('storyBible.loreDetailsPlaceholder')} rows={3} value={loreBody} onChange={(e) => setLoreBody(e.target.value)} />
            </div>
            <button type="button" className="sv21__add-btn" disabled={busy} onClick={() => { void addLore(); }}>
              <Plus size={16} aria-hidden /> {t('storyBible.addEntry')}
            </button>
          </div>

          {lore.length === 0 ? (
            <div className="sv21__empty">
              <Globe2 size={26} aria-hidden />
              <p>{t('storyBible.noLore')}</p>
            </div>
          ) : (
            <div className="sv21__char-list">
              {lore.map((e) => (
                <div key={e.id} className="sv21__char-row">
                  <div style={{ flex: 1 }}>
                    <span className="sv21__badge sv21__badge--draft" style={{ marginBottom: 6, display: 'inline-block' }}>{e.category}</span>
                    <p className="sv21__char-name">{e.title}</p>
                    {e.body && <p className="sv21__char-bio">{e.body}</p>}
                  </div>
                  <button type="button" className="sv21__icon-btn" aria-label={`Delete ${e.title}`} onClick={() => { void api.deleteStoryLore(storyId, e.id).then(reload); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && tab === 'team' && (
        <>
          <div className="sv21__form-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Users size={16} aria-hidden /> {t('storyBible.team')}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {members.map((m) => (
                <span key={m.id} className="sv21__badge sv21__badge--draft">{m.role}</span>
              ))}
            </div>
            <div className="sv21__upload-row">
              <input className="sv21__input" type="email" placeholder={t('storyBible.inviteEmailPlaceholder')} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              <select className="sv21__input" style={{ width: 'auto' }} value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                {INVITE_ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
              <input className="sv21__input" type="number" min={1} placeholder={t('storyBible.chapterOptional')} value={inviteChapter} onChange={(e) => setInviteChapter(e.target.value)} />
            </div>
            {inviteRole === 'beta_reader' && (
              <p className="sv21__hint" style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>
                Beta readers get pre-publish access to the chosen chapter. Ask them for structured
                feedback (typo / pacing / confusion) via the feedback inbox after they read.
              </p>
            )}
            <button type="button" className="sv21__add-btn" disabled={busy} onClick={() => { void sendInvite(); }}>
              {t('storyBible.invite')}
            </button>
          </div>

          {invites.filter((i) => i.status === 'pending').length > 0 && (
            <div className="sv21__char-list" style={{ marginBottom: '1.25rem' }}>
              {invites.filter((i) => i.status === 'pending').map((i) => (
                <div key={i.id} className="sv21__char-row">
                  <div style={{ flex: 1 }}>
                    <span className="sv21__badge sv21__badge--registered">{i.role}</span>
                    <p className="sv21__char-name">{i.invitee_email || i.invitee_user_id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="sv21__form-card">
            <div className="sv21__upload-row">
              <input className="sv21__input" placeholder={t('storyBible.taskPlaceholder')} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              <select className="sv21__input" style={{ width: 'auto' }} value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} aria-label={t('storyBible.assignee')}>
                <option value="">{t('storyBible.unassigned')}</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{memberLabel(m)}</option>
                ))}
              </select>
              <button type="button" className="sv21__cta sv21__cta--soft sv21__cta--sm" disabled={busy} onClick={() => { void addTask(); }}>
                {t('storyBible.addTask')}
              </button>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="sv21__empty">
              <Circle size={26} aria-hidden />
              <p>{t('storyBible.noTasks')}</p>
            </div>
          ) : (
            <div className="sv21__tasks">
              {tasks.map((task) => (
                <div key={task.id} className="sv21__task">
                  <button type="button" className="sv21__icon-btn" style={{ border: 'none' }} onClick={() => { void toggleTask(task); }} aria-label={task.status === 'done' ? t('storyBible.markOpen') : t('storyBible.markDone')}>
                    {task.status === 'done' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                  <span className={task.status === 'done' ? 'sv21__row-meta' : ''} style={{ textDecoration: task.status === 'done' ? 'line-through' : undefined }}>
                    {task.title}
                    {task.assignee_label && ` · ${task.assignee_label}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {attributions.length > 0 && (
            <div className="sv21__char-list" style={{ marginTop: '1.25rem' }}>
              <p className="sv21__subtitle" style={{ marginBottom: 8 }}>{t('storyBible.contributorAttribution')}</p>
              {attributions.map((a) => (
                <div key={a.id} className="sv21__char-row">
                  <div style={{ flex: 1 }}>
                    <span className="sv21__badge sv21__badge--draft">{a.role}</span>
                    <p className="sv21__char-name">{a.display_name || a.user_id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}