import type { FlexProps } from '@chakra-ui/react';
import {
  Box,
  Button,
  type ButtonProps,
  Checkbox,
  Flex,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  type MenuItemProps,
  MenuList,
  useDisclosure
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MyTag from '../Tag/index';
import MyIcon from '../Icon';
import MyAvatar from '../Avatar';
import { useTranslation } from 'next-i18next';
import type { useScrollPagination } from '../../../hooks/useScrollPagination';
import MyDivider from '../MyDivider';
import { shadowLight } from '../../../styles/theme';

const menuItemStyles: MenuItemProps = {
  borderRadius: 'sm',
  py: 2,
  display: 'flex',
  alignItems: 'center',
  _hover: {
    backgroundColor: 'myGray.100'
  },
  _notLast: {
    mb: 2
  }
};

export type SelectProps<T = any> = {
  list: {
    icon?: string;
    label: string | React.ReactNode;
    value: T;
  }[];
  value: T[];
  isSelectAll: boolean;
  setIsSelectAll?: React.Dispatch<React.SetStateAction<boolean>>;

  placeholder?: string;
  itemWrap?: boolean;
  onSelect: (val: T[]) => void;
  closeable?: boolean;
  isDisabled?: boolean;
  ScrollData?: ReturnType<typeof useScrollPagination>['ScrollData'];

  formLabel?: string;
  formLabelFontSize?: string;

  inputValue?: string;
  setInputValue?: (val: string) => void;

  tagStyle?: FlexProps;
} & Omit<ButtonProps, 'onSelect'>;

const MultipleSelect = <T = any,>({
  value = [],
  placeholder,
  list = [],
  onSelect,
  closeable = false,
  itemWrap = true,
  ScrollData,
  isSelectAll,
  setIsSelectAll,
  isDisabled = false,

  formLabel,
  formLabelFontSize = 'sm',

  inputValue,
  setInputValue,

  tagStyle,
  ...props
}: SelectProps<T>) => {
  const ref = useRef<HTMLButtonElement>(null);
  const SearchInputRef = useRef<HTMLInputElement>(null);
  const tagsContainerRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const canInput = setInputValue !== undefined;

  type SelectedItemType = {
    icon?: string;
    label: string | React.ReactNode;
    value: T;
  };

  const [visibleItems, setVisibleItems] = useState<SelectedItemType[]>([]);
  const [overflowItems, setOverflowItems] = useState<SelectedItemType[]>([]);

  const selectedItems = useMemo(() => {
    return value.map((val) => {
      const listItem = list.find((item) => item.value === val);
      return listItem || { value: val, label: String(val) };
    });
  }, [value, list]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && (!inputValue || inputValue === '')) {
        const newValue = [...value];
        newValue.pop();
        onSelect(newValue);
      }
    },
    [inputValue, value, isSelectAll, onSelect]
  );
  useEffect(() => {
    if (!isOpen) {
      setInputValue?.('');
    }
  }, [isOpen]);

  useEffect(() => {
    const getWidth = (w: any) =>
      typeof w === 'number' ? w : typeof w === 'string' ? parseInt(w) : 0;

    const totalWidth = getWidth(props.w) || 200;
    const tagWidth = getWidth(tagStyle?.w) || 60;
    const formLabelWidth = formLabel ? formLabel.length * 8 + 20 : 0;
    const availableWidth = totalWidth - formLabelWidth - 40;
    const overflowWidth = 30;

    if (availableWidth <= 0) {
      setVisibleItems(selectedItems.length > 0 ? [selectedItems[0]] : []);
      setOverflowItems(selectedItems.slice(1));
      return;
    }

    const { count } = selectedItems.reduce(
      (acc, item, i) => {
        const remain = selectedItems.length - i - 1;
        const needOverflow = remain > 0 ? overflowWidth : 0;
        if (acc.used + tagWidth + needOverflow <= availableWidth) {
          return {
            used: acc.used + tagWidth,
            count: i + 1
          };
        }
        return acc;
      },
      { used: 0, count: 0 }
    );
    setVisibleItems(selectedItems.slice(0, count));
    setOverflowItems(selectedItems.slice(count));
  }, [selectedItems, isOpen, props.w, tagStyle, formLabel]);

  const onclickItem = useCallback(
    (val: T) => {
      if (isSelectAll) {
        onSelect(list.map((item) => item.value).filter((i) => i !== val));
        setIsSelectAll?.(false);
        return;
      }

      if (value.includes(val)) {
        onSelect(value.filter((i) => i !== val));
      } else {
        onSelect([...value, val]);
      }
    },
    [value, isSelectAll, onSelect, setIsSelectAll]
  );

  const onSelectAll = useCallback(() => {
    const hasSelected = isSelectAll || value.length > 0;
    onSelect(hasSelected ? [] : list.map((item) => item.value));

    setIsSelectAll?.((state) => !state);
  }, [value, list, setIsSelectAll, onSelect]);

  const ListRender = useMemo(() => {
    return (
      <>
        {list.map((item, i) => {
          const isSelected = isSelectAll || value.includes(item.value);
          return (
            <MenuItem
              key={i}
              {...(isSelected
                ? {
                    color: 'primary.600'
                  }
                : {
                    color: 'myGray.900'
                  })}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onclickItem(item.value);
              }}
              whiteSpace={'pre-wrap'}
              fontSize={'sm'}
              gap={2}
              {...menuItemStyles}
            >
              <Checkbox isChecked={isSelected} />
              {item.icon && <MyAvatar src={item.icon} w={'1rem'} borderRadius={'0'} />}
              <Box flex={'1 0 0'}>{item.label}</Box>
            </MenuItem>
          );
        })}
      </>
    );
  }, [value, list, isSelectAll]);

  return (
    <Box h={'100%'} w={'100%'}>
      <Menu
        autoSelect={false}
        isOpen={isOpen && !isDisabled}
        onOpen={isDisabled ? undefined : onOpen}
        onClose={onClose}
        strategy={'fixed'}
        matchWidth
        closeOnSelect={false}
      >
        <MenuButton
          as={Flex}
          ref={ref}
          px={3}
          alignItems={'center'}
          borderRadius={'md'}
          border={'sm'}
          userSelect={'none'}
          cursor={isDisabled ? 'not-allowed' : 'pointer'}
          _active={{
            transform: 'none'
          }}
          _hover={{
            borderColor: isDisabled ? 'myGray.200' : 'primary.300'
          }}
          opacity={isDisabled ? 0.6 : 1}
          {...props}
          {...(isOpen && !isDisabled
            ? {
                boxShadow: shadowLight,
                borderColor: 'primary.600 !important',
                bg: 'white'
              }
            : {})}
        >
          <Flex alignItems={'center'} w={'100%'} h={'100%'} py={1.5}>
            {formLabel && (
              <Flex alignItems={'center'}>
                <Box color={'myGray.600'} fontSize={formLabelFontSize} whiteSpace={'nowrap'}>
                  {formLabel}
                </Box>
                <Box w={'1px'} h={'12px'} bg={'myGray.200'} mx={2} />
              </Flex>
            )}
            {value.length === 0 && placeholder ? (
              <Box color={'myGray.500'} fontSize={formLabelFontSize} flex={1}>
                {placeholder}
              </Box>
            ) : (
              <Flex
                ref={tagsContainerRef}
                flex={'1 0 0'}
                gap={1}
                flexWrap={'nowrap'}
                overflow={'hidden'}
                alignItems={'center'}
              >
                {(!isOpen || !canInput) &&
                  (isSelectAll ? (
                    <Box fontSize={formLabelFontSize} color={'myGray.900'}>
                      {t('common:All')}
                    </Box>
                  ) : (
                    <>
                      {visibleItems.map((item, i) => (
                        <MyTag
                          className="tag-icon"
                          key={i}
                          bg={'primary.100'}
                          color={'primary.700'}
                          type={'fill'}
                          borderRadius={'lg'}
                          px={2}
                          py={0.5}
                          flexShrink={0}
                          {...tagStyle}
                        >
                          {item.label}
                          {closeable && (
                            <MyIcon
                              name={'common/closeLight'}
                              ml={1}
                              w="0.8rem"
                              cursor={'pointer'}
                              _hover={{
                                color: 'red.500'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onclickItem(item.value);
                              }}
                            />
                          )}
                        </MyTag>
                      ))}
                      {overflowItems.length > 0 && (
                        <Box
                          fontSize={formLabelFontSize}
                          px={2}
                          py={0.5}
                          flexShrink={0}
                          borderRadius={'lg'}
                          bg={'myGray.100'}
                        >
                          +{overflowItems.length}
                        </Box>
                      )}
                    </>
                  ))}
                {canInput && isOpen && (
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue?.(e.target.value)}
                    onKeyDown={handleKeyDown}
                    ref={SearchInputRef}
                    autoFocus
                    onBlur={() => {
                      setTimeout(() => {
                        SearchInputRef?.current?.focus();
                      }, 0);
                    }}
                    h={6}
                    variant={'unstyled'}
                    border={'none'}
                  />
                )}
              </Flex>
            )}
            <MyIcon name={'core/chat/chevronDown'} color={'myGray.600'} w={4} h={4} />
          </Flex>
        </MenuButton>

        <MenuList
          className={props.className}
          px={'6px'}
          py={'6px'}
          border={'1px solid #fff'}
          boxShadow={
            '0px 4px 10px 0px rgba(19, 51, 107, 0.10), 0px 0px 1px 0px rgba(19, 51, 107, 0.10);'
          }
          zIndex={99}
          maxH={'40vh'}
          overflowY={'auto'}
        >
          <MenuItem
            color={isSelectAll ? 'primary.600' : 'myGray.900'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onSelectAll();
            }}
            whiteSpace={'pre-wrap'}
            fontSize={'sm'}
            gap={2}
            mb={1}
            {...menuItemStyles}
          >
            <Checkbox isChecked={isSelectAll} />
            <Box flex={'1 0 0'}>{t('common:All')}</Box>
          </MenuItem>

          <MyDivider my={1} />

          {ScrollData ? <ScrollData minH={20}>{ListRender}</ScrollData> : ListRender}
        </MenuList>
      </Menu>
    </Box>
  );
};

export default MultipleSelect;

export const useMultipleSelect = <T = any,>(defaultValue: T[] = [], defaultSelectAll = false) => {
  const [value, setValue] = useState<T[]>(defaultValue);
  const [isSelectAll, setIsSelectAll] = useState<boolean>(defaultSelectAll);
  return { value, setValue, isSelectAll, setIsSelectAll };
};
