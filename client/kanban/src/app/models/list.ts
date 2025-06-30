import { Card } from './card';

export interface List {
    id?: string;
    title: string;
    boardId: string;
    order?: number;
    Cards?: Card[];
}