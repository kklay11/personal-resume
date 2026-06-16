import { clampNumber } from '../lib/utils';

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  suffix?: string;
}

export const NumberField = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
}: NumberFieldProps) => (
  <label className="field">
    <span>{label}</span>
    <div className="number-field">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(clampNumber(Number(event.target.value), min, max))}
      />
      {suffix ? <em>{suffix}</em> : null}
    </div>
  </label>
);
