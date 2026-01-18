export interface TaskStatusDto {
    id: string;
    listId: string;
    name: string;
    color: string;
    category: 'NotStarted' | 'Active' | 'Closed';
    order: number;
}

export interface ListDto {
    id: string;
    spaceId: string;
    folderId: string | null;
    name: string;
    orderIndex: number;
    createdAt: string;
    statuses?: TaskStatusDto[];
}

export interface FolderHierarchyDto {
    id: string;
    name: string;
    icon: string | null;
    orderIndex: number;
    lists: ListDto[];
}

export interface SpaceHierarchyDto {
    id: string;
    name: string;
    icon: string | null;
    orderIndex: number;
    folders: FolderHierarchyDto[];
    lists: ListDto[]; // Lists not in a folder
}

export interface CreateSpaceRequest {
    name: string;
    icon?: string;
}

export interface CreateFolderRequest {
    spaceId: string;
    name: string;
    icon?: string;
}

export interface CreateListRequest {
    spaceId: string;
    folderId?: string;
    name: string;
}

export interface UpdateSpaceRequest {
    name?: string;
    icon?: string;
}

export interface UpdateFolderRequest {
    name?: string;
    icon?: string;
    spaceId?: string; // For moving
}

export interface UpdateListRequest {
    name: string;
    folderId?: string | null; // For moving
}
