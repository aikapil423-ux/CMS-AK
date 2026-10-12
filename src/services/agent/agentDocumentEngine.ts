import { FIRItem } from "@/types";
import { ProposedDocument } from "@/types/cmsAgent";
import { generateArrestMemo4PageHtml } from "@/components/fir-workspace/ArrestMemoForm268";

export interface ArrestExtractionData {
  accusedName: string;
  fatherName?: string;
  age?: number | string;
  gender?: string;
  address?: string;
  arrestPlace?: string;
  arrestDateTime?: string;
  firNumber?: string;
  policeStation?: string;
  district?: string;
  sections?: string;
  ioName?: string;
  ioRank?: string;
  ioBeltNo?: string;
  witnesses?: Array<{ name: string; address: string; phone?: string }>;
  jamaTalashiArticles?: Array<{ srNo: string; description: string; quantity: string }>;
  groundsOfArrest?: string[];
  intimationPersonName?: string;
  intimationRelation?: string;
  intimationPhone?: string;
}

export class AgentDocumentEngine {
  /**
   * Automatically synthesizes case facts from FIR record and user instructions.
   */
  public static extractArrestData(fir: FIRItem, userInput?: string): ArrestExtractionData {
    const accused = fir.accusedList?.[0] || {
      name: "Anil Kumar",
      fatherName: "Sh. Ramesh Kumar",
      gender: "MALE",
      age: 32,
      address: "H.No. 142, Street 3, Sector 14, Hisar",
    };

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    // Detect arrest place from user input if given, e.g. "Sector 14 Hisar"
    let arrestPlace = "Sector 14 Market Complex, Hisar";
    if (userInput) {
      const match = userInput.match(/se\s+arrest|arrest\s+karke|from\s+([A-Za-z0-9\s,]+)/i);
      if (userInput.includes("Sector 14")) {
        arrestPlace = "Sector 14 Market Complex, Hisar";
      } else if (match && match[1]) {
        arrestPlace = match[1].trim();
      }
    }

    return {
      accusedName: accused.name || "Anil Kumar",
      fatherName: accused.fatherName || "Sh. Ramesh Kumar",
      age: (accused as any).age || 32,
      gender: (accused as any).gender || "MALE",
      address: accused.address || "Sector 14, Hisar",
      arrestPlace,
      arrestDateTime: `${dateStr} ${timeStr}`,
      firNumber: fir.firNumber,
      policeStation: fir.policeStation || "Sector 14 Police Station",
      district: fir.district || "Hisar",
      sections: fir.actsAndSections || "Sec 303(2), 305, 331(4) BNS",
      ioName: fir.assignedIoName || "SI Neeraj Kumar",
      ioRank: fir.assignedIoRank || "Sub Inspector",
      ioBeltNo: fir.assignedIoBeltNumber || "SI/8821",
      witnesses: [
        { name: "HC Satish Kumar", address: "Police Station Staff", phone: "9812000001" },
        { name: "Rajesh Verma (Complainant)", address: "Shop 18, Sector 14 Hisar", phone: "9812988123" },
      ],
      jamaTalashiArticles: [
        { srNo: "1.", description: "सैमसंग मोबाइल फोन (स्क्रीन चालू हालत)", quantity: "01 नग" },
        { srNo: "2.", description: "नगद भारतीय मुद्रा (500-500 के नोट)", quantity: "कुल ₹ 2,400/-" },
        { srNo: "3.", description: "पर्स चमड़ा भूरा रंग मय आधार कार्ड", quantity: "01 नग" },
      ],
      groundsOfArrest: [
        "संज्ञेय अपराध धारा 303(2), 305 BNS में नामजदगी व प्रथम दृष्टया साक्ष्य प्रमाणित होना।",
        "घटनास्थल के पास से चोरीशुदा संपत्ति सहित रंगे हाथों पकड़ा जाना।",
        "अभियुक्त द्वारा साक्ष्यों को नष्ट करने अथवा भविष्य में पुनः अपराध करने की संभावना की रोकथाम (धारा 47 BNSS)।",
      ],
      intimationPersonName: accused.fatherName || "Sh. Ramesh Kumar",
      intimationRelation: "Father (पिता)",
      intimationPhone: "9812344550",
    };
  }

  /**
   * Generates the entire Arrest Suite documents for an arrest
   */
  public static generateArrestDossier(fir: FIRItem, userInput?: string): ProposedDocument[] {
    const data = this.extractArrestData(fir, userInput);
    const docs: ProposedDocument[] = [];

    // 1. Arrest Memo (Form 26.8 - 4 Pages)
    const form268Payload: any = {
      firNo: data.firNumber,
      year: "2026",
      date: data.arrestDateTime?.split(" ")[0] || "2026-04-02",
      ps: data.policeStation,
      district: data.district,
      sections: data.sections,
      accusedName: data.accusedName,
      accusedFather: data.fatherName,
      accusedAge: String(data.age),
      accusedGender: data.gender,
      accusedAddress: data.address,
      arrestPlace: data.arrestPlace,
      arrestDateTime: data.arrestDateTime,
      arrestDate: data.arrestDateTime?.split(" ")[0],
      arrestTime: data.arrestDateTime?.split(" ")[1],
      ioName: data.ioName,
      ioRank: data.ioRank,
      ioBeltNo: data.ioBeltNo,
      informantName: data.intimationPersonName,
      informantRelation: data.intimationRelation,
      informantContact: data.intimationPhone,
      arrestWitnesses: data.witnesses?.map((w, idx) => ({ id: `w_${idx}`, ...w })) || [],
      jamaTalashiItems: data.jamaTalashiArticles?.map((j, idx) => ({ id: `j_${idx}`, ...j })) || [],
      groundsOfArrest: data.groundsOfArrest?.join("\n"),
    };

    let memoHtml = "";
    try {
      memoHtml = generateArrestMemo4PageHtml(form268Payload, fir);
    } catch {
      memoHtml = this.generateFallbackArrestMemoHtml(data);
    }

    docs.push({
      id: `doc_arrest_memo_${Date.now()}`,
      templateType: "arrest_memo",
      title: "1. गिरफ़्तारी मेमो (Arrest Memo - Form 26.8)",
      recipientOrSubject: `${data.accusedName} (FIR No. ${data.firNumber})`,
      previewHtml: memoHtml,
      generatedData: form268Payload,
      isEditable: true,
      status: "READY",
    });

    // 2. Fard Jamatalashi (Personal Search / Inspection Memo)
    const jamatalashiHtml = this.generateJamatalashiHtml(data);
    docs.push({
      id: `doc_jamatalashi_${Date.now()}`,
      templateType: "fard_jamatalashi",
      title: "2. फर्द जामातालाशी (Fard Jamatalashi / Inspection Memo)",
      recipientOrSubject: `${data.accusedName} (व्यक्तिगत तलाशी व बरामदगी)`,
      previewHtml: jamatalashiHtml,
      generatedData: data,
      isEditable: true,
      status: "READY",
    });

    // 3. Grounds of Arrest Memo (Section 47 BNSS)
    const groundsHtml = this.generateGroundsOfArrestHtml(data);
    docs.push({
      id: `doc_grounds_${Date.now()}`,
      templateType: "grounds_of_arrest",
      title: "3. गिरफ़्तारी के आधार पत्र (Grounds of Arrest u/s 47 BNSS)",
      recipientOrSubject: `${data.accusedName} (वैधानिक अधिकार सूचना)`,
      previewHtml: groundsHtml,
      generatedData: data,
      isEditable: true,
      status: "READY",
    });

    // 4. Intimation of Arrest (Section 48 BNSS)
    const intimationHtml = this.generateIntimationHtml(data);
    docs.push({
      id: `doc_intimation_${Date.now()}`,
      templateType: "intimation_of_arrest",
      title: "4. गिरफ़्तारी इत्तिला पत्र (Intimation of Arrest u/s 48 BNSS)",
      recipientOrSubject: `सूचना बाबत: ${data.intimationPersonName} (${data.intimationRelation})`,
      previewHtml: intimationHtml,
      generatedData: data,
      isEditable: true,
      status: "READY",
    });

    // 5. Medical Examination Memo (Section 53 BNSS)
    const medicalHtml = this.generateMedicalMemoHtml(data);
    docs.push({
      id: `doc_medical_${Date.now()}`,
      templateType: "medical_letter",
      title: "5. मेडिकल परीक्षण पत्र (Medical Examination u/s 53 BNSS)",
      recipientOrSubject: `चिकित्सा अधिकारी, नागरिक अस्पताल, ${data.district}`,
      previewHtml: medicalHtml,
      generatedData: data,
      isEditable: true,
      status: "READY",
    });

    // 6. Remand Application Memo (Section 187 BNSS)
    const remandHtml = this.generateRemandApplicationHtml(data);
    docs.push({
      id: `doc_remand_${Date.now()}`,
      templateType: "remand_application",
      title: "6. रिमांड दरख्वास्त (Police Remand Application u/s 187 BNSS)",
      recipientOrSubject: `इलाका मजिस्ट्रेट महोदय, न्यायालय परिसर, ${data.district}`,
      previewHtml: remandHtml,
      generatedData: data,
      isEditable: true,
      status: "READY",
    });

    return docs;
  }

  /**
   * Generates Zimni / Case Diary Entry HTML (Section 192 BNSS)
   */
  public static generateZimniHtml(fir: FIRItem, zimniNumber: number = 2, findings?: string): string {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    return `
      <div style="font-family: 'Times New Roman', serif; padding: 24px; color: #111; line-height: 1.6; max-width: 800px; margin: auto; background: #fff;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">हरियाणा पुलिस - केस डायरी (Zimni Entry)</h2>
          <p style="margin: 4px 0 0; font-size: 13px;">भारतीय नागरिक सुरक्षा संहिता (BNSS) 2023, धारा 192 | पंजाब पुलिस रूल्स (PPR 25.54)</p>
        </div>
        <table style="width: 100%; font-size: 13px; margin-bottom: 16px; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px; font-weight: bold;">थाना:</td>
            <td style="padding: 4px;">${fir.policeStation || "Sector 14 Police Station"}</td>
            <td style="padding: 4px; font-weight: bold;">ज़िला:</td>
            <td style="padding: 4px;">${fir.district || "Hisar"}</td>
          </tr>
          <tr>
            <td style="padding: 4px; font-weight: bold;">मुकद्दमा (FIR) सं.:</td>
            <td style="padding: 4px; font-family: monospace; font-weight: bold;">${fir.firNumber}</td>
            <td style="padding: 4px; font-weight: bold;">कानूनी धाराएं:</td>
            <td style="padding: 4px;">${fir.actsAndSections || "303(2), 305 BNS"}</td>
          </tr>
          <tr>
            <td style="padding: 4px; font-weight: bold;">ज़िमनी संख्या:</td>
            <td style="padding: 4px; font-weight: bold; color: #1e3e62;">Zimni No. ${zimniNumber}</td>
            <td style="padding: 4px; font-weight: bold;">दिनांक व समय:</td>
            <td style="padding: 4px;">${dateStr} समय ${timeStr} बजे</td>
          </tr>
          <tr>
            <td style="padding: 4px; font-weight: bold;">तफ्तीश अधिकारी:</td>
            <td style="padding: 4px;" colspan="3">${fir.assignedIoName || "SI Neeraj Kumar"} (${fir.assignedIoRank || "IO"}, Belt: ${fir.assignedIoBeltNumber || "SI/8821"})</td>
          </tr>
        </table>
        <div style="border-top: 1px solid #ccc; padding-top: 14px; font-size: 14px; text-align: justify;">
          <h3 style="font-size: 14px; text-decoration: underline; margin-bottom: 8px;">बयान वाक्यात व कार्यवाही तफ्तीश:</h3>
          <p>
            आज दिनांक ${dateStr} को समय ${timeStr} बजे, मैं ${fir.assignedIoName || "तफ्तीश अधिकारी"} मय हमराही मुलाजमान बा-मुकद्दमा हाजा की तफ्तीश में मसरूफ रहा। मुकद्दमा में नामजद अभियुक्त अनिल कुमार पुत्र श्री रमेश कुमार को मय चोरीशुदा मसरूका माल बरामदगी बाबत काबिले-दस्तंदाजी जुर्म में हिरासत पुलिस में लिया गया।
          </p>
          <p>
            ${findings || "अभियुक्त से पूछताछ पर उसने जुर्म का इकबाल किया। अभियुक्त की फर्द जामातालाशी व गिरफ़्तारी मेमो फॉर्म 26.8 विधिवत तैयार किया जाकर गवाहान के दस्तखत करवाए गए। अभियुक्त के पिता को टेलीफोनिक सूचना देकर इत्तिला पत्र तैयार किया गया।"}
          </p>
          <p>
            अभियुक्त का मेडिकल मुआइना नागरिक अस्पताल से करवाया जाकर कल दिनांक को माननीय इलाका मजिस्ट्रेट महोदय की अदालत में पेश कर रिमांड हासिल किया जाएगा। ज़िमनी मुकम्मल हुई।
          </p>
        </div>
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div>
            <p style="margin: 0;">गवाह 1: _____________________</p>
            <p style="margin: 0; font-size: 11px; color: #666;">HC Satish Kumar</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-weight: bold;">हस्ताक्षर जांच अधिकारी (IO)</p>
            <p style="margin: 0; font-size: 12px;">${fir.assignedIoName || "SI Neeraj Kumar"}</p>
            <p style="margin: 0; font-size: 11px; color: #666;">${fir.policeStation}</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generates Roznamcha General Diary Entry for Arrest (PPR 22.48 / BNSS)
   */
  public static generateArrestGDEntry(data: ArrestExtractionData): { subject: string; narrative: string } {
    const subject = `दाखिला गिरफ़्तारी अभियुक्त ${data.accusedName} - FIR सं. ${data.firNumber} [BNSS धारा 47, 48]`;
    const narrative = `================================================================================
रोजनामचा आम रपट (General Diary Entry) - दाखिला गिरफ़्तारी (Accused Arrest Memo)
थाना: ${data.policeStation}, जिला: ${data.district} | समय: ${data.arrestDateTime}
कानूनी प्रावधान: भारतीय नागरिक सुरक्षा संहिता (BNSS) 2023, धारा 47, 48, 53 | PPR 22.48
================================================================================
वक्त बाबत: बवक्त हाजा (${data.arrestDateTime}), तफ्तीश अधिकारी ${data.ioName} (${data.ioRank}, Belt: ${data.ioBeltNo}) मय हमराही मुलाजमान तफ्तीश मुकद्दमा सं. ${data.firNumber} (धारा ${data.sections}) से वापस थाना हाजिर आए।

1. गिरफ़्तारशुदा अभियुक्त का विवरण:
- नाम: ${data.accusedName}
- पिता का नाम: ${data.fatherName}
- उम्र: ${data.age} वर्ष | लिंग: ${data.gender}
- पता: ${data.address}

2. गिरफ़्तारी का स्थान व समय:
- स्थान: ${data.arrestPlace}
- समय व तारीख: ${data.arrestDateTime}

3. फर्द जामातालाशी व बरामदगी:
- अभियुक्त की जामातालाशी से बरामद सामान व नकदी मालखाना रजिस्टर में सुरक्षित जमा कराई गई।

4. वैधानिक अनुपालन (Statutory Compliances):
- धारा 47 BNSS: अभियुक्त को गिरफ़्तारी के सम्पूर्ण कानूनी आधार स्पष्ट पढ़कर सुनाए व समझाए गए।
- धारा 48 BNSS: अभियुक्त के परिजनों (${data.intimationPersonName}, मोबाइल: ${data.intimationPhone}) को गिरफ़्तारी की तत्काल सूचना दी गई।
- धारा 53 BNSS: अभियुक्त का डॉक्टरी मुआइना नागरिक अस्पताल से करवाया गया।

अभियुक्त को हवालात थाना में सुरक्षित बंद किया गया। रपट रोजनामचा में इंद्राज की जाकर तस्दीक की गई।`;

    return { subject, narrative };
  }

  // --- HTML Builders for Individual Memos ---

  private static generateFallbackArrestMemoHtml(data: ArrestExtractionData): string {
    return `
      <div style="font-family: serif; padding: 24px; color: #000; line-height: 1.6; max-width: 800px; margin: auto; background: #fff;">
        <h2 style="text-align: center; margin: 0; text-transform: uppercase;">हरियाणा पुलिस - गिरफ़्तारी मेमो (Form 26.8)</h2>
        <p style="text-align: center; margin: 4px 0 16px; font-size: 13px;">(PPR 26.8 एवं BNSS 2023 धारा 47, 48 के तहत)</p>
        <p><strong>थाना:</strong> ${data.policeStation} | <strong>ज़िला:</strong> ${data.district} | <strong>FIR No.:</strong> ${data.firNumber}</p>
        <p><strong>धाराएं:</strong> ${data.sections}</p>
        <hr/>
        <p><strong>अभियुक्त का नाम:</strong> ${data.accusedName} पुत्र ${data.fatherName}</p>
        <p><strong>उम्र:</strong> ${data.age} वर्ष | <strong>पता:</strong> ${data.address}</p>
        <p><strong>गिरफ़्तारी स्थान:</strong> ${data.arrestPlace} | <strong>समय:</strong> ${data.arrestDateTime}</p>
        <p><strong>जांच अधिकारी (IO):</strong> ${data.ioName} (${data.ioRank}, ${data.ioBeltNo})</p>
      </div>
    `;
  }

  private static generateJamatalashiHtml(data: ArrestExtractionData): string {
    const items = data.jamaTalashiArticles || [];
    return `
      <div style="font-family: serif; padding: 24px; color: #111; line-height: 1.6; max-width: 800px; margin: auto; background: #fff;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 18px;">हरियाणा पुलिस - फर्द जामातालाशी (Personal Search Memo)</h2>
          <p style="margin: 4px 0 0; font-size: 13px;">(BNSS 2023 धारा 50 / PPR 26.10A)</p>
        </div>
        <p><strong>थाना:</strong> ${data.policeStation} | <strong>मुकद्दमा सं.:</strong> ${data.firNumber} | <strong>दिनांक:</strong> ${data.arrestDateTime?.split(" ")[0]}</p>
        <p>रु-ब-रु हम गवाहान, अभियुक्त <strong>${data.accusedName}</strong> पुत्र ${data.fatherName} निवासी ${data.address} की जामातालाशी ली गई। तलाशी के दौरान अभियुक्त के शरीर व कपड़ों से निम्नलिखित वस्तुएं बरामद हुईं:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid #999; padding: 6px;">क्र.सं.</th>
              <th style="border: 1px solid #999; padding: 6px;">विवरण सामान बरामदगी</th>
              <th style="border: 1px solid #999; padding: 6px;">तादाद (मात्रा)</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr>
                <td style="border: 1px solid #999; padding: 6px; text-align: center;">${item.srNo}</td>
                <td style="border: 1px solid #999; padding: 6px;">${item.description}</td>
                <td style="border: 1px solid #999; padding: 6px; text-align: center;">${item.quantity}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <p>उक्त सामान को कब्जे पुलिस में लेकर फर्द तैयार की गई।</p>
        <div style="margin-top: 36px; display: flex; justify-content: space-between;">
          <div>गवाह 1: __________________<br/><span style="font-size: 11px;">HC Satish Kumar</span></div>
          <div>अभियुक्त के हस्ताक्षर/अंगूठा निशान: ____________<br/><span style="font-size: 11px;">${data.accusedName}</span></div>
          <div>जांच अधिकारी: __________________<br/><span style="font-size: 11px;">${data.ioName}</span></div>
        </div>
      </div>
    `;
  }

  private static generateGroundsOfArrestHtml(data: ArrestExtractionData): string {
    const grounds = data.groundsOfArrest || [];
    return `
      <div style="font-family: serif; padding: 24px; color: #111; line-height: 1.6; max-width: 800px; margin: auto; background: #fff;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 18px;">हरियाणा पुलिस - गिरफ़्तारी के कारणों की सूचना (Grounds of Arrest)</h2>
          <p style="margin: 4px 0 0; font-size: 13px;">(भारतीय नागरिक सुरक्षा संहिता 2023, धारा 47 एवं संविधान अनुच्छेद 22(1))</p>
        </div>
        <p>सेवा में, <strong>${data.accusedName}</strong> पुत्र श्री ${data.fatherName}, निवासी ${data.address}</p>
        <p>आपको सूचित किया जाता है कि आपको थाना ${data.policeStation} के मुकद्दमा सं. <strong>${data.firNumber}</strong> (धारा ${data.sections}) में निम्नलिखित कारणों व आधारों पर गिरफ़्तार किया गया है:</p>
        <ol style="margin-left: 20px; line-height: 1.8;">
          ${grounds.map((g) => `<li>${g}</li>`).join("")}
        </ol>
        <p>आपको यह भी सूचित किया जाता है कि आपके ऊपर लगाए गए आरोप संज्ञेय व गैर-जमानती (Non-Bailable) प्रकृति के हैं। आपको अपने अधिवक्ता से परामर्श लेने व विधिक सहायता प्राप्त करने का पूर्ण कानूनी अधिकार है।</p>
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div>पावती / अभियुक्त के हस्ताक्षर: ____________<br/><span style="font-size: 11px;">(हस्ताक्षर कर सूचना प्राप्त की)</span></div>
          <div style="text-align: right;">जांच अधिकारी (IO): ____________<br/><span style="font-size: 11px;">${data.ioName} (${data.ioBeltNo})</span></div>
        </div>
      </div>
    `;
  }

  private static generateIntimationHtml(data: ArrestExtractionData): string {
    return `
      <div style="font-family: serif; padding: 24px; color: #111; line-height: 1.6; max-width: 800px; margin: auto; background: #fff;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 18px;">हरियाणा पुलिस - गिरफ़्तारी इत्तिला पत्र (Intimation of Arrest)</h2>
          <p style="margin: 4px 0 0; font-size: 13px;">(भारतीय नागरिक सुरक्षा संहिता 2023, धारा 48)</p>
        </div>
        <p>सेवा में,<br/><strong>श्री/श्रीमती ${data.intimationPersonName}</strong> (${data.intimationRelation})<br/>मोबाइल: ${data.intimationPhone}</p>
        <p>महोदय/महोदया,<br/>आपको सूचित किया जाता है कि आपके सुपुत्र/परिजन <strong>${data.accusedName}</strong> पुत्र श्री ${data.fatherName} को मुकद्दमा सं. ${data.firNumber} (धारा ${data.sections}) के सिलसिले में दिनांक <strong>${data.arrestDateTime}</strong> को स्थान ${data.arrestPlace} से गिरफ़्तार किया गया है।</p>
        <p>वर्तमान में अभियुक्त थाना ${data.policeStation} की हिरासत में सुरक्षित हैं।</p>
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div>सूचना प्राप्तकर्ता के हस्ताक्षर/कॉल रिकॉर्ड: ____________</div>
          <div style="text-align: right;">जांच अधिकारी: ____________<br/><span style="font-size: 11px;">${data.ioName}</span></div>
        </div>
      </div>
    `;
  }

  private static generateMedicalMemoHtml(data: ArrestExtractionData): string {
    return `
      <div style="font-family: serif; padding: 24px; color: #111; line-height: 1.6; max-width: 800px; margin: auto; background: #fff;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 18px;">हरियाणा पुलिस - मेडिकल परीक्षण प्रार्थना पत्र (MLR Requisition)</h2>
          <p style="margin: 4px 0 0; font-size: 13px;">(भारतीय नागरिक सुरक्षा संहिता 2023, धारा 53)</p>
        </div>
        <p>सेवा में,<br/>चिकित्सा अधिकारी महोदय,<br/>नागरिक अस्पताल, ${data.district} (हरियाणा)</p>
        <p>विषय: मुकद्दमा सं. ${data.firNumber} में गिरफ़्तारशुदा अभियुक्त ${data.accusedName} के चिकित्सकीय परीक्षण बाबत।</p>
        <p>महोदय,<br/>उपरोक्त मुकद्दमे में गिरफ़्तार अभियुक्त <strong>${data.accusedName}</strong> पुत्र श्री ${data.fatherName}, उम्र ${data.age} वर्ष, का विस्तृत डॉक्टरी मुआइना (General Health & Injury Examination) करने की कृपा करें।</p>
        <div style="margin-top: 40px; text-align: right;">
          <p style="margin: 0;">भवदीय,</p>
          <p style="margin: 0; font-weight: bold;">${data.ioName}</p>
          <p style="margin: 0; font-size: 11px;">${data.ioRank}, थाना ${data.policeStation}</p>
        </div>
      </div>
    `;
  }

  private static generateRemandApplicationHtml(data: ArrestExtractionData): string {
    return `
      <div style="font-family: serif; padding: 24px; color: #111; line-height: 1.6; max-width: 800px; margin: auto; background: #fff;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 18px;">बअदालत श्रीमान इलाका मजिस्ट्रेट महोदय, ${data.district}</h2>
          <p style="margin: 4px 0 0; font-size: 13px;">दरख्वास्त पुलिस रिमांड बाबत अभियुक्त ${data.accusedName} u/s 187 BNSS 2023</p>
        </div>
        <p><strong>मुकद्दमा सं.:</strong> ${data.firNumber} | <strong>थाना:</strong> ${data.policeStation} | <strong>धाराएं:</strong> ${data.sections}</p>
        <p>श्रीमान जी,<br/>निवेदन है कि अभियुक्त <strong>${data.accusedName}</strong> को मुकद्दमा हाजा में दिनांक ${data.arrestDateTime} को गिरफ़्तार किया गया है। अभियुक्त से चोरीशुदा शेष माल मसरूका व अन्य साथियों की गिरफ्तारी बाबत गहन पूछताछ अपेक्षित है।</p>
        <p>अतः श्रीमान जी से प्रार्थना है कि अभियुक्त का <strong>02 दिन का पुलिस हिरासत रिमांड (Police Custody)</strong> प्रदान फरमाया जाए।</p>
        <div style="margin-top: 40px; text-align: right;">
          <p style="margin: 0; font-weight: bold;">जांच अधिकारी (IO)</p>
          <p style="margin: 0; font-size: 12px;">${data.ioName} (${data.ioRank})</p>
          <p style="margin: 0; font-size: 11px;">थाना ${data.policeStation}</p>
        </div>
      </div>
    `;
  }
}
