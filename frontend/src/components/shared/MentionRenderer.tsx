interface MentionRendererProps {
    content: string;
    className?: string;
}

export function MentionRenderer({ content, className }: MentionRendererProps) {
    // Regex to match <@userId|userName>
    const mentionRegex = /<@([a-zA-Z0-9-]+)\|([^>]+)>/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push(content.substring(lastIndex, match.index));
        }

        // Add mention component
        const userName = match[2];
        parts.push(
            <span key={match.index} className="inline-flex items-center mx-0.5">
                <span className="font-bold hover:underline cursor-pointer bg-background/20 px-1 rounded text-xs select-none break-all">
                    @{userName}
                </span>
            </span>
        );

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
    }

    return <div className={className}>{parts}</div>;
}
