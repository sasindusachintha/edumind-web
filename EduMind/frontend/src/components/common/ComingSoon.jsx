import React from 'react';
import { Hammer } from 'lucide-react';
import PageHeader from './PageHeader.jsx';

/**
 * Placeholder shown for modules that are still under active development.
 * Keeps the page in the nav (so the structure of the product is visible)
 * without exposing functionality that isn't ready yet.
 */
export default function ComingSoon({ title, accent = '#3949AB', note }) {
  return (
    <div>
      <PageHeader title={title} subtitle="This module is still being built." />

      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-slate py-16 text-center">
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accent}1A` }}
        >
          <Hammer size={20} style={{ color: accent }} />
        </div>
        <p className="font-display text-base font-semibold text-ink">Under development</p>
        <p className="mt-1.5 max-w-sm text-sm text-ink/50">
          {note || 'This feature is currently being built and will be available in a future update.'}
        </p>
        <span
          className="mt-4 rounded-full px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          Coming soon
        </span>
      </div>
    </div>
  );
}
