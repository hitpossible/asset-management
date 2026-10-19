import './MeasurementInput.css'
import Icon from './Icon.jsx'

export default function MeasurementInput({ unit, units, onUnitChange, ...props }) {
  return <span className={`measurement-input${props.disabled ? ' measurement-input-disabled' : ''}`}><input {...props} aria-label={props['aria-label'] || (units ? 'Power' : 'Area (m²)')} type="number" min="0" step="any" inputMode="decimal" />{units ? <span className="measurement-unit-picker"><select aria-label="Power unit" value={unit} disabled={props.disabled} onChange={onUnitChange}>{units.map((value) => <option key={value} value={value}>{value}</option>)}</select><Icon name="down" size={14} /></span> : <span className="measurement-unit-fixed" aria-hidden="true">{unit}</span>}</span>
}
