import { formatDate } from '../utils/date';
import { log } from '../utils/logger';

const NS = `ghcd_${Math.random().toString(36).slice(2)}`;
log(`NS: ${NS}`);

const SIDEBAR_SELECTORS = [
    '[data-component="SplitPageLayout.Pane"]',
    '[data-component="PageLayout.Pane"]',
    '[class*="CodeViewSidebar"]',
    '.Layout-sidebar',
    '.BorderGrid',
    'aside',
    'div[data-position="end"]',
];

function isAboutHeading(heading: Element): boolean {
    return (
        heading.textContent?.trim().toLowerCase() === 'about' &&
        !heading.closest('header')
    );
}

export function getSidebarElement(): Element | null {
    // Try explicit sidebar components before broad fallbacks, regardless of DOM order.
    for (const selector of SIDEBAR_SELECTORS) {
        for (const candidate of document.querySelectorAll(selector)) {
            if ([...candidate.querySelectorAll('h2')].some(isAboutHeading)) {
                return candidate;
            }
        }
    }

    return null;
}

function getTargetElement(): Element | undefined {
    const sidebar = getSidebarElement();
    if (!sidebar) return undefined;

    const headings = sidebar.querySelectorAll('h2');

    for (const heading of headings) {
        // GitHub also renders an About section inside its responsive header.
        if (!isAboutHeading(heading)) continue;

        const section = heading.parentElement;
        if (!section) continue;

        // Primary: insert after the "Readme" row
        const readme =
            section.querySelector("a[href='#readme-ov-file']") ??
            section.querySelector("a[href='#readme']");
        if (readme?.parentElement) return readme.parentElement;

        // Fallback: insert after the "Activity" row
        const activity = section.querySelector("a[href*='/activity']");
        if (activity?.parentElement) return activity.parentElement;

        // Last resort: append at the end of the section container
        return section;
    }

    return undefined;
}

function createCreationDateElement(creationDate: string): HTMLElement {
    const container = document.createElement('div');
    container.classList.add('mt-2');
    container.id = NS;

    const link = document.createElement('a');
    link.classList.add('Link--muted', 'prc-Link-Link-9ZwDx');
    link.setAttribute('data-component', 'Link');
    link.setAttribute('data-muted', 'true');
    link.innerHTML =
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" ` +
        `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
        `stroke-linecap="round" stroke-linejoin="round" class="mr-2" ` +
        `style="vertical-align:text-bottom">` +
        `<path d="M8 2v4"/><path d="M16 2v4"/>` +
        `<rect width="18" height="18" x="3" y="4" rx="2"/>` +
        `<path d="M3 10h18"/></svg>` +
        `<span>${formatDate(new Date(creationDate))}</span>`;

    container.appendChild(link);
    return container;
}

export function isAlreadyInjected(): boolean {
    return document.getElementById(NS) !== null;
}

export function injectCreationDate(creationDate: string): boolean {
    const target = getTargetElement();
    if (!target) {
        log('Target element not found – sidebar may not have rendered yet.');
        return false;
    }
    target.insertAdjacentElement('afterend', createCreationDateElement(creationDate));
    log('Creation date injected.');
    return true;
}
