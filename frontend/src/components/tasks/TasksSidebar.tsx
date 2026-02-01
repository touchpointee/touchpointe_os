import { useEffect, useState, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Layers,
    Rocket,
    Folder,
    Plus,
    MoreVertical,
    Pencil,
    Trash,
    X,
    Search
} from 'lucide-react';
import { useHierarchyStore } from '@/stores/hierarchyStore';
import type { SpaceHierarchyDto, FolderHierarchyDto, ListDto } from '@/types/hierarchy';
import { cn } from '@/lib/utils';
import { useWorkspaces } from '@/stores/workspaceStore';
import { CreateListModal } from './CreateListModal';

interface TasksSidebarProps {
    workspaceId: string;
}

export function TasksSidebar({ workspaceId }: TasksSidebarProps) {
    const { spaces, loading, fetchHierarchy, expandedSpaces, expandedFolders, toggleSpace, toggleFolder, createSpace } = useHierarchyStore();
    const [showNewSpace, setShowNewSpace] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [createListModalState, setCreateListModalState] = useState<{ isOpen: boolean, spaceId?: string, folderId?: string }>({ isOpen: false });

    const { activeWorkspace } = useWorkspaces();
    const location = useLocation();
    const activeListId = location.pathname.match(/\/tasks\/list\/([^\/]+)/)?.[1];

    const role = activeWorkspace?.userRole;
    // Handle both string and number cases just to be safe (runtime vs types)
    const canManageStructure = role === 'OWNER' || role === 'ADMIN' || role === 0 || role === 1;

    useEffect(() => {
        if (workspaceId) {
            fetchHierarchy(workspaceId);
        }
    }, [workspaceId, fetchHierarchy]);

    const handleCreateSpace = async () => {
        if (newSpaceName.trim()) {
            await createSpace(workspaceId, { name: newSpaceName });
            setNewSpaceName('');
            setShowNewSpace(false);
        }
    };

    // Filter spaces based on search query
    const filteredSpaces = spaces.filter(space => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();

        // Match space name
        if (space.name.toLowerCase().includes(query)) return true;

        // Match folder name
        if (space.folders.some(f => f.name.toLowerCase().includes(query))) return true;

        // Match list within space
        if (space.lists.some(l => l.name.toLowerCase().includes(query))) return true;

        // Match list within folder
        if (space.folders.some(f => f.lists.some(l => l.name.toLowerCase().includes(query)))) return true;

        return false;
    });

    if (loading) {
        return (
            <div className="p-4 pb-20 select-none animate-pulse">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between mb-4">
                    <div className="h-3 w-16 bg-muted-foreground/20 rounded" />
                </div>

                {/* Skeleton Items */}
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                            <div className="w-5 h-5 bg-muted-foreground/10 rounded" />
                            <div className="h-4 flex-1 bg-muted-foreground/10 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 pb-20 select-none">
            <div className="flex items-center justify-between mb-4 gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search by Project, Task"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-white/5 shadow-sm border border-transparent rounded-md text-xs py-1.5 pl-3 pr-8 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-background transition-all"
                    />
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>

                {canManageStructure && (
                    <button
                        onClick={() => setShowNewSpace(true)}
                        className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        title="Create New Space"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>

            {showNewSpace && (
                <div className="mb-3 flex gap-2">
                    <input
                        type="text"
                        value={newSpaceName}
                        onChange={(e) => setNewSpaceName(e.target.value)}
                        placeholder="Space name"
                        className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background outline-none focus:ring-1 focus:ring-primary"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateSpace();
                            if (e.key === 'Escape') setShowNewSpace(false);
                        }}
                        autoFocus
                    />
                </div>
            )}

            <nav className="space-y-1">
                {filteredSpaces.map((space) => (
                    <SpaceItem
                        key={space.id}
                        space={space}
                        workspaceId={workspaceId}
                        isExpanded={expandedSpaces.has(space.id) || !!searchQuery}
                        expandedFolders={expandedFolders}
                        onToggle={() => toggleSpace(space.id)}
                        onToggleFolder={toggleFolder}
                        canManageStructure={canManageStructure}
                        activeListId={activeListId}
                        onCreateList={(spaceId, folderId) => setCreateListModalState({ isOpen: true, spaceId, folderId })}
                        searchQuery={searchQuery}
                    />
                ))}
                {filteredSpaces.length === 0 && searchQuery && (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                        No results found
                    </div>
                )}
            </nav>

            <CreateListModal
                isOpen={createListModalState.isOpen}
                onClose={() => setCreateListModalState(prev => ({ ...prev, isOpen: false }))}
                defaultSpaceId={createListModalState.spaceId}
                defaultFolderId={createListModalState.folderId}
            />
        </div>
    );
}

// === SPACE ITEM ===
interface SpaceItemProps {
    space: SpaceHierarchyDto;
    workspaceId: string;
    isExpanded: boolean;
    expandedFolders: Set<string>;
    onToggle: () => void;
    onToggleFolder: (folderId: string) => void;
    canManageStructure: boolean;
    activeListId?: string;
    onCreateList: (spaceId: string, folderId?: string) => void;
    searchQuery?: string;
}

function SpaceItem({ space, workspaceId, isExpanded, expandedFolders, onToggle, onToggleFolder, canManageStructure, activeListId, onCreateList, searchQuery }: SpaceItemProps) {
    const { createFolder, updateSpace, deleteSpace } = useHierarchyStore();

    // Check if this Space contains the active list
    const containsActiveList = space.lists.some(l => l.id === activeListId) ||
        space.folders.some(f => f.lists.some(l => l.id === activeListId));

    // Highlight Rule:
    // 1. If a List is active -> Only highlight the Space containing it.
    // 2. If NO List is active -> Highlight any expanded Space (fallback behavior).
    const shouldHighlight = activeListId ? containsActiveList : isExpanded;

    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(space.name);
    const [showNewItem, setShowNewItem] = useState<'folder' | 'list' | null>(null);
    const [newItemName, setNewItemName] = useState('');

    const handleCreate = async () => {
        if (!newItemName.trim()) return;
        if (showNewItem === 'folder') {
            await createFolder(workspaceId, { spaceId: space.id, name: newItemName });
        }
        // 'list' creates are handled via modal now, but we keep this for consistency if we ever want inline list creation back or for folder
        setNewItemName('');
        setShowNewItem(null);
    };

    const handleRename = async () => {
        if (editName.trim() && editName !== space.name) {
            await updateSpace(workspaceId, space.id, { name: editName });
        }
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (window.confirm(`Delete Space "${space.name}" and all its contents?`)) {
            await deleteSpace(workspaceId, space.id);
        }
    };

    // Filter children if search query exists
    const query = searchQuery?.toLowerCase() || '';

    // Filter folders: Include if folder name matches OR if any of its lists match
    const filteredFolders = !query ? space.folders : space.folders.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.lists.some(l => l.name.toLowerCase().includes(query))
    );

    // Filter lists: Include if list name matches (Space matches are handled at parent)
    const filteredLists = !query ? space.lists : space.lists.filter(l =>
        l.name.toLowerCase().includes(query)
    );

    // Determine if we should show this space at all (if it's a direct match or has matching children)
    // Parent TasksSidebar already does this for top-level optimization, but good to ensure children are filtered.

    return (
        <div className="mb-2">
            <div
                className={cn(
                    "group flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 relative cursor-pointer select-none",
                    shouldHighlight ? "text-white font-medium shadow-sm" : "hover:bg-accent text-foreground"
                )}
                style={shouldHighlight ? { background: 'linear-gradient(94.03deg, #925FF8 -8.9%, #4175E4 100%)' } : undefined}
                onClick={onToggle}
            >
                {/* Active Indicator */}
                {shouldHighlight && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary/40 rounded-full" />
                )}

                {/* Icon */}
                <div className={cn(
                    "flex items-center justify-center w-5 h-5 rounded bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors mr-2",
                    shouldHighlight && "bg-transparent dark:bg-transparent text-white"
                )}>
                    <Layers className="w-3.5 h-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="relative">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={() => handleRename()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename();
                                    if (e.key === 'Escape') setIsEditing(false);
                                }}
                                className="w-full text-sm bg-background border border-primary px-1 py-0.5 rounded outline-none h-6 pr-6"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <span className={cn(
                            "text-sm tracking-tight truncate block transition-colors font-semibold",
                            shouldHighlight ? "text-white" : (isExpanded ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")
                        )}>
                            {space.name}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {canManageStructure && (
                        <ContextMenu
                            onRename={() => setIsEditing(true)}
                            onDelete={handleDelete}
                            onAddFolder={() => setShowNewItem('folder')}
                            onAddList={() => onCreateList(space.id)}
                        />
                    )}
                </div>
            </div>

            {/* Inline Create Input */}
            {showNewItem && (
                <div className="ml-9 mt-1 mb-2 pr-2 relative group/input">
                    <div className="absolute left-[-11px] top-6 w-3 h-px bg-border/60"></div>
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder={`New ${showNewItem}...`}
                        className="w-full px-2 py-1 text-xs border border-border rounded bg-background outline-none focus:ring-1 focus:ring-primary pr-6"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreate();
                            if (e.key === 'Escape') setShowNewItem(null);
                        }}
                        autoFocus
                    />
                    <button
                        onClick={() => setShowNewItem(null)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Children with Tree Line */}
            {isExpanded && (
                <div className="relative ml-2 pl-1 flex flex-col gap-0.5">
                    {/* Vertical Tree Line */}
                    <div className="absolute left-[3px] top-0 bottom-2 w-px bg-primary/20" />

                    {filteredFolders.map((folder) => (
                        <FolderItem
                            key={folder.id}
                            folder={folder}
                            spaceId={space.id}
                            workspaceId={workspaceId}
                            isExpanded={expandedFolders.has(folder.id) || !!searchQuery}
                            onToggle={() => onToggleFolder(folder.id)}
                            canManageStructure={canManageStructure}
                            onCreateList={onCreateList} // Pass down
                            searchQuery={searchQuery}
                        />
                    ))}
                    {filteredLists.map((list) => (
                        <ListItem
                            key={list.id}
                            list={list}
                            workspaceId={workspaceId}
                            canManageStructure={canManageStructure}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// === FOLDER ITEM ===
interface FolderItemProps {
    folder: FolderHierarchyDto;
    spaceId: string;
    workspaceId: string;
    isExpanded: boolean;
    onToggle: () => void;
    canManageStructure: boolean;
    onCreateList: (spaceId: string, folderId?: string) => void;
    searchQuery?: string;
}

function FolderItem({ folder, spaceId, workspaceId, isExpanded, onToggle, canManageStructure, onCreateList, searchQuery }: FolderItemProps) {
    const { updateFolder, deleteFolder } = useHierarchyStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(folder.name);

    const handleRename = async () => {
        if (editName.trim() && editName !== folder.name) {
            await updateFolder(workspaceId, folder.id, { name: editName });
        }
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (window.confirm(`Delete Folder "${folder.name}"?`)) {
            await deleteFolder(workspaceId, folder.id);
        }
    };

    // Filter lists
    const query = searchQuery?.toLowerCase() || '';
    const filteredLists = !query ? folder.lists : folder.lists.filter(l => l.name.toLowerCase().includes(query));

    return (
        <div className="relative pl-0">
            {/* Tree Branch Line */}
            <div className="absolute left-[3px] top-3 w-3.5 h-px bg-primary/20" />

            <div
                className={cn(
                    "group flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent transition-colors cursor-pointer select-none text-muted-foreground hover:text-foreground"
                )}
                onClick={onToggle}
            >
                <Folder className={cn(
                    "w-3.5 h-3.5 transition-colors group-hover:text-foreground",
                    isExpanded ? "text-foreground" : "text-muted-foreground"
                )} />

                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="relative">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={() => handleRename()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename();
                                    if (e.key === 'Escape') setIsEditing(false);
                                }}
                                className="w-full text-xs bg-background border border-primary px-1 py-0.5 rounded outline-none h-6 pr-6"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <span className="text-sm font-normal truncate block transition-colors group-hover:text-foreground">{folder.name}</span>
                    )}
                </div>

                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Add List Button - Visible to everyone */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onCreateList(spaceId, folder.id); }}
                        className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                        title="Add List"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Context Menu - Restricted */}
                    {canManageStructure && (
                        <ContextMenu
                            onRename={() => setIsEditing(true)}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
            </div>



            {isExpanded && (
                <div className="relative ml-2 pl-1 flex flex-col gap-0.5 mt-0.5">
                    {/* Sub-level Vertical Line */}
                    <div className="absolute left-[3px] top-0 bottom-2 w-px bg-primary/20" />

                    {filteredLists.map((list) => (
                        <ListItem
                            key={list.id}
                            list={list}
                            workspaceId={workspaceId}
                            canManageStructure={canManageStructure}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// === LIST ITEM ===
function ListItem({ list, workspaceId, canManageStructure }: { list: ListDto, workspaceId: string, canManageStructure: boolean }) {
    const { updateList, deleteList } = useHierarchyStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(list.name);

    const handleRename = async () => {
        if (editName.trim() && editName !== list.name) {
            await updateList(workspaceId, list.id, { name: editName, folderId: list.folderId });
        }
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (window.confirm(`Delete List "${list.name}"?`)) {
            await deleteList(workspaceId, list.id);
        }
    };

    if (isEditing) {
        return (
            <div className="px-2 py-1 relative">
                <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => { handleRename(); }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename();
                        if (e.key === 'Escape') setIsEditing(false);
                    }}
                    className="w-full text-xs bg-background border border-primary px-1 py-0.5 rounded outline-none h-6 pr-6"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                />
                <button
                    onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
        );
    }

    return (
        <NavLink
            to={`/tasks/list/${list.id}`}
            className={({ isActive }) =>
                cn(
                    'group relative flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all select-none pl-2',
                    isActive
                        ? 'text-foreground font-medium text-xs' // Active: medium weight (reduced from bold), consistent size
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
            }
        // Removed style prop for background gradient
        >
            {({ isActive }) => (
                <>
                    {/* Tree Branch Line */}
                    <div className="absolute left-[-2px] bottom-1/2 w-[18px] h-px bg-primary/20" />

                    {/* Active Indicator - Removed for text-only style */}
                    {/* {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary/40 rounded-full" />
                    )} */}

                    <Rocket className={cn("w-3.5 h-3.5 ml-0", isActive ? "text-primary fill-primary/10" : "text-muted-foreground group-hover:text-foreground")} />
                    <span className="truncate flex-1">{list.name}</span>

                    {/* Context Menu - Restricted to Admins/Owners */}
                    {canManageStructure && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <ContextMenu
                                onRename={() => setIsEditing(true)}
                                onDelete={handleDelete}
                            />
                        </div>
                    )}
                </>
            )}
        </NavLink>
    );
}

// === CONTEXT MENU ===
interface ContextMenuProps {
    onRename: () => void;
    onDelete: () => void;
    onAddFolder?: () => void;
    onAddList?: () => void;
}

function ContextMenu({ onRename, onDelete, onAddFolder, onAddList }: ContextMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative">
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
                className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
            >
                <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {isOpen && (
                <div
                    ref={menuRef}
                    className="absolute right-0 top-full mt-1 w-32 bg-popover text-popover-foreground border border-border rounded-md shadow-md z-50 overflow-hidden text-xs py-1"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                    {onAddList && (
                        <button
                            onClick={() => { onAddList(); setIsOpen(false); }}
                            className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2"
                        >
                            <Rocket className="w-3 h-3" /> New Project
                        </button>
                    )}
                    {onAddFolder && (
                        <button
                            onClick={() => { onAddFolder(); setIsOpen(false); }}
                            className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2"
                        >
                            <Folder className="w-3 h-3" /> New Folder
                        </button>
                    )}
                    {(onAddFolder || onAddList) && <div className="h-px bg-border my-1" />}

                    <button
                        onClick={() => { onRename(); setIsOpen(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2"
                    >
                        <Pencil className="w-3 h-3" /> Rename
                    </button>
                    <button
                        onClick={() => { onDelete(); setIsOpen(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-destructive/10 text-destructive flex items-center gap-2"
                    >
                        <Trash className="w-3 h-3" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}
