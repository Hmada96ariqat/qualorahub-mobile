import React, { useMemo } from 'react';
import { AppSelect } from '../../../../components';
import type { ManagedContact, ManagedUser } from '../../../../api/modules/management';

export interface LogbookPersonSelection {
  type: 'user' | 'contact';
  id: string;
  name: string;
}

type LogbookPersonSelectorProps = {
  value: LogbookPersonSelection | null;
  users: ManagedUser[];
  contacts: ManagedContact[];
  onChange: (value: LogbookPersonSelection | null) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  allowNone?: boolean;
  includeUsers?: boolean;
  includeContacts?: boolean;
};

function getUserDisplayName(user: ManagedUser): string {
  const fullName = user.fullName?.trim();
  if (fullName) {
    return fullName;
  }

  const nickName = user.nickName?.trim();
  if (nickName) {
    return nickName;
  }

  return user.email.trim();
}

export function LogbookPersonSelector({
  value,
  users,
  contacts,
  onChange,
  placeholder = 'Select person',
  label = 'Person',
  disabled = false,
  allowNone = false,
  includeUsers = true,
  includeContacts = true,
}: LogbookPersonSelectorProps) {
  const options = useMemo(() => {
    const nextOptions: Array<{ label: string; value: string }> = [];

    if (allowNone) {
      nextOptions.push({
        label: 'None',
        value: '__none__',
      });
    }

    if (includeUsers) {
      users
        .filter((user) => (user.status || '').toLowerCase() === 'active' && Boolean(user.userId))
        .sort((left, right) => getUserDisplayName(left).localeCompare(getUserDisplayName(right)))
        .forEach((user) => {
          nextOptions.push({
            label: `${getUserDisplayName(user)} (User)`,
            value: `user:${user.userId}`,
          });
        });
    }

    if (includeContacts) {
      contacts
        .filter((contact) => (contact.status || '').toLowerCase() === 'active')
        .sort((left, right) => left.name.localeCompare(right.name))
        .forEach((contact) => {
          nextOptions.push({
            label: `${contact.name} (Contact)`,
            value: `contact:${contact.id}`,
          });
        });
    }

    return nextOptions;
  }, [allowNone, contacts, includeContacts, includeUsers, users]);

  const selectedValue = value ? `${value.type}:${value.id}` : null;

  return (
    <AppSelect
      value={selectedValue}
      options={options}
      onChange={(nextValue) => {
        if (nextValue === '__none__') {
          onChange(null);
          return;
        }

        const [rawType, ...rest] = nextValue.split(':');
        const id = rest.join(':').trim();
        if ((rawType !== 'user' && rawType !== 'contact') || !id) {
          onChange(null);
          return;
        }

        if (rawType === 'user') {
          const match = users.find((user) => user.userId === id);
          onChange({
            type: 'user',
            id,
            name: match ? getUserDisplayName(match) : id,
          });
          return;
        }

        const match = contacts.find((contact) => contact.id === id);
        onChange({
          type: 'contact',
          id,
          name: match?.name ?? id,
        });
      }}
      placeholder={placeholder}
      label={label}
      disabled={disabled}
      searchable
      searchPlaceholder="Search people"
    />
  );
}
