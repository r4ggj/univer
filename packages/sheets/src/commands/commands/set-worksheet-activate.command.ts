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

import type { ICommand } from '@univerjs/core';
import { CommandType, ICommandService, IUniverInstanceService } from '@univerjs/core';
import type { IAccessor } from '@wendellhu/redi';

import type { ISetWorksheetActiveOperationParams } from '../operations/set-worksheet-active.operation';
import { SetWorksheetActiveOperation } from '../operations/set-worksheet-active.operation';

export interface ISetWorksheetActivateCommandParams {
    unitId?: string;
    subUnitId?: string;
}

export const SetWorksheetActivateCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheet.command.set-worksheet-activate',

    handler: async (accessor: IAccessor, params?: ISetWorksheetActivateCommandParams) => {
        const commandService = accessor.get(ICommandService);
        const univerInstanceService = accessor.get(IUniverInstanceService);

        let unitId = univerInstanceService.getCurrentUniverSheetInstance().getUnitId();
        let subUnitId = univerInstanceService.getCurrentUniverSheetInstance().getActiveSheet().getSheetId();

        if (params) {
            unitId = params.unitId ?? unitId;
            subUnitId = params.subUnitId ?? subUnitId;
        }

        const redoMutationParams: ISetWorksheetActiveOperationParams = {
            unitId,
            subUnitId,
        };

        return commandService.syncExecuteCommand(SetWorksheetActiveOperation.id, redoMutationParams);
    },
};
