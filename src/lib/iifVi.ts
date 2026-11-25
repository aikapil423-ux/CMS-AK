export const iifViStages = ["assign", "trial", "final"] as const;
export type IifViStage = (typeof iifViStages)[number];
export type Values = Record<string, string>;
export type Entry = { values: Values; tables: Record<string, Values[]> };
export type Attachment = { name: string; data?: string };
export type StageRecord = {
  entries: Entry[];
  attachments: Record<string, Attachment>;
  updatedAt: string;
  updatedBy: string;
};
export type IifViRecord = { revision: string } & Partial<Record<IifViStage, StageRecord>>;

export type Field = {
  label: string;
  kind?: "text" | "date" | "number" | "area" | "email";
  options?: readonly string[];
  required?: boolean;
  custom?: boolean;
};
const field = (label: string, kind?: Field["kind"], required = false): Field => ({ label, kind, required });
const choice = (label: string, options: readonly string[], required = false, custom = false): Field => ({ label, options, required, custom });
const fields = (...labels: string[]) => labels.map(label => field(label));
const yesNo = ["Yes", "No"];
const age = [field("Date of Birth", "date"), field("Year of Birth", "number"), field("Age (Years)", "number"), field("Age (Months)", "number"), field("Age From", "number"), field("Age To", "number")];
const examined = ["Examination Completed", "Not Examined", "On-Going Examination"];
const examination = ["Countercheck", "Cross Examination", "Examination-in-Chief", "Re-Trial"];
const courtCases = ["Criminal Case", "Juvenile Case", "Kalandra Case", "Miscellaneous Case", "Sessions Case", "Summon Trial Case", "Summons Case", "Warrant Case"];
const otherDetails = ["Accused Retracting Confession", "Complainant Turning Hostile", "Insufficient Evidence", "Investigation Incomplete/Benefit of Doubt", "Others (Specify)", "Seizure of property not proved", "Whether Witness is not Traceable", "Whether Witness is Protected", "Witness Turning Hostile"];
const courtTypes = [
  "Addl. Judicial Magistrate 1st Class", "Addl. Judicial Magistrate 2nd Class", "Addl. Labour Court", "Addl. Metropolitan Magistrate", "Addl. Munsif & JMFC Court", "Addl. Principal Civil Judge (JR DIV) Court", "Addl. Session Court", "Addl. Session Judge",
  ...["East", "West", ...[1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 28, 29, 30, 31, 32, 33, 34].map(n => `No. ${n} Metropolitan`)].map(suffix => `Addl. Civil Judge (JR DIV) & Metropolitan Magistrate, ${suffix}`),
  "Addl. Civil Judge (JR DIV) & Judicial Magistrate No. 1", "Chief Presidency Magistrate", "City Magistrate", "City Session Court", "Civil Judge & JMFC (JR DIV)", "Civil Judge & JMFC (SR DIV)",
  ...["East", "West"].map(direction => `Civil Judge (JR DIV) & Metropolitan Magistrate ${direction} Metropolitan`),
  ...["", " East", " North", " South", " West"].map(direction => `Civil Judge (JR DIV) & Judicial Magistrate${direction}`),
  "Civil Judge (SR DIV) & Addl. Chief Judicial Magistrate", "Civil Judge (SR DIV) & Chief Metropolitan Magistrate, Metropolitan",
  "Family Court Judge", "Fast Track Courts", "Gram Nayalaya", "High Court", "Honorary Magistrate", "Industrial Tribunal", "JMFC Junior & Senior Court", "Judge M.A.C.T. Court", "Judge M.A.C.T. Court No. 1", "Judge M.A.C.T. Court No. 2 Metropolitan", "Judicial Executive Magistrate", "Judicial Magistrate", "Judicial Magistrate (Railway)", "Judicial Magistrate (Revenue)", "Judicial Magistrate 2nd Class", "Judicial Magistrate First Class (Railways)", "Judicial Magistrate 1st Class", "Judicial Magistrate (Forest)", "Juvenile Court", "Labour Court", "Lok Adalat Court", "Magistrate 2nd Class", "Magistrate 1st Class", "Mahalir Neethimandram", "Mandal Executive Magistrate", "Mangan Court (Sikkim)", "Mangan Magistrate", "Member, State Transport Appellate Tribunal", "Metropolitan Court", "Metropolitan Executive Magistrate", "Metropolitan Judicial Magistrate", "Metropolitan Magistrate", "Mobile Court",
];
const accusedStatus = ["Absconding", "Admitted in Hospital", "Bailed by Court", "Bailed by Police", "Discharged by the Court", "Escaped from Jail", "Escaped from Police Custody", "Extradited", "Forwarded to Court", "In Judicial Custody", "In Juvenile Home", "In Remand Home", "Jumped Bail", "Not Arrested", "Proclaimed Offender"];
const punishments = ["Acquitted", "Admonished", "Bond and Fine", "Bond for Good Behaviour", "Compounded", "Death", "Deported to Native Country", "Detained", "Externment", "Externment and Bond", "Fine", "Forfeiture of Bond", "Life Imprisonment", "Life Imprisonment and Fine", "Probation for Good Conduct", "Proclamation/Attachment/Disposal of Property"];
const disposalTypes = ["Abated", "Acquitted", "Compounded", "Convicted", "Discharged", "FIR/Case Quashed", "Long Pending Case (LPC) / Trial", "Long Pending File (LPF)", "Pending Trial", "Plea Bargaining", "Proceedings Stayed", "Transferred", "Warning", "Warning with Fine"];
export type Group = { title: string; fields: Field[]; table?: string; columns?: string[]; source?: boolean };
const section = (title: string, fields: Field[]): Group => ({ title, fields });
const table = (title: string, fields: Field[], columns?: string[]): Group => ({ title, table: title, fields, columns });
const sourceTable = (title: string, columns: string[]): Group => ({ title, table: title, fields: [], columns, source: true });

export const formGroups: Record<IifViStage, Group[]> = {
  assign: [
    section("Court Assignment", [
      choice("Acknowledgement Details", ["Final", "Interim"]), ...fields("Charge Sheet No."),
      choice("Court Type", courtTypes, true, true), field("Court Name", "text", true),
      field("Court Case No.", "text", true), ...fields("Committal No."),
      field("Date of Submission in Court", "date", true), field("Date of Framing Charges", "date"),
      choice("Case is Transferred", yesNo), choice("Case Type", ["Split", "Joint", "Not Applicable (NA)"]),
    ]),
    table("Charges Framed", fields("Accused Name", "Relation Type", "Relative Name", "Act", "Section")),
  ],
  trial: [
    section("Case Details", [field("Date of Hearing", "date", true), choice("Other Details", otherDetails, true), field("Specify Other Details")]),
    sourceTable("Occurrence", ["Date Range of Occurrence", "Place of Occurrence", "Distance from P.S.", "Direction from P.S."]),
    sourceTable("Property Seized", ["Property Seized", "Type of Property", "Estimated Value (Seized / Recovered) (in INR)"]),
    sourceTable("Act & Section", ["Act", "Section"]),
    table("Accused Trial Details", [
      ...fields("UID"), field("Accused Name", "text", true), ...fields("Relative Name", "Gender"),
      choice("Status of Accused", accusedStatus, true, true), ...fields("NPR"), choice("Examined Status", examined),
      choice("Type of Examination", examination), field("Remarks", "area", true), ...age,
    ], ["Accused Name", "Relative Name", "Gender", "Date of Birth", "Age (Years)", "Age (Months)", "Year of Birth", "Age From", "Age To", "Examined Status", "Type of Examination", "Status of Accused", "Remarks"]),
    table("Witness Details", [
      ...fields("Witness Name", "Type of Witness"), field("Type of Evidence", "text", true), choice("Type of Examination", examination),
      field("How many times witness was examined?", "number"), field("Statement of Witness", "area"),
      ...fields("Relative Name", "Gender"), choice("Examined Status", examined), choice("Witness appeared in the court", yesNo), ...age,
    ], ["Witness Name", "Relative Name", "Gender", "Date of Birth", "Age (Years)", "Age (Months)", "Year of Birth", "Age From", "Age To", "Type of Evidence", "Type of Examination", "Witness appeared in the court", "How many times witness was examined?", "Examined Status"]),
    table("IO Details", [
      field("Name of officer attending the court", "text", true), field("Designation of officer attending the court", "text", true),
      choice("Examined Status", examined), field("Name of the IO", "text", true), ...fields("Designation of IO"), choice("Type of Examination", examination),
    ], ["Name of officer attending the court", "Designation of officer attending the court", "Examined Status", "Type of Examination"]),
    section("Trial Details", [
      ...["No. of accused present in judicial custody", "No. of accused in judicial custody but absent from trial", "No. of accused on bail", "No. of accused on bail but absent from trial", "No. of IOs summoned", "No. of IOs present", "No. of IOs examined"].map(label => field(label, "number")),
      choice("Trial is pending", yesNo, true), field("Remarks", "area", true), field("Trial Outcome/Result", "area", true),
      choice("Trial Status", ["Pending Argument", "Pending Defence Evidence", "Pending Due to Absence of Accused", "Pending Framing of Charge", "Pending Judgement", "Pending Prosecution Evidence", "Pending Stay/Review", "Pending Supply of Document to Accused", "Trial Completed"], true),
      choice("APP/PP is Present", yesNo, true),
    ]),
    section("Split/Joint case details", [choice("Case Type", ["Joint", "Split", "NA"], true)]),
  ],
  final: [
    table("Disposal Details for the Selected Accused", [
      ...fields("UID"), field("Accused Name", "text", true), ...fields("First Name", "Middle Name", "Last Name", "Alias", "Gender", "Marital Status", "Category", "NPR", "Relation Type", "Relative Name", "Landline No.", "Mobile No."),
      field("Email ID", "email"), ...age, choice("Accused Punishment", punishments, true, true),
      choice("Disposal Type Accused", disposalTypes, true, true), field("Fine Amount (Rs.)", "number"),
      field("Bond Period (Years)", "number"), field("Bond Period (Months)", "number"), field("Bond Period (Days)", "number"), field("Bond Amount (Rs.)", "number"),
      ...fields("Regular Criminal No.", "National Criminal No."), choice("Finger Prints Taken", yesNo, true),
      ...fields("Act & Sections"), field("Address", "area"), field("Compensation Details", "area"),
    ], ["Accused Name", "Relation Type", "Relative Name", "Accused Punishment", "Disposal Type Accused"]),
    section("Judgment and Disposal", [
      field("Name of Judge", "text", true), field("Court Strictures", "area"), field("Judgment Date", "date", true),
      choice("Nature of Disposal For Case", ["Acquittal", "Conviction", "Discharged", "Proceeding Dropped", "Quashed"], true),
      field("Court Remarks", "area", true), choice("Case Type", courtCases, true), field("Reason of Acquittal"),
      choice("Appeal Preferred", yesNo), ...fields("Appeal Period", "Appeal by"),
    ]),
    table("Public Prosecutors", [field("Public Prosecutor Name", "text", true)]),
  ],
};

export const uploadFields: Record<IifViStage, string[]> = {
  assign: ["Upload Document"], trial: [], final: ["Court Disposal Form", "Relevant Documents"],
};

export function visibleField(field: Field, values: Values) {
  if (field.label === "Specify Other Details") return values["Other Details"] === "Others (Specify)";
  if (field.label === "Reason of Acquittal") return values["Nature of Disposal For Case"] === "Acquittal";
  if (field.label === "Appeal Period" || field.label === "Appeal by") return values["Appeal Preferred"] === "Yes";
  return true;
}

export function requiredField(field: Field, values: Values) {
  if (["Specify Other Details", "Reason of Acquittal"].includes(field.label)) return visibleField(field, values);
  if (field.label.startsWith("Bond ")) return values["Accused Punishment"] === "Bond and Fine";
  if (field.label === "Fine Amount (Rs.)") return ["Bond and Fine", "Fine", "Life Imprisonment and Fine"].includes(values["Accused Punishment"]);
  return Boolean(field.required);
}
