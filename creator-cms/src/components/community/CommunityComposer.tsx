import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Send } from 'lucide-react';
import { createCommunityPost } from '../../lib/communityStore';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import type { StoryData } from '../../types/database';

interface Props {
  stories: StoryData[];
  onPosted: () => void;
}

const PROMPT_CHIPS = [
  {
    id: 'question',
    te: '📖 ఒక ప్రశ్న అడగండి',
    en: '📖 Ask a question',
    textTe: 'పాఠకులారా, మీకు ఏ సీన్ అత్యంత బలంగా అనిపించింది?',
    textEn: 'Readers — which scene hit hardest for you?',
  },
  {
    id: 'milestone',
    te: '🎉 మైలురాయి జరుపుకోండి',
    en: '🎉 Celebrate a milestone',
    textTe: 'ఒక మైలురాయి చేరుకున్నాం — మీ మద్దతుకి ధన్యవాదాలు 🙏',
    textEn: 'We hit a milestone — thank you for walking with this story 🙏',
  },
  {
    id: 'inspire',
    te: '✨ ప్రేరణ పంచుకోండి',
    en: '✨ Share inspiration',
    textTe: 'ఈ వారం రాయడం నాకు నేర్పింది…',
    textEn: 'Writing this week taught me…',
  },
  {
    id: 'thanks',
    te: '🙏 కృతజ్ఞతలు చెప్పండి',
    en: '🙏 Say thanks',
    textTe: 'మీరంతా ఇక్కడి వరకు నాతో ఉన్నందుకు హృదయపూర్వక ధన్యవాదాలు.',
    textEn: 'Heartfelt thanks for staying with me this far.',
  },
];

export function CommunityComposer({ stories, onPosted }: Props) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const te = locale === 'te';
  const [body, setBody] = useState('');
  const [storyId, setStoryId] = useState(stories[0]?.id ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!storyId && stories[0]?.id) setStoryId(stories[0].id);
  }, [stories, storyId]);

  const selected = stories.find((s) => s.id === storyId);
  const initial = (user?.display_name || 'C').slice(0, 1).toUpperCase();

  const handlePost = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      await createCommunityPost({
        author_id: user?.id || 'local-author',
        author_name: user?.display_name || 'Creator',
        type: 'discussion',
        body: body.trim(),
        story_id: storyId || undefined,
        story_title: selected?.title,
      });
      setBody('');
      onPosted();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="cv2-composer" aria-label={te ? 'కమ్యూనిటీ పోస్ట్' : 'Community post'}>
      <div className="cv2-composer-top">
        <div className="cv2-composer-avatar" aria-hidden>{initial}</div>
        <textarea
          placeholder={te ? 'మీ పాఠకులతో ఏమి పంచుకోవాలనుకుంటున్నారు?' : 'What do you want to share with your readers?'}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={500}
          lang="te"
          rows={2}
        />
      </div>

      <div className="cv2-prompt-chips" lang={te ? 'te' : 'en'}>
        {PROMPT_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className="cv2-prompt-chip"
            onClick={() => setBody(te ? chip.textTe : chip.textEn)}
          >
            {te ? chip.te : chip.en}
          </button>
        ))}
      </div>

      <div className="cv2-composer-actions">
        {stories.length > 0 ? (
          <label className="cv2-composer-attach">
            <BookOpen size={14} aria-hidden />
            <select
              value={storyId}
              onChange={(e) => setStoryId(e.target.value)}
              aria-label={te ? 'కథ జోడించు' : 'Attach story'}
            >
              {stories.map((s) => (
                <option key={s.id} value={s.id}>
                  {te ? `${s.title} జోడించు` : `Add ${s.title}`}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className="cv2-composer-attach">
            <Link to="/stories/new">{te ? 'ముందు ఒక కథ సృష్టించండి' : 'Create a story first'}</Link>
          </span>
        )}
        <button
          type="button"
          className="cv2-composer-submit"
          disabled={busy || !body.trim()}
          onClick={() => void handlePost()}
        >
          <Send size={14} aria-hidden />
          {busy ? (te ? 'పోస్ట్…' : 'Posting…') : (te ? 'పోస్ట్ చేయండి' : 'Post')}
        </button>
      </div>
    </section>
  );
}
