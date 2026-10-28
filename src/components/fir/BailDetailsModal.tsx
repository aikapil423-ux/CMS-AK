"use client";
import React, { useEffect, useState } from 'react';
import type { FIRItem, UserSession } from '@/types';
import { bailSchema, emptyBail, type BailData, type BailRecord } from '@/lib/bailSchema';
import { getStatesList, getDistrictsForState, getPoliceStationsForDistrict } from '@/lib/jurisdictionData';
import { DatePickerDDMMYYYY } from '@/components/ui/date-picker-ddmmyyyy';

const courts = [
  'Additional Chief Judicial Magistrate',
  'Chief Judicial Magistrate',
  'Judicial Magistrate First Class',
  'Sessions Court',
  'Additional Sessions Court',
  'High Court',
  'Supreme Court'
];

export function BailDetailsModal({ fir, user, onClose }: { fir: FIRItem; user: UserSession; onClose: () => void }) {
  const [data, setData] = useState<BailData>(emptyBail);
  const [records, setRecords] = useState<BailRecord[]>([]);
  const [id, setId] = useState(() => crypto.randomUUID());
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState('Bail Details');
  const [subtab, setSubtab] = useState('Personal Information');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const headers = { 'Content-Type': 'application/json', 'x-cms-user': user.id };

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/fir/bail-details?firId=${encodeURIComponent(fir.id)}`, {
      headers: { 'x-cms-user': user.id },
      cache: 'no-store'
    })
      .then(async r => {
        const b = await r.json();
        if (!r.ok) throw new Error(b.error);
        if (!cancelled) setRecords(b.records);
      })
      .catch(e => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [fir.id, user.id]);

  const set = (key: keyof BailData, value: unknown) => setData(d => ({ ...d, [key]: value }));

  const reset = () => {
    setData(emptyBail());
    setId(crypto.randomUUID());
    setVersion(0);
    setMessage('');
    setError('');
    setTab('Bail Details');
  };

  const inputRow = (key: keyof BailData, label: string, type = 'text', options?: string[]) => {
    return (
      <div key={key} className="cms-bail-field flex border border-slate-200 rounded-sm overflow-hidden text-sm bg-white">
        <div className="w-[38%] bg-[#f0f4ff] text-slate-800 font-medium px-3 py-2 flex items-center border-r border-slate-200 select-none">
          {label}
        </div>
        <div className="flex-1 p-1 flex items-center min-w-0 bg-white">
          {(key === 'mobile' || key === 'landline') ? (
            <div className="flex gap-1 items-center w-full px-1">
              <span className="text-slate-500 font-medium">+</span>
              <input
                aria-label={`${label} Country Code`}
                placeholder="Code"
                className="border border-slate-300 rounded px-1.5 py-1 w-14 text-sm focus:outline-none focus:border-blue-500"
                value={key === 'mobile' ? data.mobileCountryCode : data.landlineCountryCode}
                onChange={e => set(key === 'mobile' ? 'mobileCountryCode' : 'landlineCountryCode', e.target.value)}
              />
              {key === 'landline' && (
                <input
                  aria-label="Landline Area Code"
                  placeholder="STD"
                  className="border border-slate-300 rounded px-1.5 py-1 w-14 text-sm focus:outline-none focus:border-blue-500"
                  value={data.landlineAreaCode}
                  onChange={e => set('landlineAreaCode', e.target.value)}
                />
              )}
              <input
                aria-label={label}
                type="tel"
                className="border border-slate-300 rounded px-2 py-1 flex-1 text-sm focus:outline-none focus:border-blue-500"
                value={String(data[key] || '')}
                onChange={e => set(key, e.target.value)}
              />
            </div>
          ) : type === 'date' ? (
            <div className="w-full px-1">
              <DatePickerDDMMYYYY
                value={String(data[key] || '')}
                onValueChange={value => set(key, value)}
                className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : options ? (
            <select
              aria-label={label}
              className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:border-blue-500 mx-1 cursor-pointer"
              value={String(data[key] || '')}
              onChange={e => set(key, e.target.value)}
            >
              <option value="">Select</option>
              {options.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              aria-label={label}
              type={type}
              className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 mx-1"
              value={String(data[key] || '')}
              onChange={e => set(key, e.target.value)}
            />
          )}
        </div>
      </div>
    );
  };

  const address = (kind: 'presentAddress' | 'permanentAddress', title: string) => {
    const value = kind === 'permanentAddress' && data.sameAddress ? data.presentAddress : data[kind];
    const disabled = kind === 'permanentAddress' && data.sameAddress;
    const update = (key: string, next: string) =>
      setData(d => ({
        ...d,
        [kind]: {
          ...d[kind],
          [key]: next,
          ...(key === 'country' ? { state: '', district: '', policeStation: '' } :
              key === 'state' ? { district: '', policeStation: '' } :
              key === 'district' ? { policeStation: '' } : {})
        }
      }));

    const options: Record<string, string[]> = {
      country: ['INDIA', 'NEPAL', 'BHUTAN', 'BANGLADESH', 'PAKISTAN', 'SRI LANKA', 'AFGHANISTAN', 'UNITED ARAB EMIRATES', 'UNITED KINGDOM', 'UNITED STATES', 'CANADA', 'AUSTRALIA'],
      state: getStatesList(),
      district: getDistrictsForState(value.state),
      policeStation: getPoliceStationsForDistrict(value.state, value.district)
    };

    return (
      <fieldset className="border border-slate-300 rounded p-3 space-y-2 bg-slate-50/50">
        <legend className="font-semibold text-slate-800 px-2 text-sm">{title}</legend>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
          {Object.entries({
            houseNo: 'House No.',
            street: 'Street Name',
            locality: 'Colony/Locality/Area',
            city: 'Village/Town/City *',
            tehsil: 'Tehsil / Block / Mandal',
            country: 'Country *',
            state: 'State *',
            district: 'District *',
            policeStation: 'Police Station',
            pincode: 'Pincode'
          }).map(([key, label]) => {
            const current = value[key as keyof typeof value];
            const choices = options[key];
            return (
              <div key={key} className="flex border border-slate-200 rounded-sm overflow-hidden text-sm bg-white">
                <div className="w-[40%] bg-[#f0f4ff] text-slate-800 font-medium px-2 py-1.5 flex items-center border-r border-slate-200 text-xs sm:text-sm">
                  {label}
                </div>
                <div className="flex-1 p-1 flex items-center min-w-0 bg-white">
                  {choices && (key === 'country' || value.country === 'INDIA') ? (
                    <select
                      aria-label={`${title} ${label}`}
                      disabled={disabled}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-white disabled:bg-slate-100 focus:outline-none focus:border-blue-500"
                      value={current}
                      onChange={e => update(key, e.target.value)}
                    >
                      <option value="">Select</option>
                      {Array.from(new Set([...choices, ...(current ? [current] : [])])).map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      aria-label={`${title} ${label}`}
                      disabled={disabled}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100 focus:outline-none focus:border-blue-500"
                      value={current}
                      onChange={e => update(key, e.target.value)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>
    );
  };

  const clearSurety = () =>
    setData(d => ({
      ...emptyBail(),
      accusedId: d.accusedId,
      accusedName: d.accusedName,
      advocateName: d.advocateName,
      bailType: d.bailType,
      courtType: d.courtType,
      courtName: d.courtName,
      hearingDate: d.hearingDate,
      attachment: d.attachment
    }));

  const submit = async () => {
    setError('');
    setMessage('');
    const parsed = bailSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues.map(i => i.message).join('; '));
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/fir/bail-details', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id,
          expectedVersion: version,
          fir: {
            id: fir.id,
            policeStation: fir.policeStation,
            district: fir.district,
            assignedIoId: fir.assignedIoId,
            assignedIoName: fir.assignedIoName,
            accusedList: (fir.accusedList || []).map(a => ({ id: a.id, name: a.name }))
          },
          data: parsed.data
        })
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      const saved = b.record as BailRecord;
      setRecords(rows => [saved, ...rows.filter(x => x.id !== saved.id)]);
      setData(saved.data);
      setId(saved.id);
      setVersion(saved.version);
      setMessage('Bail details saved successfully in backend.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file?: File) => {
    if (!file) return;
    setError('');
    if (file.size > 5 * 1024 * 1024 || !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setError('Choose a PDF, JPG or PNG up to 5 MB.');
      return;
    }
    setBusy(true);
    try {
      const content = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error('File could not be read'));
        r.readAsDataURL(file);
      });
      set('attachment', { name: file.name, type: file.type, data: content });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="cms-bail-dialog fixed inset-0 z-[100] bg-slate-900/60 p-2 sm:p-4 md:p-6 flex items-center justify-center backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Bail Details"
    >
      <div className="bg-white w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl rounded-sm border border-slate-300 overflow-hidden">
        {/* Header - Dark Blue as in Screenshot */}
        <header className="bg-[#1e3a8a] text-white px-4 py-3 flex justify-between items-center shadow-sm">
          <h2 className="text-base sm:text-lg font-bold tracking-wide">
            Add Details of Bail Application Received in Court
          </h2>
          <button
            aria-label="Close Bail Details"
            disabled={busy}
            onClick={onClose}
            className="text-white hover:text-slate-200 text-xl font-bold leading-none px-2 py-1 transition-colors"
          >
            ✕
          </button>
        </header>

        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
          {/* Top FIR Info Row */}
          <div className="flex flex-wrap items-center justify-between text-sm text-slate-800 border-b border-slate-300 pb-2.5">
            <div>
              FIR No. <span className="font-bold">{fir.firNumber || '—'}</span>
            </div>
            <div>
              FIR Date: <span className="font-normal">{fir.firDate || '—'}</span>
            </div>
            <div>
              FIR Time: <span className="font-normal">{fir.firTime || '—'}</span>
            </div>
          </div>

          {/* Accused Table - Vibrant Blue Table Header */}
          <div className="border border-blue-600 rounded-xs overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-[#1d4ed8] text-white font-semibold">
                <tr>
                  <th className="py-2 px-3 text-center w-16 border-r border-blue-500">S.No.</th>
                  <th className="py-2 px-3 text-center w-16 border-r border-blue-500">Select</th>
                  <th className="py-2 px-4 text-left border-r border-blue-500">Accused/Suspect Name</th>
                  <th className="py-2 px-4 text-left">Police Station</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {(fir.accusedList && fir.accusedList.length > 0) ? (
                  fir.accusedList.map((a, i) => (
                    <tr key={a.id || `accused-${i}`} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-700 border-r border-slate-200">{i + 1}</td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200">
                        <input
                          aria-label={`Select ${a.name}`}
                          type="radio"
                          name="bailAccused"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                          checked={data.accusedId === (a.id || `accused-${i}`)}
                          onChange={() => setData(d => ({ ...d, accusedId: a.id || `accused-${i}`, accusedName: a.name }))}
                        />
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800 border-r border-slate-200">{a.name}</td>
                      <td className="py-2.5 px-4 text-slate-700">{fir.policeStation}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-center text-amber-800 bg-amber-50">
                      Add an accused to this FIR before recording bail details.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div role="alert" className="p-3 bg-red-50 text-red-800 border border-red-200 text-sm rounded">
              {error}
            </div>
          )}
          {message && (
            <div role="status" className="p-3 bg-green-50 text-green-800 border border-green-200 text-sm rounded">
              {message}
            </div>
          )}

          {/* Tabs Navigation (Yellow active / Blue inactive) */}
          <nav className="flex gap-1 pt-1" aria-label="Bail sections" role="tablist">
            {['Bail Details', 'Surety Details'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`px-6 py-2 font-bold text-sm rounded-t-xs transition-colors border ${
                  tab === t
                    ? 'bg-[#203c88] text-white border-[#203c88]'
                    : 'bg-[#1e3a8a] text-white border-[#1e3a8a] hover:bg-[#1d4ed8]'
                }`}
              >
                {t}
              </button>
            ))}
          </nav>

          {/* Tab Content */}
          {tab === 'Bail Details' ? (
            <div className="space-y-4 pt-1">
              {/* Form Grid with #f0f4ff label backgrounds exactly matching the screenshot */}
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                {/* Left Column */}
                <div className="space-y-2">
                  {inputRow('advocateName', 'Advocate Name *')}
                  {inputRow('courtType', 'Court Type *', 'text', courts)}
                  {inputRow('courtName', 'Court Name')}
                </div>
                {/* Right Column */}
                <div className="space-y-2">
                  {inputRow('bailType', 'Bail Type *', 'text', ['Anticipatory', 'Regular', 'Interim'])}
                  {inputRow('hearingDate', 'Bail Hearing Date *', 'date')}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                {/* File Upload Box */}
                <fieldset className="border border-slate-300 rounded p-3 text-sm flex-1 max-w-lg bg-slate-50/50">
                  <legend className="font-medium text-slate-700 px-1">File Upload (Bail Copy / Application)</legend>
                  <input
                    aria-label="Bail document"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    disabled={busy}
                    onChange={e => void upload(e.target.files?.[0])}
                    className="text-xs file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <span className="text-xs text-slate-500 block mt-1">PDF, JPG or PNG · Maximum 5 MB</span>
                  {data.attachment && (
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <button
                        type="button"
                        className="underline text-blue-700 font-medium"
                        onClick={() => {
                          const bytes = Uint8Array.from(atob(data.attachment!.data.split(',')[1]), c => c.charCodeAt(0));
                          const url = URL.createObjectURL(new Blob([bytes], { type: data.attachment!.type }));
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = data.attachment!.name;
                          a.click();
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                        }}
                      >
                        {data.attachment.name} (Download)
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => set('attachment', null)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </fieldset>

                <button
                  type="button"
                  className="border border-slate-300 hover:bg-slate-100 px-3 py-1.5 text-xs text-slate-700 font-medium rounded ml-4 h-fit"
                  onClick={() => setData(d => ({ ...d, advocateName: '', bailType: '', courtType: '', courtName: '', hearingDate: '', attachment: null }))}
                >
                  Clear Bail Details
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-6 bg-[#f0f4ff] p-2.5 rounded border border-slate-200 text-sm">
                <span className="font-semibold text-slate-800">Surety Type *</span>
                {['Known', 'Unknown'].map(t => (
                  <label key={t} className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      name="suretyType"
                      className="text-blue-600 focus:ring-blue-500"
                      checked={data.suretyType === t}
                      onChange={() => set('suretyType', t)}
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>

              <nav className="flex gap-1">
                {['Personal Information', 'Address'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSubtab(t)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-t-sm border ${
                      subtab === t
                        ? 'bg-[#203c88] text-white border-[#203c88]'
                        : 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </nav>

              {subtab === 'Personal Information' ? (
                <>
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                    {inputRow('uid', 'UID')}
                    {inputRow('gender', 'Gender *', 'text', ['Male', 'Female', 'Other'])}
                    {inputRow('firstName', 'First Name *')}
                    {inputRow('relativeType', 'Relative Type *', 'text', ['Father', 'Mother', 'Husband', 'Wife', 'Guardian'])}
                    {inputRow('middleName', 'Middle Name')}
                    {inputRow('relativeName', 'Relative Name *')}
                    {inputRow('lastName', 'Last Name')}
                    {inputRow('mobile', 'Mobile No.', 'tel')}
                    {inputRow('alias', 'Alias')}
                    {inputRow('landline', 'Landline No.', 'tel')}
                    {inputRow('idType', 'ID Type', 'text', ['Aadhaar', 'Passport', 'Voter ID', 'Driving Licence', 'PAN', 'Other'])}
                    {inputRow('email', 'Email ID', 'email')}
                    {inputRow('idNumber', 'ID Number')}
                    {inputRow('occupation', 'Occupation', 'text', ['Government Service', 'Private Service', 'Business', 'Agriculture', 'Labour', 'Student', 'Other'])}
                  </div>

                  <fieldset className="border border-slate-300 rounded p-3 bg-slate-50/50 space-y-3">
                    <legend className="font-semibold text-slate-800 px-2 text-sm">Age Panel</legend>
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                      {inputRow('dob', 'Date of Birth', 'date')}
                      {inputRow('birthYear', 'Year of birth', 'number')}
                      {inputRow('ageYears', 'Age (Years)', 'number')}
                      {inputRow('ageMonths', 'Age (Months)', 'number')}
                      {inputRow('ageFrom', 'Age Range From', 'number')}
                      {inputRow('ageTo', 'Age Range To', 'number')}
                    </div>
                    <button
                      type="button"
                      className="border border-slate-300 hover:bg-slate-100 px-3 py-1 text-xs text-slate-700 font-medium rounded"
                      onClick={() => setData(d => ({ ...d, dob: '', birthYear: '', ageYears: '', ageMonths: '', ageFrom: '', ageTo: '' }))}
                    >
                      Reset Age
                    </button>
                  </fieldset>
                </>
              ) : (
                <div className="space-y-4">
                  {address('presentAddress', 'Present Address')}
                  <label className="flex items-center gap-2 text-sm text-slate-800 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded border-slate-300"
                      checked={data.sameAddress}
                      onChange={e => set('sameAddress', e.target.checked)}
                    />
                    Permanent address same as present address
                  </label>
                  {address('permanentAddress', 'Permanent Address')}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  className="border border-slate-300 hover:bg-slate-100 px-3 py-1.5 text-xs text-slate-700 font-medium rounded"
                  onClick={clearSurety}
                >
                  Clear Surety Details
                </button>
              </div>
            </div>
          )}

          {/* Saved Bail Details Records Section */}
          <section className="border-t border-slate-200 pt-4 mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-800 text-sm">Saved Bail Details ({records.length})</h3>
              <button
                type="button"
                className="text-xs text-blue-700 font-semibold hover:underline"
                disabled={busy}
                onClick={reset}
              >
                + Add New Record
              </button>
            </div>
            {loading ? (
              <p className="text-xs text-slate-500">Loading saved records…</p>
            ) : records.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No saved bail details yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {records.map(r => (
                  <button
                    key={r.id}
                    disabled={busy}
                    type="button"
                    className="block w-full text-left border border-slate-200 p-2.5 rounded text-xs hover:bg-blue-50 transition-colors"
                    onClick={() => {
                      setData(r.data);
                      setId(r.id);
                      setVersion(r.version);
                      setError('');
                      setMessage('Saved record loaded. Submit to save changes.');
                      setTab('Bail Details');
                    }}
                  >
                    <span className="font-semibold text-slate-800">{r.data.accusedName}</span> ·{' '}
                    <span className="text-blue-700 font-medium">{r.data.bailType}</span> · Hearing {r.data.hearingDate} · {r.data.advocateName}{' '}
                    <span className="text-slate-400">(v{r.version}) — Click to View/Edit</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Modal Footer - Matching Screenshot (Submit in Dark Blue, Close in White bordered) */}
        <footer className="border-t border-slate-200 px-4 py-3 flex justify-end items-center gap-3 bg-white">
          <button
            type="button"
            disabled={busy}
            className="px-6 py-2 bg-[#1e3a8a] hover:bg-[#172554] text-white text-sm font-semibold rounded-xs shadow-xs disabled:opacity-50 transition-colors min-w-24 cursor-pointer"
            onClick={() => void submit()}
          >
            {busy ? 'Saving…' : version ? 'Save Changes' : 'Submit'}
          </button>
          <button
            type="button"
            disabled={busy}
            className="px-6 py-2 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-300 rounded-xs transition-colors min-w-24 cursor-pointer"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
