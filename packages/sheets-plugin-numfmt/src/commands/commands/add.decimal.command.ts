import { SelectionManagerService } from '@univerjs/base-sheets';
import { CommandType, ICommand, ICommandService, IUniverInstanceService, Range } from '@univerjs/core';
import { IAccessor } from '@wendellhu/redi';

import { NumfmtService } from '../../service/numfmt.service';
import { getDecimalFromPattern, isPatternEqualWithoutDecimal, setPatternDecimal } from '../../utils/decimal';
import { SetNumfmtCommand, SetNumfmtCommandParams } from './set.numfmt.command';

export const AddDecimalCommand: ICommand = {
    id: 'sheet.command.numfmt.add.decimal.command',
    type: CommandType.COMMAND,
    handler: async (accessor: IAccessor) => {
        const commandService = accessor.get(ICommandService);
        const selectionManagerService = accessor.get(SelectionManagerService);
        const numfmtService = accessor.get(NumfmtService);
        const univerInstanceService = accessor.get(IUniverInstanceService);

        const selections = selectionManagerService.getSelections();
        if (!selections || !selections.length) {
            return false;
        }
        const workbook = univerInstanceService.getCurrentUniverSheetInstance();
        const sheet = workbook.getActiveSheet();
        const workbookId = workbook.getUnitId();
        const worksheetId = sheet.getSheetId();

        let maxDecimals = 0;
        selections.forEach((selection) => {
            Range.foreach(selection.range, (row, col) => {
                const numfmtValue = numfmtService.getValue(workbookId, worksheetId, row, col);
                if (!numfmtValue) {
                    return;
                }
                const decimals = getDecimalFromPattern(numfmtValue.pattern);
                maxDecimals = decimals > maxDecimals ? decimals : maxDecimals;
            });
        });
        const decimals = maxDecimals + 1;
        const pattern = setPatternDecimal(`0${decimals > 0 ? '.0' : ''}`, decimals);
        const values: SetNumfmtCommandParams['values'] = [];

        selections.forEach((selection) => {
            Range.foreach(selection.range, (row, col) => {
                const numfmtValue = numfmtService.getValue(workbookId, worksheetId, row, col);
                if (!numfmtValue || isPatternEqualWithoutDecimal(numfmtValue.pattern, '0.0')) {
                    values.push({
                        row,
                        col,
                        pattern,
                    });
                } else {
                    const decimals = getDecimalFromPattern(numfmtValue.pattern);
                    const pattern = setPatternDecimal(numfmtValue.pattern, decimals + 1);
                    pattern !== numfmtValue.pattern &&
                        values.push({
                            row,
                            col,
                            pattern,
                        });
                }
            });
        });
        if (values.length) {
            const result = await commandService.executeCommand(SetNumfmtCommand.id, { values });
            return result;
        }
        return false;
    },
};
