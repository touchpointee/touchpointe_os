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
    X
} from 'lucide-react';
import { useHierarchyStore } from '@/stores/hierarchyStore';
import type { SpaceHierarchyDto, FolderHierarchyDto, ListDto } from '@/types/hierarchy';
import { cn } from '@/lib/utils';
import { useWorkspaces } from '@/stores/workspaceStore';

interface TasksSidebarProps {
    workspaceId: string;
}

export function TasksSidebar({ workspaceId }: TasksSidebarProps) {
    const { spaces, loading, fetchHierarchy, expandedSpaces, expandedFolders, toggleSpace, toggleFolder, createSpace } = useHierarchyStore();
    const [showNewSpace, setShowNewSpace] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState('');

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
            <div className="flex items-center justify-between mb-4 group/header">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Spaces
                </h2>
                {canManageStructure && (
                    <button
                        onClick={() => setShowNewSpace(true)}
                        className="p-1 rounded hover:bg-accent transition-colors opacity-0 group-hover/header:opacity-100"
                    >
                        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
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
                {spaces.map((space) => (
                    <SpaceItem
                        key={space.id}
                        space={space}
                        workspaceId={workspaceId}
                        isExpanded={expandedSpaces.has(space.id)}
                        expandedFolders={expandedFolders}
                        onToggle={() => toggleSpace(space.id)}
                        onToggleFolder={toggleFolder}
                        canManageStructure={canManageStructure}
                        activeListId={activeListId}
                    />
                ))}
            </nav>
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
}

function SpaceItem({ space, workspaceId, isExpanded, expandedFolders, onToggle, onToggleFolder, canManageStructure, activeListId }: SpaceItemProps) {
    const { createFolder, createList, updateSpace, deleteSpace } = useHierarchyStore();

    // Calculate Highlight State
    const isChildFolderExpanded = space.folders.some(f => expandedFolders.has(f.id));
    const isChildListActive = space.lists.some(l => l.id === activeListId) ||
        space.folders.some(f => f.lists.some(l => l.id === activeListId));

    // Only highlight if expanded AND no child interaction (folder open or list active)
    const shouldHighlight = isExpanded && !isChildFolderExpanded && !isChildListActive;

    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(space.name);
    const [showNewItem, setShowNewItem] = useState<'folder' | 'list' | null>(null);
    const [newItemName, setNewItemName] = useState('');

    const handleCreate = async () => {
        if (!newItemName.trim()) return;
        if (showNewItem === 'folder') {
            await createFolder(workspaceId, { spaceId: space.id, name: newItemName });
        } else if (showNewItem === 'list') {
            await createList(workspaceId, { spaceId: space.id, name: newItemName });
        }
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

    return (
        <div className="mb-2">
            <div
                className={cn(
                    "group flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 relative cursor-pointer select-none",
                    shouldHighlight ? "nav-item-selected" : "hover:bg-accent text-foreground"
                )}
                onClick={onToggle}
            >
                {/* Active Indicator */}
                {shouldHighlight && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary/40 rounded-full" />
                )}

                {/* Icon */}
                <div className={cn(
                    "flex items-center justify-center w-5 h-5 rounded bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors mr-2",
                    shouldHighlight && "bg-transparent dark:bg-transparent"
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
                            isExpanded ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                            shouldHighlight && ""
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
                            onAddList={() => setShowNewItem('list')}
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

                    {space.folders.map((folder) => (
                        <FolderItem
                            key={folder.id}
                            folder={folder}
                            spaceId={space.id}
                            workspaceId={workspaceId}
                            isExpanded={expandedFolders.has(folder.id)}
                            onToggle={() => onToggleFolder(folder.id)}
                            canManageStructure={canManageStructure}
                            activeListId={activeListId}
                        />
                    ))}
                    {space.lists.map((list) => (
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
    activeListId?: string;
}

function FolderItem({ folder, spaceId, workspaceId, isExpanded, onToggle, canManageStructure, activeListId }: FolderItemProps) {
    const { createList, updateFolder, deleteFolder } = useHierarchyStore();

    // Calculate Highlight State
    const isChildListActive = folder.lists.some(l => l.id === activeListId);

    // Only highlight if expanded AND no child list active
    const shouldHighlight = isExpanded && !isChildListActive;

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(folder.name);
    const [showNewList, setShowNewList] = useState(false);
    const [newListName, setNewListName] = useState('');

    const handleCreateList = async () => {
        if (newListName.trim()) {
            await createList(workspaceId, { spaceId, folderId: folder.id, name: newListName });
            setNewListName('');
            setShowNewList(false);
        }
    };

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

    return (
        <div className="relative pl-4">
            {/* Tree Branch Line */}
            <div className="absolute left-[3px] top-3 w-3.5 h-px bg-primary/20" />

            <div
                className={cn(
                    "group flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent transition-colors cursor-pointer select-none",
                    shouldHighlight && "nav-item-selected"
                )}
                onClick={onToggle}
            >
                {/* Active Indicator */}
                {shouldHighlight && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary/40 rounded-full" />
                )}

                <Folder className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    isExpanded ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                    shouldHighlight && ""
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
                        <span className={cn(
                            "text-xs font-medium truncate block transition-colors",
                            shouldHighlight ? "" : "text-muted-foreground group-hover:text-foreground"
                        )}>{folder.name}</span>
                    )}
                </div>

                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Add List Button - Visible to everyone */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowNewList(true); }}
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

            {showNewList && (
                <div className="ml-8 mt-1 mb-2 pr-2 relative group/input">
                    <input
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="List name..."
                        className="w-full px-2 py-1 text-xs border border-border rounded bg-background outline-none focus:ring-1 focus:ring-primary pr-6"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateList();
                            if (e.key === 'Escape') setShowNewList(false);
                        }}
                        autoFocus
                    />
                    <button
                        onClick={() => setShowNewList(false)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            {isExpanded && (
                <div className="relative ml-3 pl-1 flex flex-col gap-0.5 mt-0.5">
                    {/* Sub-level Vertical Line */}
                    <div className="absolute left-[3px] top-0 bottom-2 w-px bg-primary/20" />

                    {folder.lists.map((list) => (
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
            await updateList(workspaceId, list.id, { name: editName });
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
                    className="w-full text-[11px] bg-background border border-primary px-1 py-0.5 rounded outline-none h-6 pr-6"
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
                    'group relative flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all select-none pl-2',
                    isActive
                        ? 'nav-item-selected'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
            }
        >
            {({ isActive }) => (
                <>
                    {/* Tree Branch Line */}
                    <div className="absolute left-[-2px] bottom-1/2 w-[18px] h-px bg-primary/20" />

                    {/* Active Indicator */}
                    {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary/40 rounded-full" />
                    )}

                    <Rocket className={cn("w-3.5 h-3.5 ml-0", isActive ? "" : "text-muted-foreground group-hover:text-foreground")} />
                    <span className="truncate flex-1">{list.name}</span>

                    {/* Context Menu - Restricted to Admins/Owners */}
                    {canManageStructure && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.preventDefault()}>
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
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
            >
                <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {isOpen && (
                <div
                    ref={menuRef}
                    className="absolute right-0 top-full mt-1 w-32 bg-popover text-popover-foreground border border-border rounded-md shadow-md z-50 overflow-hidden text-xs py-1"
                    onClick={(e) => e.stopPropagation()}
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
