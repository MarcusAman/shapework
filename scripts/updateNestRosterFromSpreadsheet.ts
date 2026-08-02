/**
 * Helper script to update server/persistence/nestRosterSeed.ts from the user's spreadsheet.
 */

import fs from 'fs';
import path from 'path';

const RAW_TSV = `
	8/20/1998		364882	910-581-4705	Chris Brown	chris.brown@nestrealty.com	PB	Mayfaire	318 Long Pond Dr.	Sneads Ferry, NC 28460	
	1/7/2020	579507479	268269	910-547-2106	Jennifer Young	jy@nestrealty.com	Fresh Nest RE - Leader	Mayfaire	633 Tanbridge Road	Wilmington, NC 28403	8/1/2014
	1/29/2020	579512004	226738	910-297-4789	Mary Kaye Hester	marykaye@nestrealty.com	Broker	Carolina Beach	1505 Drill Shell	Carolina Beach, NC 28428	1/21/2019
	2/12/2020	579512141	302840	803-319-1988	Abby Harris	abby.harris@nestrealty.com	Broker	Carolina Beach	1218 Snapper Ln. Unit B	Carolina Beach, NC 28428	4/1/2020
	2/20/2020	579507371	267168	910-290-5458	Matt Costin	matt.costin@nestrealty.com	The Costin Group - Leader	Mayfaire	346 Pemberton Dr	Wilmington, NC 28412	2/10/2020
	2/23/2020	579509096	278908	910-367-2253	Eric Knight	eric@nestrealty.com	BIC - Wilmington Office	Mayfaire	3512 Iris St.	Wilmington, NC 28409	9/11/2014
	3/4/2020	579505870	251995	910-409-7120	Ryan Crecelius	ryan@nestrealty.com	OWNER	Mayfaire	910 Johns Orchard Ln.	Wilmington, NC 28411	9/10/2014
	3/21/2020	-579509801	283146	910-200-3028	Allison Donovan	allison.donovan@nestrealty.com	Broker	Carolina Beach	903 S Carolina Ave	Carolina Beach, NC 28428	3/9/2020
	3/21/2020	579504768	226854	910-368-1507	Jessica Keenan	jessica.keenan@nestrealty.com	BIC - Carolina Beach office	Carolina Beach	500 Clarendon	Carolina Beach, NC 28428	8/24/2018
	3/24/2020	579510012	286749	704-718-5388	Merritt Anderson Crawley	merritt@nestrealty.com	MAC Real Estate- Leader	Mayfaire	17 Draft Line Court	Hampstead, NC 28443	5/7/2020
	4/8/2020	579505755	232826	910-612-8283	Matt Orr	matt.orr@nestrealty.com	Broker	Mayfaire	1916 Wolcott Ave	Wilmington, NC 28403	7/23/2019
	4/9/2020			910-617-8264	James Fort	james.fort@nestrealty.com		Mayfaire	8132 Saltcedar Dr.	Wilmington, NC 28411	10/12/2020
	4/12/2020	579510540	151537	910-367-1832	Tricia Keane	tricia.keane@nestrealty.com	Broker	Carolina Beach	124 Walnut St. Unit 508	Wilmington, NC 28401	12/1/2018
	5/2/2020	579512485	304623	336-972-6926	Caroline Holman	caroline.holman@nestrealty.com	Broker - Costin Real Estate	Mayfaire	322 Lonicera Ct	Wilmington, NC 28411	2/10/2020
	5/11/2020	579504900	238211	910-231-2337	Andrew Kelly	andrew.kelly@nestrealty.com	Broker	Mayfaire	5127 Nicholas Creek Circle	Wilmington, NC 28409	2/24/2020
x	5/17/2020	196548817	285167	910-233-7455	Michelle Taylor	michelle.taylor@nestrealty.com	Broker - Barbee Group Realty	Mayfaire	7505 Anaca Point Road	Wilmington, NC 28411	9/4/2020
	5/26/2020	579509342	284118	910-685-0988	Ashley Whitley	Ashley.whitley@nestrealty.com	Broker	Mayfaire	8919 New Forest	Wilmington, NC 28411	1/18/2019
	5/28/2020	196564821	305930	910-508-6028	Lexi Barbee	lexi.barbee@nestrealty.com	Barbee Group Realty-Leader	Mayfaire	112 Long Leaf Drive	Leland, NC 28451	9/4/2020
	5/29/2020	579505995	253305	910-622-0319	Nilesh Jethwa	Nilesh@nestrealty.com	Jethwa Real Estate - Leader	Mayfaire	314 RL Honeycutt Dr.	Wilmington, NC 28412	1/28/2019
	6/17/2020	579506125	237976	910-726-4140	Kathy Greer	kathy.greer@nestrealty.com	Broker	Carolina Beach	9403 Voyagers Way	Wilmington, NC 28412	11/29/2018
	7/5/2020	579510387	291392	910-524-3323	Beth Starkey	beth.starkey@nestrealty.com	Broker	Mayfaire	1220 Pandion Dr.	Wilmington, NC 28411	8/16/2019
	7/30/2020	261073419	278630	910-352-7487	Debbie Lariviere	debbie.lariviere@nestrealty.com	Broker	Mayfaire	3205 Snowberry Ct	Wilmington, NC 28409	11/22/2019
	8/24/2020	579509877	285645	910-515-2031	Molly Tilyou	molly.tilyou@nestrealty.com	Broker	Mayfaire	7600 Cazaux	Wilmington, NC 28409	5/25/2018
	8/27/2020	579510336	289363	910-604-4158	Renata Kuperus	renata@nestrealty.com	Broker - Jethwa Real Estate	Mayfaire	106 Sea Turtle Ln., Hampstead NC 28443	Hampstead NC 28443	1/28/2019
	9/5/2020	579510530	290131	910-470-3456	Dan Barentine	dan.barentine@nestrealty.com	Broker	Mayfaire	1501 Lamplighter Way	Wilmington, NC 28403	7/8/2016
	9/8/2020	579505444	242159	910-409-9358	Mary Rayner	mary@nestrealty.com	Broker - Fresh Nest	Mayfaire	367 Heartwood Drive	Winnabow, NC 28479	1/15/2019
x	9/9/2020	579511173	167133	910-367-1831	Donald Wagner	Tricia's assistant/broker		Carolina Beach	124 Walnut St. Unit 508	Wilmington, NC 28401	12/1/2018
	9/11/2020	579513041	310852	404-915-5731	Pam Fox	pam.fox@nestrealty.com	Broker	Mayfaire	5115 Partha Ln.	Wilmington, NC 28409	4/2/2019
	10/23/2020			910-540-3965	Ann Gunn	ann@nestrealty.com	Admin	Mayfaire	1208 Anchors Bend Way	Wilmington, NC 28411	12/3/2015
	11/25/2020	579509420	293727	910-471-9411	Julie Carpenter	julie.carpenter@nestrealty.com	Broker	Mayfaire	4520 Mockingbird Lane	Wilmington, NC 28409	4/16/2019
	12/20/2020	579510791	294058	910-530-0843	Michael Urti	michael.urti@nestrealty.com	Urti Real Estate- Leader	Carolina Beach	513 Monroe Ave.	Carolina Beach, NC 28428	2/10/2020
	2/1/2021	579503973	216769	910-617-0684	Alicia Devereaux	aliciad@nestrealty.com	Broker	Carolina Beach	798 North Shore	Southport, NC 28461	8/27/2021
	4/26/2021	579513259	312448	910-800-1930	Sarah Finnegan	Sarah.finnegan@nestrealty.com	Broker	Carolina Beach	302 Erinshire Ct	Wilmington, NC 28412	3/23/2021
	7/31/2021			919.219.2085	Melissa Gagliardi	melissa.gagliardi@nestrealty.com	Admin	Mayfaire	18 Tillage Way	Wilmington, NC 28411	5/1/2021
email only	11/28/2021	579515247	325352	910-431-3102	Brian Donovan	brian.donovan@nestrealty.com	Broker - Donovan RE	Carolina Beach	903 S Carolina Ave	Carolina Beach, NC 28428	4/15/2021
	12/2/2021	579504834	226246	910-232-5943	Lexi Pate	lexi.pate@nestrealty.com	Broker	Carolina Beach	609 Fayetteville Ave	Carolina Beach, NC 28428	6/4/2021
	2/19/2023	579509949	285287	910.368.1222	Teri Byrnes	teri.byrnes@nestrealty.com	Broker	Carolina Beach	925 Coastwalk ln	Carolina Beach NC 28428	1/7/1900
	8/14/2023	579516721	342859	919.757.4231	Travis Hollomon	travis.hollomon@nestrealty.com	Broker- MAC Real Estate	Hampstead	42 Misty Lakes	Hampstead NC 28443	
	8/21/2023	579513310	307860	910.200.3960	Kristy Ward	kristy.ward@nestrealty.com	Broker	Mayfaire	6602 Wheatfields Ct	Wilmington, NC 28411	12/18/2023
	1/16/2024	579510925	294881	910.523.6235	Thurston Dawson	thurston@nestrealty.com	Broker	Mayfaire	2076 Harrison St.	Wilmington, NC 28411	jj./j
	10/9/2024		294258	336-817-2672	Katie Urti	katie.urti@nestrealty.com	Broker - Urti Coastal real Estate	Carolina Beach			
	10/13/2024	570011103	328096	910-515-1785	Clint Harris	clint.harris@nestrealty.com	Broker	Carolina Beach	1218 Snapper Ln. Unit B		
	1/5/2025	579504944	230918	910-620-7594	Desiree Whalen	Desiree@whalenteamrealty.com	The Whalen Team	Mayfaire	7111 Orchard Trace	Wilmington, NC 28409	
	1/7/2025	550005831	296943	910-789-0871	Cindy Young	cindy.young@nestrealty.com	Broker	Mayfaire	6905 Finian Dr.	Wilmington, NC 28409	4/1/2021
	1/7/2025		305343	843-789-9579	Meghan Bowes Alber	closings@coasttoclose.com	Coast to Close	Home	904 Seven Oaks Dr.	Wilmington, NC 28411	4/1/2021
	2/19/2025	579518173	357836	980.234.3515	McClain Harvey	mcclain.miles@gmail.com	Broker	Hampstead	917 Dickens Dr.	Wilmington, NC 28405	
	3/6/2025	579511909	301697	910.368.1804	Renee Reitzel	renee.reitzel@nestrealty.com	Broker	Carolina Beach	701 Carolina Beach Ave N	Carolina Beach, NC 28428	1/9/1900
	3/13/2025	579516338	340361	865-985-4802	Alexis Roy	alexis.roy@nestrealty.com	Broker - Urti Coastal Real Estate	Carolina Beach	711 Grand Banks Dr.	Wilmington, NC 28412	8/1/2022
	5/8/2025	579511865	301382	910-297-1758	Dawn Lagomarsino	dawnlago@nestrealty.com	Broker	Carolina Beach	1367 Tidalwalk	Wilmington, NC 28412	12/7/2022
	5/8/2025	579510622	292186	336-327-5456	Jessie Fairbairn	jessie.fairbairn@nestrealty.com	Broker	Mayfaire	128 Northern Blvd	Wilmington, NC 28401	5/5/2022
	5/20/2025	641570861	339007		Donna Neyland	donna.lomenzo@nestrealty.com	Broker	Carolina Beach	45 Pentmoor Dr.	Mastic, NY 11950	
	5/23/2025	579512866	309117	(910) 833-4807	Sydney Tobler	sydney.tobler@nestrealty.com	Broker	Mayfaire	6513 Lipscomb Drive	Wilmington, NC 28412	12/2/2024
	7/12/2025	579518131		910.512.7434	James Rackley	james.rackley@nestrealty.com	Broker	Mayfaire	2304 Blyth Rd.	Wilmington, NC 28403	12.1.24
	7/26/2025			804-512-4866	Cassie Healy	Cassie.healy@nestrealty.com	Urti Real Estate	Carolina Beach	913 Adelaide Dr.	Wilmington, NC 28412	8/11/2023
	10/12/2025	579516786	344681	910-599-4114	Laura O'Dorisio	laura.odorisio@gmail.com	Broker	Mayfaire	1114 Crest Port Lp Unit 107	Belville, NC 28451	12/12/2024
	10/26/2025	579516693	343721	910-833-1098	Sean Martin	sean@whalenteamrealty.com	Broker	Mayfaire	319 Arboretum Dr. #103	Wilmington, NC 28405	10/20/2025
	12/31/2025	579511686	298702	919-819-2740	Hannah Delacourt Smith	hannah.smith@nestrealty.com	Broker	Hampstead	18 Ransom Dr.	Hampstead, NC 28443	3/18/2022
	1/7/2026	579517355	350015	910-777-4187	Mia Escalera	mia.escalera@nestrealty.com	Broker	Mayfaire	9 N. 7th St	Wilmington, NC 28401	4/15/2026
	1/17/2026	579502259		910-279-4663	Ed Wagenseller	ed.wagenseller@nestrealty.com	Broker	Mayfaire	230 Hooker Rd.	Wilmington, NC 28403	
	2/19/2026	579518125		910-591-6157	Jordan Warren	jordan.warren@nestrealty.com	Broker	Mayfaire	133 Tanbridge Rd,	Wilmington, NC 28405	
	4/22/2026				Lindsay Crecelius	lindsay.crecelius@nestrealty.com	Admin	Mayfaire			
	5/24/2026	579518144			Max Wagenseller	max.wagenseller@nestrealty.com	Broker-Wagenseller team	Mayfaire			
	6/6/2026	579517437	349968	910-612-8125	Amanda Galante	amanda.galante@nestrealty.com	Broker	Carolina Beach	224 Golden Rd.	Wilmington, NC 28409	
	6/17/2026	579517791			Zach Hanner	zach.hanner@nestrealty.com	Broker	Mayfaire			
	9/9/2026		234325		Andra Browning	andra.browning@nestrealty.com	Broker	Mayfaire	5395 Potterfield Rd NE	Winnabow, NC 28479	
	9/10/2026		366245	980-295-9805	Dessie Greene	dessie.greene@nestrealty.com	Broker-MAC Real Estate	Mayfaire	196 Oakdale Rd.	Southport, NC 28461	
	1.16.81	579510491	290547	910.777.8259	Maradith Brown	maradithbrown@gmail.com	Broker	Mayfaire	158 Partridge Rd.	Wilmington, NC 28412	10/31/2024
	12.21.93	554040947		704.437.3457	Matt Archibald	mjarchibald93@gmail.com	Broker	Mayfaire	1602 Ann St.	Wilmington, NC 28401	11/4.24
	12.30.88	579511620	297738	910-444-1838	Bradley Farrell	bfarrell@nestrealty.com	Broker	Mayfaire	563 Greenock Ct	Shallotte, NC 28470	9.22.23
	2.11.88	579510257	319930	336-263-8008	Lindsay Barbour	lindsay.barbour@nestrealty.com	Broker	Mayfaire	7205 Lounsberry Ct	Wilmington, NC 28405	5/31/2024
	8.22.89	579513722	317183	252.903-9810	Heather Ashworth	heather.ashworth@nestrealty.com	Broker	Mayfaire	3406 Talom Ct	Wilmington, NC 28409	1/8/1900
			339550	703-935-9304	Alec Hutchinson	alhutchi@gmail.com	Referral Based agent	Mayfaire	5429 Whaler Way, Wilmington NC 28409		11/2/1983
x			346642	910-471-1917	Heather Lane	hklane@gmail.com	Referral Based agent	Mayfaire	1289 Libery Landing Rd.	Winnabow, NC 28479	
	6/18/2026				Kristin Sorokti	kristin@nestrealty.com	Broker	Carolina Beach	220 Silver sloop Way	Carolina Beach, NC 28428	
email only	3/30/2026				Todd Whalen	todd.whalen@nestrealty.com	Assistant	mayfaire	7111 Orchard Trace	Wilmington, NC 28409	
		579512973	310085	401-374-7002	Ryan Rhodes	ryan.rhodes@nestrealty.com	Debbie L. Team	Mayfaire	3208 Snowberry	Wilmington, NC 28412	
`;

function parsePhone(raw: string) {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  return raw.trim();
}

function parseName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function normalizeOffice(raw: string) {
  const r = (raw || '').toLowerCase().trim();
  if (r.includes('carolina')) return 'Carolina Beach';
  if (r.includes('hampstead')) return 'Hampstead';
  if (r.includes('home')) return 'Remote / Home';
  return 'Mayfaire';
}

function determineRoleType(rawRole: string) {
  const r = (rawRole || '').toLowerCase().trim();
  if (r.includes('owner')) return { title: 'Principal Broker / Owner', role: 'Owner / Regional Leader', personType: 'leadership', isBIC: false };
  if (r.includes('bic')) return { title: 'Broker-in-Charge', role: 'Broker-in-Charge', personType: 'leadership', isBIC: true };
  if (r.includes('admin') || r.includes('coast to close')) return { title: rawRole || 'Admin', role: rawRole || 'Admin', personType: 'staff', isBIC: false };
  if (r.includes('assistant')) return { title: rawRole || 'Assistant', role: rawRole || 'Assistant', personType: 'assistant', isBIC: false };
  return { title: rawRole || 'Broker', role: rawRole || 'Broker', personType: 'agent', isBIC: false };
}

const lines = RAW_TSV.split('\n').filter(l => l.trim().length > 0);

const people = lines.map((line, idx) => {
  const tokens = line.split('\t').map(c => c.trim()).filter(Boolean);
  if (tokens.length === 0) return null;

  // Find email token
  const emailIdx = tokens.findIndex(t => t.includes('@'));
  if (emailIdx === -1) {
    // If no email, check if there's a name
    const nameIdx = tokens.findIndex(t => /^[A-Z][a-z]+ [A-Z][a-z]+/.test(t));
    if (nameIdx === -1) return null;
    const nameRaw = tokens[nameIdx];
    const { firstName, lastName } = parseName(nameRaw);
    const roleRaw = tokens[nameIdx + 1] || 'Broker';
    const officeRaw = tokens[nameIdx + 2] || 'Mayfaire';
    const officeName = normalizeOffice(officeRaw);
    const officeId = officeName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const roleMeta = determineRoleType(roleRaw);
    const id = `dir_${firstName.toLowerCase()}_${lastName.toLowerCase()}_${idx}`;
    return {
      id,
      workspaceId: 'nest-realty-demo',
      firstName,
      lastName,
      displayName: nameRaw,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@nestrealty.com`,
      phone: '(910) 555-0100',
      title: roleMeta.title,
      role: roleMeta.role,
      personType: roleMeta.personType,
      officeIds: [officeId],
      officeNames: [officeName],
      primaryOfficeId: officeId,
      primaryOfficeName: officeName,
      isBrokerInCharge: roleMeta.isBIC,
      status: 'active',
      tags: [officeName.toLowerCase().replace(/\s+/g, '-'), roleMeta.personType],
      source: 'nest_2026_agents_sheet',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  const emailRaw = tokens[emailIdx];
  const nameRaw = tokens[emailIdx - 1] || 'Agent';
  const phoneRaw = emailIdx >= 2 && /\d{3}/.test(tokens[emailIdx - 2]) ? tokens[emailIdx - 2] : '';
  const roleRaw = tokens[emailIdx + 1] || 'Broker';
  const officeRaw = tokens[emailIdx + 2] || 'Mayfaire';

  const { firstName, lastName } = parseName(nameRaw);
  const phone = parsePhone(phoneRaw);
  const officeName = normalizeOffice(officeRaw);
  const officeId = officeName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const roleMeta = determineRoleType(roleRaw);

  const isMarkedX = line.trim().startsWith('x');
  const status = isMarkedX ? 'needs_review' : 'active';
  const id = `dir_${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${idx}`;

  const tags = [officeName.toLowerCase().replace(/\s+/g, '-'), roleMeta.personType];
  if (roleMeta.isBIC) tags.push('bic');
  if (isMarkedX) tags.push('source-marked-x');
  if (line.includes('email only')) tags.push('email-only');

  return {
    id,
    workspaceId: 'nest-realty-demo',
    firstName,
    lastName,
    displayName: nameRaw,
    email: emailRaw,
    phone: phone || '(910) 555-0100',
    title: roleMeta.title,
    role: roleMeta.role,
    personType: roleMeta.personType,
    officeIds: [officeId],
    officeNames: [officeName],
    primaryOfficeId: officeId,
    primaryOfficeName: officeName,
    isBrokerInCharge: roleMeta.isBIC,
    status,
    tags,
    source: 'nest_2026_agents_sheet',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}).filter(Boolean);

console.log(`Parsed ${people.length} directory people cleanly.`);

const fileContent = `export interface DirectorySeedPerson {
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

export const NEST_FULL_ROSTER_72: DirectorySeedPerson[] = ${JSON.stringify(people, null, 2)};
`;

fs.writeFileSync(path.join(process.cwd(), 'server/persistence/nestRosterSeed.ts'), fileContent, 'utf-8');
console.log('Successfully updated server/persistence/nestRosterSeed.ts!');
