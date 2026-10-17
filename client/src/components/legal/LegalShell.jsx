import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import kaingoLogo from "../../assets/kaingo-logo.svg";
import { LEGAL_DOCS, LEGAL_ORDER } from "../../content/legalDocuments.js";

const year = new Date().getFullYear();

/* Shared chrome (header + footer) for all legal pages. */
export default function LegalShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#141414] font-sans antialiased">
      <header className="sticky top-0 z-40 border-b border-[#EEEEEE] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            to="/"
            aria-label="KainGo home"
            className="flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40"
          >
            <img src={kaingoLogo} alt="" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold tracking-tight text-[#141414]">
              Kain<span className="text-[#EA580C]">Go</span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#6B7280] transition-colors hover:text-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#EEEEEE] bg-[#FAFAFA]">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <div className="flex items-center gap-2 text-sm font-bold text-[#141414]">
            <ShieldCheck className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
            Legal &amp; Policies
          </div>
          <nav
            aria-label="Legal documents"
            className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5"
          >
            {LEGAL_ORDER.map((slug) => (
              <Link
                key={slug}
                to={`/legal/${slug}`}
                className="text-sm text-[#6B7280] transition-colors hover:text-[#EA580C]"
              >
                {LEGAL_DOCS[slug].short}
              </Link>
            ))}
          </nav>
          <p className="mt-6 text-sm text-[#9CA3AF]">
            © {year} KainGo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
