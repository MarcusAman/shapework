export interface DirectorySeedPerson {
  id: string;
  workspaceId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  name?: string;
  office?: string;
  email: string;
  secondaryEmail?: string;
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
  headshotUrl?: string;
  basecampPersonId?: string;
  officeAddress?: string;
  blackSignatureUrl?: string;
  whiteSignatureUrl?: string;
  licenseNumber?: string;
  licenseState?: string;
  team?: string;
  isBIC?: boolean;
  isTeamLeader?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const NEST_FULL_ROSTER_77: DirectorySeedPerson[] = [
  {
    "id": "dir_chris_brown_0",
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
    "firstName": "Ryan",
    "lastName": "Crecelius",
    "displayName": "Ryan Crecelius",
    "email": "ryan@nestrealty.com",
    "phone": "(910) 409-7120",
    "title": "Owner",
    "role": "Owner",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
    "firstName": "Ann",
    "lastName": "Gunn",
    "displayName": "Ann Gunn",
    "email": "ann@nestrealty.com",
    "phone": "(910) 540-3965",
    "title": "ATC (Air Traffic Controller) & Operations Lead",
    "role": "Operations Lead",
    "personType": "staff",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Nest Realty Mayfaire",
    "officeAddress": "990 Inspiration Drive, Wilmington, NC 28405",
    "headshotUrl": "https://bc3-production-assets-cdn.basecamp-static.com/4351808/people/BAhpBB9etAE=--3d47704783baee4944e5a87fb441a6c5d0f450b1/avatar",
    "basecampPersonId": "BAhpBB9etAE",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "staff",
      "atc",
      "operations_lead",
      "vendor_lead"
    ],
    "source": "nest_basecamp_sync",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-08-19T10:37:00.000Z"
  },
  {
    "id": "dir_julie_carpenter_29",
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
    "firstName": "Melissa",
    "lastName": "Gagliardi",
    "displayName": "Melissa Gagliardi",
    "email": "melissa.gagliardi@nestrealty.com",
    "phone": "(919) 219-2085",
    "title": "Marketing Project Manager",
    "role": "Marketing Lead",
    "personType": "staff",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Nest Realty Mayfaire",
    "officeAddress": "990 Inspiration Drive, Wilmington, NC 28405",
    "headshotUrl": "https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/profile_pictures/12880160/original/17960f93-1f62-4960-8df0-b779db38cc46.png?1775143923",
    "blackSignatureUrl": "https://nest.maxadesigns.com/api/v1/blobs/proxy/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBbWdkIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--ed2a6fd02db201ba17df0f5f0895a5a0988b6709/file.png",
    "whiteSignatureUrl": "https://nest.maxadesigns.com/api/v1/blobs/proxy/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBbWtkIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--5d1143e4c6afc26029e27fb834704f50265803e2/file.png",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "staff",
      "marketing_lead",
      "maxa_admin"
    ],
    "source": "nest_maxa_design_center",
    "createdAt": "2026-07-29T21:44:07.600Z",
    "updatedAt": "2026-08-19T10:05:00.000Z"
  },
  {
    "id": "dir_brian_donovan_34",
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
    "firstName": "Desiree",
    "lastName": "Whalen",
    "displayName": "Desiree Whalen",
    "email": "desiree.whalen@nestrealty.com",
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
    "updatedAt": "2026-07-29T21:44:07.600Z",
    "secondaryEmail": "Desiree@whalenteamrealty.com"
  },
  {
    "id": "dir_cindy_young_43",
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
    "firstName": "Meghan",
    "lastName": "Bowes Alber",
    "displayName": "Meghan Bowes Alber",
    "email": "meghan.alber@nestrealty.com",
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
    "updatedAt": "2026-07-29T21:44:07.600Z",
    "secondaryEmail": "closings@coasttoclose.com"
  },
  {
    "id": "dir_mcclain_harvey_45",
    "workspaceId": "ws_wilmington",
    "firstName": "McClain",
    "lastName": "Harvey",
    "displayName": "McClain Harvey",
    "email": "mcclain.harvey@nestrealty.com",
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
    "updatedAt": "2026-07-29T21:44:07.600Z",
    "secondaryEmail": "mcclain.miles@gmail.com"
  },
  {
    "id": "dir_renee_reitzel_46",
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
    "firstName": "Laura",
    "lastName": "O'Dorisio",
    "displayName": "Laura O'Dorisio",
    "email": "laura.odorisio@nestrealty.com",
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
    "updatedAt": "2026-07-29T21:44:07.600Z",
    "secondaryEmail": "laura.odorisio@gmail.com"
  },
  {
    "id": "dir_sean_martin_55",
    "workspaceId": "ws_wilmington",
    "firstName": "Sean",
    "lastName": "Martin",
    "displayName": "Sean Martin",
    "email": "sean.martin@nestrealty.com",
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
    "updatedAt": "2026-07-29T21:44:07.600Z",
    "secondaryEmail": "sean@whalenteamrealty.com"
  },
  {
    "id": "dir_hannah_delacourtsmith_56",
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
    "firstName": "Maradith",
    "lastName": "Brown",
    "displayName": "Maradith Brown",
    "email": "maradith.brown@nestrealty.com",
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
    "updatedAt": "2026-07-29T21:44:07.600Z",
    "secondaryEmail": "maradithbrown@gmail.com"
  },
  {
    "id": "dir_matt_archibald_67",
    "workspaceId": "ws_wilmington",
    "firstName": "Matt",
    "lastName": "Archibald",
    "displayName": "Matt Archibald",
    "email": "matt.archibald@nestrealty.com",
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
    "updatedAt": "2026-07-29T21:44:07.600Z",
    "secondaryEmail": "mjarchibald93@gmail.com"
  },
  {
    "id": "dir_bradley_farrell_68",
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
    "firstName": "Alec",
    "lastName": "Hutchinson",
    "displayName": "Alec Hutchinson",
    "email": "alec.hutchinson@nestrealty.com",
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
    "updatedAt": "2026-07-29T21:44:07.600Z",
    "secondaryEmail": "alhutchi@gmail.com"
  },
  {
    "id": "dir_heather_lane_72",
    "workspaceId": "ws_wilmington",
    "firstName": "Heather",
    "lastName": "Lane",
    "displayName": "Heather Lane",
    "email": "heather.lane@nestrealty.com",
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
    "updatedAt": "2026-07-29T21:44:07.600Z",
    "secondaryEmail": "hklane@gmail.com"
  },
  {
    "id": "dir_kristin_sorokti_73",
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
    "workspaceId": "ws_wilmington",
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
  },
  {
    "id": "dir_eduardo_lovo_73",
    "workspaceId": "ws_wilmington",
    "firstName": "Eduardo",
    "lastName": "Lovo",
    "displayName": "Eduardo Lovo",
    "email": "eduardo.lovo@nestrealty.com",
    "phone": "(910) 507-2047",
    "title": "Virtual Assistant & Marketing Production",
    "role": "Virtual Assistant",
    "personType": "staff",
    "officeIds": [
      "mayfaire"
    ],
    "officeNames": [
      "Mayfaire"
    ],
    "primaryOfficeId": "mayfaire",
    "primaryOfficeName": "Nest Realty Mayfaire",
    "officeAddress": "990 Inspiration Drive, Wilmington, NC 28405",
    "headshotUrl": "https://bc3-production-assets-cdn.basecamp-static.com/4351808/people/BAhpBEi%2FJQM=--56e9a4f0579d2ebea9c9537c5c84e336d8c2108e/avatar",
    "basecampPersonId": "BAhpBEi%2FJQM",
    "isBrokerInCharge": false,
    "status": "active",
    "tags": [
      "mayfaire",
      "staff",
      "va",
      "production"
    ],
    "source": "nest_basecamp_sync",
    "createdAt": "2026-08-19T10:37:00.000Z",
    "updatedAt": "2026-08-19T10:37:00.000Z"
  }
];

export const NEST_FULL_ROSTER_72: DirectorySeedPerson[] = NEST_FULL_ROSTER_77;
