const DateInput = ({ label, value, name, onChange, required }) => {
  return (
    <label className="block text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        type="date"
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        value={value}
        onChange={onChange}
        name={name}
        required={required}
      />
    </label>
  );
};

export default DateInput;
