import { ComponentManager } from '@univerjs/base-ui';
import { ICommandService, Plugin, PluginType } from '@univerjs/core';
import { Inject, Injector } from '@wendellhu/redi';

import { SHEET_NUMFMT_PLUGIN } from './base/const/PLUGIN_NAME';
import { SetNumfmtMutation } from './commands/mutations/set.numfmt.mutation';
import { CloseNumfmtPanelOperator } from './commands/operators/close.numfmt.panel.operator';
import { OpenNumfmtPanelOperator } from './commands/operators/open.numfmt.panel.operator';
import { SheetNumfmtPanel } from './components/index';
import { NumfmtService } from './service/numfmt.service';

export class NumfmtPlugin extends Plugin {
    static override type = PluginType.Sheet;
    constructor(
        @Inject(Injector) override readonly _injector: Injector,
        @Inject(ComponentManager) private _componentManager: ComponentManager,
        @Inject(ICommandService) private _commandService: ICommandService
    ) {
        super(SHEET_NUMFMT_PLUGIN);
        this._injector.add([NumfmtService]);
        this._componentManager.register(SHEET_NUMFMT_PLUGIN, SheetNumfmtPanel);
        this._commandService.registerCommand(OpenNumfmtPanelOperator);
        this._commandService.registerCommand(CloseNumfmtPanelOperator);
        this._commandService.registerCommand(SetNumfmtMutation);
    }

    open() {
        this._commandService.executeCommand('sheet.open.numfmt.panel.operator');
    }

    close() {
        this._commandService.executeCommand('sheet.close.numfmt.panel.operator');
    }
}