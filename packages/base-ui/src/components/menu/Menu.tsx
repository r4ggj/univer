import { isRealNum } from '@univerjs/core';
import {
    Menu as DesignMenu,
    MenuItem as DesignMenuItem,
    MenuItemGroup as DesignMenuItemGroup,
    SubMenu as DesignSubMenu,
} from '@univerjs/design';
import { CheckMarkSingle, MoreSingle } from '@univerjs/icons';
import { useDependency } from '@wendellhu/redi/react-bindings';
import clsx from 'clsx';
import { useState } from 'react';
import { isObservable, of } from 'rxjs';

import {
    IDisplayMenuItem,
    IMenuButtonItem,
    IMenuItem,
    IMenuSelectorItem,
    IValueOption,
    MenuGroup,
    MenuItemDefaultValueType,
    MenuItemType,
} from '../../services/menu/menu';
import { IMenuService } from '../../services/menu/menu.service';
import { CustomLabel } from '../custom-label/CustomLabel';
import { useObservable } from '../hooks/observable';
import styles from './index.module.less';

// TODO: @jikkai disabled and hidden are not working

export interface IBaseMenuProps {
    parentKey?: string | number;
    menuType?: string | string[];

    value?: string | number;
    options?: IValueOption[];

    onOptionSelect?: (option: IValueOption) => void;
}

function MenuWrapper(props: IBaseMenuProps) {
    const { menuType, onOptionSelect } = props;
    const menuService = useDependency(IMenuService);

    if (!menuType) return;

    if (Array.isArray(menuType)) {
        const menuTypes = menuType.map((type) => menuService.getMenuItems(type));

        const group = menuTypes.map((menuItems) =>
            menuItems.reduce(
                (acc, item: IDisplayMenuItem<IMenuItem>) => {
                    if (item.group) {
                        acc[item.group] = acc[item.group] ?? [];
                        acc[item.group].push(item);
                    } else {
                        acc[MenuGroup.CONTEXT_MENU_OTHERS] = acc[MenuGroup.CONTEXT_MENU_OTHERS] ?? [];
                        acc[MenuGroup.CONTEXT_MENU_OTHERS].push(item);
                    }
                    return acc;
                },
                {} as Record<MenuGroup, Array<IDisplayMenuItem<IMenuItem>>>
            )
        );

        return (
            <>
                {group.map((groupItem) =>
                    Object.keys(groupItem).map((groupKey: string) => (
                        <DesignMenuItemGroup key={groupKey} eventKey={groupKey}>
                            {groupItem[groupKey as unknown as MenuGroup].map((item: IDisplayMenuItem<IMenuItem>) => (
                                <MenuItem
                                    key={item.id}
                                    menuItem={item}
                                    onClick={(object: Partial<IValueOption>) => {
                                        onOptionSelect?.({ value: '', label: item.id, ...object });
                                    }}
                                />
                            ))}
                        </DesignMenuItemGroup>
                    ))
                )}
            </>
        );
    }

    const menuItems = menuService.getMenuItems(menuType);

    return menuItems.map((item: IDisplayMenuItem<IMenuItem>) => (
        <MenuItem
            key={item.id}
            menuItem={item}
            onClick={(object: Partial<IValueOption>) => {
                onOptionSelect?.({ value: '', label: item.id, ...object });
            }}
        />
    ));
}

function MenuOptionsWrapper(props: IBaseMenuProps) {
    const { options, value, onOptionSelect, parentKey } = props;

    return options?.map((option: IValueOption, index: number) => {
        const key = `${parentKey}-${option.label ?? option.id}-${index}`;

        const onChange = (v: string | number) => {
            onOptionSelect?.({ value: v, label: option?.label });
        };

        const handleClick = () => {
            if (typeof option.value === 'undefined') return;

            onOptionSelect?.({
                ...option,
            });
        };

        const _className = clsx({
            [styles.menuItemNoHover]: typeof option.label !== 'string' && !option.label?.hoverable,
        });

        return (
            <DesignMenuItem key={key} eventKey={key} className={_className} onClick={handleClick}>
                <span
                    className={clsx(styles.menuItemContent, {
                        [styles.menuItemSelectable]: !(typeof option.label !== 'string' && !option.label?.hoverable),
                    })}
                >
                    {typeof value !== 'undefined' && String(value) === String(option.value) && (
                        <span className={styles.menuItemSelectableIcon}>
                            <CheckMarkSingle style={{ color: 'rgb(var(--success-color))' }} />
                        </span>
                    )}
                    <CustomLabel value={option.value} label={option.label} icon={option.icon} onChange={onChange} />
                </span>
            </DesignMenuItem>
        );
    });
}

export const Menu = (props: IBaseMenuProps) => (
    <DesignMenu selectable={false}>
        <MenuOptionsWrapper {...props} />
        <MenuWrapper {...props} />
    </DesignMenu>
);

interface IMenuItemProps {
    menuItem: IDisplayMenuItem<IMenuItem>;
    onClick: (params: Partial<IValueOption>) => void;
}

function MenuItem({ menuItem, onClick }: IMenuItemProps) {
    const menuService = useDependency(IMenuService);

    const menuItems = menuItem.id ? menuService.getMenuItems(menuItem.id) : [];

    const disabled = useObservable<boolean>(menuItem.disabled$ || of(false), false, true);
    const hidden = useObservable(menuItem.hidden$ || of(false), false, true);
    const value = useObservable<MenuItemDefaultValueType>(menuItem.value$ || of(undefined), undefined, true);
    const [inputValue, setInputValue] = useState(value);

    /**
     * user input change value from CustomLabel
     * @param v
     */
    const onChange = (v: string | number) => {
        const newValue = isRealNum(v) && typeof v === 'string' ? parseInt(v) : v;
        setInputValue(newValue);
    };

    const renderButtonType = () => {
        const item = menuItem as IDisplayMenuItem<IMenuButtonItem>;
        const { title, label } = item;

        return (
            <DesignMenuItem
                key={item.id}
                eventKey={item.id}
                disabled={disabled}
                onClick={() => {
                    onClick({ value: inputValue, id: item.id }); // merge cell
                }}
            >
                <span className={styles.menuItemContent}>
                    <CustomLabel value={value} title={title} label={label} icon={item.icon} onChange={onChange} />
                </span>
            </DesignMenuItem>
        );
    };

    const renderSelectorType = () => {
        const item = menuItem as IDisplayMenuItem<IMenuSelectorItem>;

        let selections: IValueOption[];
        if (isObservable(item.selections)) {
            selections = useObservable<IValueOption[]>(item.selections || of([]), [], true);
        } else {
            selections = item.selections || [];
        }

        if (selections.length > 0) {
            return (
                <DesignSubMenu
                    key={item.id}
                    eventKey={item.id}
                    popupOffset={[18, 0]}
                    title={
                        <span className={styles.menuItemContent}>
                            <CustomLabel
                                title={item.title}
                                value={inputValue}
                                onChange={onChange}
                                icon={item.icon}
                                label={item.label}
                            />
                            {item.shortcut && ` (${item.shortcut})`}
                        </span>
                    }
                    expandIcon={<MoreSingle className={styles.menuItemMoreIcon} />}
                >
                    {selections.length > 0 && (
                        <MenuOptionsWrapper
                            parentKey={item.id}
                            menuType={item.id}
                            options={selections}
                            onOptionSelect={(v) => {
                                onClick({ value: v.value, id: item.id });
                            }}
                        />
                    )}
                </DesignSubMenu>
            );
        }

        return (
            <DesignMenuItem key={item.id} eventKey={item.id}>
                <span className={styles.menuItemContent}>
                    <CustomLabel
                        title={item.title}
                        value={inputValue}
                        icon={item.icon}
                        label={item.label}
                        onChange={onChange}
                    />
                    {item.shortcut && ` (${item.shortcut})`}
                </span>
            </DesignMenuItem>
        );
    };

    const renderSubItemsType = () => {
        const item = menuItem as IDisplayMenuItem<IMenuSelectorItem>;

        return (
            <DesignSubMenu
                key={item.id}
                eventKey={item.id}
                popupOffset={[18, 0]}
                title={
                    <span className={styles.menuItemContent}>
                        <CustomLabel title={item.title} icon={item.icon} label={item.label} onChange={onChange} />
                    </span>
                }
                expandIcon={<MoreSingle className={styles.menuItemMoreIcon} />}
            >
                {menuItems.length && <MenuWrapper menuType={item.id} parentKey={item.id} onOptionSelect={onClick} />}
            </DesignSubMenu>
        );
    };

    if (hidden) {
        return null;
    }

    return (
        <>
            {menuItem.type === MenuItemType.SELECTOR && renderSelectorType()}
            {menuItem.type === MenuItemType.SUBITEMS && renderSubItemsType()}
            {menuItem.type === MenuItemType.BUTTON && renderButtonType()}
        </>
    );
}
