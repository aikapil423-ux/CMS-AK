// Field catalogue transcribed page by page from the supplied 12-page form.
// Legacy coordinate metadata documents the reference; native pages render no scan.
export const SCRUTINY_TEMPLATE_VERSION = 'panipat-scrutiny-12p-v1';
export const SCRUTINY_PAGE_TITLES = ['Forwarding letter', 'प्रारम्भिक समीक्षा 1–31', 'समीक्षा 32–59', 'पहचान पत्र', 'पहचान / पूर्व रिकॉर्ड', 'तलाशी एवं जब्ती', 'जब्त सम्पत्ति / सील', 'शिकायतकर्ता आवेदन', 'अनुसन्धानकर्ता / GD', 'आरोपी पूछताछ', 'आरोपी सम्पत्ति / रिकॉर्ड', 'प्रमुख गवाह पूछताछ'];
export interface ScrutinyField { id: string; page: number; label: string; x: number; y: number; w: number; h: number; check?: boolean; }
export interface ScrutinyValue { value: string; origin: 'FIR' | 'PROCESSED' | 'MANUAL'; sourceId?: string; sourceName?: string; quote?: string; }
export type ScrutinyValues = Record<string, ScrutinyValue>;
const fields: ScrutinyField[] = [];
function field(page: number, id: string, label: string, x: number, y: number, w: number, h = 2) { fields.push({ page, id, label, x, y, w, h }); }
function table(page: number, prefix: string, labels: string[], rows: number, x: number, y: number, widths: number[], height: number) {
  for (let r = 0; r < rows; r++) { let left = x; labels.forEach((label, c) => { field(page, `${prefix}.${r}.${c}`, `${label} ${r + 1}`, left, y + r * height, widths[c], height - .25); left += widths[c]; }); }
}
function caseLine(page: number, y: number) {
  field(page, 'station.' + page, 'थाना', 15.4, y, 12.4);
  field(page, 'fir.' + page, 'FIR', 33, y, 8.1);
  field(page, 'date.' + page, 'FIR दिनांक', 48, y, 9);
  field(page, 'sections.' + page, 'धारा', 66.4, y, 24.8);
}
function person(page: number, y: number, prefix: string) {
  field(page, prefix + '.name', 'नाम', 16.5, y, 32.5);
  field(page, prefix + '.relative', 'पिता / पति का नाम', 66, y, 25);
  field(page, prefix + '.age', 'जन्म तिथि / उम्र', 25, y + 2.65, 24);
  field(page, prefix + '.gender', 'लिंग', 66, y + 2.65, 25);
  field(page, prefix + '.mobile', 'मोबाइल नम्बर', 25, y + 5.4, 24, 3.2);
  field(page, prefix + '.idType', 'आई कार्ड प्रकार', 20.3, y + 8.9, 11.6, 3.2);
  field(page, prefix + '.idNumber', 'आई कार्ड नम्बर', 42.4, y + 8.9, 22, 3.2);
  field(page, prefix + '.pan', 'PAN', 73, y + 8.9, 18, 3.2);
  field(page, prefix + '.address', 'वर्तमान पता', 10, y + 15.6, 38.5, 9.3);
  field(page, prefix + '.permanentAddress', 'स्थाई पता', 49.4, y + 15.6, 41, 9.3);
}
field(1, 'da.register', 'DA Register No.', 70, 12.1, 14.5);
field(1, 'da.date', 'DA Office Date', 63, 13.7, 21.5);
field(1, 'district.attorney', 'District Attorney district', 25.4, 17.3, 24);
field(1, 'forward.fir', 'FIR Number', 28, 23.4, 7.2);
field(1, 'forward.date', 'FIR Date', 39, 23.4, 11);
field(1, 'forward.sections', 'Acts and sections', 54, 23.4, 31.3, 3.3);
field(1, 'forward.station', 'Police Station', 56, 25.3, 12);
field(1, 'forward.district', 'District', 69, 25.3, 10);
field(1, 'forward.dispatch', 'Scrutiny Cell No.', 16.3, 28.2, 8.8);
field(1, 'forward.dispatchDate', 'Forwarding date', 43, 28.2, 16);
field(1, 'forward.challanType', 'Juvenile / Supplementary / Final / Partial', 52.5, 33.8, 29.4);
field(1, 'forward.dueDate', 'Challan presentation due date', 44, 42.3, 13.5);
field(1, 'forward.firstArrest', 'First accused arrest date', 40.4, 47.1, 9.4);
field(1, 'forward.custody', 'Custody / bail status', 32, 49.3, 23.4);
['signature', 'name', 'rank', 'station', 'mobile'].forEach((s, i) => field(1, 'io.' + s, 'IO ' + s, 26.7, 57.7 + i * 2.1, 31.8, i === 4 ? 3.1 : 1.9));
field(1, 'branch.name', 'Scrutiny Branch officer', 79.1, 57.1, 11);
field(1, 'branch.date', 'Scrutiny Branch date', 79.1, 60.5, 11);
field(1, 'proceedings', 'Date-wise proceedings by Law Officers and IO', 13, 74, 73, 15);
caseLine(2, 4.95);
// The three independent review columns are deliberately never checked by AI.
const ys2 = [18.05,20.2,24.15,26.35,28.55,30.75,32.95,35.2,37.4,39.6,41.8,44,46.2,48.4,50.6,52.8,55,57.2,59.4,61.6,63.8,66,68.2,70.4,72.6,77.1,80.1,82.2,84.4,86.6,89.5];
const ys3 = [5.3,7.55,9.8,12.5,15.9,18.4,21.4,24.5,27,29.6,32.7,36.5,41,45.3,48.6,51.1,53.6,56.1,58.6,61.1,63.6,66.1,72,76.9,79.7,82,84.2];
[...ys2.map((y, i) => ({page:2,y,n:i+1})), ...ys3.map((y,i)=>({page:3,y,n:i+32}))].forEach(({page,y,n}) => {
  [65.4,75.4,85.4].forEach((x,c) => fields.push({id:`review.${n}.${c}`,page,label:`बिंदु ${n} / ${['IO','समीक्षा सेल','पूर्ति समीक्षा'][c]}`,x,y,w:1.9,h:1.4,check:true}));
});
field(3,'review.custody','आरोपी जमानत / पुलिस रिमाण्ड / न्यायिक जेल',61,86.3,30,2.4);
table(3,'review.sign',['नाम, रैंक, बेल्ट / हस्ताक्षर','समीक्षा अधिकारी','पूर्ति अधिकारी'],1,60.7,91,[10,10,12],3.6);
field(4,'identity.station','थाना',17.1,12.6,18); field(4,'identity.district','जिला',77,12.4,14);
field(4,'identity.state','राज्य द्वारा',18.7,24.7,53);
field(4,'identity.fir','अभियोग संख्या',22,26.7,8);field(4,'identity.date','दिनांक',37,26.7,11);
field(4,'identity.sections','धारा',49,26.7,27);field(4,'identity.ps','थाना',81,26.7,10);
field(4,'identity.accused','बनाम',18,30.3,71);
table(4,'identity.features',['लिंग','जन्मतिथि / उम्र','शारीरिक बनावट','कद (सेमी)','रंग / रक्त समूह','पहचान चिन्ह'],1,17.8,39.6,[9.5,11.6,12.7,12.8,13.2,12.6],3);
table(4,'identity.features2',['विशिष्टता','दांत','बाल','आंख','आदत','पहनावा'],1,17.7,48,[14.5,11.6,11.1,11.5,12.8,11],3);
table(4,'identity.features3',['भाषा / बोली','जलने का निशान','सफेद दाग','मस्सा','घाव','गोदना'],1,17.7,60.9,[12,10.4,18.7,10.3,10.2,10.4],3.5);
['otherMarks','fingerprints','livingStandard','education','occupation','income','dangerous','bailJump'].forEach((s,i)=>field(4,'identity.'+s,s,40,64.6+i*3.1,43,2.4));
['armed','associates','knownOffender','habitual','absconding','threat','wanted','references'].forEach((s,i)=>field(5,'identity.'+s,s,65,5+i*2.5,24,2.1));
field(5,'identity.io','जांच अधिकारी नाम / पद / नंबर',64,31,22,9); field(5,'identity.placeDate','स्थान / दिनांक',20,35,22,6);
field(5,'identity.priorCases','ICJS पूर्व अपराधिक रिकॉर्ड',21,53,68,8);field(5,'identity.criminalId','Eagle Criminal ID',50,61.5,39);
field(6,'seizure.district','जिला',18,12.3,15);field(6,'seizure.station','थाना',43,12.3,16);field(6,'seizure.year','वर्ष',64,12.3,15);
field(6,'seizure.fir','FIR / GD',34,14.7,15);field(6,'seizure.date','दिनांक',57,14.7,17);field(6,'seizure.sections','अधिनियम व धाराएं',28,17.2,41);
field(6,'seizure.type','सम्पत्ति प्रकार',29,20.2,57);field(6,'seizure.recovered','दिनांक / समय / स्थान',40,22.7,47);
field(6,'seizure.person','जिससे सम्पत्ति बरामद हुई',48,26,39);field(6,'seizure.personDetails','लिंग उम्र पेशा पता',24,28.5,63,3.3);
table(6,'seizure.witness',['नाम','पता / मोबाइल','हस्ताक्षर'],2,19.3,39.8,[15.1,40.5,13],2.5);
field(6,'seizure.identification','पहचान आवश्यक / विवरण',48,47,38,4.5);field(6,'seizure.value','अनुमानित मूल्य',49,52.4,38);
field(6,'seizure.property','जब्त / बरामद सम्पत्ति विवरण',19,58.3,65,6);field(6,'seizure.grounds','जब्ती का आधार',17,69.2,68,6);
field(6,'seizure.copyRecipient','जब्ती फार्म की प्रति किसे दी',18,81.7,66,4);
table(7,'seizure.parcels',['सम्पत्ति विवरण','सील / मोहर'],3,18,10.9,[46.2,25.8],9.8);
field(7,'seizure.personSignature','जिस व्यक्ति से सम्पत्ति जब्त हुई',17,42,35,3);
field(7,'seizure.place','स्थान',16,53.3,21);field(7,'seizure.signatureDate','दिनांक',17,56.6,20);
field(7,'seizure.ioName','जांच अधिकारी नाम',59,53.2,26);field(7,'seizure.ioRank','पद / नंबर',59,56.6,26);field(7,'seizure.ioStation','थाना',60,59.9,25);
field(8,'complaint.station','थाना',17,10,69);
field(8,'complaint.date','शिकायत तिथि',29,14.8,19);field(8,'complaint.time','शिकायत समय',68,14.8,22);
field(8,'complainant.name','शिकायतकर्ता नाम',28,19.2,20);field(8,'complainant.relative','पिता / पति',66,19.2,24);
field(8,'complainant.age','जन्मतिथि / उम्र',28,23.1,20);field(8,'complainant.gender','लिंग',66,23.1,24);
field(8,'complainant.aadhaar','आधार (वैकल्पिक)',28,25.9,20,3.2);field(8,'complainant.mobile','मोबाइल',66,25.9,24,3.2);
field(8,'complainant.address','वर्तमान पता',12.4,33.2,36.6,9);field(8,'complainant.permanentAddress','स्थाई पता',50,33.2,40,9);
field(8,'complaint.isVictim','शिकायतकर्ता स्वयं पीड़ित?',54,42.7,32);
field(8,'victim.name','पीड़ित नाम',28,50,24);field(8,'victim.relative','पीड़ित पिता / पति',67,50,24);
field(8,'victim.age','पीड़ित उम्र',28,53.3,24);field(8,'victim.gender','पीड़ित लिंग',67,53.3,24);
field(8,'victim.relationship','सम्बन्ध',28,55.8,24,3);field(8,'victim.mobile','पीड़ित मोबाइल',67,55.8,24,3);
field(8,'incident.date','घटना की तिथि',28,62,21);field(8,'incident.time','घटना का समय',67,62,23);
field(8,'complaint.propertyValue','सम्पत्ति कुल मूल्य',48,64.3,42);field(8,'complaint.delay','शिकायत देरी का कारण',13,69.6,77,10);
field(8,'complaint.signedDate','हस्ताक्षर दिनांक',59,87.4,31);
field(9,'investigation.receiptMode','सूचना का माध्यम',56,15.6,32,3);field(9,'investigation.receiptDate','सूचना तिथि',32,18.9,22,3);field(9,'investigation.receiptTime','सूचना समय',75,18.9,12,3);
field(9,'incident.distanceDirection','दूरी और दिशा',32,25.2,56);field(9,'incident.latitude','अक्षांश',32,28.1,17);field(9,'incident.longitude','देशांतर',68,28.1,19);
field(9,'incident.address','घटनास्थल पता',32,31.5,56,5);field(9,'investigation.delay','अभियोग देरी से दर्ज कारण',14,40.2,74,10);
field(9,'investigation.io','IO रैंक नाम बेल्ट',33,56.9,55);field(9,'investigation.posting','तैनाती स्थान',33,59.7,55);field(9,'investigation.mobile','IO मोबाइल',33,62.3,55);field(9,'investigation.signedDate','हस्ताक्षर दिनांक',33,65.1,55,3.3);
field(9,'gd.number','GD Entry No',32,73,9,3.1);field(9,'gd.time','GD समय',53,73,15,3.1);field(9,'gd.date','GD दिनांक',77,73,11,3.1);
field(9,'gd.fir','FIR / धारा',33,77.5,55);field(9,'gd.operator','Computer operator रैंक नाम बेल्ट',33,80.5,55);field(9,'gd.signature','हस्ताक्षर दिनांक',33,83.1,55,3.1);
caseLine(10,9.65);person(10,12.2,'accused');
table(10,'accused.family',['नाम','पता','सम्बन्ध','मोबाइल','सम्पत्ति'],10,13.1,43.5,[13.6,22.5,12,14,16],2.85);
table(10,'accused.bank',['खाता संख्या','बैंक','ब्रांच','IFSC'],3,16.1,78.5,[20.6,18.9,19,15.9],2.6);
field(11,'accused.income','आय का स्रोत',34,6.2,57,8.2);field(11,'accused.property','चल / अचल सम्पत्ति',34,15.6,57,8.2);field(11,'accused.ancestralProperty','पुश्तैनी सम्पत्ति',34,25,57,8.2);
table(11,'accused.priorCases',['अभियोग / दिनांक','धारा','थाना / जिला','Case Status'],10,16.2,42,[16.3,22.5,18.5,16],2.65);
field(11,'accused.ioSignature','IO हस्ताक्षर दिनांक',15,76,26,6);field(11,'accused.signature','आरोपी हस्ताक्षर',66,76,23,6);
['complainant','victim','eyewitness'].forEach((s,i)=>fields.push({id:'witness.role.'+s,page:12,label:s,x:[20.1,50.5,83.4][i],y:8.1,w:2.2,h:1.4,check:true}));
caseLine(12,11.6);person(12,14.2,'witness');
table(12,'witness.family',['नाम','पता','सम्बन्ध','मोबाइल','सम्पत्ति'],8,12.7,45.2,[14,25,13,14,14],2.7);
field(12,'witness.income','आय का स्रोत',33.5,68.5,59,9);field(12,'witness.ioSignature','IO हस्ताक्षर दिनांक',15,82,26,6);field(12,'witness.signature','पूछताछ व्यक्ति हस्ताक्षर',60,82,31,6);
field(4,'identity.photo','फोटोग्राफ आरोपी',74,16,13,6);
field(5,'identity.moharrSignature','मोहर्र थाना हस्ताक्षर',65,71,24,5);
field(7,'seizure.ioSignature','जांच अधिकारी हस्ताक्षर',60,63,25,3);
field(8,'complaint.signature','शिकायतकर्ता हस्ताक्षर / अंगूठा',50,84,40,3);
table(3,'review.date',['IO दिनांक','समीक्षा दिनांक','पूर्ति समीक्षा दिनांक'],1,61,83,[10,10,12],2);
export const SCRUTINY_FIELDS: readonly ScrutinyField[] = fields;
