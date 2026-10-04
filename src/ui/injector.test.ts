// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { injectCreationDate, isAlreadyInjected } from './injector';

// Local-time date so the formatted output is timezone-independent.
const ISO = new Date(2020, 0, 5).toISOString();
const FORMATTED = 'Jan 5, 2020';

function render(html: string) {
  document.body.innerHTML = html;
}

/** The element injected right after `el`, if any. */
const injectedAfter = (el: Element | null) => el?.nextElementSibling ?? null;

describe('injector', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('returns false and injects nothing when there is no About heading', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    render('<h2>Releases</h2><div>stuff</div>');

    expect(injectCreationDate(ISO)).toBe(false);
    expect(isAlreadyInjected()).toBe(false);
  });

  it('returns false on an empty page', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(injectCreationDate(ISO)).toBe(false);
  });

  it('inserts after the Readme row (#readme-ov-file)', () => {
    render(`
      <div id="section">
        <h2 data-component="Heading">About</h2>
        <div id="readme-row"><a href="#readme-ov-file">Readme</a></div>
        <div id="activity-row"><a href="/o/r/activity">Activity</a></div>
      </div>`);

    expect(injectCreationDate(ISO)).toBe(true);

    const injected = injectedAfter(document.getElementById('readme-row'));
    expect(injected).not.toBeNull();
    expect(injected?.id).not.toBe('activity-row');
    expect(injected?.textContent).toContain(FORMATTED);
    expect(isAlreadyInjected()).toBe(true);
  });

  it('supports the legacy #readme anchor', () => {
    render(`
      <div class="BorderGrid-cell">
        <h2>About</h2>
        <div id="readme-row"><a href="#readme">Readme</a></div>
      </div>`);

    expect(injectCreationDate(ISO)).toBe(true);
    expect(injectedAfter(document.getElementById('readme-row'))?.textContent).toContain(FORMATTED);
  });

  it('falls back to the Activity row when there is no Readme link', () => {
    render(`
      <div>
        <h2>About</h2>
        <div id="activity-row"><a href="/o/r/activity">Activity</a></div>
      </div>`);

    expect(injectCreationDate(ISO)).toBe(true);
    expect(injectedAfter(document.getElementById('activity-row'))?.textContent).toContain(
      FORMATTED,
    );
  });

  it('as a last resort inserts after the section container', () => {
    render('<div id="section"><h2>About</h2><p>no links</p></div>');

    expect(injectCreationDate(ISO)).toBe(true);
    expect(injectedAfter(document.getElementById('section'))?.textContent).toContain(FORMATTED);
  });

  it('matches the heading case-insensitively and ignoring whitespace', () => {
    render(`
      <div id="section">
        <h2>  ABOUT
        </h2>
      </div>`);

    expect(injectCreationDate(ISO)).toBe(true);
  });

  it('ignores other h2 headings before About', () => {
    render(`
      <div id="other"><h2>Releases</h2></div>
      <div id="section"><h2>About</h2></div>`);

    expect(injectCreationDate(ISO)).toBe(true);
    expect(injectedAfter(document.getElementById('section'))).not.toBeNull();
    expect(injectedAfter(document.getElementById('other'))?.id).toBe('section');
  });

  it('renders a link with the calendar icon and date text', () => {
    render('<div id="section"><h2>About</h2></div>');
    injectCreationDate(ISO);

    const injected = injectedAfter(document.getElementById('section'));
    expect(injected?.classList.contains('mt-2')).toBe(true);
    expect(injected?.querySelector('a svg')).not.toBeNull();
    expect(injected?.querySelector('a span')?.textContent).toBe(FORMATTED);
  });

  it('isAlreadyInjected is false before and true after injection', () => {
    render('<div><h2>About</h2></div>');
    expect(isAlreadyInjected()).toBe(false);
    injectCreationDate(ISO);
    expect(isAlreadyInjected()).toBe(true);
  });
});
