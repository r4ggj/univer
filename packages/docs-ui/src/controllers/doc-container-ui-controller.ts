/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { LocaleType } from '@univerjs/core';
import { LocaleService } from '@univerjs/core';
import { Inject, Injector } from '@wendellhu/redi';

import type { IUniverDocsUIConfig } from '../basics';
import type { DocContainer } from '../views/doc-container/DocContainer';

export class DocContainerUIController {
    private _docContainer?: DocContainer;

    constructor(
        private readonly _config: IUniverDocsUIConfig,
        @Inject(LocaleService) private readonly _localeService: LocaleService,
        @Inject(Injector) private readonly _injector: Injector
    ) {}

    getUIConfig() {
        const config = {
            injector: this._injector,
            config: this._config,
            changeLocale: this.changeLocale,
            getComponent: this.getComponent,
        };
        return config;
    }

    // 获取SheetContainer组件
    getComponent = (ref: DocContainer) => {
        this._docContainer = ref;

        const container = ref.getContentRef().current;

        if (!container) {
            throw new Error('container is not ready');
        }
    };

    /**
     * Change language
     * @param {String} lang new language
     *
     * e: {target: HTMLSelectElement } reference from  https://stackoverflow.com/a/48443771
     *
     */
    changeLocale = (locale: string) => {
        this._localeService.setLocale(locale as LocaleType);
    };

    getContentRef() {
        return this._docContainer!.getContentRef();
    }

    UIDidMount(cb: Function) {
        if (this._docContainer) {
            return cb(this._docContainer);
        }
    }

    getDocContainer() {
        return this._docContainer;
    }
}
