import { ICommandService, LocaleService } from '@univerjs/core';
import { Dropdown, Tooltip } from '@univerjs/design';
import { MoreDownSingle } from '@univerjs/icons';
import { useDependency } from '@wendellhu/redi/react-bindings';
import { useEffect, useState } from 'react';
import { isObservable, of, Subscription } from 'rxjs';

import { CustomLabel } from '../../../components/custom-label/CustomLabel';
import { useObservable } from '../../../components/hooks/observable';
import { Menu } from '../../../components/menu/Menu';
import {
    ICustomComponentOption,
    IDisplayMenuItem,
    IMenuItem,
    IMenuSelectorItem,
    isValueOptions,
    IValueOption,
    MenuItemType,
} from '../../../services/menu/menu';
import { ToolbarButton } from './Button/ToolbarButton';
import styles from './index.module.less';

export function ToolbarItem(props: IDisplayMenuItem<IMenuItem>) {
    const localeService = useDependency(LocaleService);
    const commandService = useDependency(ICommandService);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [value, setValue] = useState<any>();
    const [disabled, setDisabled] = useState(false);
    const [activated, setActivated] = useState(false);

    useEffect(() => {
        const subscriptions: Subscription[] = [];

        props.disabled$ &&
            subscriptions.push(
                props.disabled$.subscribe((disabled) => {
                    setDisabled(disabled);
                })
            );

        if (props.type === MenuItemType.BUTTON) {
            props.activated$ &&
                subscriptions.push(
                    props.activated$.subscribe((activated) => {
                        setActivated(activated);
                    })
                );
        }

        if (props.type === MenuItemType.SELECTOR) {
            props.value$ &&
                subscriptions.push(
                    props.value$.subscribe((value) => {
                        setValue(value);
                    })
                );
        }

        return () => {
            subscriptions.forEach((subscription) => {
                subscription.unsubscribe();
            });
        };
    }, []);

    const { tooltip, shortcut, icon, title, label, id } = props;

    const tooltipTitle = localeService.t(tooltip ?? '') + (shortcut ? ` (${shortcut})` : '');

    function renderSelectorType() {
        const { selections } = props as IDisplayMenuItem<IMenuSelectorItem>;

        let options: Array<IValueOption | ICustomComponentOption>;
        if (isObservable(selections)) {
            options = useObservable<Array<IValueOption | ICustomComponentOption>>(selections || of([]), [], true);
        } else {
            options = selections || [];
        }

        const item = options?.find((o) => isValueOptions(o) && o.value === value) as IValueOption | undefined;
        const iconToDisplay = item?.icon ?? icon;

        function handleSelect(option: IValueOption) {
            let commandId = id;
            const value = option;

            if (option.id) {
                commandId = option.id;
            }

            commandService.executeCommand(commandId, value);
        }

        function handleChange(value: string | number) {
            const commandId = id;
            commandService.executeCommand(commandId, { value });
        }

        return (
            <Dropdown overlay={<Menu menuType={id} options={options} onOptionSelect={handleSelect} value={value} />}>
                <div className={styles.toolbarItemSelectButton}>
                    <CustomLabel
                        icon={iconToDisplay}
                        title={title!}
                        value={value}
                        label={label}
                        onChange={handleChange}
                    />
                    <div className={styles.toolbarItemSelectButtonArrow}>
                        <MoreDownSingle />
                    </div>
                </div>
            </Dropdown>
        );
    }

    function renderButtonType() {
        return (
            <ToolbarButton
                className={styles.toolbarItemTextButton}
                active={activated}
                disabled={disabled}
                onClick={() => commandService.executeCommand(props.id)}
                onDoubleClick={() => props.subId && commandService.executeCommand(props.subId)}
            >
                <CustomLabel icon={icon} />
            </ToolbarButton>
        );
    }

    function renderItem() {
        switch (props.type) {
            case MenuItemType.SUBITEMS:
            case MenuItemType.SELECTOR:
                return renderSelectorType();
            case MenuItemType.BUTTON:
            default:
                return renderButtonType();
        }
    }

    return (
        <Tooltip title={tooltipTitle} placement="bottom">
            {renderItem()}
        </Tooltip>
    );
}
