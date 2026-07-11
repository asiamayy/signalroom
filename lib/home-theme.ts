// Material-3-style palette lifted from the reference Home mockup the user
// supplied — a dark-green primary theme layered over warm off-white
// surfaces. Kept as one shared object (rather than re-typing hexes in every
// Home component) so the hero, ribbon, and sidebar cards stay in sync if
// the palette ever shifts.
export const HOME_COLORS = {
  primary: '#18281c',
  onPrimary: '#ffffff',
  primaryContainer: '#2d3e31',
  onPrimaryContainer: '#96a998',
  primaryFixed: '#d4e8d5',
  primaryFixedDim: '#b8ccba',
  onPrimaryFixed: '#0f1f14',
  onPrimaryFixedVariant: '#3a4b3d',
  secondary: '#596058',
  onSecondary: '#ffffff',
  secondaryContainer: '#dee5da',
  onSecondaryContainer: '#5f665e',
  surface: '#fcf9f8',
  surfaceBright: '#fcf9f8',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f6f3f2',
  surfaceContainer: '#f0eded',
  surfaceContainerHigh: '#eae7e7',
  outline: '#737873',
  outlineVariant: '#c3c8c1',
  onSurface: '#1c1b1b',
  onSurfaceVariant: '#434843',
  tertiary: '#232525',
  onTertiary: '#ffffff',
  error: '#ba1a1a',
} as const

export const HOME_FONT_DISPLAY = 'var(--nf-source-serif), Georgia, serif'
export const HOME_FONT_BODY = 'var(--nf-hanken), system-ui, sans-serif'
