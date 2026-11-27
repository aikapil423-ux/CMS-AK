import { randomBytes, scryptSync } from 'node:crypto';
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';

nextEnv.loadEnvConfig(process.cwd(), false);

const databaseUrl = process.env.POSTGRES_DATABASE_URL;
if (!databaseUrl) {
  console.error('[seed-75-accounts] POSTGRES_DATABASE_URL is required.');
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

function newUnusableHash() {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(randomBytes(32), salt, 64).toString('hex')}`;
}

const UNITS = [
  {
    "id": "DST-PNP",
    "code": "DST-PNP",
    "name": "Panipat District",
    "type": "DISTRICT_OFFICE",
    "district": "Panipat",
    "range": "Karnal Range",
    "contactPhone": "0180-2652200",
    "email": "sp-pnp.pol@hry.gov.in",
    "address": "Mini Secretariat, Gohana Road, Panipat",
    "parentId": null
  },
  {
    "id": "HAR-PNP-CYBER",
    "code": "HAR-PNP-CYBER",
    "name": "PS Cyber Crime Panipat",
    "type": "POLICE_STATION",
    "district": "Panipat",
    "range": "Karnal Range",
    "contactPhone": null,
    "email": null,
    "address": null,
    "parentId": null
  },
  {
    "id": "HAR-PNP-PS-03",
    "code": "HAR-PNP-PS-03",
    "name": "PS Chandni Bagh Panipat",
    "type": "POLICE_STATION",
    "district": "Panipat",
    "range": "Karnal Range",
    "contactPhone": "0180-2661200",
    "email": "ps-chandnibagh-pnp.pol@hry.gov.in",
    "address": "Chandni Bagh Road, Panipat, Haryana",
    "parentId": "DST-PNP"
  },
  {
    "id": "HAR-PNP-SECTOR-29",
    "code": "HAR-PNP-SECTOR-29",
    "name": "PS Industrial Sector 29 Panipat",
    "type": "POLICE_STATION",
    "district": "Panipat",
    "range": "Karnal Range",
    "contactPhone": null,
    "email": null,
    "address": null,
    "parentId": null
  }
];
const ACCOUNTS = [
  {
    "id": "cb_0fa7al",
    "pno": "0FA7AL",
    "beltNumber": null,
    "fullName": "SUMIT",
    "rank": "Constable",
    "role": "MHC",
    "status": "ACTIVE",
    "mobileNumber": "9000000025",
    "email": null,
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "cb_1b4l1y",
    "pno": "1B4L1Y",
    "beltNumber": null,
    "fullName": "HAWA SINGH",
    "rank": "Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9000000008",
    "email": null,
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_1a774f59",
    "pno": "1B4LD4",
    "beltNumber": "1609/PPT",
    "fullName": "SUNITA",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_c7e657d9",
    "pno": "2C4LFI",
    "beltNumber": "1501",
    "fullName": "SUKHRAM PAL",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "cb_2c4lx0",
    "pno": "2C4LX0",
    "beltNumber": null,
    "fullName": "RAVINDER SINGH",
    "rank": "Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9000000018",
    "email": null,
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_21c25859",
    "pno": "3A4LOA",
    "beltNumber": "1595",
    "fullName": "SUMAN DEVI",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_9dfe5fc1",
    "pno": "3C4L5I",
    "beltNumber": "1630",
    "fullName": "MONINDER SINGH",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_f50880c4",
    "pno": "3C4LIN",
    "beltNumber": "71/PPT",
    "fullName": "SUNIL KUMAR",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_9f81728f",
    "pno": "3D4L0V",
    "beltNumber": "1606/PPT",
    "fullName": "LAKHWINDER",
    "rank": "Assistant Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9466063377",
    "email": "3d4l0v@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_42270646",
    "pno": "3D4L7X",
    "beltNumber": "1424",
    "fullName": "SANDEEP KUMAR",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_6b34097a",
    "pno": "3E4L39",
    "beltNumber": "1055/PPT",
    "fullName": "SUBHASH KUMAR",
    "rank": "SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_178c0dfe",
    "pno": "3E4L7W",
    "beltNumber": "272",
    "fullName": "RAJ KUMAR",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_08e34b3d",
    "pno": "3E4LAK",
    "beltNumber": "26/PPT",
    "fullName": "CHANDERPAL",
    "rank": "Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9996180200",
    "email": "3e4lak@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_5492280e",
    "pno": "3E4LHV",
    "beltNumber": "36/PPT",
    "fullName": "NARENDER KUMAR",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_9e924a85",
    "pno": "3F4L11",
    "beltNumber": "958",
    "fullName": "BIJENDER SINGH",
    "rank": "Constable",
    "role": "MM",
    "status": "ACTIVE",
    "mobileNumber": "9466529336",
    "email": "3f4l11@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_ea311a82",
    "pno": "3F4L56",
    "beltNumber": "165/PPT",
    "fullName": "RAJINDER SINGH",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_3c04221f",
    "pno": "3F4L6E",
    "beltNumber": "59",
    "fullName": "SATENDER SINGH",
    "rank": "Head Constable",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9813443160",
    "email": "3f4l6e@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_e316303f",
    "pno": "3F4LHU",
    "beltNumber": "296/PPT",
    "fullName": "BALJIT SINGH",
    "rank": "SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "cb_3f4li2",
    "pno": "3F4LI2",
    "beltNumber": null,
    "fullName": "DILBAG SINGH",
    "rank": "Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9000000006",
    "email": null,
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_6c21b74e",
    "pno": "3F4LM7",
    "beltNumber": "1533/PPT",
    "fullName": "HAPPY",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "cb_3g3gaf",
    "pno": "3G3GAF",
    "beltNumber": null,
    "fullName": "BALWAN SINGH",
    "rank": "Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9000000003",
    "email": null,
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_5b74bb71",
    "pno": "3G4L37",
    "beltNumber": "1051/PPT",
    "fullName": "JITENDER KUMAR",
    "rank": "SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_ff93e2fe",
    "pno": "3H3GVK",
    "beltNumber": "751",
    "fullName": "RAVINDER",
    "rank": "CONSTABLE",
    "role": "MHC_GD_INCHARGE",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_dcadfc7d",
    "pno": "3H4LKP",
    "beltNumber": "173/PPT",
    "fullName": "SHUKENDER SINGH",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_0180e2de",
    "pno": "4F1AFR",
    "beltNumber": "113/PPT",
    "fullName": "SUNIL KUMAR",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "cb_4g2b21",
    "pno": "4G2B21",
    "beltNumber": null,
    "fullName": "RAKESH KUMAR",
    "rank": "Assistant Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9000000017",
    "email": null,
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_c794c124",
    "pno": "4G2BIU",
    "beltNumber": "1529",
    "fullName": "SUNIL KUMAR",
    "rank": "Head Constable",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9466011772",
    "email": "4g2biu@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_cfe2a32d",
    "pno": "5A2L7I",
    "beltNumber": "1602",
    "fullName": "LALITA",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_5b7b0f67",
    "pno": "5A2VVB",
    "beltNumber": "532/PPT",
    "fullName": "SACHIN KUMAR",
    "rank": "SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_52e41a54",
    "pno": "5C16F6",
    "beltNumber": "197",
    "fullName": "WAZIR KUMAR",
    "rank": "Head Constable",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9466702990",
    "email": "5c16f6@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_036d1f86",
    "pno": "5E1A9O",
    "beltNumber": "810",
    "fullName": "NAVEEN KUMAR",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_c8e33799",
    "pno": "5F3QBL",
    "beltNumber": "1063/KTL",
    "fullName": "SEEMA",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_3d051060",
    "pno": "5F4LJH",
    "beltNumber": "287/PPT",
    "fullName": "RAKESH",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_b5076d27",
    "pno": "5G4L08",
    "beltNumber": "161/PPT",
    "fullName": "JOGINDER SINGH",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_67291ddc",
    "pno": "5H1QGP",
    "beltNumber": "1851/SPT",
    "fullName": "MOHKAM SINGH",
    "rank": "Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9729700100",
    "email": "5h1qgp@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "cb_5i4lc3",
    "pno": "5I4LC3",
    "beltNumber": null,
    "fullName": "SATPAL SINGH",
    "rank": "Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9000000023",
    "email": null,
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "cb_5i4lhg",
    "pno": "5I4LHG",
    "beltNumber": null,
    "fullName": "REKHA",
    "rank": "Inspector",
    "role": "SHO",
    "status": "ACTIVE",
    "mobileNumber": "9000000019",
    "email": null,
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_0521fc28",
    "pno": "6D0188",
    "beltNumber": "137/PPT",
    "fullName": "SANJAY",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_709b5034",
    "pno": "7A01KG",
    "beltNumber": "118/PPT",
    "fullName": "PARVEEN KUMAR",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_6601c394",
    "pno": "7D5GK2",
    "beltNumber": "1123/SPT",
    "fullName": "RAJBIR",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_5025ced1",
    "pno": "7G161W",
    "beltNumber": "447",
    "fullName": "AJAY KUMAR",
    "rank": "Head Constable",
    "role": "MHC",
    "status": "ACTIVE",
    "mobileNumber": "8901207666",
    "email": "7g161w@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_f749804b",
    "pno": "8C9WT0",
    "beltNumber": "1631/PPT",
    "fullName": "RISHI PARKASH",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_fe2c0df0",
    "pno": "8D5G0L",
    "beltNumber": "135/SPT",
    "fullName": "KAMLESH",
    "rank": "Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "7015914485",
    "email": "8d5g0l@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_30514214",
    "pno": "9A4VXL",
    "beltNumber": "1539",
    "fullName": "PUNEET",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_e3be1835",
    "pno": "9C5GPW",
    "beltNumber": "1523",
    "fullName": "SANJAY",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_c032b392",
    "pno": "9D3G8N",
    "beltNumber": "1534/PPT",
    "fullName": "VED SINGH",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_3ef971b0",
    "pno": "9D9G79",
    "beltNumber": "636",
    "fullName": "NAVEEN MALIK",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_cfe75d4a",
    "pno": "9F9GHX",
    "beltNumber": "105",
    "fullName": "JOGINDER SINGH",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_38afd7df",
    "pno": "9H3G6L",
    "beltNumber": "1119/KNL",
    "fullName": "VIRENDER SINGH",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_a3793330",
    "pno": "AD9Q2L",
    "beltNumber": "929",
    "fullName": "HARI OM",
    "rank": "Head Constable",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9050231099",
    "email": "ad9q2l@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_b3138dd4",
    "pno": "AH0BSF",
    "beltNumber": "782",
    "fullName": "VINOD KUMAR",
    "rank": "HEAD_CONSTABLE",
    "role": "MM",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_98006793",
    "pno": "BA21N7",
    "beltNumber": "532/PPT",
    "fullName": "DEEPAK",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_989c56f6",
    "pno": "BI4BBQ",
    "beltNumber": "923/PPT",
    "fullName": "SURENDER SINGH",
    "rank": "ASSISTANT_SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_8ec5cd9b",
    "pno": "CA9X71",
    "beltNumber": "773",
    "fullName": "ROHIT",
    "rank": "Head Constable",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9034132848",
    "email": "ca9x71@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_64479420",
    "pno": "CB9Q5R",
    "beltNumber": "928",
    "fullName": "PAWAN KUMAR",
    "rank": "Head Constable",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9468379479",
    "email": "cb9q5r@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_6e74464f",
    "pno": "DF3GLM",
    "beltNumber": "395/PPT",
    "fullName": "SENU RANI",
    "rank": "Assistant Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "8306596476",
    "email": "df3glm@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_5c885675",
    "pno": "DG3G0O",
    "beltNumber": "127",
    "fullName": "AGARSAIN",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_cfac1920",
    "pno": "DI21UH",
    "beltNumber": "141",
    "fullName": "SONU DESWAL",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_70b9d68e",
    "pno": "EAAYE8",
    "beltNumber": "11-09-1995",
    "fullName": "SOURABH SHARMA",
    "rank": "SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_83f9dd60",
    "pno": "EAAYM0",
    "beltNumber": "19071997",
    "fullName": "MAHIPAL",
    "rank": "Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9992982150",
    "email": "eaaym0@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_0df678f9",
    "pno": "EFAYF2",
    "beltNumber": "10-01-1996",
    "fullName": "AJAY KUMAR",
    "rank": "SUB_INSPECTOR",
    "role": "SHO",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_09c743b8",
    "pno": "HABH6K",
    "beltNumber": "12-08-1994",
    "fullName": "DEEPAK CHAHAL",
    "rank": "SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_a2361391",
    "pno": "HFBH7E",
    "beltNumber": "10-06-1994",
    "fullName": "SOMVIR",
    "rank": "SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_a458fd3f",
    "pno": "HHBHGL",
    "beltNumber": "P/SI",
    "fullName": "RAHUL",
    "rank": "Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9992208875",
    "email": "hhbhgl@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_7b86e79a",
    "pno": "HHBHJ9",
    "beltNumber": "23-03-1998",
    "fullName": "ROBIN NAIN",
    "rank": "SUB_INSPECTOR",
    "role": "SHO",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_d139afa8",
    "pno": "HI3GS8",
    "beltNumber": "100",
    "fullName": "AJAY KUMAR",
    "rank": "Head Constable",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "8059101005",
    "email": "hi3gs8@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_cd9a9f2c",
    "pno": "JEAX7P",
    "beltNumber": "11-02-1994",
    "fullName": "DEEPAK DAHIYA",
    "rank": "SUB_INSPECTOR",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "usr_0aaaf69e",
    "pno": "JI9QP2",
    "beltNumber": "1006",
    "fullName": "RAVIT RAMAN",
    "rank": "HEAD_CONSTABLE",
    "role": "MHC_GD_INCHARGE",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-CYBER"
  },
  {
    "id": "cb_kfakx1",
    "pno": "KFAKX1",
    "beltNumber": null,
    "fullName": "JAGMANDER",
    "rank": "Constable",
    "role": "MHC",
    "status": "ACTIVE",
    "mobileNumber": "9000000009",
    "email": null,
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_267607f0",
    "pno": "OH9GDB",
    "beltNumber": "134",
    "fullName": "NAVEEN KUMAR",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_20ff566e",
    "pno": "QG9GCK",
    "beltNumber": "621",
    "fullName": "SUBHASH",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_19d88aed",
    "pno": "SA9W5F",
    "beltNumber": "1325",
    "fullName": "KULDEEP SINGH",
    "rank": "HEAD_CONSTABLE",
    "role": "ENQUIRY_OFFICER",
    "status": "ACTIVE",
    "mobileNumber": null,
    "email": null,
    "unitId": "HAR-PNP-SECTOR-29"
  },
  {
    "id": "usr_791d76d5",
    "pno": "SI137KIRPAL",
    "beltNumber": "137",
    "fullName": "KIRPAL",
    "rank": "Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "9813700137",
    "email": "si137kirpal@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "usr_0008cf20",
    "pno": "SI564H",
    "beltNumber": "564/H",
    "fullName": "SATPAL SINGH",
    "rank": "Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "7988128307",
    "email": "si564h@hry.police.gov.in",
    "unitId": "HAR-PNP-PS-03"
  },
  {
    "id": "cb_udbh0j",
    "pno": "UDBH0J",
    "beltNumber": null,
    "fullName": "AAKASH",
    "rank": "Sub-Inspector",
    "role": "IO",
    "status": "ACTIVE",
    "mobileNumber": "0000000000",
    "email": null,
    "unitId": "HAR-PNP-PS-03"
  }
];

async function main() {
  let createdUnits = 0;
  for (const unit of UNITS) {
    const existing = await prisma.policeUnit.findUnique({ where: { id: unit.id } });
    if (!existing) {
      await prisma.policeUnit.create({ data: unit });
      createdUnits++;
    }
  }

  let createdUsers = 0;
  for (const acc of ACCOUNTS) {
    const existing = await prisma.user.findUnique({ where: { pno: acc.pno } });
    if (!existing) {
      await prisma.user.create({
        data: {
          id: acc.id,
          pno: acc.pno,
          beltNumber: acc.beltNumber,
          fullName: acc.fullName,
          rank: acc.rank,
          role: acc.role,
          status: acc.status || 'ACTIVE',
          mobileNumber: acc.mobileNumber,
          email: acc.email,
          passwordHash: newUnusableHash(),
          unitId: acc.unitId,
        },
      });
      createdUsers++;
    }
  }

  console.log(`[seed-75-accounts] Done. Created ${createdUnits} units and ${createdUsers} missing accounts (total in script: ${ACCOUNTS.length}).`);
}

main()
  .catch((err) => {
    console.error('[seed-75-accounts] Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
