import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('sceneCharacterStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('links and replaces characters per scene', async () => {
    const { listSceneCharacterLinks, setSceneCharacters } = await import(
      `./sceneCharacterStore.js?test=${Date.now()}`
    );

    const storyId = `story-scl-${Date.now()}`;
    const chapterNumber = 1;
    const sceneA = 'scene-1';
    const sceneB = 'scene-2';

    await setSceneCharacters(storyId, chapterNumber, sceneA, ['char-a', 'char-b']);
    await setSceneCharacters(storyId, chapterNumber, sceneB, ['char-b']);

    let links = await listSceneCharacterLinks(storyId, chapterNumber);
    assert.equal(links.length, 3);

    await setSceneCharacters(storyId, chapterNumber, sceneA, ['char-c']);
    links = await listSceneCharacterLinks(storyId, chapterNumber);
    assert.equal(links.length, 2);
    assert.ok(links.some((l) => l.scene_id === sceneA && l.character_id === 'char-c'));
    assert.ok(links.some((l) => l.scene_id === sceneB && l.character_id === 'char-b'));
  });
});