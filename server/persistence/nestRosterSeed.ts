export interface DirectorySeedPerson {
  id: string;
  workspaceId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  title: string;
  role: string;
  personType: 'leadership' | 'staff' | 'agent' | 'assistant';
  officeIds: string[];
  officeNames: string[];
  primaryOfficeId: string;
  primaryOfficeName: string;
  isBrokerInCharge: boolean;
  status: 'active' | 'inactive' | 'needs_review';
  tags: string[];
  source: string;
  createdAt: string;
  updatedAt: string;
}

export const NEST_FULL_ROSTER_72: DirectorySeedPerson[] = [
  {
    "id": "dir_chris_brown_0",
    "workspaceId": "nest-realty-demo",
    "firstName": "Chris",
    "lastName": "Brown",
    "displayName": "Chris Brown",
    "email": "chris.brown@nestrealty.com",
    "phone": "(910) 581-4705",
    "title": "PB",
    "role": "PB",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.599Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_jennifer_young_1",
    "workspaceId": "nest-realty-demo",
    "firstName": "Jennifer",
    "lastName": "Young",
    "displayName": "Jennifer Young",
    "email": "jy@nestrealty.com",
    "phone": "(910) 547-2106",
    "title": "Fresh Nest RE - Leader",
    "role": "Fresh Nest RE - Leader",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_mary_kayehester_2",
    "workspaceId": "nest-realty-demo",
    "firstName": "Mary",
    "lastName": "Kaye Hester",
    "displayName": "Mary Kaye Hester",
    "email": "marykaye@nestrealty.com",
    "phone": "(910) 297-4789",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_abby_harris_3",
    "workspaceId": "nest-realty-demo",
    "firstName": "Abby",
    "lastName": "Harris",
    "displayName": "Abby Harris",
    "email": "abby.harris@nestrealty.com",
    "phone": "(803) 319-1988",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_matt_costin_4",
    "workspaceId": "nest-realty-demo",
    "firstName": "Matt",
    "lastName": "Costin",
    "displayName": "Matt Costin",
    "email": "matt.costin@nestrealty.com",
    "phone": "(910) 290-5458",
    "title": "The Costin Group - Leader",
    "role": "The Costin Group - Leader",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_eric_knight_5",
    "workspaceId": "nest-realty-demo",
    "firstName": "Eric",
    "lastName": "Knight",
    "displayName": "Eric Knight",
    "email": "eric@nestrealty.com",
    "phone": "(910) 367-2253",
    "title": "Broker-in-Charge",
    "role": "Broker-in-Charge",
    "personType": "leadership",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": true,
    "status": "active",
    "tags": [
      "mayfaire",
      "leadership",
      "bic"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_ryan_crecelius_6",
    "workspaceId": "nest-realty-demo",
    "firstName": "Ryan",
    "lastName": "Crecelius",
    "displayName": "Ryan Crecelius",
    "email": "ryan@nestrealty.com",
    "phone": "(910) 409-7120",
    "title": "Principal Broker / Owner",
    "role": "Owner / Regional Leader",
    "personType": "leadership",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "leadership"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_allison_donovan_7",
    "workspaceId": "nest-realty-demo",
    "firstName": "Allison",
    "lastName": "Donovan",
    "displayName": "Allison Donovan",
    "email": "allison.donovan@nestrealty.com",
    "phone": "(910) 200-3028",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_jessica_keenan_8",
    "workspaceId": "nest-realty-demo",
    "firstName": "Jessica",
    "lastName": "Keenan",
    "displayName": "Jessica Keenan",
    "email": "jessica.keenan@nestrealty.com",
    "phone": "(910) 368-1507",
    "title": "Broker-in-Charge",
    "role": "Broker-in-Charge",
    "personType": "leadership",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": true,
    "status": "active",
    "tags": [
      "carolina-beach",
      "leadership",
      "bic"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_merritt_andersoncrawley_9",
    "workspaceId": "nest-realty-demo",
    "firstName": "Merritt",
    "lastName": "Anderson Crawley",
    "displayName": "Merritt Anderson Crawley",
    "email": "merritt@nestrealty.com",
    "phone": "(704) 718-5388",
    "title": "MAC Real Estate- Leader",
    "role": "MAC Real Estate- Leader",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_matt_orr_10",
    "workspaceId": "nest-realty-demo",
    "firstName": "Matt",
    "lastName": "Orr",
    "displayName": "Matt Orr",
    "email": "matt.orr@nestrealty.com",
    "phone": "(910) 612-8283",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_james_fort_11",
    "workspaceId": "nest-realty-demo",
    "firstName": "James",
    "lastName": "Fort",
    "displayName": "James Fort",
    "email": "james.fort@nestrealty.com",
    "phone": "(910) 617-8264",
    "title": "Mayfaire",
    "role": "Mayfaire",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_tricia_keane_12",
    "workspaceId": "nest-realty-demo",
    "firstName": "Tricia",
    "lastName": "Keane",
    "displayName": "Tricia Keane",
    "email": "tricia.keane@nestrealty.com",
    "phone": "(910) 367-1832",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_caroline_holman_13",
    "workspaceId": "nest-realty-demo",
    "firstName": "Caroline",
    "lastName": "Holman",
    "displayName": "Caroline Holman",
    "email": "caroline.holman@nestrealty.com",
    "phone": "(336) 972-6926",
    "title": "Broker - Costin Real Estate",
    "role": "Broker - Costin Real Estate",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_andrew_kelly_14",
    "workspaceId": "nest-realty-demo",
    "firstName": "Andrew",
    "lastName": "Kelly",
    "displayName": "Andrew Kelly",
    "email": "andrew.kelly@nestrealty.com",
    "phone": "(910) 231-2337",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_michelle_taylor_15",
    "workspaceId": "nest-realty-demo",
    "firstName": "Michelle",
    "lastName": "Taylor",
    "displayName": "Michelle Taylor",
    "email": "michelle.taylor@nestrealty.com",
    "phone": "(910) 233-7455",
    "title": "Broker - Barbee Group Realty",
    "role": "Broker - Barbee Group Realty",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "needs_review",
    "tags": [
      "mayfaire",
      "agent",
      "source-marked-x"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_ashley_whitley_16",
    "workspaceId": "nest-realty-demo",
    "firstName": "Ashley",
    "lastName": "Whitley",
    "displayName": "Ashley Whitley",
    "email": "Ashley.whitley@nestrealty.com",
    "phone": "(910) 685-0988",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_lexi_barbee_17",
    "workspaceId": "nest-realty-demo",
    "firstName": "Lexi",
    "lastName": "Barbee",
    "displayName": "Lexi Barbee",
    "email": "lexi.barbee@nestrealty.com",
    "phone": "(910) 508-6028",
    "title": "Barbee Group Realty-Leader",
    "role": "Barbee Group Realty-Leader",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_nilesh_jethwa_18",
    "workspaceId": "nest-realty-demo",
    "firstName": "Nilesh",
    "lastName": "Jethwa",
    "displayName": "Nilesh Jethwa",
    "email": "Nilesh@nestrealty.com",
    "phone": "(910) 622-0319",
    "title": "Jethwa Real Estate - Leader",
    "role": "Jethwa Real Estate - Leader",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_kathy_greer_19",
    "workspaceId": "nest-realty-demo",
    "firstName": "Kathy",
    "lastName": "Greer",
    "displayName": "Kathy Greer",
    "email": "kathy.greer@nestrealty.com",
    "phone": "(910) 726-4140",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_beth_starkey_20",
    "workspaceId": "nest-realty-demo",
    "firstName": "Beth",
    "lastName": "Starkey",
    "displayName": "Beth Starkey",
    "email": "beth.starkey@nestrealty.com",
    "phone": "(910) 524-3323",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_debbie_lariviere_21",
    "workspaceId": "nest-realty-demo",
    "firstName": "Debbie",
    "lastName": "Lariviere",
    "displayName": "Debbie Lariviere",
    "email": "debbie.lariviere@nestrealty.com",
    "phone": "(910) 352-7487",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_molly_tilyou_22",
    "workspaceId": "nest-realty-demo",
    "firstName": "Molly",
    "lastName": "Tilyou",
    "displayName": "Molly Tilyou",
    "email": "molly.tilyou@nestrealty.com",
    "phone": "(910) 515-2031",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_renata_kuperus_23",
    "workspaceId": "nest-realty-demo",
    "firstName": "Renata",
    "lastName": "Kuperus",
    "displayName": "Renata Kuperus",
    "email": "renata@nestrealty.com",
    "phone": "(910) 604-4158",
    "title": "Broker - Jethwa Real Estate",
    "role": "Broker - Jethwa Real Estate",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_dan_barentine_24",
    "workspaceId": "nest-realty-demo",
    "firstName": "Dan",
    "lastName": "Barentine",
    "displayName": "Dan Barentine",
    "email": "dan.barentine@nestrealty.com",
    "phone": "(910) 470-3456",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_mary_rayner_25",
    "workspaceId": "nest-realty-demo",
    "firstName": "Mary",
    "lastName": "Rayner",
    "displayName": "Mary Rayner",
    "email": "mary@nestrealty.com",
    "phone": "(910) 409-9358",
    "title": "Broker - Fresh Nest",
    "role": "Broker - Fresh Nest",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_donald_wagner_26",
    "workspaceId": "nest-realty-demo",
    "firstName": "Donald",
    "lastName": "Wagner",
    "displayName": "Donald Wagner",
    "email": "donald.wagner@nestrealty.com",
    "phone": "(910) 555-0100",
    "title": "Tricia's assistant/broker",
    "role": "Tricia's assistant/broker",
    "personType": "assistant",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "assistant"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_pam_fox_27",
    "workspaceId": "nest-realty-demo",
    "firstName": "Pam",
    "lastName": "Fox",
    "displayName": "Pam Fox",
    "email": "pam.fox@nestrealty.com",
    "phone": "(404) 915-5731",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_ann_gunn_28",
    "workspaceId": "nest-realty-demo",
    "firstName": "Ann",
    "lastName": "Gunn",
    "displayName": "Ann Gunn",
    "email": "ann@nestrealty.com",
    "phone": "(910) 540-3965",
    "title": "Admin",
    "role": "Admin",
    "personType": "staff",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "staff"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_julie_carpenter_29",
    "workspaceId": "nest-realty-demo",
    "firstName": "Julie",
    "lastName": "Carpenter",
    "displayName": "Julie Carpenter",
    "email": "julie.carpenter@nestrealty.com",
    "phone": "(910) 471-9411",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_michael_urti_30",
    "workspaceId": "nest-realty-demo",
    "firstName": "Michael",
    "lastName": "Urti",
    "displayName": "Michael Urti",
    "email": "michael.urti@nestrealty.com",
    "phone": "(910) 530-0843",
    "title": "Urti Real Estate- Leader",
    "role": "Urti Real Estate- Leader",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_alicia_devereaux_31",
    "workspaceId": "nest-realty-demo",
    "firstName": "Alicia",
    "lastName": "Devereaux",
    "displayName": "Alicia Devereaux",
    "email": "aliciad@nestrealty.com",
    "phone": "(910) 617-0684",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_sarah_finnegan_32",
    "workspaceId": "nest-realty-demo",
    "firstName": "Sarah",
    "lastName": "Finnegan",
    "displayName": "Sarah Finnegan",
    "email": "Sarah.finnegan@nestrealty.com",
    "phone": "(910) 800-1930",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_melissa_gagliardi_33",
    "workspaceId": "nest-realty-demo",
    "firstName": "Melissa",
    "lastName": "Gagliardi",
    "displayName": "Melissa Gagliardi",
    "email": "melissa.gagliardi@nestrealty.com",
    "phone": "(919) 219-2085",
    "title": "Admin",
    "role": "Admin",
    "personType": "staff",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "staff"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_brian_donovan_34",
    "workspaceId": "nest-realty-demo",
    "firstName": "Brian",
    "lastName": "Donovan",
    "displayName": "Brian Donovan",
    "email": "brian.donovan@nestrealty.com",
    "phone": "(910) 431-3102",
    "title": "Broker - Donovan RE",
    "role": "Broker - Donovan RE",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent",
      "email-only"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_lexi_pate_35",
    "workspaceId": "nest-realty-demo",
    "firstName": "Lexi",
    "lastName": "Pate",
    "displayName": "Lexi Pate",
    "email": "lexi.pate@nestrealty.com",
    "phone": "(910) 232-5943",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_teri_byrnes_36",
    "workspaceId": "nest-realty-demo",
    "firstName": "Teri",
    "lastName": "Byrnes",
    "displayName": "Teri Byrnes",
    "email": "teri.byrnes@nestrealty.com",
    "phone": "(910) 368-1222",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_travis_hollomon_37",
    "workspaceId": "nest-realty-demo",
    "firstName": "Travis",
    "lastName": "Hollomon",
    "displayName": "Travis Hollomon",
    "email": "travis.hollomon@nestrealty.com",
    "phone": "(919) 757-4231",
    "title": "Broker- MAC Real Estate",
    "role": "Broker- MAC Real Estate",
    "personType": "agent",
    "officeIds": [
      "hampstead"
    ],
    "officeNames": [
      "Hampstead"
    ],
    "primaryOfficeId": "hampstead",
    "primaryOfficeName": "Hampstead",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "hampstead",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_kristy_ward_38",
    "workspaceId": "nest-realty-demo",
    "firstName": "Kristy",
    "lastName": "Ward",
    "displayName": "Kristy Ward",
    "email": "kristy.ward@nestrealty.com",
    "phone": "(910) 200-3960",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_thurston_dawson_39",
    "workspaceId": "nest-realty-demo",
    "firstName": "Thurston",
    "lastName": "Dawson",
    "displayName": "Thurston Dawson",
    "email": "thurston@nestrealty.com",
    "phone": "(910) 523-6235",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_katie_urti_40",
    "workspaceId": "nest-realty-demo",
    "firstName": "Katie",
    "lastName": "Urti",
    "displayName": "Katie Urti",
    "email": "katie.urti@nestrealty.com",
    "phone": "(336) 817-2672",
    "title": "Broker - Urti Coastal real Estate",
    "role": "Broker - Urti Coastal real Estate",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_clint_harris_41",
    "workspaceId": "nest-realty-demo",
    "firstName": "Clint",
    "lastName": "Harris",
    "displayName": "Clint Harris",
    "email": "clint.harris@nestrealty.com",
    "phone": "(910) 515-1785",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_desiree_whalen_42",
    "workspaceId": "nest-realty-demo",
    "firstName": "Desiree",
    "lastName": "Whalen",
    "displayName": "Desiree Whalen",
    "email": "Desiree@whalenteamrealty.com",
    "phone": "(910) 620-7594",
    "title": "The Whalen Team",
    "role": "The Whalen Team",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_cindy_young_43",
    "workspaceId": "nest-realty-demo",
    "firstName": "Cindy",
    "lastName": "Young",
    "displayName": "Cindy Young",
    "email": "cindy.young@nestrealty.com",
    "phone": "(910) 789-0871",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_meghan_bowesalber_44",
    "workspaceId": "nest-realty-demo",
    "firstName": "Meghan",
    "lastName": "Bowes Alber",
    "displayName": "Meghan Bowes Alber",
    "email": "closings@coasttoclose.com",
    "phone": "(843) 789-9579",
    "title": "Coast to Close",
    "role": "Coast to Close",
    "personType": "staff",
    "officeIds": [
      "remote___home"
    ],
    "officeNames": [
      "Remote / Home"
    ],
    "primaryOfficeId": "remote___home",
    "primaryOfficeName": "Remote / Home",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "remote-/-home",
      "staff"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_mcclain_harvey_45",
    "workspaceId": "nest-realty-demo",
    "firstName": "McClain",
    "lastName": "Harvey",
    "displayName": "McClain Harvey",
    "email": "mcclain.miles@gmail.com",
    "phone": "(980) 234-3515",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "hampstead"
    ],
    "officeNames": [
      "Hampstead"
    ],
    "primaryOfficeId": "hampstead",
    "primaryOfficeName": "Hampstead",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "hampstead",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_renee_reitzel_46",
    "workspaceId": "nest-realty-demo",
    "firstName": "Renee",
    "lastName": "Reitzel",
    "displayName": "Renee Reitzel",
    "email": "renee.reitzel@nestrealty.com",
    "phone": "(910) 368-1804",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_alexis_roy_47",
    "workspaceId": "nest-realty-demo",
    "firstName": "Alexis",
    "lastName": "Roy",
    "displayName": "Alexis Roy",
    "email": "alexis.roy@nestrealty.com",
    "phone": "(865) 985-4802",
    "title": "Broker - Urti Coastal Real Estate",
    "role": "Broker - Urti Coastal Real Estate",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_dawn_lagomarsino_48",
    "workspaceId": "nest-realty-demo",
    "firstName": "Dawn",
    "lastName": "Lagomarsino",
    "displayName": "Dawn Lagomarsino",
    "email": "dawnlago@nestrealty.com",
    "phone": "(910) 297-1758",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_jessie_fairbairn_49",
    "workspaceId": "nest-realty-demo",
    "firstName": "Jessie",
    "lastName": "Fairbairn",
    "displayName": "Jessie Fairbairn",
    "email": "jessie.fairbairn@nestrealty.com",
    "phone": "(336) 327-5456",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_donna_neyland_50",
    "workspaceId": "nest-realty-demo",
    "firstName": "Donna",
    "lastName": "Neyland",
    "displayName": "Donna Neyland",
    "email": "donna.lomenzo@nestrealty.com",
    "phone": "339007",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_sydney_tobler_51",
    "workspaceId": "nest-realty-demo",
    "firstName": "Sydney",
    "lastName": "Tobler",
    "displayName": "Sydney Tobler",
    "email": "sydney.tobler@nestrealty.com",
    "phone": "(910) 833-4807",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_james_rackley_52",
    "workspaceId": "nest-realty-demo",
    "firstName": "James",
    "lastName": "Rackley",
    "displayName": "James Rackley",
    "email": "james.rackley@nestrealty.com",
    "phone": "(910) 512-7434",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_cassie_healy_53",
    "workspaceId": "nest-realty-demo",
    "firstName": "Cassie",
    "lastName": "Healy",
    "displayName": "Cassie Healy",
    "email": "Cassie.healy@nestrealty.com",
    "phone": "(804) 512-4866",
    "title": "Urti Real Estate",
    "role": "Urti Real Estate",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_laura_odorisio_54",
    "workspaceId": "nest-realty-demo",
    "firstName": "Laura",
    "lastName": "O'Dorisio",
    "displayName": "Laura O'Dorisio",
    "email": "laura.odorisio@gmail.com",
    "phone": "(910) 599-4114",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_sean_martin_55",
    "workspaceId": "nest-realty-demo",
    "firstName": "Sean",
    "lastName": "Martin",
    "displayName": "Sean Martin",
    "email": "sean@whalenteamrealty.com",
    "phone": "(910) 833-1098",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_hannah_delacourtsmith_56",
    "workspaceId": "nest-realty-demo",
    "firstName": "Hannah",
    "lastName": "Delacourt Smith",
    "displayName": "Hannah Delacourt Smith",
    "email": "hannah.smith@nestrealty.com",
    "phone": "(919) 819-2740",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "hampstead"
    ],
    "officeNames": [
      "Hampstead"
    ],
    "primaryOfficeId": "hampstead",
    "primaryOfficeName": "Hampstead",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "hampstead",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_mia_escalera_57",
    "workspaceId": "nest-realty-demo",
    "firstName": "Mia",
    "lastName": "Escalera",
    "displayName": "Mia Escalera",
    "email": "mia.escalera@nestrealty.com",
    "phone": "(910) 777-4187",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_ed_wagenseller_58",
    "workspaceId": "nest-realty-demo",
    "firstName": "Ed",
    "lastName": "Wagenseller",
    "displayName": "Ed Wagenseller",
    "email": "ed.wagenseller@nestrealty.com",
    "phone": "(910) 279-4663",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_jordan_warren_59",
    "workspaceId": "nest-realty-demo",
    "firstName": "Jordan",
    "lastName": "Warren",
    "displayName": "Jordan Warren",
    "email": "jordan.warren@nestrealty.com",
    "phone": "(910) 591-6157",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_lindsay_crecelius_60",
    "workspaceId": "nest-realty-demo",
    "firstName": "Lindsay",
    "lastName": "Crecelius",
    "displayName": "Lindsay Crecelius",
    "email": "lindsay.crecelius@nestrealty.com",
    "phone": "4/22/2026",
    "title": "Admin",
    "role": "Admin",
    "personType": "staff",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "staff"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_max_wagenseller_61",
    "workspaceId": "nest-realty-demo",
    "firstName": "Max",
    "lastName": "Wagenseller",
    "displayName": "Max Wagenseller",
    "email": "max.wagenseller@nestrealty.com",
    "phone": "579518144",
    "title": "Broker-Wagenseller team",
    "role": "Broker-Wagenseller team",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_amanda_galante_62",
    "workspaceId": "nest-realty-demo",
    "firstName": "Amanda",
    "lastName": "Galante",
    "displayName": "Amanda Galante",
    "email": "amanda.galante@nestrealty.com",
    "phone": "(910) 612-8125",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_zach_hanner_63",
    "workspaceId": "nest-realty-demo",
    "firstName": "Zach",
    "lastName": "Hanner",
    "displayName": "Zach Hanner",
    "email": "zach.hanner@nestrealty.com",
    "phone": "579517791",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_andra_browning_64",
    "workspaceId": "nest-realty-demo",
    "firstName": "Andra",
    "lastName": "Browning",
    "displayName": "Andra Browning",
    "email": "andra.browning@nestrealty.com",
    "phone": "234325",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_dessie_greene_65",
    "workspaceId": "nest-realty-demo",
    "firstName": "Dessie",
    "lastName": "Greene",
    "displayName": "Dessie Greene",
    "email": "dessie.greene@nestrealty.com",
    "phone": "(980) 295-9805",
    "title": "Broker-MAC Real Estate",
    "role": "Broker-MAC Real Estate",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_maradith_brown_66",
    "workspaceId": "nest-realty-demo",
    "firstName": "Maradith",
    "lastName": "Brown",
    "displayName": "Maradith Brown",
    "email": "maradithbrown@gmail.com",
    "phone": "(910) 777-8259",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_matt_archibald_67",
    "workspaceId": "nest-realty-demo",
    "firstName": "Matt",
    "lastName": "Archibald",
    "displayName": "Matt Archibald",
    "email": "mjarchibald93@gmail.com",
    "phone": "(704) 437-3457",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_bradley_farrell_68",
    "workspaceId": "nest-realty-demo",
    "firstName": "Bradley",
    "lastName": "Farrell",
    "displayName": "Bradley Farrell",
    "email": "bfarrell@nestrealty.com",
    "phone": "(910) 444-1838",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_lindsay_barbour_69",
    "workspaceId": "nest-realty-demo",
    "firstName": "Lindsay",
    "lastName": "Barbour",
    "displayName": "Lindsay Barbour",
    "email": "lindsay.barbour@nestrealty.com",
    "phone": "(336) 263-8008",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_heather_ashworth_70",
    "workspaceId": "nest-realty-demo",
    "firstName": "Heather",
    "lastName": "Ashworth",
    "displayName": "Heather Ashworth",
    "email": "heather.ashworth@nestrealty.com",
    "phone": "(252) 903-9810",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_alec_hutchinson_71",
    "workspaceId": "nest-realty-demo",
    "firstName": "Alec",
    "lastName": "Hutchinson",
    "displayName": "Alec Hutchinson",
    "email": "alhutchi@gmail.com",
    "phone": "(703) 935-9304",
    "title": "Referral Based agent",
    "role": "Referral Based agent",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_heather_lane_72",
    "workspaceId": "nest-realty-demo",
    "firstName": "Heather",
    "lastName": "Lane",
    "displayName": "Heather Lane",
    "email": "hklane@gmail.com",
    "phone": "(910) 471-1917",
    "title": "Referral Based agent",
    "role": "Referral Based agent",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "needs_review",
    "tags": [
      "mayfaire",
      "agent",
      "source-marked-x"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_kristin_sorokti_73",
    "workspaceId": "nest-realty-demo",
    "firstName": "Kristin",
    "lastName": "Sorokti",
    "displayName": "Kristin Sorokti",
    "email": "kristin@nestrealty.com",
    "phone": "6/18/2026",
    "title": "Broker",
    "role": "Broker",
    "personType": "agent",
    "officeIds": [
      "carolina_beach"
    ],
    "officeNames": [
      "Carolina Beach"
    ],
    "primaryOfficeId": "carolina_beach",
    "primaryOfficeName": "Carolina Beach",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "carolina-beach",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_todd_whalen_74",
    "workspaceId": "nest-realty-demo",
    "firstName": "Todd",
    "lastName": "Whalen",
    "displayName": "Todd Whalen",
    "email": "todd.whalen@nestrealty.com",
    "phone": "3/30/2026",
    "title": "Assistant",
    "role": "Assistant",
    "personType": "assistant",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "assistant",
      "email-only"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  },
  {
    "id": "dir_ryan_rhodes_75",
    "workspaceId": "nest-realty-demo",
    "firstName": "Ryan",
    "lastName": "Rhodes",
    "displayName": "Ryan Rhodes",
    "email": "ryan.rhodes@nestrealty.com",
    "phone": "(401) 374-7002",
    "title": "Debbie L. Team",
    "role": "Debbie L. Team",
    "personType": "agent",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Mayfaire",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "agent"
    ],
    "source": "nest_2026_agents_sheet",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-07-29T21:44:07.600Z"
  }
];
