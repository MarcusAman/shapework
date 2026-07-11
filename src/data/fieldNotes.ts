export interface FieldNote {
  id: string;
  slug: string;
  title: string;
  date: string;
  author: string;
  readingTime: string;
  summary: string;
  content: string; // Markdown format
}

export const fieldNotes: FieldNote[] = [
  {
    id: "fn_1",
    slug: "why-owners-become-the-human-middleware",
    title: "Why Owners Become the Human Middleware",
    date: "June 15, 2026",
    author: "Matt Orr",
    readingTime: "5 min read",
    summary: "As a business scales, communication overhead explodes. Without a structured workflow layer, the founder or owner becomes the default routing engine for every request, document, and notification.",
    content: `When a business is small—say, under five people—operations are simple. Everyone sits in the same room or the same Slack channel. Information moves through ambient awareness. If a contract is signed, everyone knows. If an agent needs a lockbox, they grab one.

But as you scale past ten, fifteen, or thirty employees, this high-fidelity ambient communication collapses. 

In its place, communication channels multiply exponentially. An owner-led business starts receiving requests through SMS, group chats, email threads, direct phone calls, and hallway conversations. 

Without an operating layer to catch and structure these incoming signals, a dangerous pattern emerges: **the owner becomes the human middleware.**

### The Middleware Trap

What does human middleware look like? 
* You spend your morning forwarding emails from Title companies to Transaction Coordinators.
* You spend your afternoon answering text messages from agents asking if a lockbox has been ordered yet.
* You spend your evening reviewing spreadsheets to make sure commission payouts match contract intakes.
* You are the only person who can verify if a file is truly complete, because the operating history lives entirely in your memory.

You are not running a business; you are routing traffic. You are acting as a human network switch, translating messy, unstructured requests from one person into tasks for another.

This is exhausting, but more importantly, it is highly vulnerable. The moment the owner steps away, operations grind to a halt. Important details slip through the cracks. Decisions are made from memory instead of records.

### The Solution: An Operating Layer Above the Tools

The solution is not to buy another CRM or hire more coordinators. The solution is to separate *communication* from *operations*.

A request desk must sit in front of the team. When an agent requests a sign or a client asks for an update, the signal must be immediately classified, structured, and routed to the person who owns that workflow. 

The system should alert the owner only when a genuine exception occurs—a compliance risk, a critical deadline miss, or a formal approval gate. 

If you don't build an operating layer to route work, you will spend the rest of your career routing it yourself.`
  },
  {
    id: "fn_2",
    slug: "why-ai-fails-when-the-workflow-is-broken",
    title: "Why AI Fails When the Workflow is Broken",
    date: "June 2, 2026",
    author: "Adam LeMire",
    readingTime: "6 min read",
    summary: "Adding artificial intelligence to a chaotic business process doesn't fix the process—it just makes mistakes happen faster. Here is why workflow design must precede AI implementation.",
    content: `Every business owner is being told to adopt AI. Tech consultants promise that adding a chatbot or an autonomous agent will instantly automate your operations and save hundreds of hours.

They are selling a fantasy.

If you introduce AI into a workflow that is unstructured, poorly documented, and relies on human memory, you will not get automation. You will get accelerated chaos.

### The Garbage In, Garbage Out Reality

AI is a reasoning engine, not a magic wand. To make a decision, an AI agent needs two things: structured inputs and clear rules of ownership.

Consider a common real estate brokerage problem: closing compliance. If your transaction coordinators are chasing agents for missing lead paint disclosures via personal text messages, and storing files in a mix of Google Drive, desktop folders, and local email client archives, how can an AI possibly help?

If you point an AI agent at that mess, it will:
* Send the wrong reminders to the wrong agents because it doesn't know which email is the source of truth.
* Fail to verify if a document is actually complete because the signature lines are non-standard.
* Generate dozens of false-positive warnings, leading to "alert fatigue" and causing your staff to turn the system off entirely.

AI fails because the underlying workflow has no *shape*. There are no clear boundaries, no standardized handoffs, and no structured inputs.

### Workflow Design First, AI Second

At shapework., we believe in **AI only where it earns its place.**

Before we write a single line of automation code or connect an LLM, we document the workflow as it exists today. We look at the friction points: Where does work stall? Who owns the handoff? What information is required to move to the next stage?

Only after we have designed a clean, structured, and repeatable process do we introduce AI. 

In a clean workflow, AI is highly effective. It doesn't run the show; it handles the predictable, high-volume classification tasks:
1. It reads an inbound email from a lender, classifies it as a financing milestone, and extracts the commitment date.
2. It checks if the title folder contains the corresponding PDF.
3. It drafts a response to the agent, which a human coordinator reviews and approves in one click.

By placing AI inside a well-designed workflow, you get calm operations. By placing AI inside a broken workflow, you get expensive noise.`
  },
  {
    id: "fn_3",
    slug: "what-an-operating-layer-actually-does",
    title: "What an Operating Layer Actually Does",
    date: "May 18, 2026",
    author: "Matt Orr",
    readingTime: "4 min read",
    summary: "Most businesses suffer from software fatigue. They don't need another application. They need an operating layer that sits above their existing tools to coordinate how work moves.",
    content: `If you audit a growing professional services firm or real estate brokerage, you will find an average of 8 to 12 software subscriptions running simultaneously.

You'll see a CRM (like HubSpot or kvCORE), a transaction platform (like SkySlope or DocuSign), a bookkeeping tool (like QuickBooks), communication platforms (Gmail, Slack, Twilio), and task managers (Asana or Trello).

And yet, despite all this software, the team is still stressed, files are still missing, and the owner is still constantly interrupted.

Why? Because these tools don't talk to each other in a meaningful way. They are databases, not workflows. They hold information, but they do not move work.

This is where an **operating layer** comes in.

### The Bridge Between Databases and Behavior

An operating layer is not a replacement for your existing tools. It is the system that coordinates them. It sits above your CRMs, email accounts, and file systems, acting as the workflow memory and air traffic controller.

Here is the difference in practice:

| Without an Operating Layer | With an Operating Layer (shapework.) |
| :--- | :--- |
| An agent emails a contract to the office. The admin has to open SkySlope, create a folder, manually copy data, and then email the TC. | The system detects the contract via email, parses key dates, automatically syncs it to SkySlope, and queues an intake checklist for approval. |
| A transaction coordinator checks files weekly to find missing disclosures, then texts agents individually. | The system monitors files in the background, detects missing documents, and generates a secure upload link for the agent automatically. |
| The owner has to ask three different people to find out if the brokerage is on track to hit its monthly revenue goals. | The system tracks deal volume and compliance risks in real-time, surfacing only exceptions and final approvals to the owner. |

### Less Software, Not More

Building an operating layer actually allows you to use *less* software. You don't need a custom client portal, a separate task manager, and an automated text service. 

By unifying your operations into a single coordinate layer, you create a calm, unified cockpit. Your staff works out of a structured inbox, your agents interact via simple links, and your existing tools finally do the job you bought them for.`
  },
  {
    id: "fn_4",
    slug: "less-software-cleaner-operations",
    title: "Less Software. Cleaner Operations.",
    date: "May 5, 2026",
    author: "Adam LeMire",
    readingTime: "5 min read",
    summary: "The instinct when an operation starts leaking time is to buy a new software subscription. This is a mistake. Clean operations are built on design, not licenses.",
    content: `When a business owner feels like operations are slipping, their first instinct is almost always to search for a new software product. They look for "the CRM for real estate brokerages" or "the ultimate project manager for agencies."

They buy the subscription, spend three months onboarding the team, and then realize they have simply moved their problems from one screen to another.

The software industry has trained us to believe that operational problems are actually software problems. If work is falling through the cracks, it must be because we don't have the right tool.

This is false. Operational problems are **design problems**.

### Software Cannot Fix Behavior

Software is passive. It sits there, waiting for data entry. If your team doesn't have a habit of updating transaction statuses, a new software tool won't make them start. In fact, more complex software often leads to *less* compliance because the friction of data entry is higher.

When you add software to a messy operation, you create three new problems:
1. **Data Silos:** Client info is in the CRM, transaction docs are in the file system, and billing status is in the accounting tool.
2. **Context Switching:** Your staff spends half their day copying data from one screen to another.
3. **Subscription Bloat:** You pay hundreds of dollars a month for features you don't use, and your overhead margins shrink.

### Design the Handoff, Keep the Tools

Clean operations are built by looking at how work actually moves between people, not by buying licenses.

At shapework., we start by mapping the handoffs:
* How does a lead become an active client?
* How does a signed contract get reviewed for compliance?
* How does a closing document trigger a commission disbursement?

Once the handoffs are designed with clear rules, ownership, and timelines, we build the integration layer to make the new workflow stick. We use the tools you already have. We connect them behind the scenes so data flows automatically.

We don't want to sell you another subscription. We want to help you stop paying for the ones that aren't working.`
  },
  {
    id: "fn_5",
    slug: "what-we-keep-finding-inside-growing-businesses",
    title: "What We Keep Finding Inside Growing Businesses",
    date: "April 20, 2026",
    author: "Matt Orr",
    readingTime: "7 min read",
    summary: "After conducting dozens of operational audits for companies scaling past $100M in transaction volume, we've identified the six recurring friction patterns that drain executive time.",
    content: `Over the past several years, we have run operational diagnostic audits for professional service firms, real estate brokerages, and fast-growing operator-led businesses. 

While every business owner believes their problems are unique, the reality is remarkably consistent. Once a business scales past 15 employees or $100M in volume, the same six friction patterns show up, week after week.

Here is what we keep finding:

### 1. Multi-Channel Chaos
Work enters the organization through a chaotic mix of personal text messages, WhatsApp groups, emails, phone calls, and Slack. Because there is no single front desk, work is missed, duplicated, or delayed.

### 2. The Owner as Middleware
Founders find themselves spending 4-6 hours a day acting as information routers. They forward emails, chase updates, and sit in the middle of routine decisions that their staff is fully qualified to make if they had the data.

### 3. Institutional Memory Locked in Heads
Critical operational knowledge—how a specific client likes their billing formatted, which compliance documents are required for a unique deal type—lives entirely in the heads of one or two key employees. If they get sick or leave, the operation breaks.

### 4. Manual Data Rebuilding
Staff spends hours typing the same client name, property address, and contract price into four different systems: the CRM, the transaction management portal, the invoicing system, and the internal spreadsheet.

### 5. Reactive Deadline Chasing
Instead of looking ahead, teams operate reactively. Compliance issues are uncovered three days before closing; client updates are sent only when the client emails to ask for them; invoices are chased weeks after they are overdue.

### 6. Late-Night Reporting Shifts
Because data is scattered across multiple systems, reporting doesn't happen automatically. Operations managers or owners have to spend hours on Sunday nights exporting CSV files, cleaning up columns, and building manual charts just to see if the business is profitable.

### Breaking the Patterns

These patterns are not a reflection of your team's capability. They are the natural result of growth. The systems that got you to $50M will break at $150M.

Recognizing these patterns is the first step toward building a calm operation. The second step is to stop treating them as isolated issues and design a unified operating layer that eliminates them at the source.`
  }
];
