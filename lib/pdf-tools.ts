import {
  FileStack,
  Scissors,
  Minimize2,
  Image,
  FileImage,
  RotateCw,
  ListOrdered,
  Droplet,
  Lock,
  Unlock,
  FileText,
  FileType,
  ArrowRightLeft,
  Trash2,
  type LucideIcon,
} from "lucide-react";

export interface PDFTool {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  href: string;
  category: "organize" | "convert" | "edit" | "security";
}

export const pdfTools: PDFTool[] = [
  // Organize
  {
    id: "merge",
    name: "Merge PDF",
    description: "Combine multiple PDFs into one document",
    icon: FileStack,
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100",
    href: "/tools/merge",
    category: "organize",
  },
  {
    id: "split",
    name: "Split PDF",
    description: "Extract pages or split PDF into multiple files",
    icon: Scissors,
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
    href: "/tools/split",
    category: "organize",
  },
  {
    id: "remove-pages",
    name: "Remove Pages",
    description: "Delete unwanted pages from your PDF",
    icon: Trash2,
    color: "text-rose-600",
    bgColor: "bg-rose-50 hover:bg-rose-100",
    href: "/tools/remove-pages",
    category: "organize",
  },
  {
    id: "rotate",
    name: "Rotate PDF",
    description: "Rotate PDF pages to the correct orientation",
    icon: RotateCw,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 hover:bg-cyan-100",
    href: "/tools/rotate",
    category: "organize",
  },
  // Convert
  {
    id: "pdf-to-image",
    name: "PDF to Image",
    description: "Convert PDF pages to JPG or PNG images",
    icon: Image,
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100",
    href: "/tools/pdf-to-image",
    category: "convert",
  },
  {
    id: "image-to-pdf",
    name: "Image to PDF",
    description: "Convert images to a PDF document",
    icon: FileImage,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 hover:bg-emerald-100",
    href: "/tools/image-to-pdf",
    category: "convert",
  },
  {
    id: "pdf-to-text",
    name: "PDF to Text",
    description: "Extract text content from PDF files",
    icon: FileText,
    color: "text-slate-600",
    bgColor: "bg-slate-50 hover:bg-slate-100",
    href: "/tools/pdf-to-text",
    category: "convert",
  },
  {
    id: "html-to-pdf",
    name: "HTML to PDF",
    description: "Convert web pages to PDF documents",
    icon: FileType,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:bg-indigo-100",
    href: "/tools/html-to-pdf",
    category: "convert",
  },
  // Edit
  {
    id: "compress",
    name: "Compress PDF",
    description: "Reduce file size while maintaining quality",
    icon: Minimize2,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
    href: "/tools/compress",
    category: "edit",
  },
  {
    id: "page-numbers",
    name: "Page Numbers",
    description: "Add page numbers to your PDF document",
    icon: ListOrdered,
    color: "text-amber-600",
    bgColor: "bg-amber-50 hover:bg-amber-100",
    href: "/tools/page-numbers",
    category: "edit",
  },
  {
    id: "watermark",
    name: "Watermark",
    description: "Add text or image watermark to PDF",
    icon: Droplet,
    color: "text-teal-600",
    bgColor: "bg-teal-50 hover:bg-teal-100",
    href: "/tools/watermark",
    category: "edit",
  },
  {
    id: "reorder",
    name: "Reorder Pages",
    description: "Rearrange PDF pages in any order",
    icon: ArrowRightLeft,
    color: "text-fuchsia-600",
    bgColor: "bg-fuchsia-50 hover:bg-fuchsia-100",
    href: "/tools/reorder",
    category: "edit",
  },
  // Security
  {
    id: "protect",
    name: "Protect PDF",
    description: "Add password protection to your PDF",
    icon: Lock,
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
    href: "/tools/protect",
    category: "security",
  },
  {
    id: "unlock",
    name: "Unlock PDF",
    description: "Remove password from protected PDF",
    icon: Unlock,
    color: "text-pink-600",
    bgColor: "bg-pink-50 hover:bg-pink-100",
    href: "/tools/unlock",
    category: "security",
  },
];

export const categories = [
  {
    id: "organize",
    name: "Organize PDF",
    description: "Merge, split, and arrange your PDF pages",
  },
  {
    id: "convert",
    name: "Convert PDF",
    description: "Transform PDFs to and from other formats",
  },
  {
    id: "edit",
    name: "Edit PDF",
    description: "Compress, add watermarks, and modify PDFs",
  },
  {
    id: "security",
    name: "PDF Security",
    description: "Protect and unlock PDF documents",
  },
];

const pdfHandoffTargetIds = new Set([
  "merge",
  "compress",
  "split",
  "remove-pages",
  "rotate",
  "pdf-to-image",
  "pdf-to-text",
  "page-numbers",
  "watermark",
  "reorder",
  "protect",
  "unlock",
]);

export const pdfHandoffTargets = pdfTools.filter((tool) =>
  pdfHandoffTargetIds.has(tool.id),
);
