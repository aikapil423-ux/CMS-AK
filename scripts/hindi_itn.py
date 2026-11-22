"""
Inverse Text Normalization (ITN) for Hindi Speech-to-Text
Converts spoken Hindi numbers, dates, and police/legal terms to standard written format.
"""
import re
from typing import Dict, List, Optional

# Basic Hindi Numbers 0-100 mapping
HINDI_NUMS: Dict[str, int] = {
    "शून्य": 0, "सिफर": 0, "सिफ़र": 0, "जीरो": 0, "ज़ीरो": 0,
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "पाँच": 5,
    "छह": 6, "छः": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
    "ग्यारह": 11, "बारह": 12, "तेरह": 13, "चौदह": 14, "पंद्रह": 15, "पन्द्रह": 15,
    "सोलह": 16, "सत्रह": 17, "अठारह": 18, "अट्ठारह": 18, "उन्नीस": 19, "बीस": 20,
    "इक्कीस": 21, "बाईस": 22, "तेईस": 23, "चौबीस": 24, "पच्चीस": 25,
    "छब्बीस": 26, "सत्ताईस": 27, "अट्ठाईस": 28, "उनतीस": 29, "तीस": 30,
    "इकतीस": 31, "बत्तीस": 32, "तैंतीस": 33, "चौंतीस": 34, "पैंतीस": 35,
    "छत्तीस": 36, "सैंतीस": 37, "अड़तीस": 38, "उनतालीस": 39, "चालीस": 40,
    "इकतालीस": 41, "बयालीस": 42, "तैंतालीस": 43, "चवालीस": 44, "पैंतालीस": 45,
    "छियालीस": 46, "सैंतालीस": 47, "अड़तालीस": 48, "उनचास": 49, "पचास": 50,
    "इक्यावन": 51, "इक्याउन": 51, "बावन": 52, "तिरपन": 53, "चौवन": 54,
    "बचपन": 55, "पचपन": 55, "छप्पन": 56, "सत्तावन": 57, "अट्ठावन": 58,
    "उनसठ": 59, "साठ": 60, "इकसठ": 61, "बासठ": 62, "तिरसठ": 63,
    "चौंसठ": 64, "पैंसठ": 65, "छियासठ": 66, "सरसठ": 67, "अड़सठ": 68,
    "उनहत्तर": 69, "सत्तर": 70, "इकहत्तर": 71, "बहत्तर": 72, "तिहत्तर": 73,
    "चौहत्तर": 74, "पचहत्तर": 75, "छिहत्तर": 76, "सतहत्तर": 77, "अठहत्तर": 78,
    "उन्यासी": 79, "अस्सी": 80, "इक्यासी": 81, "बयासी": 82, "तिरासी": 83,
    "चौरासी": 84, "पचासी": 85, "छियासी": 86, "सत्तासी": 87, "अट्ठासी": 88,
    "नवासी": 89, "नवाँसी": 89, "नब्बे": 90, "इक्यानवे": 91, "बानवे": 92,
    "बायनवे": 92, "तिरानवे": 93, "चौरानवे": 94, "पचानवे": 95, "छियानवे": 96,
    "सत्तानवे": 97, "अट्ठानवे": 98, "निन्यानवे": 99, "सौ": 100,
}

HINDI_MONTHS: Dict[str, int] = {
    "जनवरी": 1, "फरवरी": 2, "फ़रवरी": 2, "मार्च": 3, "अप्रैल": 4, "अप्रेल": 4,
    "मई": 5, "जून": 6, "जुलाई": 7, "अगस्त": 8, "सितंबर": 9, "सितम्बर": 9,
    "अक्टूबर": 10, "अक्तूबर": 10, "नवंबर": 11, "नवम्बर": 11, "दिसंबर": 12, "दिसम्बर": 12
}

MULTIPLIERS: Dict[str, int] = {
    "सौ": 100,
    "हजार": 1000,
    "हज़ार": 1000,
    "लाख": 100000,
    "करोड़": 10000000,
    "करोड": 10000000,
}

ALL_NUM_WORDS = set(HINDI_NUMS.keys()) | set(MULTIPLIERS.keys())

def words_to_number(phrase: str) -> Optional[int]:
    """
    Converts compound Hindi spoken number phrase into integer.
    E.g. 'दो हजार छब्बीस' -> 2026, 'तीन सौ बीस' -> 320, 'चार सौ बीस' -> 420
    """
    words = phrase.strip().split()
    if not words:
        return None
    
    total = 0
    current = 0
    matched_any = False
    
    for w in words:
        if w in HINDI_NUMS:
            val = HINDI_NUMS[w]
            if val == 100:
                current = (current if current != 0 else 1) * 100
            else:
                current += val
            matched_any = True
        elif w in MULTIPLIERS:
            mul = MULTIPLIERS[w]
            current = (current if current != 0 else 1) * mul
            total += current
            current = 0
            matched_any = True
        elif w.isdigit():
            current += int(w)
            matched_any = True
        else:
            return None
            
    if not matched_any:
        return None
        
    return total + current

def normalize_dates(text: str) -> str:
    """
    Replaces spoken date phrases with DD/MM/YYYY format.
    E.g.:
      'ग्यारह नवंबर दो हजार छब्बीस' -> '11/11/2026'
      '11 नवंबर 2026' -> '11/11/2026'
      'पंद्रह अगस्त दो हजार चौबीस' -> '15/08/2024'
    """
    tokens = text.split()
    i = 0
    new_tokens = []
    
    while i < len(tokens):
        if i + 1 < len(tokens) and tokens[i+1] in HINDI_MONTHS:
            day_str = tokens[i]
            month_name = tokens[i+1]
            month_num = HINDI_MONTHS[month_name]
            
            day_val = HINDI_NUMS.get(day_str) or (int(day_str) if day_str.isdigit() else None)
            if day_val and 1 <= day_val <= 31:
                year_words = []
                j = i + 2
                while j < len(tokens):
                    clean_w = re.sub(r"[^\w\u0900-\u097F]", "", tokens[j])
                    if clean_w in ALL_NUM_WORDS or clean_w.isdigit():
                        year_words.append(tokens[j])
                        j += 1
                    else:
                        break
                        
                if year_words:
                    year_val = words_to_number(" ".join(year_words)) or (int(year_words[0]) if year_words[0].isdigit() else None)
                    if year_val and 1900 <= year_val <= 2100:
                        new_tokens.append(f"{day_val:02d}/{month_num:02d}/{year_val:04d}")
                        i = j
                        continue
        new_tokens.append(tokens[i])
        i += 1
        
    return " ".join(new_tokens)

def normalize_digit_sequences(text: str) -> str:
    """
    Converts sequences of single-digit Hindi numbers (like mobile numbers, PIN codes)
    E.g. 'नौ आठ एक दो तीन चार पांच छह सात आठ' -> '9812345678'
    """
    single_digits = {
        "शून्य": "0", "सिफर": "0", "सिफ़र": "0", "जीरो": "0", "ज़ीरो": "0",
        "एक": "1", "दो": "2", "तीन": "3", "चार": "4", "पांच": "5", "पाँच": "5",
        "छह": "6", "छः": "6", "सात": "7", "आठ": "8", "नौ": "9"
    }
    tokens = text.split()
    new_tokens = []
    i = 0
    while i < len(tokens):
        clean_w = re.sub(r"[^\w\u0900-\u097F]", "", tokens[i])
        if clean_w in single_digits or (clean_w.isdigit() and len(clean_w) == 1):
            seq = [single_digits.get(clean_w, clean_w)]
            j = i + 1
            while j < len(tokens):
                cw = re.sub(r"[^\w\u0900-\u097F]", "", tokens[j])
                if cw in single_digits or (cw.isdigit() and len(cw) == 1):
                    seq.append(single_digits.get(cw, cw))
                    j += 1
                else:
                    break
            if len(seq) >= 3:
                new_tokens.append("".join(seq))
                i = j
                continue
        new_tokens.append(tokens[i])
        i += 1
    return " ".join(new_tokens)

def normalize_police_terms(text: str) -> str:
    """
    Standardizes FIR, Case, GD, Sections and other police abbreviations.
    """
    text = re.sub(r"(?i)\b(?:एफ\s*आई\s*आर|एफआईआर|fir)\s*(?:नंबर|नं|संख्या)?\s*", "FIR No. ", text)
    text = re.sub(r"\b(?:मुकदमा\s*अपराध\s*संख्या|मु\s*अ\s*सं|मु०अ०सं०)\s*", "मु०अ०सं० ", text)
    text = re.sub(r"(?i)\b(?:जी\s*डी|जीडी)\s*(?:नंबर|नं|संख्या)?\s*", "GD No. ", text)
    text = re.sub(r"\b(?:रोजनामचा\s*(?:आम)?\s*रपट\s*संख्या)\s*", "रपट संख्या ", text)
    text = re.sub(r"\b(?:मोबाइल\s*नंबर|फोन\s*नंबर)\s*", "मोबाइल नं० ", text)
    return text

def normalize_compound_numbers(text: str) -> str:
    """
    Identifies multi-word spoken numbers and replaces them with digits.
    E.g. 'तीन सौ बीस' -> '320', 'चार सौ बीस' -> '420', 'दो हजार छब्बीस' -> '2026'
    """
    tokens = text.split()
    new_tokens = []
    i = 0
    
    while i < len(tokens):
        clean = re.sub(r"[^\w\u0900-\u097F]", "", tokens[i])
        if clean in ALL_NUM_WORDS or clean.isdigit():
            seq = [tokens[i]]
            j = i + 1
            while j < len(tokens):
                c = re.sub(r"[^\w\u0900-\u097F]", "", tokens[j])
                if c in ALL_NUM_WORDS or c.isdigit():
                    seq.append(tokens[j])
                    j += 1
                else:
                    break
                    
            seq_str = " ".join(seq)
            prev_token = new_tokens[-1].lower() if new_tokens else ""
            is_preceded_by_keyword = any(kw in prev_token for kw in ["fir", "no.", "no", "सं०", "संख्या", "धारा", "वार्ड", "कमरा", "दिनांक", "तारीख", "नं०", "नं", "आईपीसी", "भादवि", "bns"])
            
            num = words_to_number(seq_str)
            if num is not None:
                if len(seq) > 1 or num >= 10 or is_preceded_by_keyword or clean in MULTIPLIERS:
                    new_tokens.append(str(num))
                    i = j
                    continue
                    
        new_tokens.append(tokens[i])
        i += 1
        
    return " ".join(new_tokens)

def apply_hindi_itn(text: str) -> str:
    """
    Main pipeline for Hindi Inverse Text Normalization.
    """
    if not text or not text.strip():
        return text
        
    res = text
    res = normalize_police_terms(res)
    res = normalize_dates(res)
    res = normalize_digit_sequences(res)
    res = normalize_compound_numbers(res)
    res = re.sub(r"\s+", " ", res).strip()
    return res

if __name__ == "__main__":
    test_cases = [
        "ग्यारह नवंबर दो हजार छब्बीस",
        "एफआईआर नंबर तीन सौ बीस",
        "मुकदमा अपराध संख्या चार सौ बीस धारा तीन सौ दो",
        "घटना दिनांक पंद्रह अगस्त दो हजार चौबीस को हुई थी",
        "मोबाइल नंबर नौ आठ एक दो तीन चार पांच छह सात आठ",
        "रोजनामचा रपट संख्या पैंसठ",
    ]
    for tc in test_cases:
        print(f"INPUT : {tc}")
        print(f"OUTPUT: {apply_hindi_itn(tc)}\n")
