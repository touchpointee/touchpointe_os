import { forwardRef } from 'react';
import { type LucideProps } from 'lucide-react';

export const MyTasksIcon = forwardRef<SVGSVGElement, LucideProps>(
    ({ color = "currentColor", size = 24, strokeWidth = 2, className, ...props }, ref) => {
        return (
            <svg
                ref={ref}
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
                {...props}
            >
                {/* 
                   Pixel-Perfect "Bullet & Pill" Icon (Reference Match) - SCALED UP
                   - Content expanded to fill nearly the entire 24x24 grid (minimal padding).
                   - Stroke width effectively looks consistent with bold size.
                */}

                {/* Document Border */}
                {/* 
                   Old Bounds: x=4 to 18 (w=14), y=3 to 21 (h=18)
                   New Bounds: x=2 to 22 (w=20), y=2 to 22 (h=20)
                   This is a significant size increase (+40% area).
                */}
                <path d="M16 22H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h13a3 3 0 0 1 3 3v10" />

                {/* Rows (Start x=6, End x=18?) */}

                {/* Row 1 */}
                <circle cx="7" cy="8" r="1.5" fill="currentColor" stroke="none" />
                <path d="M11 8h7" strokeLinecap="round" />

                {/* Row 2 */}
                <circle cx="7" cy="13" r="1.5" fill="currentColor" stroke="none" />
                <path d="M11 13h7" strokeLinecap="round" />

                {/* Row 3 */}
                <circle cx="7" cy="18" r="1.5" fill="currentColor" stroke="none" />
                <path d="M11 18h3" strokeLinecap="round" />

                {/* User Icon (Bottom Right - Larger) */}
                <circle cx="19" cy="18" r="3" />
                <path d="M22 23v-.5a3.5 3.5 0 0 0-6 0v.5" />
            </svg>
        );
    }
);

MyTasksIcon.displayName = 'MyTasksIcon';
