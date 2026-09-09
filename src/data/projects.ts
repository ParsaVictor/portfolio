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
};

export type Group = "cv" | "data" | "web";

export const cvProjects: Project[] = [
  {
    id: "pelakx",
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
  {
    id: "thief",
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
  },
];

export const dataProjects: Project[] = [
  {
    id: "pointcloud",
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
    title: "AI Project Template",
    descEn:
      "Clean, reproducible project template for Computer Vision & Machine Learning — config-driven training, seeded runs, tests and CI out of the box.",
    descFa:
      "قالبِ تمیز و تکرارپذیر برای بینایی ماشین و یادگیری ماشین — آموزشِ config-محور، runهای seed-دار، تست و CI از همان ابتدا.",
    tags: ["PyTorch", "MLOps", "Reproducibility"],
    url: "https://github.com/ParsaVictor/ai-project-template",
    stars: 3,
    stat: "config-driven",
    accent: "#35e0ff",
  },
];

export const webProjects: Project[] = [
  {
    id: "b2b",
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

export const desc = (p: Project, lang: Lang) =>
  lang === "fa" ? p.descFa : p.descEn;
