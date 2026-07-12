import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('storyBibleStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('creates character and lore entries', async () => {
    const {
      createCharacter,
      listCharacters,
      createLoreEntry,
      listLoreEntries,
      exportGlossary,
    } = await import(`./storyBibleStore.js?test=${Date.now()}`);

    const storyId = `story-bible-${Date.now()}`;
    const character = await createCharacter(storyId, {
      name: 'Ananya',
      bio: 'Protagonist — village storyteller.',
      arc_summary: 'Discovers her voice',
    });
    assert.equal(character.name, 'Ananya');

    const chars = await listCharacters(storyId);
    assert.equal(chars.length, 1);

    await createLoreEntry(storyId, {
      title: 'Pallepalem',
      category: 'location',
      body: 'Coastal Telugu village.',
    });
    await createLoreEntry(storyId, {
      title: 'diya',
      category: 'glossary',
      body: 'Oil lamp — symbol of continuity.',
      glossary_term: 'diya',
    });

    const lore = await listLoreEntries(storyId);
    assert.equal(lore.length, 2);

    const glossary = await exportGlossary(storyId);
    assert.equal(glossary.length, 1);
    assert.equal(glossary[0].term, 'diya');
  });

  it('deletes character', async () => {
    const { createCharacter, deleteCharacter, listCharacters } = await import(
      `./storyBibleStore.js?test=${Date.now()}-del`
    );
    const storyId = `story-del-${Date.now()}`;
    const c = await createCharacter(storyId, { name: 'Temp' });
    await deleteCharacter(storyId, c.id);
    const chars = await listCharacters(storyId);
    assert.equal(chars.length, 0);
  });
});