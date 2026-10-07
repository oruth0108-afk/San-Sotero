import seal from '../barangay-seal.jpg';

const SIZE_CLASSES = {
  sm: { image: 'h-8 w-8', name: 'text-sm' },
  md: { image: 'h-10 w-10', name: 'text-lg' },
  lg: { image: 'h-12 w-12', name: 'text-xl' },
};

export default function BrandIdentity({ name, subtitle, size = 'md' }) {
  const classes = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <img
        src={seal}
        alt=""
        aria-hidden="true"
        className={`${classes.image} shrink-0 rounded-full border-2 border-white/80 bg-white object-cover shadow-sm`}
      />
      <span className="min-w-0">
        <span className={`block truncate font-extrabold leading-tight tracking-tight ${classes.name}`}>
          Barangay {name}
        </span>
        {subtitle && <span className="block truncate text-xs text-brand-200">{subtitle}</span>}
      </span>
    </span>
  );
}
