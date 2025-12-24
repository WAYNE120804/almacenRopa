import { useState } from 'react';
import { formatCOP, parseNumber } from '../../utils/money';

const MoneyInput = ({ label, value, onChange, name, required }) => {
  const [display, setDisplay] = useState(value ? formatCOP(value) : '');

  const handleChange = (event) => {
    const raw = event.target.value;
    setDisplay(raw);
    onChange?.({ target: { name, value: parseNumber(raw) } });
  };

  const handleBlur = () => {
    setDisplay(formatCOP(parseNumber(display)));
  };

  const handleFocus = () => {
    setDisplay(value ? String(value) : '');
  };

  return (
    <label className="block text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        name={name}
        required={required}
        inputMode="numeric"
      />
    </label>
  );
};

export default MoneyInput;
