import type { Lang } from "../i18n/dict";

export type Project = {
  id: string;
  title: string;
  descEn: string;
  descFa: string;
  tags: string[];
  url: string;
  /** A dedicated site for this project, once one exists. */
  website?: string;
  image?: string;
  stars: number;
  stat: string;
  accent: string;
  /** Marks a project as a must-see highlight — gets the special violet glow treatment. */
  featured?: boolean;
  /** What sort of work it is — see KINDS. Independent of which chapter shows it. */
  kind: Kind;
  /** The real-world field it serves. */
  domainEn: string;
  domainFa: string;
  /**
   * open    — public repo of mine
   * private — repo is private (client work); `url` then points at the live demo
   * contrib — someone else's open-source project I contribute to
   */
  access: "open" | "private" | "contrib";
  /** Shipped since the last round of updates — gets a small NEW mark. */
  isNew?: boolean;
};

export type Kind = "vision" | "research" | "tooling" | "product";

export type KindMeta = {
  id: Kind;
  en: string;
  fa: string;
  noteEn: string;
  noteFa: string;
  color: string;
};

/**
 * The four kinds of project on this site. A project lives in one chapter for
 * the story, but a visitor who asks "show me just the products" filters by
 * these instead.
 */
export const KINDS: KindMeta[] = [
  {
    id: "vision",
    en: "Vision systems",
    fa: "سامانه‌های بینایی",
    noteEn: "Camera in, decision out — detection, tracking and OCR running on real footage.",
    noteFa: "دوربین ورودی، تصمیم خروجی — تشخیص، ردیابی و OCR روی تصویرِ واقعی.",
    color: "#35e0ff",
  },
  {
    id: "research",
    en: "Research & algorithms",
    fa: "پژوهش و الگوریتم",
    noteEn: "Papers reproduced and benchmarked; models you can read, not just run.",
    noteFa: "مقاله‌هایی که بازسازی و محک خورده‌اند؛ مدل‌هایی که می‌شود خواندشان، نه فقط اجرا.",
    color: "#a894ff",
  },
  {
    id: "tooling",
    en: "AI developer tooling",
    fa: "ابزارِ توسعه‌ی هوش مصنوعی",
    noteEn: "Engines and templates that make other engineers — and their agents — faster.",
    noteFa: "موتورها و قالب‌هایی که مهندس‌های دیگر — و ایجنت‌هایشان — را سریع‌تر می‌کنند.",
    color: "#8fd67a",
  },
  {
    id: "product",
    en: "Products & platforms",
    fa: "محصول و پلتفرم",
    noteEn: "Full-stack software real people log into — web, API, database, mobile.",
    noteFa: "نرم‌افزارِ فول‌استکی که آدم‌های واقعی واردش می‌شوند — وب، API، پایگاه‌داده، موبایل.",
    color: "#ffb454",
  },
];

export const kindMeta = (k: Kind) => KINDS.find((m) => m.id === k)!;

export type Group = "cv" | "data" | "web";

export const cvProjects: Project[] = [
  {
    id: "thief",
    kind: "vision",
    domainEn: "Retail security",
    domainFa: "امنیتِ فروشگاه",
    access: "open",
    title: "Thief / Concealed-Face Detection",
    descEn:
      "Tells a robber in a balaclava from a customer in a surgical mask — real-time concealed-face detection for retail CCTV. Pose-based orientation, occlusion-hardened tracking, zero training.",
    descFa:
      "سارقِ نقاب‌دار را از مشتریِ ماسک‌دار تشخیص می‌دهد — تشخیصِ بلادرنگِ چهره‌ی پوشیده برای دوربین‌های فروشگاهی. جهت‌یابیِ pose-محور، ردیابیِ مقاوم به انسداد، بدون آموزش.",
    tags: ["ByteTrack", "Pose Estimation", "CCTV"],
    url: "https://github.com/ParsaVictor/thief-face-detection",
    image: "/images/project-thief.jpg",
    stars: 4,
    stat: "Retail CCTV",
    accent: "#ff6a5e",
    featured: true,
  },
  {
    id: "visual-intelligence-engine",
    kind: "vision",
    domainEn: "Media archives",
    domainFa: "آرشیوِ رسانه",
    access: "open",
    title: "Visual Intelligence Engine",
    descEn:
      "Multimodal search over an image archive — face recognition, species detection, food recognition and open-vocabulary text search, all on one unified vector index.",
    descFa:
      "جست‌وجوی چندوجهی روی آرشیوِ تصویر — تشخیصِ چهره، تشخیصِ گونه، تشخیصِ غذا و جست‌وجوی متنیِ open-vocabulary، همه روی یک ایندکسِ برداریِ یکپارچه.",
    tags: ["CLIP", "ArcFace", "Vector Search"],
    url: "https://github.com/ParsaVictor/visual-intelligence-engine",
    image: "/images/project-visual-intelligence.jpg",
    stars: 4,
    stat: "Multimodal",
    accent: "#a894ff",
  },
  {
    id: "ppe-sentinel",
    kind: "vision",
    domainEn: "Construction safety",
    domainFa: "ایمنیِ کارگاه",
    access: "open",
    title: "PPE Detection — Sentinel",
    descEn:
      "Real-time PPE compliance monitoring for construction CCTV — a person-grounded two-stage pipeline (COCO person + ByteTrack → head/torso geometric association → temporal hysteresis). TensorRT FP16, all weights included, Colab-ready.",
    descFa:
      "پایشِ بلادرنگِ رعایتِ تجهیزاتِ ایمنی (PPE) برای دوربین‌های کارگاه ساختمانی — خط‌لوله‌ی دومرحله‌ایِ فرد-محور (تشخیصِ فرد COCO + ByteTrack ← تناظرِ هندسیِ سر/تنه ← هیسترزیسِ زمانی). TensorRT FP16، همراه با تمامِ وزن‌ها، آماده برای Colab.",
    tags: ["YOLO", "ByteTrack", "TensorRT", "Safety"],
    url: "https://github.com/ParsaVictor/PPE_detection-Sentinel",
    image: "/images/project-ppe.jpg",
    stars: 0,
    stat: "Construction CCTV",
    accent: "#ffb454",
  },
  {
    id: "pelakx",
    kind: "vision",
    domainEn: "Mobility & traffic",
    domainFa: "حمل‌ونقل و ترافیک",
    access: "open",
    title: "PelakX",
    descEn:
      "Multi-country license-plate intelligence (ALPR): real-time vehicle detection, tracking, script-aware OCR and plate-category recognition — with the deepest support for Iran's plate grammar (taxi, government, police, free-zone, province lookup).",
    descFa:
      "هوشِ پلاکِ چندکشوری (ALPR): تشخیص و ردیابی بلادرنگ خودرو، OCR آگاه به خط و شناسایی نوع پلاک — با عمیق‌ترین پشتیبانی از گرامرِ پلاک ایران (تاکسی، دولتی، پلیس، منطقه‌ی آزاد، جست‌وجوی استان).",
    tags: ["YOLO", "OCR", "OpenCV", "Real-time"],
    url: "https://github.com/ParsaVictor/pelakx-license-plate-detection",
    image: "/images/project-pelakx.jpg",
    stars: 3,
    stat: "Multi-country",
    accent: "#35e0ff",
  },
  {
    id: "fireguard",
    kind: "vision",
    domainEn: "Fire safety",
    domainFa: "ایمنیِ حریق",
    access: "open",
    title: "FireGuard",
    descEn:
      "Real-time fire & smoke detection with hazard-state intelligence — three generations of YOLO (v8/11/26), broadcast-grade overlays, zero training. One-click Colab demo.",
    descFa:
      "تشخیص آتش و دودِ بلادرنگ با هوشِ وضعیتِ خطر — سه نسل YOLO (v8/11/26)، روکشِ نمایشیِ برادکست‌گرید، بدون آموزش مجدد. دموی یک‌کلیکِ کولب.",
    tags: ["YOLOv8/11/26", "Real-time", "Safety"],
    url: "https://github.com/ParsaVictor/fireguard",
    image: "/images/project-fireguard.jpg",
    stars: 3,
    stat: "3× YOLO gens",
    accent: "#ff6b3d",
  },
  {
    id: "pcb-detect",
    kind: "vision",
    domainEn: "Electronics manufacturing",
    domainFa: "تولیدِ الکترونیک",
    access: "open",
    title: "PCB Component Detection",
    descEn:
      "YOLOv8 detection of electronic components on populated PCBs — 50 classes, 675k annotations, with dataset tooling and a full diagnosis of what limits the baseline.",
    descFa:
      "تشخیص قطعات الکترونیکی روی بردهای مونتاژشده با YOLOv8 — ۵۰ کلاس، ۶۷۵ هزار annotation، به‌همراه ابزارِ دیتاست و تحلیلِ کاملِ محدودیت‌های baseline.",
    tags: ["YOLOv8", "PyTorch", "Dataset Tooling"],
    url: "https://github.com/ParsaVictor/pcb-component-detection-yolov8",
    image: "/images/project-pcb.jpg",
    stars: 3,
    stat: "50 classes",
    accent: "#a894ff",
  },
  {
    id: "pcb-classify",
    kind: "research",
    domainEn: "Electronics manufacturing",
    domainFa: "تولیدِ الکترونیک",
    access: "open",
    title: "PCB Component Classifier",
    descEn:
      "Explainable classification of electronic components from images — Random Forest over 33 hand-engineered CV features, 93.3% holdout accuracy, every prediction traceable to a readable decision path.",
    descFa:
      "طبقه‌بندی تفسیرپذیرِ قطعات الکترونیکی از تصویر — Random Forest روی ۳۳ ویژگیِ مهندسی‌شده‌ی بینایی ماشین، دقتِ ۹۳٫۳٪ روی holdout، هر پیش‌بینی قابل‌ردیابی به یک مسیرِ تصمیمِ خوانا.",
    tags: ["Random Forest", "OpenCV", "Explainable AI"],
    url: "https://github.com/ParsaVictor/pcb-component-classifier",
    image: "/images/project-cv-2.jpg",
    stars: 3,
    stat: "93.3% acc",
    accent: "#35e0ff",
  },
];

export const dataProjects: Project[] = [
  {
    id: "pointcloud",
    kind: "research",
    domainEn: "Industrial 3D printing",
    domainFa: "چاپِ سه‌بعدیِ صنعتی",
    access: "open",
    title: "Point Cloud Curve Reconstruction",
    descEn:
      "Five peer-reviewed algorithms for 3D point-cloud denoising and curve reconstruction, benchmarked on industrial 3D-printing scan data.",
    descFa:
      "پنج الگوریتمِ داوری‌شده برای حذف نویز و بازسازیِ منحنی از ابر نقاطِ سه‌بعدی، محک‌خورده روی داده‌ی اسکنِ صنعتیِ چاپ سه‌بعدی.",
    tags: ["Open3D", "B-Spline", "Computational Geometry"],
    url: "https://github.com/ParsaVictor/point-cloud-curve-reconstruction",
    image: "/images/project-pointcloud.jpg",
    stars: 4,
    stat: "5 algorithms",
    accent: "#a894ff",
  },
  {
    id: "ai-template",
    kind: "tooling",
    domainEn: "ML engineering",
    domainFa: "مهندسیِ یادگیری ماشین",
    access: "open",
    title: "AI Project Template",
    descEn:
      "Clean, reproducible project template for Computer Vision & Machine Learning — config-driven training, seeded runs, tests and CI out of the box.",
    descFa:
      "قالبِ تمیز و تکرارپذیر برای بینایی ماشین و یادگیری ماشین — آموزشِ config-محور، runهای seed-دار، تست و CI از همان ابتدا.",
    tags: ["PyTorch", "MLOps", "Reproducibility"],
    url: "https://github.com/ParsaVictor/ai-project-template",
    image: "/images/project-ai-template.jpg",
    stars: 3,
    stat: "config-driven",
    accent: "#35e0ff",
  },
  {
    id: "code-context-engine",
    kind: "tooling",
    domainEn: "Developer tools",
    domainFa: "ابزارِ توسعه‌دهنده",
    access: "open",
    title: "Code Context Engine",
    descEn:
      "Local-first MCP context engine that cuts AI coding-agent token cost by ~90% — per-project code graphs and intelligent folding route a prompt to the right symbols and send a folded evidence packet instead of whole-file dumps. Rust, tree-sitter, works with Cursor / Claude Code / Codex.",
    descFa:
      "موتورِ زمینه‌ی MCP با معماریِ local-first که هزینه‌ی توکنِ ایجنت‌های کدنویسی را حدود ۹۰٪ کم می‌کند — گرافِ کدِ پروژه‌محور و فولدینگِ هوشمند، پرامپت را به سمبل‌های درست می‌رساند و به‌جای ریختنِ کاملِ فایل‌ها، یک بسته‌ی شواهدِ فشرده می‌فرستد. Rust، tree-sitter، سازگار با Cursor / Claude Code / Codex.",
    tags: ["Rust", "MCP", "tree-sitter", "AI Tooling"],
    url: "https://github.com/ParsaVictor/code-context-engine",
    image: "/images/project-code-context-engine.jpg",
    stars: 0,
    stat: "~90% fewer tokens",
    accent: "#a894ff",
    featured: true,
  },
  {
    id: "neuromesh",
    kind: "tooling",
    domainEn: "Developer tools",
    domainFa: "ابزارِ توسعه‌دهنده",
    access: "contrib",
    isNew: true,
    title: "NeuroMesh — open-source contribution",
    descEn:
      "Contributor to NeuroMesh (93★), a biomimetic MCP context engine: it indexes a repo into a live code graph, routes a prompt to the right symbols and folds the rest into reversible one-line markers. My work: strict per-project isolation (path-derived project ids, a CI gate against cross-project leakage), sharper call resolution in the graph, a TypeScript parser upgrade, deterministic packets, and the 3D galaxy dashboard UX.",
    descFa:
      "مشارکت در NeuroMesh (۹۳★)، موتورِ زمینه‌ی MCP با الهام از زیست‌شناسی: مخزن را به یک گرافِ زنده‌ی کد تبدیل می‌کند، پرامپت را به سمبل‌های درست می‌رساند و بقیه را در نشانگرهای یک‌خطیِ برگشت‌پذیر تا می‌کند. سهمِ من: ایزوله‌سازیِ کاملِ پروژه‌ها (شناسه‌ی پروژه از مسیر، دروازه‌ی CI علیه نشتِ بین‌پروژه‌ای)، دقیق‌ترشدنِ تشخیصِ فراخوانی در گراف، ارتقای پارسرِ TypeScript، بسته‌های قطعی، و تجربه‌ی کاربریِ داشبوردِ کهکشانِ سه‌بعدی.",
    tags: ["Rust", "MCP", "Code Graph", "Open Source"],
    url: "https://github.com/pinoox/neuromesh",
    website: "https://pinoox.github.io/neuromesh/",
    image: "/images/project-neuromesh.jpg",
    stars: 93,
    stat: "93★ · contributor",
    accent: "#8fd67a",
  },
];

export const webProjects: Project[] = [
  {
    id: "homsayeh",
    kind: "product",
    domainEn: "Residential buildings",
    domainFa: "مدیریتِ ساختمان",
    access: "private",
    isNew: true,
    featured: true,
    title: "Homsayeh — Smart Building Platform",
    descEn:
      "Neighbours register their building, verify one another, then run charges, rules, repairs, votes, shared-amenity bookings and guests together, in the open. Next.js 16 web + installable PWA, an Expo Android app, and a Hono API on Cloudflare Workers with D1 (18 tables, 40+ routes) — plus a FastAPI + PostgreSQL twin for self-hosting inside Iran.",
    descFa:
      "همسایه‌ها ساختمانشان را ثبت می‌کنند، یکدیگر را تأیید می‌کنند و بعد شارژ، قوانین، تعمیرات، رأی‌گیری، رزروِ مشاعات و مهمان را با هم و شفاف مدیریت می‌کنند. وبِ Next.js 16 و PWAِ نصب‌شدنی، اپ اندرویدِ Expo و یک API با Hono روی Cloudflare Workers و D1 (۱۸ جدول، +۴۰ مسیر) — به‌همراه نسخه‌ی FastAPI + PostgreSQL برای میزبانی روی سرورِ داخلی.",
    tags: ["Next.js 16", "Expo", "Hono", "Cloudflare D1"],
    url: "https://homsayeh.eshop3.pages.dev",
    website: "https://homsayeh.eshop3.pages.dev",
    image: "/images/project-homsayeh.jpg",
    stars: 0,
    stat: "Web · PWA · Android",
    accent: "#ffb454",
  },
  {
    id: "univecity",
    kind: "product",
    domainEn: "Higher education",
    domainFa: "آموزشِ عالی",
    access: "private",
    isNew: true,
    title: "UniVecity — Faculty Portal",
    descEn:
      "Persian RTL portal for Razi University's Faculty of Computer & Electrical Engineering — faculty, courses, class files, announcements and student panels. One Hono API runs on Cloudflare (D1/R2) and in Docker (PostgreSQL 17); university SSO over OIDC + PKCE, server-side sessions, class-scoped data privacy, OpenAPI 3.1, and 68 automated tests with load testing and OWASP ZAP scans in CI.",
    descFa:
      "پورتالِ فارسی و راست‌به‌چپِ دانشکده‌ی مهندسیِ کامپیوتر و برقِ دانشگاه رازی — استادان، دروس، جزوه‌های کلاسی، اعلان‌ها و پنلِ دانشجو. یک API با Hono که هم روی Cloudflare (D1/R2) و هم در Docker (PostgreSQL 17) اجرا می‌شود؛ ورودِ یکپارچه‌ی دانشگاه با OIDC و PKCE، نشستِ سمتِ سرور، حریمِ داده در سطحِ کلاس، OpenAPI 3.1 و ۶۸ آزمونِ خودکار به‌همراه آزمونِ بار و اسکنِ OWASP ZAP در CI.",
    tags: ["Next.js 16", "Hono", "PostgreSQL", "OIDC SSO"],
    url: "https://razi-university.pages.dev",
    website: "https://razi-university.pages.dev",
    image: "/images/project-univecity.jpg",
    stars: 1,
    stat: "68 tests · SSO",
    accent: "#e8c36a",
  },
  {
    id: "imam-reza-shift",
    kind: "product",
    domainEn: "Healthcare",
    domainFa: "سلامت و درمان",
    access: "private",
    isNew: true,
    title: "Hospital Shift Intelligence",
    descEn:
      "Smart shift management built as a demo for Imam Reza Hospital, Kermanshah. A scheduling engine flags shortages and conflicts and rebalances the roster for fairness — about 41% → 89% on the demo ward, with protections for working mothers — alongside multi-step approvals, a coverage heat-map, a hash-chained audit log you can try to tamper with, RBAC and a guided 12-step presentation mode. Runs fully offline on a Jalali calendar.",
    descFa:
      "سامانه‌ی هوشمندِ مدیریتِ شیفت، ساخته‌شده به‌عنوانِ نسخه‌ی نمایشی برای بیمارستان امام رضا (ع) کرمانشاه. موتورِ چیدمان، کمبود و تداخل را هشدار می‌دهد و برنامه را برای عدالت بازچینی می‌کند — حدودِ ۴۱٪ به ۸۹٪ در بخشِ نمونه، با حمایت از مادرانِ شاغل — به‌همراه تأییدِ چندمرحله‌ای، نقشه‌ی حرارتیِ پوشش، ممیزی با زنجیره‌ی هش که می‌شود دست‌کاری‌اش را امتحان کرد، RBAC و حالتِ ارائه‌ی ۱۲ مرحله‌ای. کاملاً آفلاین، با تقویمِ شمسی.",
    tags: ["JavaScript", "Scheduling Engine", "RBAC", "Audit Chain"],
    url: "https://imam-reza-shift.1-parsa-karkooti.workers.dev",
    website: "https://imam-reza-shift.1-parsa-karkooti.workers.dev",
    image: "/images/project-imam-reza-shift.jpg",
    stars: 0,
    stat: "fairness 41 → 89%",
    accent: "#4fe3c1",
  },
  {
    id: "b2b",
    kind: "product",
    domainEn: "Cross-border commerce",
    domainFa: "تجارتِ فرامرزی",
    access: "open",
    title: "B2B International Marketplace",
    descEn:
      "International B2B marketplace on a modern full-stack architecture — product, order and payment management at cross-border scale.",
    descFa:
      "بازارگاهِ بین‌المللیِ B2B روی معماریِ فول‌استکِ مدرن — مدیریتِ محصول، سفارش و پرداخت در مقیاسِ فرامرزی.",
    tags: ["Vue", "Node.js", "TypeScript"],
    url: "https://github.com/ParsaVictor/b2b-marketplace",
    image: "/images/project-b2b.jpg",
    stars: 4,
    stat: "full-stack",
    accent: "#35e0ff",
  },
  {
    id: "melkai",
    kind: "product",
    domainEn: "Real estate",
    domainFa: "املاک",
    access: "open",
    title: "Melk AI — Real Estate Platform",
    descEn:
      "AI-powered Persian real-estate platform — Next.js 16, glassy RTL interface and a smooth motion experience with Framer Motion.",
    descFa:
      "پلتفرمِ فارسیِ املاکِ مبتنی بر هوش مصنوعی — Next.js 16، رابطِ شیشه‌ایِ RTL و تجربه‌ی حرکتیِ روان با Framer Motion.",
    tags: ["Next.js", "Framer Motion", "RTL"],
    url: "https://github.com/ParsaVictor/melkai-realestate-platform",
    website: "https://amlak-s46a.eshop3.pages.dev",
    image: "/images/project-realestate.jpg",
    stars: 3,
    stat: "Next.js 16",
    accent: "#ffb454",
  },
];

export const groups: Record<Group, Project[]> = {
  cv: cvProjects,
  data: dataProjects,
  web: webProjects,
};

export const allProjects: Project[] = [...cvProjects, ...dataProjects, ...webProjects];

/** Which chapter a project is told in. */
export const groupOf = (id: string): Group =>
  (Object.keys(groups) as Group[]).find((g) => groups[g].some((p) => p.id === id)) ?? "cv";

export const desc = (p: Project, lang: Lang) =>
  lang === "fa" ? p.descFa : p.descEn;

export const domain = (p: Project, lang: Lang) =>
  lang === "fa" ? p.domainFa : p.domainEn;
