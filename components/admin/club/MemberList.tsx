'use client';

import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { Field, inputClass } from '@/components/admin/form-fields';
import { Avatar } from '@/components/people/Avatar';
import type { ClubMember, MemberRole } from '@/types/club';
import { cn } from '@/lib/utils';
import { ImagePicker, OrderControls, moveItem, pillButton, uid } from './ui';

/** What the editor holds for a person before it is saved. */
export type DraftMember = Pick<ClubMember, 'id' | 'name' | 'image_url' | 'email' | 'phone' | 'linkedin' | 'bio'>;

export const blankMember = (): DraftMember => ({ id: uid(), name: '', image_url: '', email: '', phone: '', linkedin: '', bio: '' });

function MemberRow({
  member,
  role,
  index,
  count,
  startOpen,
  onChange,
  onMove,
  onRemove,
}: {
  member: DraftMember;
  role: MemberRole;
  index: number;
  count: number;
  startOpen: boolean;
  onChange: (m: DraftMember) => void;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(startOpen);
  const set = (key: keyof DraftMember) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...member, [key]: e.target.value });
  const fid = (k: string) => `${member.id}-${k}`;

  return (
    <li className="rounded-sm border border-rule bg-void-1">
      <div className="flex items-center gap-3 p-3">
        <Avatar key={member.image_url} src={member.image_url || undefined} name={member.name || '?'} className="h-11 w-11 shrink-0" sizes="44px" />
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className={cn('block truncate text-[0.9375rem]', member.name ? 'text-starlight' : 'italic text-destructive')}>
            {member.name || 'Name required'}
          </span>
          <span className="label-chart mt-1 block truncate">{member.email || (role === 'director' ? 'Director' : 'Manager')}</span>
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} className={pillButton} aria-label={open ? 'Close details' : 'Edit details'}>
          {open ? 'Done' : 'Edit'}
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </button>
        <OrderControls
          index={index}
          count={count}
          label={member.name || role}
          onMove={onMove}
          onRemove={() => {
            if (!member.name || confirm(`Remove ${member.name} from this year’s team?`)) onRemove();
          }}
        />
      </div>

      {open && (
        <div className="flex flex-col gap-6 border-t border-rule p-4 sm:flex-row sm:p-5">
          <ImagePicker value={member.image_url} onChange={(image_url) => onChange({ ...member, image_url })} folder="members" label="Photo" round />
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full name" htmlFor={fid('name')}>
              <input id={fid('name')} className={inputClass} value={member.name} onChange={set('name')} autoFocus={!member.name} placeholder="e.g. Chamudi Kaushika" />
            </Field>
            <Field label="Email" htmlFor={fid('email')}>
              <input id={fid('email')} type="email" className={inputClass} value={member.email} onChange={set('email')} placeholder="name@usjastro.lk" />
            </Field>
            <Field label="Phone" htmlFor={fid('phone')} hint="Optional. Not shown on the public site.">
              <input id={fid('phone')} className={inputClass} value={member.phone} onChange={set('phone')} placeholder="+94 7X XXX XXXX" />
            </Field>
            <Field label="LinkedIn" htmlFor={fid('linkedin')} hint="Optional.">
              <input id={fid('linkedin')} className={inputClass} value={member.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/…" />
            </Field>
            <Field label="Short bio" htmlFor={fid('bio')} className="md:col-span-2" hint={role === 'director' ? 'Shown next to the director on the planet page.' : 'Optional.'}>
              <textarea id={fid('bio')} rows={2} className={cn(inputClass, 'resize-y')} value={member.bio} onChange={set('bio')} />
            </Field>
          </div>
        </div>
      )}
    </li>
  );
}

/** An ordered, editable list of directors or managers — as many as the year needs. */
export function MemberList({
  role,
  members,
  onChange,
}: {
  role: MemberRole;
  members: DraftMember[];
  onChange: (members: DraftMember[]) => void;
}) {
  const [added, setAdded] = useState<Set<string>>(() => new Set());
  const title = role === 'director' ? 'Directors' : 'Managers';

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="label-chart">
          {title} <span className="text-star-ghost">/ {members.length}</span>
        </p>
        <button
          type="button"
          className={pillButton}
          onClick={() => {
            const m = blankMember();
            setAdded((s) => new Set(s).add(m.id));
            onChange([...members, m]);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add {role}
        </button>
      </div>
      {members.length === 0 ? (
        <p className="note mt-3 rounded-sm border border-dashed border-rule px-4 py-5 text-center">No {title.toLowerCase()} this year yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {members.map((m, i) => (
            <MemberRow
              key={m.id}
              member={m}
              role={role}
              index={i}
              count={members.length}
              startOpen={added.has(m.id)}
              onChange={(next) => onChange(members.map((x) => (x.id === m.id ? next : x)))}
              onMove={(from, to) => onChange(moveItem(members, from, to))}
              onRemove={() => onChange(members.filter((x) => x.id !== m.id))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
