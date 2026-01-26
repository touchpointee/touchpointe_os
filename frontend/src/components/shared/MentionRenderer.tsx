import * as twemoji from 'twemoji';

interface MentionRendererProps {
    content: string;
    className?: string;
}

export function MentionRenderer({ content, className }: MentionRendererProps) {
    // Regex to match <@userId|userName>
    const mentionRegex = /<@([a-zA-Z0-9-]+)\|([^>]+)>/g;

    // Jumbomoji Logic
    let emojiClass = 'inline-block w-5 h-5 align-text-bottom mx-0.5'; // Default
    const hasMentions = /<@([a-zA-Z0-9-]+)\|([^>]+)/.test(content);

    if (!hasMentions) {
        const parsed = (twemoji as any).parse(content);
        const stripped = parsed.replace(/<img[^>]*>/g, '').trim();
        if (stripped.length === 0) {
            const count = (parsed.match(/<img/g) || []).length;
            if (count === 1) emojiClass = 'inline-block w-14 h-14 align-middle mx-0.5';
            else if (count === 2) emojiClass = 'inline-block w-10 h-10 align-middle mx-0.5';
            else if (count === 3) emojiClass = 'inline-block w-9 h-9 align-middle mx-0.5';
            else if (count <= 6) emojiClass = 'inline-block w-6 h-6 align-middle mx-0.5';
        }
    }

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        // Add text before match (Default size because mentions exist)
        if (match.index > lastIndex) {
            const text = content.substring(lastIndex, match.index);
            parts.push(
                <span
                    key={`text-${lastIndex}`}
                    dangerouslySetInnerHTML={{
                        __html: (twemoji as any).parse(text, {
                            folder: 'svg',
                            ext: '.svg',
                            className: 'inline-block w-5 h-5 align-text-bottom mx-0.5'
                        })
                    }}
                />
            );
        }

        // Add mention component
        const userName = match[2];
        parts.push(
            <span key={match.index} className="inline-flex items-center mx-0.5">
                <span className="font-bold hover:underline cursor-pointer bg-background/20 px-1 rounded text-sm select-none break-all text-[#01d127c8]">
                    @{userName}
                </span>
            </span>
        );

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        const text = content.substring(lastIndex);
        parts.push(
            <span
                key={`text-${lastIndex}`}
                dangerouslySetInnerHTML={{
                    __html: (twemoji as any).parse(text, {
                        folder: 'svg',
                        ext: '.svg',
                        className: emojiClass
                    })
                }}
            />
        );
    }

    return <span className={className}>{parts}</span>;
}
