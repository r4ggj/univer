import { MoveCursorOperation } from '@univerjs/base-docs';
import {
    DOCS_FORMULA_BAR_EDITOR_UNIT_ID_KEY,
    DOCS_NORMAL_EDITOR_UNIT_ID_KEY,
    IMouseEvent,
    IPointerEvent,
    IRenderManagerService,
} from '@univerjs/base-render';
import { SetRangeValuesCommand } from '@univerjs/base-sheets';
import { KeyCode } from '@univerjs/base-ui';
import {
    DEFAULT_EMPTY_DOCUMENT_VALUE,
    Direction,
    Disposable,
    DocumentModel,
    FOCUSING_EDITOR,
    FOCUSING_EDITOR_BUT_HIDDEN,
    FOCUSING_EDITOR_INPUT_FORMULA,
    ICellData,
    ICommandInfo,
    ICommandService,
    IContextService,
    INTERCEPTOR_POINT,
    isFormulaString,
    IUniverInstanceService,
    LifecycleStages,
    Nullable,
    Observer,
    OnLifecycle,
    SheetInterceptorService,
    Tools,
} from '@univerjs/core';
import { Inject } from '@wendellhu/redi';
import { Subscription } from 'rxjs';

import { getEditorObject } from '../../basics/editor/get-editor-object';
import { MoveSelectionCommand, MoveSelectionEnterAndTabCommand } from '../../commands/commands/set-selection.command';
import { SetCellEditVisibleArrowOperation } from '../../commands/operations/cell-edit.operation';
import { ICellEditorManagerService } from '../../services/editor/cell-editor-manager.service';
import { IEditorBridgeService, IEditorBridgeServiceVisibleParam } from '../../services/editor-bridge.service';
import { MOVE_SELECTION_KEYCODE_LIST } from '../shortcuts/editor.shortcut';

enum CursorChange {
    InitialState,
    StartEditor,
    CursorChange,
}

@OnLifecycle(LifecycleStages.Steady, EndEditController)
export class EndEditController extends Disposable {
    private _onInputSubscription: Nullable<Subscription>;

    private _cursorChangeObservers: Nullable<Observer<IPointerEvent | IMouseEvent>>;

    private _editorVisiblePrevious = false;

    /**
     * It is used to distinguish whether the user has actively moved the cursor in the editor, mainly through mouse clicks.
     */
    private _isCursorChange: CursorChange = CursorChange.InitialState;

    constructor(
        @IUniverInstanceService private readonly _currentUniverService: IUniverInstanceService,
        @IRenderManagerService private readonly _renderManagerService: IRenderManagerService,
        @ICommandService private readonly _commandService: ICommandService,
        @IEditorBridgeService private readonly _editorBridgeService: IEditorBridgeService,
        @IContextService private readonly _contextService: IContextService,
        @ICellEditorManagerService private readonly _cellEditorManagerService: ICellEditorManagerService,
        @Inject(SheetInterceptorService) private readonly _sheetInterceptorService: SheetInterceptorService
    ) {
        super();

        this._initialize();

        this._commandExecutedListener();
    }

    override dispose(): void {
        this._onInputSubscription?.unsubscribe();

        const editorObject = this._getEditorObject();

        if (editorObject == null) {
            return;
        }

        const { document: documentComponent } = editorObject;
        documentComponent.onPointerDownObserver.remove(this._cursorChangeObservers);
    }

    private _initialize() {
        this._initialExitInput();

        this._cursorStateListener();
    }

    private _initialExitInput() {
        this._onInputSubscription = this._editorBridgeService.visible$.subscribe((param) => {
            const { visible, keycode } = param;

            if (visible === this._editorVisiblePrevious) {
                return;
            }

            this._editorVisiblePrevious = visible;

            if (visible === true) {
                this._isCursorChange = CursorChange.StartEditor;
                return;
            }

            this._isCursorChange = CursorChange.InitialState;

            this._exitInput(param);

            if (keycode === KeyCode.ESC) {
                return;
            }

            const state = this._editorBridgeService.getState();

            if (state == null) {
                return;
            }

            const { unitId, sheetId, row, column, documentLayoutObject } = state;

            if (documentLayoutObject == null) {
                return;
            }

            this._moveCursor(keycode);

            const workbook = this._currentUniverService.getUniverSheetInstance(unitId);

            const worksheet = workbook?.getSheetBySheetId(sheetId);

            if (worksheet == null) {
                return;
            }

            const cellData: ICellData = Tools.deepClone(worksheet.getCell(row, column) || {});

            const documentModel = documentLayoutObject.documentModel as DocumentModel;

            const snapshot = documentModel.getSnapshot();

            const body = snapshot.body;

            if (body == null) {
                return;
            }

            if (body.textRuns && body.textRuns.length > 1) {
                cellData.p = snapshot;
            } else {
                const data = body.dataStream;
                const lastString = data.substring(data.length - 2, data.length);
                const newDataStream =
                    lastString === DEFAULT_EMPTY_DOCUMENT_VALUE ? data.substring(0, data.length - 2) : data;

                if (newDataStream === cellData.v) {
                    return;
                }

                if (isFormulaString(newDataStream)) {
                    cellData.f = newDataStream;
                } else {
                    cellData.v = newDataStream;
                    cellData.m = newDataStream;
                }
            }

            const context = {
                worksheetId: sheetId,
                workbookId: unitId,
                workbook: workbook!,
                worksheet,
                row,
                col: column,
            };
            const cell = this._sheetInterceptorService.fetchThroughInterceptors(INTERCEPTOR_POINT.AFTER_CELL_EDIT)(
                cellData,
                context
            );
            this._commandService.executeCommand(SetRangeValuesCommand.id, {
                worksheetId: sheetId,
                workbookId: unitId,
                range: {
                    startRow: row,
                    startColumn: column,
                    endRow: row,
                    endColumn: column,
                },
                value: cell,
            });
        });
    }

    private _exitInput(param: IEditorBridgeServiceVisibleParam) {
        this._contextService.setContextValue(FOCUSING_EDITOR_INPUT_FORMULA, false);
        this._contextService.setContextValue(FOCUSING_EDITOR, false);
        this._contextService.setContextValue(FOCUSING_EDITOR_BUT_HIDDEN, false);
        this._cellEditorManagerService.setState({
            show: param.visible,
        });
    }

    private _moveCursor(keycode?: KeyCode) {
        if (keycode == null || !MOVE_SELECTION_KEYCODE_LIST.includes(keycode)) {
            return;
        }

        let direction = Direction.LEFT;

        switch (keycode) {
            case KeyCode.ENTER:
                direction = Direction.DOWN;
                break;
            case KeyCode.TAB:
                direction = Direction.RIGHT;
                break;
            case KeyCode.ARROW_DOWN:
                direction = Direction.DOWN;
                break;
            case KeyCode.ARROW_UP:
                direction = Direction.UP;
                break;
            case KeyCode.ARROW_LEFT:
                direction = Direction.LEFT;
                break;
            case KeyCode.ARROW_RIGHT:
                direction = Direction.RIGHT;
                break;
        }

        if (keycode === KeyCode.ENTER || keycode === KeyCode.TAB) {
            this._commandService.executeCommand(MoveSelectionEnterAndTabCommand.id, {
                keycode,
                direction,
            });
        } else {
            this._commandService.executeCommand(MoveSelectionCommand.id, {
                direction,
            });
        }
    }

    private _cursorStateListener() {
        /**
         * The user's operations follow the sequence of opening the editor and then moving the cursor.
         * The logic here predicts the user's first cursor movement behavior based on this rule
         */

        const editorObject = this._getEditorObject();

        if (editorObject == null) {
            return;
        }

        const { document: documentComponent } = editorObject;

        this._cursorChangeObservers = documentComponent.onPointerDownObserver.add(() => {
            if (this._isCursorChange === CursorChange.StartEditor) {
                this._isCursorChange = CursorChange.CursorChange;
            }
        });
    }

    private _commandExecutedListener() {
        const updateCommandList = [SetCellEditVisibleArrowOperation.id];
        this.disposeWithMe(
            this._commandService.onCommandExecuted((command: ICommandInfo) => {
                if (updateCommandList.includes(command.id)) {
                    const params = command.params as IEditorBridgeServiceVisibleParam;
                    const { keycode } = params;

                    /**
                     * After the user enters the editor and actively moves the editor selection area with the mouse,
                     * the up, down, left, and right keys can no longer switch editing cells,
                     * but move the cursor within the editor instead.
                     */
                    if (keycode != null && this._isCursorChange === CursorChange.CursorChange) {
                        this._moveInEditor(keycode);
                        return;
                    }

                    this._editorBridgeService.changeVisible(params);
                }
            })
        );
    }

    private _moveInEditor(keycode: KeyCode) {
        let direction = Direction.LEFT;
        if (keycode === KeyCode.ARROW_DOWN) {
            direction = Direction.DOWN;
        } else if (keycode === KeyCode.ARROW_UP) {
            direction = Direction.UP;
        } else if (keycode === KeyCode.ARROW_RIGHT) {
            direction = Direction.RIGHT;
        }

        this._commandService.executeCommand(MoveCursorOperation.id, {
            direction,
        });
    }

    private _getEditorObject() {
        return getEditorObject(DOCS_NORMAL_EDITOR_UNIT_ID_KEY, this._renderManagerService);
    }

    private _getFormulaBarEditorObject() {
        return getEditorObject(DOCS_FORMULA_BAR_EDITOR_UNIT_ID_KEY, this._renderManagerService);
    }
}
