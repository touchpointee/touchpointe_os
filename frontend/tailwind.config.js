/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Poppins', 'sans-serif'],
				display: ['Inter', 'Poppins', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'xl': '1.5rem',
				'2xl': '2rem',
				'3xl': '2.5rem',
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: '#60a5fa',
					dark: '#2563eb',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					glow: '#3b82f6',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				'task-card': {
					border: 'var(--task-card-border)',
					'hover-border': 'var(--task-card-hover-border)',
					foreground: 'var(--task-card-text)',
					muted: 'var(--task-card-text-muted)',
				},
				'background-dark': '#020405',
				'surface-dark': '#090c10',
			},
			keyframes: {
				'pulse-slow': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.2' },
				},
				float: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-20px)' },
				},
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				slideUp: {
					'0%': { opacity: '0', transform: 'translateY(30px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				slideInLeft: {
					'0%': { opacity: '0', transform: 'translateX(-50px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' },
				},
				slideInRight: {
					'0%': { opacity: '0', transform: 'translateX(50px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' },
				},
				scaleIn: {
					'0%': { opacity: '0', transform: 'scale(0.9)' },
					'100%': { opacity: '1', transform: 'scale(1)' },
				},
				rotate: {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' },
				},
				shimmer: {
					'0%': { backgroundPosition: '-200% center' },
					'100%': { backgroundPosition: '200% center' },
				},
				glow: {
					'0%, 100%': { filter: 'brightness(1) drop-shadow(0 0 10px rgba(96, 165, 250, 0.5))' },
					'50%': { filter: 'brightness(1.2) drop-shadow(0 0 20px rgba(96, 165, 250, 0.8))' },
				},
			},
			boxShadow: {
				'task-card': 'var(--task-card-shadow)',
			},
			backgroundImage: {
				'task-card': 'var(--task-card-bg)',
				'grid-pattern': 'linear-gradient(to right, #3b82f610 1px, transparent 1px), linear-gradient(to bottom, #3b82f610 1px, transparent 1px)',
			},
			animation: {
				'pulse-slow': 'pulse-slow 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'float': 'float 6s ease-in-out infinite',
				'fadeIn': 'fadeIn 0.6s ease-out forwards',
				'slideUp': 'slideUp 0.8s ease-out forwards',
				'slideInLeft': 'slideInLeft 0.8s ease-out forwards',
				'slideInRight': 'slideInRight 0.8s ease-out forwards',
				'scaleIn': 'scaleIn 0.6s ease-out forwards',
				'rotate': 'rotate 20s linear infinite',
				'shimmer': 'shimmer 2.5s infinite',
				'glow': 'glow 2s ease-in-out infinite',
			},
			backgroundSize: {
				'grid': '40px 40px',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}
