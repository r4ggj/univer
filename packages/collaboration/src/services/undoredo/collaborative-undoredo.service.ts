import { IUndoRedoService, LocalUndoRedoService } from '@univerjs/core';

export interface ICollaborativeUndoRedoService extends IUndoRedoService {
    // TODO: add methods to transform command info in undo redo stack
}

export class CollaborativeUndoRedoService extends LocalUndoRedoService implements IUndoRedoService {}
