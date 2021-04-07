/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AriaTabProps} from '@react-types/tabs';
import {generateId} from './utils';
import {HTMLAttributes, RefObject} from 'react';
import {SingleSelectListState} from '@react-stately/list';
import {usePress} from '@react-aria/interactions';
import {useSelectableItem} from '@react-aria/selection';

interface TabAria {
  /** Props for the tab element. */
  tabProps: HTMLAttributes<HTMLElement>
}
  
export function useTab<T>(
  props: AriaTabProps<T>,
  state: SingleSelectListState<T>,
  ref: RefObject<HTMLElement>
): TabAria {
  let {item, isDisabled: propsDisabled} = props;
  let {key} = item;
  let {selectionManager: manager, selectedKey} = state;

  let isSelected = key === selectedKey;

  let {itemProps} = useSelectableItem({
    selectionManager: manager,
    key,
    ref
  });
  let isDisabled = propsDisabled || state.disabledKeys.has(key);

  let {pressProps} = usePress({...itemProps, isDisabled});
  let tabId = generateId(state, key, 'tab');
  let tabPanelId = generateId(state, key, 'tabpanel');
  let {tabIndex} = pressProps;

    // selected tab should have tabIndex=0, when it initializes
  if (isSelected && !isDisabled) {
    tabIndex = 0;
  }

  return {
    tabProps: {
      ...pressProps,
      id: tabId,
      'aria-selected': isSelected,
      'aria-disabled': isDisabled || undefined,
      'aria-controls': isSelected ? tabPanelId : undefined,
      tabIndex: isDisabled ? undefined : tabIndex,
      role: 'tab'
    }
  };
}
  
