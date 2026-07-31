import { phoneticToTelugu } from './phonetic';
import { isProtectedPlaceholderText, shouldKeepLiteralEnglish, unwrapLiteralEnglish } from './phoneticEscape';

export { isProtectedPlaceholderText, shouldKeepLiteralEnglish } from './phoneticEscape';

function convertTextPreservingPlaceholders(text: string): string {
  if (!text || !/[a-zA-Z`]/.test(text)) return text;
  if (isProtectedPlaceholderText(text)) return text;
  // Word-level: keep English literals + unwrap `backticks` (must match before bare [a-zA-Z]+)
  return text.replace(/`[A-Za-z][A-Za-z0-9_\-]*`|\$[A-Za-z][A-Za-z0-9_\-]*|[A-Za-z]+/g, (word) => {
    if (shouldKeepLiteralEnglish(word)) return unwrapLiteralEnglish(word);
    return phoneticToTelugu(word);
  });
}

export function applyLivePhoneticToHtml(html: string): { html: string; trailingWord: string } {
  if (!html) return { html: '', trailingWord: '' };
  const div = document.createElement('div');
  div.innerHTML = html;
  const fullPlain = div.textContent || '';
  if (isProtectedPlaceholderText(fullPlain)) {
    return { html, trailingWord: '' };
  }
  const match = fullPlain.match(/[a-zA-Z]+$/);
  let trailingWord = match ? match[0] : '';
  let convertLen = trailingWord ? fullPlain.length - trailingWord.length : fullPlain.length;
  if (trailingWord.length >= 2) {
    const last = trailingWord[trailingWord.length - 1];
    const prev = trailingWord[trailingWord.length - 2];
    if (last.toLowerCase() === prev.toLowerCase() && /[a-zA-Z]/.test(last)) {
      convertLen = fullPlain.length;
      trailingWord = trailingWord.slice(-1);
    }
  }
  let pos = 0;
  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const start = pos;
      const end = pos + text.length;
      pos = end;
      if (isProtectedPlaceholderText(text)) return;
      if (end <= convertLen) node.textContent = convertTextPreservingPlaceholders(text);
      else if (start < convertLen) {
        node.textContent =
          convertTextPreservingPlaceholders(text.slice(0, convertLen - start)) + text.slice(convertLen - start);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(walk);
    }
  }
  walk(div);
  return { html: div.innerHTML, trailingWord };
}

export function convertAllPhoneticInHtml(html: string): string {
  if (!html) return html;
  const div = document.createElement('div');
  div.innerHTML = html;
  if (isProtectedPlaceholderText(div.textContent || '')) return html;
  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (!isProtectedPlaceholderText(text)) {
        node.textContent = convertTextPreservingPlaceholders(text);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(walk);
    }
  }
  walk(div);
  return div.innerHTML;
}

export function replaceTrailingRomanInHtml(html: string, teluguWord: string): string {
  if (!html) return html;
  const div = document.createElement('div');
  div.innerHTML = html;
  let found = false;
  function walk(node: Node) {
    if (found) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const m = text.match(/[a-zA-Z]+$/);
      if (m) { node.textContent = text.slice(0, text.length - m[0].length) + teluguWord; found = true; }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (const child of Array.from(node.childNodes).reverse()) { walk(child); if (found) break; }
    }
  }
  walk(div);
  return div.innerHTML;
}

export function isEmptyEditorHtml(html: string) {
  if (!html) return true;
  const div = document.createElement('div');
  div.innerHTML = html;
  return !(div.textContent || '').trim();
}