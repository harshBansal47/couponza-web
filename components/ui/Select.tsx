export default function Select({
  id,
  label,
  options,
  defaultValue,
  name,
}: {
  id: string;
  label: string;
  name?: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs uppercase tracking-wider text-ink-soft">
        {label}
      </label>
      <select id={id} name={name ?? id} defaultValue={defaultValue} className="input appearance-none">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
