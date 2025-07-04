import { List } from './list';

export interface Board {
    id?: string;
    title: string;
    userId?: string;
    Lists?: List[];
    isCollaborationEnabled?: boolean;
    shareCode?: string;
    collaborators?: any[];
}