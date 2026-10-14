import { CMS_DICTIONARY, REVERSE_DICTIONARY, translatePhrase } from "../cmsTranslationDictionary";
import { translateStringToHindi } from "../universalDomTranslator";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error("❌ FAILED:", msg);
    process.exit(1);
  }
  console.log("✅ PASS:", msg);
}

console.log("\n=======================================================");
console.log("HARYANA POLICE CMS - BILINGUAL TRANSLATION VERIFICATION");
console.log("=======================================================\n");

// 1. Navigation items
assert(translateStringToHindi("Smart General Diary") === "स्मार्ट रोजनामचा (GD)", "Smart General Diary -> स्मार्ट रोजनामचा (GD)");
assert(translateStringToHindi("Complaints Register") === "शिकायत रजिस्टर", "Complaints Register -> शिकायत रजिस्टर");
assert(translateStringToHindi("FIR Register") === "एफ.आई.आर. रजिस्टर", "FIR Register -> एफ.आई.आर. रजिस्टर");
assert(translateStringToHindi("Investigation Workspace") === "अनुसंधान कार्यक्षेत्र", "Investigation Workspace -> अनुसंधान कार्यक्षेत्र");
assert(translateStringToHindi("Station Profile") === "थाना प्रोफ़ाइल", "Station Profile -> थाना प्रोफ़ाइल");
assert(translateStringToHindi("Officer Roster") === "अधिकारी रोस्टर", "Officer Roster -> अधिकारी रोस्टर");
assert(translateStringToHindi("Modules Portal") === "मॉड्यूल पोर्टल", "Modules Portal -> मॉड्यूल पोर्टल");

// 2. Buttons and Badges
assert(translateStringToHindi("Register Complaint") === "शिकायत दर्ज करें", "Register Complaint -> शिकायत दर्ज करें");
assert(translateStringToHindi("Register FIR") === "एफ.आई.आर. दर्ज करें", "Register FIR -> एफ.आई.आर. दर्ज करें");
assert(translateStringToHindi("Sign Out") === "लॉग आउट", "Sign Out -> लॉग आउट");
assert(translateStringToHindi("Active") === "सक्रिय", "Active -> सक्रिय");

// 3. Reverse mapping
assert(REVERSE_DICTIONARY["शिकायत रजिस्टर"] === "Complaints Register", "Reverse: शिकायत रजिस्टर -> Complaints Register");
assert(REVERSE_DICTIONARY["थाना प्रोफ़ाइल"] === "Station Profile", "Reverse: थाना प्रोफ़ाइल -> Station Profile");
assert(REVERSE_DICTIONARY["लॉग आउट"] === "Sign Out", "Reverse: लॉग आउट -> Sign Out");

// 4. translatePhrase utility
assert(translatePhrase("Complaints Register", "hi") === "शिकायत रजिस्टर", "translatePhrase(..., 'hi')");
assert(translatePhrase("शिकायत रजिस्टर", "en") === "Complaints Register", "translatePhrase(..., 'en')");

console.log("\n=======================================================");
console.log("ALL 16 TRANSLATION & REVERSAL TESTS PASSED PERFECTLY!");
console.log("=======================================================\n");
