import { useState } from 'react';
import { providersApi } from '../api/resources.js';
import { useSaveAvailability } from '../hooks/useResources.js';
import { ErrorMessage } from '../components/States.jsx';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const initialRules = weekdays.map((_, dayOfWeek) => ({ dayOfWeek, enabled: dayOfWeek < 5, startMin: 9 * 60, endMin: 17 * 60 }));

function minutesToTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function AvailabilityEditorPage() {
  const [rules, setRules] = useState(initialRules);
  const [saved, setSaved] = useState(false);
  const mutation = useSaveAvailability();
  function updateRule(index, update) {
    setRules((current) => current.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, ...update } : rule));
    setSaved(false);
  }
  async function save() {
    await mutation.mutateAsync(rules.filter((rule) => rule.enabled).map(({ enabled, ...rule }) => rule));
    setSaved(true);
  }
  return (
    <section className="content-section narrow-section">
      <div className="section-heading"><div><p className="eyebrow">Provider workspace</p><h1>Weekly availability</h1><p className="section-copy">Set the hours you want to make bookable.</p></div></div>
      <div className="availability-list">{rules.map((rule, index) => <div className={`availability-row ${rule.enabled ? '' : 'is-disabled'}`} key={rule.dayOfWeek}>
        <label className="day-toggle"><input type="checkbox" checked={rule.enabled} onChange={(event) => updateRule(index, { enabled: event.target.checked })} /><span className="toggle-ui" /><strong>{weekdays[rule.dayOfWeek]}</strong></label>
        <label className="time-field"><span className="sr-only">Start time</span><input type="time" disabled={!rule.enabled} value={minutesToTime(rule.startMin)} onChange={(event) => updateRule(index, { startMin: timeToMinutes(event.target.value) })} /></label>
        <span className="time-dash">to</span>
        <label className="time-field"><span className="sr-only">End time</span><input type="time" disabled={!rule.enabled} value={minutesToTime(rule.endMin)} onChange={(event) => updateRule(index, { endMin: timeToMinutes(event.target.value) })} /></label>
      </div>)}</div>
      <ErrorMessage error={mutation.error} />
      {saved && <div className="notice notice-success">Availability saved.</div>}
      <div className="editor-actions"><span className="muted">Times use your provider timezone.</span><button className="button button-primary" onClick={save} disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save availability'}<span aria-hidden="true">↗</span></button></div>
    </section>
  );
}