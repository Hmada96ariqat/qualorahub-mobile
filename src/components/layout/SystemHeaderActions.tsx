import React from 'react';
import { HeaderActionGroup } from './HeaderActionGroup';
import { HeaderLanguageSwitcher } from './HeaderLanguageSwitcher';
import { NotificationHeaderButton } from './NotificationHeaderButton';

type SystemHeaderActionsProps = {
  children?: React.ReactNode;
  compactLanguage?: boolean;
  languageTestID?: string;
  notificationTestID?: string;
};

export function SystemHeaderActions({
  children,
  compactLanguage,
  languageTestID,
  notificationTestID,
}: SystemHeaderActionsProps) {
  const extraActionCount = React.Children.toArray(children).length;
  const displayMode =
    compactLanguage === true || extraActionCount > 1 ? 'compact' : 'auto';

  return (
    <HeaderActionGroup>
      <NotificationHeaderButton testID={notificationTestID} />
      <HeaderLanguageSwitcher displayMode={displayMode} testID={languageTestID} />
      {children}
    </HeaderActionGroup>
  );
}
