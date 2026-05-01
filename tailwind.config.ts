import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '1.5rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
				mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
			},
			fontSize: {
				'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0' }],
				'sm': ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '0' }],
				'base': ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
				'lg': ['1.0625rem', { lineHeight: '1.625rem', letterSpacing: '-0.005em' }],
				'xl': ['1.1875rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
				'2xl': ['1.4375rem', { lineHeight: '1.875rem', letterSpacing: '-0.015em' }],
				'3xl': ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.02em' }],
				'4xl': ['2.125rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
				'5xl': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
				'6xl': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.035em' }],
				'7xl': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.04em' }],
			},
			colors: {
				polygon: {
					blue: "#00aeef",
					darkblue: "#0095cc",
					gray: "#4a4a4a",
					lightgray: "#f8fafc",
					purple: "#00aeef",
					darkpurple: "#0095cc",
					tertiary: "#0080b3",
					darkest: "#1A1F2C",
					light: "#b3e7fa",
					neutral: "#8E9196",
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))'
				},
				gray: {
					25: 'hsl(var(--gray-25))',
					50: 'hsl(var(--gray-50))',
					100: 'hsl(var(--gray-100))',
					200: 'hsl(var(--gray-200))',
					300: 'hsl(var(--gray-300))',
					400: 'hsl(var(--gray-400))',
					500: 'hsl(var(--gray-500))',
					600: 'hsl(var(--gray-600))',
					700: 'hsl(var(--gray-700))',
					800: 'hsl(var(--gray-800))',
					900: 'hsl(var(--gray-900))',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))',
				},
			},
			borderRadius: {
				sm: 'calc(var(--radius) - 4px)',
				md: 'calc(var(--radius) - 2px)',
				lg: 'var(--radius)',
				xl: 'calc(var(--radius) + 4px)',
				'2xl': 'calc(var(--radius) + 8px)',
				'3xl': 'calc(var(--radius) + 12px)',
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'128': '32rem',
				'144': '36rem',
			},
			boxShadow: {
				'xs': 'var(--shadow-xs)',
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'xl': 'var(--shadow-xl)',
				'2xl': 'var(--shadow-xl)',
			},
			transitionDuration: {
				'150': '150ms',
				'200': '200ms',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0', opacity: '0' },
					to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
					to: { height: '0', opacity: '0' }
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' }
				},
				'fade-in-up': {
					from: { opacity: '0', transform: 'translateY(6px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.98)' },
					to: { opacity: '1', transform: 'scale(1)' }
				},
				'mesh-drift': {
					'0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
					'33%': { transform: 'translate3d(4%, -3%, 0) scale(1.08)' },
					'66%': { transform: 'translate3d(-3%, 4%, 0) scale(0.95)' },
				},
				'mesh-drift-alt': {
					'0%, 100%': { transform: 'translate3d(0,0,0) scale(1.05)' },
					'50%': { transform: 'translate3d(-5%, 3%, 0) scale(0.92)' },
				},
				'mesh-float-1': {
					'0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
					'33%': { transform: 'translate3d(12%, 8%, 0) scale(1.15)' },
					'66%': { transform: 'translate3d(-8%, 14%, 0) scale(0.95)' },
				},
				'mesh-float-2': {
					'0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
					'50%': { transform: 'translate3d(-14%, -10%, 0) scale(1.2)' },
				},
				'mesh-float-3': {
					'0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
					'40%': { transform: 'translate3d(10%, -12%, 0) scale(1.1)' },
					'80%': { transform: 'translate3d(-6%, 6%, 0) scale(1.25)' },
				},
				'logo-shimmer': {
					'0%, 100%': { filter: 'drop-shadow(0 0 0 hsl(var(--primary) / 0))' },
					'50%': { filter: 'drop-shadow(0 0 14px hsl(var(--primary) / 0.55))' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 200ms ease-out',
				'accordion-up': 'accordion-up 200ms ease-out',
				'fade-in': 'fade-in 200ms ease-out',
				'fade-in-up': 'fade-in-up 220ms ease-out',
				'fade-in-down': 'fade-in 200ms ease-out',
				'scale-in': 'scale-in 180ms ease-out',
				'slide-in-right': 'fade-in 200ms ease-out',
				'slide-in-left': 'fade-in 200ms ease-out',
				'mesh-drift': 'mesh-drift 18s ease-in-out infinite',
				'mesh-drift-alt': 'mesh-drift-alt 22s ease-in-out infinite',
				'logo-shimmer': 'logo-shimmer 4s ease-in-out infinite',
			},
			zIndex: {
				'60': '60',
				'70': '70',
				'80': '80',
				'90': '90',
				'100': '100',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
