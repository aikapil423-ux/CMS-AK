import React from "react";
import { toStatutoryFinalReport } from "@/lib/finalReport";

// Keep the existing IIF-V preview markup and layout unchanged.
export function StatutoryFinalReportPreview({ data, previewRef }: { data: ReturnType<typeof toStatutoryFinalReport>; previewRef: React.Ref<HTMLDivElement> }) {
  const { court, district, ps, year, firNo, firDate, reportNo, reportDate, actRows, finalFormType, ifFirUnoccurred, ifChargeSheet, ioName, ioRank, ioNo, complainantName, complainantFather, propertyRows, accusedPersonList, accusedNotChargeSheeted, witnessesList, falseFirAction, labAnalysis, briefFacts, referNoticeServed, referNoticeDate, referNoticeAck, despatchedOn, noOfEnclosures, listOfEnclosures, shoName, shoRank, shoNo } = data;
  return (
<div
            ref={previewRef}
            className="bg-white p-8 sm:p-12 rounded-xl shadow-lg border border-slate-300 font-serif text-slate-900 space-y-6 max-w-4xl mx-auto"
            style={{ fontSize: "12px", lineHeight: "1.6" }}
          >
            {/* Header Section */}
            <div className="border-b-2 border-slate-900 pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-sans font-bold text-xs tracking-wider">
                    I.I.F.-V | FINAL FORM / REPORT
                  </h4>
                  <p className="font-sans text-[11px] text-slate-600">
                    Under Section 193 BNSS
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-sans font-bold text-xs uppercase tracking-wider">
                    Haryana Police
                  </span>
                </div>
              </div>
              <div className="text-center mt-3">
                <h2 className="font-sans font-black text-base sm:text-lg tracking-wide uppercase">
                  FINAL FORM / REPORT
                </h2>
              </div>
            </div>

            {/* IN THE COURT OF */}
            <div className="space-y-1">
              <div className="font-bold text-[11px] font-sans uppercase">IN THE COURT OF</div>
              <div className="border-b border-slate-400 pb-1 font-bold text-xs font-sans">
                {court || "Chief Judicial Magistrate, Kurukshetra"}
              </div>
            </div>

            {/* 1. District / P.S. / Year / FIR */}
            <div className="space-y-2">
              <div className="font-bold text-xs font-sans">1. District / P.S. / Year / FIR</div>
              <div className="grid grid-cols-3 gap-4 border-b border-slate-300 pb-2 text-xs">
                <div>
                  <span className="font-bold">District: </span>
                  <span>{district}</span>
                </div>
                <div>
                  <span className="font-bold">P.S.: </span>
                  <span>{ps}</span>
                </div>
                <div>
                  <span className="font-bold">Year: </span>
                  <span>{year}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-2 text-xs">
                <div>
                  <span className="font-bold">FIR No.: </span>
                  <span className="font-bold font-mono">{firNo}</span>
                </div>
                <div>
                  <span className="font-bold">Date: </span>
                  <span>{firDate}</span>
                </div>
              </div>
            </div>

            {/* 2 & 3 */}
            <div className="space-y-2 text-xs">
              <div className="border-b border-slate-300 pb-2">
                <span className="font-bold">2. Final Report / Charge Sheet No.: </span>
                <span className="font-bold font-mono">{reportNo}</span>
              </div>
              <div className="border-b border-slate-300 pb-2">
                <span className="font-bold">3. Date: </span>
                <span>{reportDate}</span>
              </div>
            </div>

            {/* 4. Act & Sections */}
            <div className="space-y-1.5 text-xs">
              <div className="font-bold font-sans">4. Act &amp; Sections</div>
              <table className="w-full border-collapse border border-slate-400 text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400">
                    <th className="border border-slate-400 p-1.5 w-14 text-center">S. No.</th>
                    <th className="border border-slate-400 p-1.5">Act</th>
                    <th className="border border-slate-400 p-1.5">Sections</th>
                  </tr>
                </thead>
                <tbody>
                  {actRows.map((r, i) => (
                    <tr key={i}>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">{r.sNo}</td>
                      <td className="border border-slate-400 p-1.5">{r.act}</td>
                      <td className="border border-slate-400 p-1.5 font-bold font-mono">{r.sections}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 5, 6, 7 */}
            <div className="space-y-2 text-xs border-b border-slate-300 pb-2">
              <div>
                <span className="font-bold">5. Type of Final Form / Report: </span>
                <span>{finalFormType}</span>
              </div>
              <div>
                <span className="font-bold">6. If FIR Unoccurred: </span>
                <span>{ifFirUnoccurred}</span>
              </div>
              <div>
                <span className="font-bold">7. If Charge Sheet: </span>
                <span>{ifChargeSheet}</span>
              </div>
            </div>

            {/* 8. Name of I.O. at the time of Charge Sheet */}
            <div className="space-y-1 text-xs border-b border-slate-300 pb-2">
              <div className="font-bold font-sans">8. Name of I.O. at the time of Charge Sheet</div>
              <div className="grid grid-cols-3 gap-4 pt-1">
                <div>
                  <span className="font-bold">Name: </span>
                  <span>{ioName}</span>
                </div>
                <div>
                  <span className="font-bold">Rank: </span>
                  <span>{ioRank}</span>
                </div>
                <div>
                  <span className="font-bold">No.: </span>
                  <span className="font-mono">{ioNo}</span>
                </div>
              </div>
            </div>

            {/* 9. Complainant / Informant */}
            <div className="space-y-1 text-xs border-b border-slate-300 pb-2">
              <div>
                <span className="font-bold">9. (a) Name of Complainant / Informant: </span>
                <span className="font-semibold">{complainantName}</span>
              </div>
              <div>
                <span className="font-bold">&nbsp;&nbsp;&nbsp;&nbsp;(b) Father&apos;s / Husband&apos;s Name: </span>
                <span>{complainantFather}</span>
              </div>
            </div>

            {/* 10. Details of Properties Recovered */}
            <div className="space-y-1.5 text-xs">
              <div className="font-bold font-sans">
                10. Details of Properties / Articles / Documents Recovered / Seized
              </div>
              <table className="w-full border-collapse border border-slate-400 text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400">
                    <th className="border border-slate-400 p-1.5 w-12 text-center">S. No.</th>
                    <th className="border border-slate-400 p-1.5">Property Description</th>
                    <th className="border border-slate-400 p-1.5 w-24">Estimated Value (Rs.)</th>
                    <th className="border border-slate-400 p-1.5 w-28">P.S. Property Register No.</th>
                    <th className="border border-slate-400 p-1.5">From Whom / Where Seized</th>
                    <th className="border border-slate-400 p-1.5 w-24">Disposal</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyRows.map((p, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">{p.sNo}</td>
                      <td className="border border-slate-400 p-1.5">{p.propertyDescription}</td>
                      <td className="border border-slate-400 p-1.5">{p.estimatedValue}</td>
                      <td className="border border-slate-400 p-1.5 font-mono">{p.psPropertyRegisterNo}</td>
                      <td className="border border-slate-400 p-1.5">{p.fromWhomWhereRecovered}</td>
                      <td className="border border-slate-400 p-1.5">{p.disposal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 11. Particulars of Accused Persons Charge-Sheeted */}
            <div className="space-y-3 text-xs pt-2">
              <div className="font-bold font-sans border-b border-slate-400 pb-1 uppercase tracking-wide">
                11. Particulars of Accused Persons Charge-Sheeted
              </div>

              {accusedPersonList.map((acc, aIdx) => (
                <div key={aIdx} className="space-y-2 border border-slate-300 p-3 rounded bg-slate-50/30">
                  <div className="font-bold font-sans">
                    S. No.: <span className="font-mono">{acc.sNo}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold">(i) Name: </span>
                      <span className="font-bold">{acc.name}</span>
                    </div>
                    <div>
                      <span className="font-bold">Whether Verified: </span>
                      <span>{acc.whetherVerified}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold">(ii) Husband&apos;s / Father&apos;s Name: </span>
                    <span>{acc.husbandFatherName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold">(iii) Date / Year of Birth: </span>
                      <span>{acc.dateOrYearOfBirth}</span>
                    </div>
                    <div>
                      <span className="font-bold">(iv) Sex: </span>
                      <span>{acc.sex}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold">(v) Nationality: </span>
                      <span>{acc.nationality}</span>
                    </div>
                    <div>
                      <span className="font-bold">(vi) Passport No.: </span>
                      <span>{acc.passportNo || "Nil"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="font-bold">(vii) Religion: </span>
                      <span>{acc.religion}</span>
                    </div>
                    <div>
                      <span className="font-bold">(viii) Whether SC / ST / OBC: </span>
                      <span>{acc.scStObc}</span>
                    </div>
                    <div>
                      <span className="font-bold">(ix) Occupation: </span>
                      <span>{acc.occupation}</span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1 pt-1">
                    <div className="font-bold">. (x) Address</div>
                    <table className="w-full border-collapse border border-slate-300 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                          <th className="border border-slate-300 p-1 w-10 text-center">S. No.</th>
                          <th className="border border-slate-300 p-1 w-32">Address Type</th>
                          <th className="border border-slate-300 p-1">Address</th>
                          <th className="border border-slate-300 p-1 w-24 text-center">Verified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acc.addresses.map((ad, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-300 p-1 text-center font-mono">{ad.sNo}</td>
                            <td className="border border-slate-300 p-1">{ad.addressType}</td>
                            <td className="border border-slate-300 p-1">{ad.address}</td>
                            <td className="border border-slate-300 p-1 text-center">{ad.whetherVerified}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="font-bold">(xi) Regular Criminal No.: </span>
                      <span>{acc.regularCriminalNo || "Nil"}</span>
                    </div>
                    <div>
                      <span className="font-bold">(xii) Date of Arrest: </span>
                      <span>{acc.dateOfArrest}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold">(xiii) Date of Release on Bail: </span>
                      <span>{acc.dateOfReleaseOnBail}</span>
                    </div>
                    <div>
                      <span className="font-bold">(xiv) Date on Which Forwarded to Court: </span>
                      <span>{acc.dateForwardedToCourt}</span>
                    </div>
                  </div>

                  {/* Under Acts & Sections */}
                  <div className="space-y-1 pt-1">
                    <div className="font-bold">. (xv) Under Acts &amp; Sections</div>
                    <table className="w-full border-collapse border border-slate-300 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                          <th className="border border-slate-300 p-1 w-10 text-center">S. No.</th>
                          <th className="border border-slate-300 p-1">Act</th>
                          <th className="border border-slate-300 p-1">Sections</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acc.underActsSections.map((u, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-300 p-1 text-center font-mono">{u.sNo}</td>
                            <td className="border border-slate-300 p-1">{u.act}</td>
                            <td className="border border-slate-300 p-1 font-bold font-mono">{u.sections}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bailers / Sureties */}
                  <div className="space-y-1 pt-1">
                    <div className="font-bold">. (xvi) Details of Bailers / Sureties</div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div><span className="font-bold">Name: </span>{acc.bailerName}</div>
                      <div><span className="font-bold">Father&apos;s Name: </span>{acc.bailerFatherHusbandName}</div>
                      <div><span className="font-bold">Occupation: </span>{acc.bailerOccupation}</div>
                    </div>
                    <table className="w-full border-collapse border border-slate-300 text-[11px] mt-1">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                          <th className="border border-slate-300 p-1 w-10 text-center">S. No.</th>
                          <th className="border border-slate-300 p-1 w-32">Address Type</th>
                          <th className="border border-slate-300 p-1">Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acc.bailerAddresses.map((ba, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-300 p-1 text-center font-mono">{ba.sNo}</td>
                            <td className="border border-slate-300 p-1">{ba.addressType}</td>
                            <td className="border border-slate-300 p-1">{ba.address}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Identification */}
                  <div className="space-y-1 pt-1 text-[11px]">
                    <div className="font-bold">. Identification</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><span className="font-bold">Date of Birth: </span>{acc.identificationDob}</div>
                      <div><span className="font-bold">UID Number: </span><span className="font-mono">{acc.identificationUid}</span></div>
                    </div>
                    <div className="font-bold pt-1">. Any Other ID Proof</div>
                    <table className="w-full border-collapse border border-slate-300 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                          <th className="border border-slate-300 p-1 w-10 text-center">S. No.</th>
                          <th className="border border-slate-300 p-1 w-36">ID Type</th>
                          <th className="border border-slate-300 p-1">ID Number</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acc.otherIdProofs.map((op, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-300 p-1 text-center font-mono">{op.sNo}</td>
                            <td className="border border-slate-300 p-1">{op.idType}</td>
                            <td className="border border-slate-300 p-1 font-mono">{op.idNumber}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Previous Convictions */}
                  <div className="space-y-1 pt-1 text-[11px]">
                    <div className="font-bold">. (xvii) Previous Convictions with Case References</div>
                    <table className="w-full border-collapse border border-slate-300 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                          <th className="border border-slate-300 p-1 w-8 text-center">S.No.</th>
                          <th className="border border-slate-300 p-1">FIR No.</th>
                          <th className="border border-slate-300 p-1">State</th>
                          <th className="border border-slate-300 p-1">District</th>
                          <th className="border border-slate-300 p-1">Police Station</th>
                          <th className="border border-slate-300 p-1">Description of Case</th>
                          <th className="border border-slate-300 p-1">Details of Conviction/Acquittal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acc.previousConvictions.map((pv, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-300 p-1 text-center font-mono">{pv.sNo}</td>
                            <td className="border border-slate-300 p-1">{pv.firNo}</td>
                            <td className="border border-slate-300 p-1">{pv.state}</td>
                            <td className="border border-slate-300 p-1">{pv.district}</td>
                            <td className="border border-slate-300 p-1">{pv.policeStation}</td>
                            <td className="border border-slate-300 p-1">{pv.descriptionOfCase}</td>
                            <td className="border border-slate-300 p-1">{pv.convictionAcquittal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-1">
                    <span className="font-bold">(xviii) Status of the Accused: </span>
                    <span className="font-bold">{acc.statusOfAccused}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 12, 13, 14, 15 */}
            <div className="space-y-3 text-xs border-t border-slate-300 pt-3">
              <div>
                <div className="font-bold font-sans">
                  12. Particulars of Accused Persons Not Charge-Sheeted (Suspect)
                </div>
                <p className="mt-1 whitespace-pre-wrap text-slate-800">{accusedNotChargeSheeted}</p>
              </div>

              <div>
                <div className="font-bold font-sans">
                  13. Particulars of Witnesses to be Examined
                </div>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed bg-slate-50 p-2 border border-slate-200 rounded">
                  {witnessesList}
                </pre>
              </div>

              <div>
                <div className="font-bold font-sans">
                  14. If FIR is False, Action Taken or Proposed to be Taken
                </div>
                <p className="mt-1 text-slate-800">{falseFirAction}</p>
              </div>

              <div>
                <div className="font-bold font-sans">
                  15. Result of Laboratory Analysis
                </div>
                <p className="mt-1 text-slate-800">{labAnalysis}</p>
              </div>
            </div>

            {/* 16. Brief Facts */}
            <div className="space-y-2 text-xs border-t border-slate-300 pt-3">
              <div className="font-bold font-sans text-sm uppercase tracking-wide">
                16. Brief Facts of the Case
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-slate-900 text-justify bg-slate-50/50 p-3 rounded border border-slate-200">
                {briefFacts}
              </div>
            </div>

            {/* 17, 18, 19, 20 */}
            <div className="space-y-2 text-xs border-t border-slate-300 pt-3">
              <div className="font-bold font-sans">17. Refer Notice Served</div>
              <div className="grid grid-cols-3 gap-4">
                <div><span className="font-bold">Refer Notice Served: </span>{referNoticeServed}</div>
                <div><span className="font-bold">Date: </span>{referNoticeDate || "N/A"}</div>
                <div><span className="font-bold">Acknowledgement to be Placed: </span>{referNoticeAck}</div>
              </div>

              <div className="pt-1">
                <span className="font-bold">18. Despatched On: </span>{despatchedOn}
              </div>

              <div>
                <span className="font-bold">19. No. of Enclosures: </span>{noOfEnclosures}
              </div>

              <div className="pt-1">
                <div className="font-bold font-sans">20. List of Enclosures, As Annexed</div>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed bg-slate-50 p-2.5 border border-slate-200 rounded">
                  {listOfEnclosures}
                </pre>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-12 border-t-2 border-slate-800">
              <div className="grid grid-cols-2 gap-8 text-xs font-sans">
                {/* Left: Forwarded by Officer in Charge */}
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 uppercase">Forwarded by Officer in Charge</p>
                  <div className="pt-8">
                    <div>
                      <span className="font-semibold text-slate-700">Signature: </span>
                      <span className="font-mono text-slate-500">_________________________________</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-semibold text-slate-700">Name: </span>
                      <span className="font-bold text-slate-900">{shoName}</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-semibold text-slate-700">Rank: </span>
                      <span className="text-slate-800">{shoRank}</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-semibold text-slate-700">No.: </span>
                      <span className="font-mono text-slate-800">{shoNo}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Signature of Investigating Officer */}
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 uppercase">
                    Investigating Officer Submitting Final Report / Charge Sheet
                  </p>
                  <div className="pt-8">
                    <div>
                      <span className="font-semibold text-slate-700">Signature: </span>
                      <span className="font-mono text-slate-500">_________________________________</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-semibold text-slate-700">Name: </span>
                      <span className="font-bold text-slate-900">{ioName}</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-semibold text-slate-700">Rank: </span>
                      <span className="text-slate-800">{ioRank}</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-semibold text-slate-700">No.: </span>
                      <span className="font-mono text-slate-800">{ioNo}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
}
