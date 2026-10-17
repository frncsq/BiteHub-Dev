import { useParams, Link, Navigate } from "react-router-dom";
import { FileText, AlertCircle, ChevronRight } from "lucide-react";
import LegalShell from "../components/legal/LegalShell.jsx";
import { LEGAL_DOCS, LEGAL_ORDER } from "../content/legalDocuments.js";

/* Highlights [ bracketed placeholders ] so they are easy to find and replace. */
function renderText(text) {
  return String(text)
    .split(/(\[[^\]]+\])/g)
    .map((part, i) =>
      part.startsWith("[") && part.endsWith("]") ? (
        <mark
          key={i}
          className="rounded bg-orange-100 px-1 font-medium text-[#9A3412]"
        >
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
}

function Block({ block }) {
  if (block.t === "p") {
    return <p className="mt-3 leading-relaxed text-[#4B5563]">{renderText(block.text)}</p>;
  }
  if (block.t === "ul") {
    return (
      <ul className="mt-3 space-y-2">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-3 leading-relaxed text-[#4B5563]">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#EA580C]" aria-hidden="true" />
            <span>{renderText(item)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.t === "ol") {
    return (
      <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed text-[#4B5563] marker:font-semibold marker:text-[#EA580C]">
        {block.items.map((item, i) => (
          <li key={i}>{renderText(item)}</li>
        ))}
      </ol>
    );
  }
  if (block.t === "callout") {
    return (
      <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm leading-relaxed text-[#9A3412]">
        {renderText(block.text)}
      </div>
    );
  }
  return null;
}

function LegalIndex() {
  return (
    <LegalShell>
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:py-16">
        <p className="text-xs font-bold uppercase tracking-wide text-[#EA580C]">Legal Center</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#141414] sm:text-4xl">
          Legal &amp; Policies
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          The terms and policies that apply when you use KainGo, whether you are a
          customer ordering food or a restaurant offering items on the Platform.
        </p>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm leading-relaxed text-[#9A3412]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            These documents are templates for review and do not constitute legal advice.
            Replace all highlighted placeholders and have a qualified attorney review them
            before relying on them.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {LEGAL_ORDER.map((slug) => {
            const doc = LEGAL_DOCS[slug];
            return (
              <Link
                key={slug}
                to={`/legal/${slug}`}
                className="group flex items-start gap-4 rounded-2xl border border-[#EEEEEE] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#EA580C]/30 hover:shadow-lg hover:shadow-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FBF1E7] text-[#EA580C] transition-colors group-hover:bg-[#EA580C] group-hover:text-white">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="flex items-center gap-1 text-base font-bold text-[#141414] group-hover:text-[#EA580C]">
                    {doc.title}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">{doc.summary}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </LegalShell>
  );
}

function LegalDocument({ doc }) {
  const related = LEGAL_ORDER.filter((slug) => slug !== doc.slug).slice(0, 4);
  return (
    <LegalShell>
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:py-16">
        <nav aria-label="Breadcrumb" className="text-sm text-[#9CA3AF]">
          <Link to="/legal" className="hover:text-[#EA580C]">
            Legal
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#6B7280]">{doc.title}</span>
        </nav>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#141414] sm:text-4xl">
          {doc.title}
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">{doc.summary}</p>
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#9CA3AF]">
          <span>Effective: {renderText(doc.effective)}</span>
          <span>Last updated: {renderText(doc.updated)}</span>
        </p>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Table of contents */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
              On this page
            </p>
            <nav aria-label="Table of contents" className="mt-3 hidden lg:block">
              <ul className="space-y-1.5 border-l border-[#EEEEEE]">
                {doc.sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="block border-l-2 border-transparent pl-3 text-sm text-[#6B7280] transition-colors hover:border-[#EA580C] hover:text-[#EA580C]"
                    >
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Body */}
          <article className="max-w-none">
            {doc.sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 border-b border-[#F3F4F6] pb-8 last:border-b-0">
                <h2 className="text-lg font-bold text-[#141414] sm:text-xl">{s.heading}</h2>
                {s.blocks.map((b, i) => (
                  <Block key={i} block={b} />
                ))}
              </section>
            ))}

            <div className="mt-8 rounded-2xl border border-[#EEEEEE] bg-[#FAFAFA] p-5">
              <p className="text-sm font-bold text-[#141414]">Related documents</p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                {related.map((slug) => (
                  <Link
                    key={slug}
                    to={`/legal/${slug}`}
                    className="text-sm text-[#6B7280] transition-colors hover:text-[#EA580C]"
                  >
                    {LEGAL_DOCS[slug].short}
                  </Link>
                ))}
                <Link to="/legal" className="text-sm font-semibold text-[#EA580C] hover:underline">
                  View all
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </LegalShell>
  );
}

export default function Legal() {
  const { slug } = useParams();
  if (!slug) return <LegalIndex />;
  const doc = LEGAL_DOCS[slug];
  if (!doc) return <Navigate to="/legal" replace />;
  return <LegalDocument doc={doc} />;
}
