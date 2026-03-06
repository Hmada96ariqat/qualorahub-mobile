import React from 'react';
import { ModuleTabs } from '../../../../components';
import { INVENTORY_TAB_OPTIONS, type InventoryTab } from '../../contracts';

type InventoryModuleTabsProps = {
  value: InventoryTab;
  onValueChange: (value: InventoryTab) => void;
  testID?: string;
};

export function InventoryModuleTabs({
  value,
  onValueChange,
  testID,
}: InventoryModuleTabsProps) {
  return <ModuleTabs tabs={INVENTORY_TAB_OPTIONS} value={value} onValueChange={onValueChange} testID={testID} />;
}
