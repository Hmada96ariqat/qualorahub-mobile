import React from 'react';
import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, type ScrollViewProps } from 'react-native';

type PullToRefreshContainerProps = {
  children: ReactNode;
  refreshing: boolean;
  onRefresh: () => void;
  testID?: string;
} & Omit<ScrollViewProps, 'refreshControl'>;

export function PullToRefreshContainer({
  children,
  refreshing,
  onRefresh,
  testID,
  ...rest
}: PullToRefreshContainerProps) {
  return (
    <ScrollView
      testID={testID}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
      {...rest}
    >
      {children}
    </ScrollView>
  );
}
