/**
 * Published chapter immutability — Vol_04-VC-D1
 * Literary Council: live chapters require explicit resubmit, not silent overwrite.
 */

export function assertChapterEditable(status) {
  if (status === 'published') {
    const err = new Error('Published chapters are immutable. Resubmit for review to publish edits.');
    err.code = 'CHAPTER_IMMUTABLE';
    throw err;
  }
}