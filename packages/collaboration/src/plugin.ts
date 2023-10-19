import { IUndoRedoService, Plugin, PluginType } from '@univerjs/core';
import { Injector } from '@wendellhu/redi';

export class CollaborationPlugin extends Plugin {
    static override type = PluginType.Univer;

    override onStarting(_injector: Injector): void {
        // replace default
        _injector.replace([IUndoRedoService, { useClass: class {} }]);
    }
}
