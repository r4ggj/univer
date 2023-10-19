import { ICommandInfo } from '@univerjs/core';

export interface IChangeset {
    rev: number;
    mutations: ICommandInfo[];
}
