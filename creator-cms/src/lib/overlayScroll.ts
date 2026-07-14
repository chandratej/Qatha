const FADE_MS = 500;
const REGION_SELECTOR = [
  '.overlay-scroll',
  '.premium-main',
  '.scroll-region',
  '[data-overlay-scroll]',
  '.cms-table-wrap',
  '.stories-widget__table-wrap',
  '.cms-moderation-preview',
  '.cms-auth-page',
  '.katha-proto-scene-list',
  '.katha-proto-preview-body',
  '.narrative-os-app .stage',
  '.narrative-os-app .panel',
  '.narrative-os-app .cmdk',
  '.narrative-os-app .nos-insp-body--scroll',
  '.narrative-os-app .ql-editor',
].join(', ');

const fadeTimers = new WeakMap<EventTarget, ReturnType<typeof setTimeout>>();
const boundRegions = new Set<HTMLElement>();
const unbinders: Array<() => void> = [];

function scheduleFade(el: HTMLElement) {
  const prev = fadeTimers.get(el);
  if (prev) clearTimeout(prev);
  fadeTimers.set(
    el,
    setTimeout(() => {
      fadeTimers.delete(el);
      el.classList.remove('overlay-scroll--active');
    }, FADE_MS),
  );
}

function bindOverlayScroll(el: HTMLElement) {
  if (boundRegions.has(el)) return;

  boundRegions.add(el);
  el.classList.add('overlay-scroll');

  const onScroll = () => {
    el.classList.add('overlay-scroll--active');
    scheduleFade(el);
  };

  const onWheel = () => {
    el.classList.add('overlay-scroll--active');
    scheduleFade(el);
  };

  const onEnter = () => {
    const prev = fadeTimers.get(el);
    if (prev) clearTimeout(prev);
    fadeTimers.delete(el);
    el.classList.add('overlay-scroll--active');
  };

  const onLeave = () => {
    if (!fadeTimers.has(el)) scheduleFade(el);
  };

  el.addEventListener('scroll', onScroll, { passive: true });
  el.addEventListener('wheel', onWheel, { passive: true });
  el.addEventListener('mouseenter', onEnter);
  el.addEventListener('mouseleave', onLeave);

  unbinders.push(() => {
    el.removeEventListener('scroll', onScroll);
    el.removeEventListener('wheel', onWheel);
    el.removeEventListener('mouseenter', onEnter);
    el.removeEventListener('mouseleave', onLeave);
    const t = fadeTimers.get(el);
    if (t) clearTimeout(t);
    fadeTimers.delete(el);
    boundRegions.delete(el);
  });
}

function scanRegions(root: ParentNode = document) {
  root.querySelectorAll(REGION_SELECTOR).forEach((node) => {
    if (node instanceof HTMLElement) bindOverlayScroll(node);
  });
}

/** Attach overlay scrollbar behavior to all scroll regions; returns teardown. */
export function initOverlayScrollRegions(): () => void {
  scanRegions();

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.matches(REGION_SELECTOR)) bindOverlayScroll(node);
          scanRegions(node);
        }
      });
    }
  });

  const observeRoot = document.querySelector('.narrative-os-app, .app-viewport, #root') ?? document.body;
  observer.observe(observeRoot, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    while (unbinders.length) unbinders.pop()?.();
    boundRegions.clear();
  };
}